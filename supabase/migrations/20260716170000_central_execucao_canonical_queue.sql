-- Central de Execucao Base44 1:1 sobre a arquitetura normalizada do MX.
-- Evolui execution_actions. Nao cria uma segunda fila operacional.

BEGIN;

ALTER TABLE public.execution_actions
  ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS oportunidade_id uuid REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agendamento_id uuid REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS evento_id uuid REFERENCES public.eventos_comerciais(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS activity_type text,
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS priority_rank smallint NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS result_code text,
  ADD COLUMN IF NOT EXISTS result_note text,
  ADD COLUMN IF NOT EXISTS origin_module text NOT NULL DEFAULT 'central_execucao',
  ADD COLUMN IF NOT EXISTS source_record_id text,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS last_mutation_key text,
  ADD COLUMN IF NOT EXISTS last_mutation_result jsonb,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS automatic boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS client_name_snapshot text,
  ADD COLUMN IF NOT EXISTS phone_snapshot text,
  ADD COLUMN IF NOT EXISTS vehicle_snapshot text,
  ADD COLUMN IF NOT EXISTS manager_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS escalation_reason text,
  ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS escalated_at timestamptz;

UPDATE public.execution_actions
SET activity_type = CASE source_type
  WHEN 'pdi' THEN 'pdi'
  WHEN 'feedback' THEN 'feedback'
  WHEN 'funil' THEN 'funil'
  ELSE 'comercial'
END
WHERE activity_type IS NULL;

ALTER TABLE public.execution_actions
  ALTER COLUMN activity_type SET NOT NULL;

ALTER TABLE public.execution_actions
  DROP CONSTRAINT IF EXISTS execution_actions_source_type_check,
  DROP CONSTRAINT IF EXISTS execution_actions_status_check,
  DROP CONSTRAINT IF EXISTS execution_actions_activity_type_check,
  DROP CONSTRAINT IF EXISTS execution_actions_priority_rank_check,
  DROP CONSTRAINT IF EXISTS execution_actions_result_code_check;

ALTER TABLE public.execution_actions
  ADD CONSTRAINT execution_actions_source_type_check CHECK (
    source_type = ANY (ARRAY['pdi', 'feedback', 'funil', 'manual', 'agendamento', 'cliente', 'sistema']::text[])
  ) NOT VALID,
  ADD CONSTRAINT execution_actions_status_check CHECK (
    status = ANY (ARRAY['pendente', 'em_andamento', 'concluida', 'justificada', 'reagendada', 'cancelada']::text[])
  ) NOT VALID,
  ADD CONSTRAINT execution_actions_activity_type_check CHECK (
    activity_type = ANY (ARRAY[
      'atendimento', 'visita', 'retorno', 'documentacao', 'entrega', 'pos_venda',
      'aniversario', 'garantia', 'comercial', 'test_drive', 'negociacao',
      'pdi', 'feedback', 'funil'
    ]::text[])
  ) NOT VALID,
  ADD CONSTRAINT execution_actions_priority_rank_check CHECK (priority_rank BETWEEN 1 AND 9) NOT VALID,
  ADD CONSTRAINT execution_actions_result_code_check CHECK (
    result_code IS NULL OR result_code = ANY (ARRAY[
      'confirmed', 'attended', 'no_show', 'contacted', 'no_answer', 'no_response',
      'reschedule', 'advanced', 'manager_required', 'sale_completed', 'sale_lost',
      'documentation_completed', 'documentation_pending', 'delivery_completed',
      'delivery_confirmed', 'client_absent', 'waiting_workshop', 'waiting_part',
      'warranty_resolved', 'post_sale_satisfied', 'post_sale_question', 'complaint',
      'repurchase', 'referral', 'task_completed', 'task_justified', 'cancelled'
    ]::text[])
  ) NOT VALID;

ALTER TABLE public.execution_actions VALIDATE CONSTRAINT execution_actions_source_type_check;
ALTER TABLE public.execution_actions VALIDATE CONSTRAINT execution_actions_status_check;
ALTER TABLE public.execution_actions VALIDATE CONSTRAINT execution_actions_activity_type_check;
ALTER TABLE public.execution_actions VALIDATE CONSTRAINT execution_actions_priority_rank_check;
ALTER TABLE public.execution_actions VALIDATE CONSTRAINT execution_actions_result_code_check;

CREATE INDEX IF NOT EXISTS execution_actions_seller_active_due_idx
  ON public.execution_actions (seller_id, active, status, due_at);
CREATE INDEX IF NOT EXISTS execution_actions_store_manager_idx
  ON public.execution_actions (store_id, manager_required, status, due_at)
  WHERE store_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS execution_actions_client_idx
  ON public.execution_actions (cliente_id, due_at DESC)
  WHERE cliente_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS execution_actions_idempotency_key_uidx
  ON public.execution_actions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS execution_actions_last_mutation_key_uidx
  ON public.execution_actions (last_mutation_key)
  WHERE last_mutation_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS execution_actions_active_source_uidx
  ON public.execution_actions (source_type, source_id, seller_id)
  WHERE source_id IS NOT NULL AND active;

COMMENT ON TABLE public.execution_actions IS
  'Fila operacional canonica da Central de Execucao. Clientes, oportunidades e agendamentos permanecem fontes dos fatos de dominio.';
COMMENT ON COLUMN public.execution_actions.idempotency_key IS
  'Chave estavel de origem da atividade. Nao deve ser sobrescrita por resolucoes posteriores.';
COMMENT ON COLUMN public.execution_actions.last_mutation_key IS
  'Chave da ultima mutacao transacional aplicada para impedir dupla submissao.';

CREATE OR REPLACE FUNCTION public.central_can_access_store(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    p_store_id IS NULL
    OR public.is_admin()
    OR public.eh_area_interna_mx(auth.uid())
    OR public.is_owner_of(p_store_id)
    OR public.is_manager_of(p_store_id)
    OR EXISTS (
      SELECT 1
      FROM public.vinculos_loja vl
      WHERE vl.user_id = auth.uid()
        AND vl.store_id = p_store_id
        AND vl.is_active
        AND vl.ended_at IS NULL
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.central_can_manage_action(p_seller_id uuid, p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    auth.uid() = p_seller_id
    OR public.is_admin()
    OR public.eh_area_interna_mx(auth.uid())
    OR (p_store_id IS NOT NULL AND public.is_owner_of(p_store_id))
    OR (p_store_id IS NOT NULL AND public.is_manager_of(p_store_id))
  );
$$;

CREATE OR REPLACE FUNCTION public.central_result_allowed(p_activity_type text, p_result_code text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_activity_type
    WHEN 'retorno' THEN p_result_code = ANY (ARRAY['contacted', 'no_answer', 'no_response', 'reschedule', 'advanced', 'manager_required']::text[])
    WHEN 'entrega' THEN p_result_code = ANY (ARRAY['delivery_completed', 'delivery_confirmed', 'reschedule', 'documentation_pending', 'client_absent']::text[])
    WHEN 'garantia' THEN p_result_code = ANY (ARRAY['contacted', 'waiting_workshop', 'waiting_part', 'warranty_resolved', 'manager_required', 'reschedule']::text[])
    WHEN 'pos_venda' THEN p_result_code = ANY (ARRAY['post_sale_satisfied', 'post_sale_question', 'complaint', 'repurchase', 'referral', 'reschedule']::text[])
    WHEN 'documentacao' THEN p_result_code = ANY (ARRAY['documentation_completed', 'documentation_pending', 'reschedule', 'manager_required']::text[])
    WHEN 'comercial' THEN p_result_code = ANY (ARRAY['task_completed', 'task_justified', 'reschedule', 'manager_required', 'cancelled']::text[])
    WHEN 'pdi' THEN p_result_code = ANY (ARRAY['task_completed', 'task_justified', 'reschedule', 'cancelled']::text[])
    WHEN 'feedback' THEN p_result_code = ANY (ARRAY['task_completed', 'task_justified', 'manager_required', 'cancelled']::text[])
    WHEN 'aniversario' THEN p_result_code = ANY (ARRAY['contacted', 'no_answer', 'no_response', 'reschedule']::text[])
    ELSE p_result_code = ANY (ARRAY[
      'confirmed', 'attended', 'no_show', 'contacted', 'no_answer', 'no_response',
      'reschedule', 'advanced', 'manager_required', 'sale_completed', 'sale_lost',
      'task_completed', 'task_justified', 'cancelled'
    ]::text[])
  END;
$$;

CREATE OR REPLACE FUNCTION public.central_upsert_appointment_action_internal(
  p_agendamento_id uuid,
  p_idempotency_key text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ag record;
  v_action_id uuid;
  v_key text;
  v_status text;
  v_active boolean;
  v_priority text;
  v_priority_rank smallint;
BEGIN
  SELECT a.*, c.nome AS cliente_nome, c.telefone AS cliente_telefone,
         c.proxima_acao, o.veiculo_interesse
  INTO v_ag
  FROM public.agendamentos a
  LEFT JOIN public.clientes c ON c.id = a.cliente_id
  LEFT JOIN public.oportunidades o ON o.id = a.oportunidade_id
  WHERE a.id = p_agendamento_id
  FOR UPDATE OF a;

  IF NOT FOUND THEN RAISE EXCEPTION 'Agendamento nao encontrado.'; END IF;

  v_key := coalesce(nullif(trim(p_idempotency_key), ''), 'central:agendamento:' || v_ag.id::text);
  v_status := CASE WHEN v_ag.status::text IN ('compareceu', 'nao_compareceu') THEN 'concluida' ELSE 'pendente' END;
  v_active := v_ag.status::text NOT IN ('compareceu', 'nao_compareceu');
  v_priority_rank := CASE v_ag.tipo::text
    WHEN 'visita' THEN 1 WHEN 'negociacao' THEN 1 WHEN 'test_drive' THEN 1
    WHEN 'entrega' THEN 2 WHEN 'garantia' THEN 3 WHEN 'retorno' THEN 4
    WHEN 'pos_venda' THEN 5 ELSE 5 END;
  v_priority := CASE WHEN v_priority_rank <= 1 THEN 'urgent' WHEN v_priority_rank <= 3 THEN 'high' ELSE 'medium' END;

  INSERT INTO public.execution_actions (
    store_id, seller_id, source_type, source_id, cliente_id, oportunidade_id,
    agendamento_id, activity_type, title, description, objective, due_at, status,
    priority, priority_rank, alert_tone, origin_module, source_record_id,
    idempotency_key, active, automatic, client_name_snapshot, phone_snapshot,
    vehicle_snapshot, metadata, created_by, updated_by, completed_at
  ) VALUES (
    v_ag.loja_id, v_ag.seller_user_id, 'agendamento', v_ag.id, v_ag.cliente_id,
    v_ag.oportunidade_id, v_ag.id, v_ag.tipo::text,
    concat(CASE v_ag.tipo::text
      WHEN 'visita' THEN 'Atendimento' WHEN 'test_drive' THEN 'Test-drive'
      WHEN 'pos_venda' THEN 'Pos-venda' ELSE initcap(replace(v_ag.tipo::text, '_', ' ')) END,
      ' - ', coalesce(nullif(v_ag.cliente_nome, ''), 'Cliente sem nome')),
    v_ag.observacoes, v_ag.proxima_acao, v_ag.data_hora, v_status, v_priority,
    v_priority_rank, CASE WHEN v_priority_rank <= 2 THEN 'warning' ELSE 'info' END,
    coalesce(nullif(v_ag.origem_modulo, ''), 'crm'), v_ag.id::text, v_key,
    v_active, true, v_ag.cliente_nome, v_ag.cliente_telefone, v_ag.veiculo_interesse,
    jsonb_build_object('appointment_status', v_ag.status::text, 'appointment_type', v_ag.tipo::text, 'channel', v_ag.canal::text),
    coalesce(v_ag.created_by, v_ag.seller_user_id), coalesce(v_ag.updated_by, v_ag.seller_user_id),
    CASE WHEN v_active THEN NULL ELSE coalesce(v_ag.updated_at, now()) END
  )
  ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL
  DO UPDATE SET
    store_id = EXCLUDED.store_id,
    seller_id = EXCLUDED.seller_id,
    source_type = EXCLUDED.source_type,
    source_id = EXCLUDED.source_id,
    cliente_id = EXCLUDED.cliente_id,
    oportunidade_id = EXCLUDED.oportunidade_id,
    agendamento_id = EXCLUDED.agendamento_id,
    activity_type = EXCLUDED.activity_type,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    objective = EXCLUDED.objective,
    due_at = EXCLUDED.due_at,
    status = CASE WHEN public.execution_actions.status IN ('cancelada', 'justificada')
      THEN public.execution_actions.status ELSE EXCLUDED.status END,
    priority = EXCLUDED.priority,
    priority_rank = EXCLUDED.priority_rank,
    alert_tone = EXCLUDED.alert_tone,
    origin_module = EXCLUDED.origin_module,
    source_record_id = EXCLUDED.source_record_id,
    active = CASE WHEN public.execution_actions.status IN ('cancelada', 'justificada')
      THEN false ELSE EXCLUDED.active END,
    automatic = true,
    client_name_snapshot = EXCLUDED.client_name_snapshot,
    phone_snapshot = EXCLUDED.phone_snapshot,
    vehicle_snapshot = EXCLUDED.vehicle_snapshot,
    metadata = public.execution_actions.metadata || EXCLUDED.metadata,
    updated_by = EXCLUDED.updated_by,
    completed_at = CASE WHEN EXCLUDED.active THEN NULL ELSE EXCLUDED.completed_at END,
    updated_at = now()
  RETURNING id INTO v_action_id;

  RETURN v_action_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.central_sync_appointment_action(
  p_agendamento_id uuid,
  p_idempotency_key text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_ag record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sessao invalida.'; END IF;
  SELECT seller_user_id, loja_id INTO v_ag FROM public.agendamentos WHERE id = p_agendamento_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Agendamento nao encontrado.'; END IF;
  IF NOT public.central_can_manage_action(v_ag.seller_user_id, v_ag.loja_id) THEN
    RAISE EXCEPTION 'Sem permissao para sincronizar este agendamento.';
  END IF;
  RETURN public.central_upsert_appointment_action_internal(p_agendamento_id, p_idempotency_key);
END;
$$;

CREATE OR REPLACE FUNCTION public.central_create_manual_action(
  p_payload jsonb,
  p_idempotency_key text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing uuid;
  v_action_id uuid;
  v_store_id uuid;
  v_client_id uuid;
  v_opportunity_id uuid;
  v_activity_type text;
  v_title text;
  v_due_at timestamptz;
  v_priority text;
  v_priority_rank smallint;
  v_client_name text;
  v_client_phone text;
  v_client_store uuid;
  v_client_seller uuid;
  v_opportunity_client uuid;
  v_opportunity_store uuid;
  v_opportunity_seller uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sessao invalida.'; END IF;
  IF nullif(trim(coalesce(p_idempotency_key, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Chave de idempotencia obrigatoria.';
  END IF;

  SELECT id INTO v_existing FROM public.execution_actions WHERE idempotency_key = p_idempotency_key;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  p_payload := coalesce(p_payload, '{}'::jsonb);
  v_activity_type := nullif(trim(coalesce(p_payload->>'activity_type', '')), '');
  v_title := nullif(trim(coalesce(p_payload->>'title', '')), '');
  v_due_at := nullif(p_payload->>'due_at', '')::timestamptz;
  v_store_id := nullif(p_payload->>'store_id', '')::uuid;
  v_client_id := nullif(p_payload->>'client_id', '')::uuid;
  v_opportunity_id := nullif(p_payload->>'opportunity_id', '')::uuid;
  v_priority := coalesce(nullif(p_payload->>'priority', ''), 'medium');
  v_priority_rank := coalesce(nullif(p_payload->>'priority_rank', '')::smallint, 5);

  IF v_activity_type IS NULL OR NOT (v_activity_type = ANY (ARRAY[
    'atendimento', 'visita', 'retorno', 'documentacao', 'entrega', 'pos_venda',
    'aniversario', 'garantia', 'comercial', 'test_drive', 'negociacao',
    'pdi', 'feedback', 'funil']::text[])) THEN
    RAISE EXCEPTION 'Tipo de atividade invalido.';
  END IF;
  IF v_title IS NULL THEN RAISE EXCEPTION 'Titulo obrigatorio.'; END IF;
  IF v_due_at IS NULL THEN RAISE EXCEPTION 'Data e horario obrigatorios.'; END IF;
  IF v_priority NOT IN ('low', 'medium', 'high', 'urgent') OR v_priority_rank NOT BETWEEN 1 AND 9 THEN
    RAISE EXCEPTION 'Prioridade invalida.';
  END IF;

  IF v_client_id IS NOT NULL THEN
    SELECT nome, telefone, loja_id, seller_user_id
    INTO v_client_name, v_client_phone, v_client_store, v_client_seller
    FROM public.clientes WHERE id = v_client_id FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Cliente nao encontrado.'; END IF;
    IF NOT public.central_can_manage_action(v_client_seller, v_client_store) THEN
      RAISE EXCEPTION 'Sem permissao para usar este cliente.';
    END IF;
    IF v_store_id IS NOT NULL AND v_store_id <> v_client_store THEN
      RAISE EXCEPTION 'Cliente nao pertence a loja informada.';
    END IF;
    v_store_id := coalesce(v_store_id, v_client_store);
  END IF;

  IF v_opportunity_id IS NOT NULL THEN
    SELECT cliente_id, loja_id, seller_user_id
    INTO v_opportunity_client, v_opportunity_store, v_opportunity_seller
    FROM public.oportunidades WHERE id = v_opportunity_id FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Oportunidade nao encontrada.'; END IF;
    IF NOT public.central_can_manage_action(v_opportunity_seller, v_opportunity_store) THEN
      RAISE EXCEPTION 'Sem permissao para usar esta oportunidade.';
    END IF;
    IF v_client_id IS NOT NULL AND v_client_id <> v_opportunity_client THEN
      RAISE EXCEPTION 'Oportunidade nao pertence ao cliente informado.';
    END IF;
    v_client_id := coalesce(v_client_id, v_opportunity_client);
    v_store_id := coalesce(v_store_id, v_opportunity_store);
  END IF;

  IF v_store_id IS NULL THEN
    SELECT vl.store_id INTO v_store_id
    FROM public.vinculos_loja vl
    WHERE vl.user_id = auth.uid() AND vl.is_active AND vl.ended_at IS NULL
    ORDER BY vl.created_at DESC LIMIT 1;
  END IF;
  IF NOT public.central_can_access_store(v_store_id) THEN
    RAISE EXCEPTION 'Sem permissao para criar atividade nesta loja.';
  END IF;

  INSERT INTO public.execution_actions (
    store_id, seller_id, source_type, source_id, cliente_id, oportunidade_id,
    activity_type, title, description, objective, due_at, status, priority,
    priority_rank, alert_tone, origin_module, source_record_id, idempotency_key,
    active, automatic, client_name_snapshot, phone_snapshot, vehicle_snapshot,
    metadata, created_by, updated_by
  ) VALUES (
    v_store_id, auth.uid(), 'manual', NULL, v_client_id, v_opportunity_id,
    v_activity_type, v_title, nullif(trim(coalesce(p_payload->>'description', '')), ''),
    nullif(trim(coalesce(p_payload->>'objective', '')), ''), v_due_at, 'pendente',
    v_priority, v_priority_rank, CASE WHEN v_priority IN ('high', 'urgent') THEN 'warning' ELSE 'info' END,
    'central_execucao', nullif(trim(coalesce(p_payload->>'source_record_id', '')), ''),
    p_idempotency_key, true, false,
    coalesce(v_client_name, nullif(trim(coalesce(p_payload->>'name_snapshot', '')), '')),
    coalesce(v_client_phone, nullif(trim(coalesce(p_payload->>'phone_snapshot', '')), '')),
    nullif(trim(coalesce(p_payload->>'vehicle_snapshot', '')), ''),
    coalesce(p_payload->'metadata', '{}'::jsonb), auth.uid(), auth.uid()
  )
  ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL
  DO UPDATE SET updated_at = public.execution_actions.updated_at
  RETURNING id INTO v_action_id;

  RETURN v_action_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.central_reschedule_action(
  p_action_id uuid,
  p_due_at timestamptz,
  p_note text,
  p_idempotency_key text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_action public.execution_actions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sessao invalida.'; END IF;
  IF p_due_at IS NULL THEN RAISE EXCEPTION 'Nova data e horario obrigatorios.'; END IF;
  IF nullif(trim(coalesce(p_idempotency_key, '')), '') IS NULL THEN RAISE EXCEPTION 'Chave de idempotencia obrigatoria.'; END IF;

  SELECT * INTO v_action FROM public.execution_actions WHERE id = p_action_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Atividade nao encontrada.'; END IF;
  IF NOT public.central_can_manage_action(v_action.seller_id, v_action.store_id) THEN
    RAISE EXCEPTION 'Sem permissao para reagendar esta atividade.';
  END IF;
  IF v_action.last_mutation_key = p_idempotency_key THEN RETURN v_action.id; END IF;

  IF v_action.agendamento_id IS NOT NULL THEN
    UPDATE public.agendamentos
    SET data_hora = p_due_at,
        proxima_acao = coalesce(nullif(trim(coalesce(p_note, '')), ''), proxima_acao),
        updated_by = auth.uid(), updated_at = now()
    WHERE id = v_action.agendamento_id;
  END IF;
  IF v_action.cliente_id IS NOT NULL THEN
    UPDATE public.clientes
    SET proxima_acao = coalesce(nullif(trim(coalesce(p_note, '')), ''), 'Retomar contato'),
        proxima_acao_em = (p_due_at AT TIME ZONE 'America/Sao_Paulo')::date,
        updated_by = auth.uid(), updated_at = now()
    WHERE id = v_action.cliente_id;
  END IF;

  UPDATE public.execution_actions
  SET due_at = p_due_at, status = 'reagendada', result_code = 'reschedule',
      result_note = nullif(trim(coalesce(p_note, '')), ''), active = true,
      completed_at = NULL, completed_by = NULL,
      last_mutation_key = p_idempotency_key,
      last_mutation_result = jsonb_build_object('action_id', id, 'due_at', p_due_at, 'status', 'reagendada'),
      updated_by = auth.uid(), updated_at = now()
  WHERE id = p_action_id;
  RETURN p_action_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.central_escalate_action(
  p_action_id uuid,
  p_reason text,
  p_idempotency_key text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action public.execution_actions%ROWTYPE;
  v_manager_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sessao invalida.'; END IF;
  IF nullif(trim(coalesce(p_reason, '')), '') IS NULL THEN RAISE EXCEPTION 'Motivo do escalonamento obrigatorio.'; END IF;
  IF nullif(trim(coalesce(p_idempotency_key, '')), '') IS NULL THEN RAISE EXCEPTION 'Chave de idempotencia obrigatoria.'; END IF;

  SELECT * INTO v_action FROM public.execution_actions WHERE id = p_action_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Atividade nao encontrada.'; END IF;
  IF NOT public.central_can_manage_action(v_action.seller_id, v_action.store_id) THEN
    RAISE EXCEPTION 'Sem permissao para escalar esta atividade.';
  END IF;
  IF v_action.last_mutation_key = p_idempotency_key THEN RETURN v_action.id; END IF;

  SELECT vl.user_id INTO v_manager_id
  FROM public.vinculos_loja vl
  JOIN public.usuarios u ON u.id = vl.user_id AND u.active
  WHERE vl.store_id = v_action.store_id AND vl.role = 'gerente'
    AND vl.is_active AND vl.ended_at IS NULL
  ORDER BY vl.created_at DESC LIMIT 1;

  IF v_manager_id IS NULL AND v_action.store_id IS NOT NULL THEN
    SELECT u.id INTO v_manager_id
    FROM public.lojas l JOIN public.usuarios u ON lower(u.email) = lower(l.manager_email)
    WHERE l.id = v_action.store_id AND u.active LIMIT 1;
  END IF;

  UPDATE public.execution_actions
  SET manager_required = true, escalation_reason = trim(p_reason), manager_id = v_manager_id,
      escalated_at = now(), result_code = 'manager_required', result_note = trim(p_reason),
      status = 'em_andamento', active = true, last_mutation_key = p_idempotency_key,
      last_mutation_result = jsonb_build_object('action_id', id, 'manager_id', v_manager_id, 'status', 'escalated'),
      updated_by = auth.uid(), updated_at = now()
  WHERE id = p_action_id;

  IF v_manager_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (
      sender_id, title, message, target_type, target_store_id, target_role,
      recipient_id, store_id, type, priority, link
    ) VALUES (
      auth.uid(), 'Vendedor precisa de apoio', concat(v_action.title, ': ', trim(p_reason)),
      'store', v_action.store_id, 'gerente', v_manager_id, v_action.store_id,
      'central_escalation', 'high', '/gerente/rotina-equipe'
    );
  END IF;
  RETURN p_action_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.central_resolve_action(
  p_action_id uuid,
  p_result_code text,
  p_note text,
  p_payload jsonb,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action public.execution_actions%ROWTYPE;
  v_event_type text;
  v_event_id uuid;
  v_due_at timestamptz;
  v_new_status text := 'concluida';
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sessao invalida.'; END IF;
  IF nullif(trim(coalesce(p_result_code, '')), '') IS NULL THEN RAISE EXCEPTION 'Resultado obrigatorio.'; END IF;
  IF nullif(trim(coalesce(p_idempotency_key, '')), '') IS NULL THEN RAISE EXCEPTION 'Chave de idempotencia obrigatoria.'; END IF;
  p_payload := coalesce(p_payload, '{}'::jsonb);

  SELECT * INTO v_action FROM public.execution_actions WHERE id = p_action_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Atividade nao encontrada.'; END IF;
  IF NOT public.central_can_manage_action(v_action.seller_id, v_action.store_id) THEN
    RAISE EXCEPTION 'Sem permissao para resolver esta atividade.';
  END IF;
  IF v_action.last_mutation_key = p_idempotency_key THEN
    RETURN coalesce(v_action.last_mutation_result, jsonb_build_object('action_id', v_action.id, 'replayed', true));
  END IF;
  IF NOT public.central_result_allowed(v_action.activity_type, p_result_code) THEN
    RAISE EXCEPTION 'Resultado invalido para o tipo de atividade.';
  END IF;

  IF p_result_code = 'reschedule' THEN
    v_due_at := nullif(p_payload->>'due_at', '')::timestamptz;
    PERFORM public.central_reschedule_action(p_action_id, v_due_at, p_note, p_idempotency_key);
    RETURN jsonb_build_object('action_id', p_action_id, 'status', 'reagendada', 'due_at', v_due_at);
  END IF;
  IF p_result_code = 'manager_required' THEN
    PERFORM public.central_escalate_action(p_action_id, p_note, p_idempotency_key);
    RETURN jsonb_build_object('action_id', p_action_id, 'status', 'escalated');
  END IF;

  IF p_result_code = 'task_justified' THEN
    IF nullif(trim(coalesce(p_note, '')), '') IS NULL THEN RAISE EXCEPTION 'Justificativa obrigatoria.'; END IF;
    v_new_status := 'justificada';
  ELSIF p_result_code = 'cancelled' THEN
    v_new_status := 'cancelada';
  END IF;

  IF v_action.agendamento_id IS NOT NULL THEN
    UPDATE public.agendamentos
    SET status = CASE
          WHEN p_result_code IN ('attended', 'delivery_completed', 'warranty_resolved', 'post_sale_satisfied') THEN 'compareceu'::public.crm_agendamento_status
          WHEN p_result_code IN ('no_show', 'client_absent') THEN 'nao_compareceu'::public.crm_agendamento_status
          WHEN p_result_code IN ('confirmed', 'delivery_confirmed') THEN 'confirmado'::public.crm_agendamento_status
          ELSE status END,
        observacoes = CASE WHEN nullif(trim(coalesce(p_note, '')), '') IS NULL THEN observacoes
          ELSE concat_ws(E'\n', observacoes, concat('Central: ', trim(p_note))) END,
        updated_by = auth.uid(), updated_at = now()
    WHERE id = v_action.agendamento_id;
  END IF;

  IF v_action.oportunidade_id IS NOT NULL AND p_result_code = 'sale_completed' THEN
    UPDATE public.oportunidades
    SET valor_negociado = coalesce(nullif(p_payload->>'value', '')::numeric, valor_negociado),
        sinal = coalesce(nullif(p_payload->>'deposit', '')::numeric, sinal),
        financiamento = coalesce(nullif(p_payload->>'financing', '')::public.crm_financiamento, financiamento),
        carro_avaliado = coalesce(nullif(p_payload->>'trade_evaluated', '')::boolean, carro_avaliado),
        etapa = 'ganho'::public.crm_etapa_funil, closed_at = now(),
        updated_by = auth.uid(), updated_at = now()
    WHERE id = v_action.oportunidade_id;
  ELSIF v_action.oportunidade_id IS NOT NULL AND p_result_code = 'sale_lost' THEN
    IF nullif(trim(coalesce(p_payload->>'loss_reason', p_note, '')), '') IS NULL THEN
      RAISE EXCEPTION 'Motivo da perda obrigatorio.';
    END IF;
    UPDATE public.oportunidades
    SET etapa = 'perdido'::public.crm_etapa_funil,
        motivo_perda = trim(coalesce(nullif(p_payload->>'loss_reason', ''), p_note)),
        closed_at = now(), updated_by = auth.uid(), updated_at = now()
    WHERE id = v_action.oportunidade_id;
  ELSIF v_action.oportunidade_id IS NOT NULL AND p_result_code = 'advanced' THEN
    UPDATE public.oportunidades
    SET etapa = CASE WHEN etapa IN ('ganho', 'perdido') THEN etapa ELSE 'negociacao'::public.crm_etapa_funil END,
        updated_by = auth.uid(), updated_at = now()
    WHERE id = v_action.oportunidade_id;
  END IF;

  IF v_action.cliente_id IS NOT NULL THEN
    UPDATE public.clientes
    SET status = CASE
          WHEN p_result_code = 'sale_completed' THEN 'pos_venda'::public.crm_cliente_status
          WHEN p_result_code = 'sale_lost' AND nullif(p_payload->>'future_date', '') IS NULL THEN 'inativo'::public.crm_cliente_status
          ELSE status END,
        ultima_interacao = current_date,
        proxima_acao = CASE
          WHEN nullif(p_payload->>'next_action', '') IS NOT NULL THEN trim(p_payload->>'next_action')
          WHEN p_result_code = 'sale_completed' THEN 'Realizar pos-venda'
          WHEN p_result_code IN ('no_answer', 'no_response') THEN 'Tentar novo contato'
          WHEN p_result_code = 'sale_lost' AND nullif(p_payload->>'future_date', '') IS NOT NULL THEN 'Reativar oportunidade futura'
          WHEN p_result_code IN ('task_completed', 'documentation_completed', 'delivery_completed', 'warranty_resolved') THEN NULL
          ELSE proxima_acao END,
        proxima_acao_em = CASE
          WHEN nullif(p_payload->>'next_due_date', '') IS NOT NULL THEN (p_payload->>'next_due_date')::date
          WHEN p_result_code = 'sale_completed' THEN current_date + 3
          WHEN p_result_code IN ('no_answer', 'no_response') THEN current_date + 1
          WHEN p_result_code = 'sale_lost' AND nullif(p_payload->>'future_date', '') IS NOT NULL THEN (p_payload->>'future_date')::date
          WHEN p_result_code IN ('task_completed', 'documentation_completed', 'delivery_completed', 'warranty_resolved') THEN NULL
          ELSE proxima_acao_em END,
        updated_by = auth.uid(), updated_at = now()
    WHERE id = v_action.cliente_id;
  END IF;

  v_event_type := CASE
    WHEN p_result_code = 'sale_completed' THEN 'venda_realizada'
    WHEN p_result_code = 'attended' THEN 'atendimento_comercial_realizado'
    WHEN p_result_code = 'contacted' AND v_action.activity_type = 'retorno' THEN 'retorno_realizado'
    WHEN p_result_code = 'advanced' THEN 'proposta_enviada'
    WHEN p_result_code = 'delivery_completed' THEN 'entrega_realizada'
    WHEN p_result_code IN ('warranty_resolved', 'waiting_workshop', 'waiting_part') THEN 'garantia_registrada'
    WHEN p_result_code IN ('post_sale_satisfied', 'post_sale_question', 'complaint', 'repurchase', 'referral') THEN 'pos_venda_realizado'
    ELSE NULL END;

  IF v_event_type IS NOT NULL AND v_action.cliente_id IS NOT NULL AND v_action.store_id IS NOT NULL THEN
    INSERT INTO public.eventos_comerciais (
      cliente_id, oportunidade_id, agendamento_id, loja_id, seller_user_id,
      tipo_evento, data_evento, origem_modulo, observacao, data_competencia,
      created_by, idempotency_key
    ) VALUES (
      v_action.cliente_id, v_action.oportunidade_id, v_action.agendamento_id,
      v_action.store_id, v_action.seller_id, v_event_type::public.crm_evento_tipo,
      now(), 'central_execucao', nullif(trim(coalesce(p_note, '')), ''), current_date,
      auth.uid(), 'central:event:' || p_idempotency_key
    )
    ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
    RETURNING id INTO v_event_id;
    IF v_event_id IS NULL THEN
      SELECT id INTO v_event_id FROM public.eventos_comerciais
      WHERE idempotency_key = 'central:event:' || p_idempotency_key;
    END IF;
  END IF;

  v_result := jsonb_build_object('action_id', p_action_id, 'status', v_new_status,
    'result_code', p_result_code, 'event_id', v_event_id);
  UPDATE public.execution_actions
  SET status = v_new_status, result_code = p_result_code,
      result_note = nullif(trim(coalesce(p_note, '')), ''),
      evento_id = coalesce(v_event_id, evento_id), active = false,
      completed_at = now(), completed_by = auth.uid(),
      justificativa = CASE WHEN v_new_status = 'justificada' THEN trim(p_note) ELSE justificativa END,
      last_mutation_key = p_idempotency_key, last_mutation_result = v_result,
      updated_by = auth.uid(), updated_at = now()
  WHERE id = p_action_id;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_central_sync_agendamento_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.central_upsert_appointment_action_internal(NEW.id, 'central:agendamento:' || NEW.id::text);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_central_sync_agendamento_action ON public.agendamentos;
CREATE TRIGGER trg_central_sync_agendamento_action
AFTER INSERT OR UPDATE OF data_hora, status, tipo, cliente_id, oportunidade_id, observacoes
ON public.agendamentos
FOR EACH ROW EXECUTE FUNCTION public.trg_central_sync_agendamento_action();

-- Backfill idempotente dos compromissos existentes.
INSERT INTO public.execution_actions (
  store_id, seller_id, source_type, source_id, cliente_id, oportunidade_id,
  agendamento_id, activity_type, title, description, objective, due_at, status,
  priority, priority_rank, alert_tone, origin_module, source_record_id,
  idempotency_key, active, automatic, client_name_snapshot, phone_snapshot,
  vehicle_snapshot, metadata, created_by, updated_by, completed_at
)
SELECT
  a.loja_id, a.seller_user_id, 'agendamento', a.id, a.cliente_id, a.oportunidade_id,
  a.id, a.tipo::text,
  concat(CASE a.tipo::text
    WHEN 'visita' THEN 'Atendimento' WHEN 'test_drive' THEN 'Test-drive'
    WHEN 'pos_venda' THEN 'Pos-venda' ELSE initcap(replace(a.tipo::text, '_', ' ')) END,
    ' - ', coalesce(nullif(c.nome, ''), 'Cliente sem nome')),
  a.observacoes, a.proxima_acao, a.data_hora,
  CASE WHEN a.status::text IN ('compareceu', 'nao_compareceu') THEN 'concluida' ELSE 'pendente' END,
  CASE WHEN a.tipo::text IN ('visita', 'negociacao', 'test_drive') THEN 'urgent'
       WHEN a.tipo::text IN ('entrega', 'garantia') THEN 'high' ELSE 'medium' END,
  CASE a.tipo::text WHEN 'visita' THEN 1 WHEN 'negociacao' THEN 1 WHEN 'test_drive' THEN 1
       WHEN 'entrega' THEN 2 WHEN 'garantia' THEN 3 WHEN 'retorno' THEN 4 WHEN 'pos_venda' THEN 5 ELSE 5 END,
  CASE WHEN a.tipo::text IN ('visita', 'negociacao', 'test_drive', 'entrega') THEN 'warning' ELSE 'info' END,
  coalesce(nullif(a.origem_modulo, ''), 'crm'), a.id::text,
  'central:agendamento:' || a.id::text,
  a.status::text NOT IN ('compareceu', 'nao_compareceu'), true,
  c.nome, c.telefone, o.veiculo_interesse,
  jsonb_build_object('appointment_status', a.status::text, 'appointment_type', a.tipo::text, 'channel', a.canal::text),
  coalesce(a.created_by, a.seller_user_id), coalesce(a.updated_by, a.seller_user_id),
  CASE WHEN a.status::text IN ('compareceu', 'nao_compareceu') THEN coalesce(a.updated_at, now()) ELSE NULL END
FROM public.agendamentos a
LEFT JOIN public.clientes c ON c.id = a.cliente_id
LEFT JOIN public.oportunidades o ON o.id = a.oportunidade_id
ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL
DO UPDATE SET
  cliente_id = EXCLUDED.cliente_id,
  oportunidade_id = EXCLUDED.oportunidade_id,
  agendamento_id = EXCLUDED.agendamento_id,
  activity_type = EXCLUDED.activity_type,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  objective = EXCLUDED.objective,
  due_at = EXCLUDED.due_at,
  priority = EXCLUDED.priority,
  priority_rank = EXCLUDED.priority_rank,
  alert_tone = EXCLUDED.alert_tone,
  client_name_snapshot = EXCLUDED.client_name_snapshot,
  phone_snapshot = EXCLUDED.phone_snapshot,
  vehicle_snapshot = EXCLUDED.vehicle_snapshot,
  metadata = public.execution_actions.metadata || EXCLUDED.metadata,
  updated_at = now();

REVOKE ALL ON FUNCTION public.central_can_access_store(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.central_can_manage_action(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.central_result_allowed(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.central_upsert_appointment_action_internal(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.central_sync_appointment_action(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.central_create_manual_action(jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.central_reschedule_action(uuid, timestamptz, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.central_resolve_action(uuid, text, text, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.central_escalate_action(uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.central_can_access_store(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.central_can_manage_action(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.central_result_allowed(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.central_sync_appointment_action(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.central_create_manual_action(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.central_reschedule_action(uuid, timestamptz, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.central_resolve_action(uuid, text, text, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.central_escalate_action(uuid, text, text) TO authenticated;

COMMIT;
