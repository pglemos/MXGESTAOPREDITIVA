-- Historia FUND-02: limpeza tecnica residual de tabelas secundarias.
-- Nao altera migrations historicas; aplica novos nomes no schema live.

BEGIN;

-- Consultoria / PMR secundarios.
ALTER TABLE IF EXISTS public.consulting_assignments RENAME TO atribuicoes_consultoria;
ALTER TABLE IF EXISTS public.consulting_client_units RENAME TO unidades_cliente_consultoria;
ALTER TABLE IF EXISTS public.consulting_client_contacts RENAME TO contatos_cliente_consultoria;
ALTER TABLE IF EXISTS public.consulting_methodology_steps RENAME TO etapas_metodologia_consultoria;
ALTER TABLE IF EXISTS public.consulting_oauth_tokens RENAME TO tokens_oauth_consultoria;
ALTER TABLE IF EXISTS public.consulting_calendar_settings RENAME TO configuracoes_calendario_consultoria;
ALTER TABLE IF EXISTS public.consulting_google_oauth_states RENAME TO estados_oauth_google_consultoria;
ALTER TABLE IF EXISTS public.consulting_visit_programs RENAME TO programas_visita_consultoria;
ALTER TABLE IF EXISTS public.consulting_visit_template_steps RENAME TO etapas_modelo_visita_consultoria;
ALTER TABLE IF EXISTS public.consulting_client_modules RENAME TO modulos_cliente_consultoria;
ALTER TABLE IF EXISTS public.consulting_pmr_form_templates RENAME TO modelos_formulario_pmr;
ALTER TABLE IF EXISTS public.consulting_pmr_form_responses RENAME TO respostas_formulario_pmr;
ALTER TABLE IF EXISTS public.consulting_metric_catalog RENAME TO catalogo_metricas_consultoria;
ALTER TABLE IF EXISTS public.consulting_parameter_sets RENAME TO conjuntos_parametros_consultoria;
ALTER TABLE IF EXISTS public.consulting_parameter_values RENAME TO valores_parametros_consultoria;
ALTER TABLE IF EXISTS public.consulting_client_metric_targets RENAME TO metas_metricas_cliente;
ALTER TABLE IF EXISTS public.consulting_client_metric_results RENAME TO resultados_metricas_cliente;
ALTER TABLE IF EXISTS public.consulting_client_metric_snapshots RENAME TO snapshots_metricas_cliente;
ALTER TABLE IF EXISTS public.consulting_marketing_monthly RENAME TO marketing_mensal_consultoria;
ALTER TABLE IF EXISTS public.consulting_sales_entries RENAME TO entradas_vendas_consultoria;
ALTER TABLE IF EXISTS public.consulting_inventory_snapshots RENAME TO snapshots_estoque_consultoria;
ALTER TABLE IF EXISTS public.consulting_inventory_items RENAME TO itens_estoque_consultoria;
ALTER TABLE IF EXISTS public.consulting_generated_artifacts RENAME TO artefatos_gerados_consultoria;
ALTER TABLE IF EXISTS public.consulting_schedule_events RENAME TO eventos_agenda_consultoria;
ALTER TABLE IF EXISTS public.consulting_import_batches RENAME TO lotes_importacao_consultoria;
ALTER TABLE IF EXISTS public.consulting_import_rows RENAME TO linhas_importacao_consultoria;

-- Operacao de loja e automacoes secundarias.
ALTER TABLE IF EXISTS public.store_audit_log RENAME TO logs_auditoria_loja;
ALTER TABLE IF EXISTS public.store_benchmarks RENAME TO benchmarks_loja;
ALTER TABLE IF EXISTS public.store_delivery_rules RENAME TO regras_entrega_loja;
ALTER TABLE IF EXISTS public.store_meta_rules RENAME TO regras_metas_loja;
ALTER TABLE IF EXISTS public.store_meta_rules_history RENAME TO historico_regras_metas_loja;
ALTER TABLE IF EXISTS public.reprocess_logs RENAME TO logs_reprocessamento;
ALTER TABLE IF EXISTS public.raw_imports RENAME TO importacoes_brutas;
ALTER TABLE IF EXISTS public.weekly_feedback_reports RENAME TO relatorios_devolutivas_semanais;
ALTER TABLE IF EXISTS public.checkin_correction_requests RENAME TO solicitacoes_correcao_lancamento;
ALTER TABLE IF EXISTS public.digital_products RENAME TO produtos_digitais;
ALTER TABLE IF EXISTS public.notifications RENAME TO notificacoes;
ALTER TABLE IF EXISTS public.feedbacks RENAME TO devolutivas;
ALTER TABLE IF EXISTS public.manager_routine_logs RENAME TO logs_rotina_gerente;
ALTER TABLE IF EXISTS public.whatsapp_share_logs RENAME TO logs_compartilhamento_whatsapp;
ALTER TABLE IF EXISTS public.profiles RENAME TO perfis_usuario;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedbacks_seller_id_fkey') THEN
    ALTER TABLE public.devolutivas RENAME CONSTRAINT feedbacks_seller_id_fkey TO devolutivas_vendedor_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedbacks_manager_id_fkey') THEN
    ALTER TABLE public.devolutivas RENAME CONSTRAINT feedbacks_manager_id_fkey TO devolutivas_gerente_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consulting_visits_consultant_id_fkey') THEN
    ALTER TABLE public.visitas_consultoria RENAME CONSTRAINT consulting_visits_consultant_id_fkey TO visitas_consultoria_consultor_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consulting_visits_auxiliary_consultant_id_fkey') THEN
    ALTER TABLE public.visitas_consultoria RENAME CONSTRAINT consulting_visits_auxiliary_consultant_id_fkey TO visitas_consultoria_consultor_auxiliar_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consulting_schedule_events_responsible_user_id_fkey') THEN
    ALTER TABLE public.eventos_agenda_consultoria RENAME CONSTRAINT consulting_schedule_events_responsible_user_id_fkey TO eventos_agenda_consultoria_responsavel_usuario_id_fkey;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('perfis_usuario', 'perfis_usuario', true)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.pode_acessar_cliente_consultoria(p_cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.eh_administrador_mx(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.atribuicoes_consultoria ac
      WHERE ac.client_id = p_cliente_id
        AND ac.user_id = auth.uid()
        AND ac.active = true
    )
$$;

CREATE OR REPLACE FUNCTION public.can_access_consulting_client(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.pode_acessar_cliente_consultoria(p_client_id)
$$;

CREATE OR REPLACE FUNCTION public.modulo_cliente_consultoria_habilitado(p_cliente_id uuid, p_modulo_chave text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.modulos_cliente_consultoria mcc
    WHERE mcc.client_id = p_cliente_id
      AND mcc.module_key = p_modulo_chave
      AND mcc.enabled = true
  )
$$;

CREATE OR REPLACE FUNCTION public.consulting_client_module_enabled(p_client_id uuid, p_module_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.modulo_cliente_consultoria_habilitado(p_client_id, p_module_key)
$$;

CREATE OR REPLACE FUNCTION public.approve_correction_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
BEGIN
  SELECT * INTO v_request
  FROM public.solicitacoes_correcao_lancamento
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitacao nao encontrada ou ja processada.';
  END IF;

  IF NOT (public.eh_administrador_mx(auth.uid()) OR public.is_manager_of(v_request.store_id)) THEN
    RAISE EXCEPTION 'Permissao negada.';
  END IF;

  UPDATE public.lancamentos_diarios
  SET
    leads_prev_day = COALESCE((v_request.requested_values->>'leads_prev_day')::integer, (v_request.requested_values->>'leads')::integer, leads_prev_day),
    agd_cart_today = COALESCE((v_request.requested_values->>'agd_cart_today')::integer, (v_request.requested_values->>'agd_cart')::integer, agd_cart_today),
    agd_net_today = COALESCE((v_request.requested_values->>'agd_net_today')::integer, (v_request.requested_values->>'agd_net')::integer, agd_net_today),
    vnd_porta_prev_day = COALESCE((v_request.requested_values->>'vnd_porta_prev_day')::integer, (v_request.requested_values->>'vnd_porta')::integer, vnd_porta_prev_day),
    vnd_cart_prev_day = COALESCE((v_request.requested_values->>'vnd_cart_prev_day')::integer, (v_request.requested_values->>'vnd_cart')::integer, vnd_cart_prev_day),
    vnd_net_prev_day = COALESCE((v_request.requested_values->>'vnd_net_prev_day')::integer, (v_request.requested_values->>'vnd_net')::integer, vnd_net_prev_day),
    visit_prev_day = COALESCE((v_request.requested_values->>'visit_prev_day')::integer, (v_request.requested_values->>'visitas')::integer, visit_prev_day),
    updated_at = now()
  WHERE id = v_request.checkin_id;

  UPDATE public.solicitacoes_correcao_lancamento
  SET status = 'approved',
      auditor_id = auth.uid(),
      reviewed_at = now()
  WHERE id = request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_import_data(p_log_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw record;
  v_store_id uuid;
  v_seller_id uuid;
  v_ref_date date;
  v_current_status text;
  v_file_hash text;
BEGIN
  SELECT status, file_hash
    INTO v_current_status, v_file_hash
    FROM public.logs_reprocessamento
   WHERE id = p_log_id
   FOR UPDATE;

  IF v_current_status = 'completed' OR v_current_status = 'processing' THEN
    RAISE EXCEPTION 'Este lote ja foi processado ou esta em execucao (status: %).', v_current_status;
  END IF;

  IF v_file_hash IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.logs_reprocessamento lr
    WHERE lr.id <> p_log_id
      AND lr.file_hash = v_file_hash
      AND lr.status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Arquivo ja processado anteriormente para este hash.';
  END IF;

  UPDATE public.logs_reprocessamento
     SET status = 'processing',
         started_at = now()
   WHERE id = p_log_id;

  FOR v_raw IN
    SELECT id, raw_data
    FROM public.importacoes_brutas
    WHERE log_id = p_log_id
  LOOP
    BEGIN
      IF (v_raw.raw_data->>'store_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_store_id := (v_raw.raw_data->>'store_id')::uuid;
      ELSE
        SELECT id INTO v_store_id
        FROM public.lojas
        WHERE name ILIKE COALESCE(v_raw.raw_data->>'LOJA', '')
        LIMIT 1;
      END IF;

      IF (v_raw.raw_data->>'seller_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_seller_id := (v_raw.raw_data->>'seller_id')::uuid;
      ELSE
        SELECT id INTO v_seller_id
        FROM public.usuarios
        WHERE email ILIKE COALESCE(v_raw.raw_data->>'EMAIL', '')
           OR name ILIKE COALESCE(v_raw.raw_data->>'VENDEDOR', '')
        LIMIT 1;
      END IF;

      v_ref_date := (v_raw.raw_data->>'DATA')::date;

      IF v_ref_date > (timezone('America/Sao_Paulo', now()))::date THEN
        RAISE EXCEPTION 'Data de referencia (%) superior ao limite operacional.', v_ref_date;
      END IF;

      IF v_store_id IS NOT NULL AND v_seller_id IS NOT NULL AND v_ref_date IS NOT NULL THEN
        INSERT INTO public.lancamentos_diarios (
          seller_user_id,
          store_id,
          reference_date,
          submitted_at,
          metric_scope,
          leads_prev_day,
          agd_cart_today,
          agd_net_today,
          vnd_porta_prev_day,
          vnd_cart_prev_day,
          vnd_net_prev_day,
          visit_prev_day,
          zero_reason,
          created_by,
          updated_at
        ) VALUES (
          v_seller_id,
          v_store_id,
          v_ref_date,
          now(),
          'daily',
          COALESCE(NULLIF(v_raw.raw_data->>'LEADS', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'AGD_CART', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'AGD_NET', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'VND_PORTA', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'VND_CART', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'VND_NET', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'VISITA', '')::integer, 0),
          NULLIF(v_raw.raw_data->>'MOTIVO_ZERO', ''),
          COALESCE((SELECT triggered_by FROM public.logs_reprocessamento WHERE id = p_log_id), v_seller_id),
          now()
        )
        ON CONFLICT (seller_user_id, store_id, reference_date)
        DO UPDATE SET
          submitted_at = EXCLUDED.submitted_at,
          leads_prev_day = EXCLUDED.leads_prev_day,
          agd_cart_today = EXCLUDED.agd_cart_today,
          agd_net_today = EXCLUDED.agd_net_today,
          vnd_porta_prev_day = EXCLUDED.vnd_porta_prev_day,
          vnd_cart_prev_day = EXCLUDED.vnd_cart_prev_day,
          vnd_net_prev_day = EXCLUDED.vnd_net_prev_day,
          visit_prev_day = EXCLUDED.visit_prev_day,
          zero_reason = EXCLUDED.zero_reason,
          updated_at = now();

        UPDATE public.logs_reprocessamento
           SET records_processed = COALESCE(records_processed, 0) + 1,
               rows_processed = COALESCE(rows_processed, 0) + 1
         WHERE id = p_log_id;
      ELSE
        UPDATE public.logs_reprocessamento
           SET records_failed = COALESCE(records_failed, 0) + 1,
               error_log = COALESCE(error_log, '[]'::jsonb) || jsonb_build_object(
                 'error', 'Entidade nao localizada (Loja ou Vendedor)',
                 'store_found', v_store_id IS NOT NULL,
                 'seller_found', v_seller_id IS NOT NULL,
                 'data', v_raw.raw_data
               )
         WHERE id = p_log_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.logs_reprocessamento
         SET records_failed = COALESCE(records_failed, 0) + 1,
             error_log = COALESCE(error_log, '[]'::jsonb) || jsonb_build_object('error', SQLERRM, 'data', v_raw.raw_data)
       WHERE id = p_log_id;
    END;
  END LOOP;

  UPDATE public.logs_reprocessamento
     SET status = 'completed',
         finished_at = now(),
         processed_at = now()
   WHERE id = p_log_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_broadcast_notification(
  p_title text,
  p_message text,
  p_type text DEFAULT 'system'::text,
  p_priority text DEFAULT 'medium'::text,
  p_store_id uuid DEFAULT NULL::uuid,
  p_target_role text DEFAULT 'todos'::text,
  p_link text DEFAULT NULL::text,
  p_sender_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_record record;
  v_broadcast_id uuid := gen_random_uuid();
BEGIN
  FOR v_user_record IN
    SELECT DISTINCT
      u.id AS user_id,
      CASE WHEN p_store_id IS NULL THEN NULL ELSE p_store_id END AS resolved_store_id
    FROM public.usuarios u
    LEFT JOIN public.vinculos_loja v ON v.user_id = u.id
    WHERE u.active = true
      AND (p_store_id IS NULL OR v.store_id = p_store_id)
      AND (
        p_target_role = 'todos'
        OR u.role = p_target_role
        OR v.role = p_target_role
      )
  LOOP
    INSERT INTO public.notificacoes (
      recipient_id,
      store_id,
      sender_id,
      broadcast_id,
      title,
      message,
      type,
      priority,
      link,
      read,
      created_at,
      target_type,
      target_store_id,
      target_role,
      sent_at
    ) VALUES (
      v_user_record.user_id,
      v_user_record.resolved_store_id,
      p_sender_id,
      v_broadcast_id,
      p_title,
      p_message,
      p_type,
      p_priority,
      p_link,
      false,
      now(),
      CASE WHEN p_store_id IS NULL THEN 'all' ELSE 'store' END,
      p_store_id,
      CASE WHEN p_target_role = 'todos' THEN NULL ELSE p_target_role END,
      now()
    );
  END LOOP;

  RETURN v_broadcast_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_store_update_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changes jsonb;
BEGIN
  SELECT COALESCE(
    jsonb_object_agg(key, jsonb_build_object('old', old_value, 'new', new_value)),
    '{}'::jsonb
  )
  INTO v_changes
  FROM (
    SELECT new_values.key, old_values.value AS old_value, new_values.value AS new_value
    FROM jsonb_each(to_jsonb(NEW)) AS new_values(key, value)
    JOIN jsonb_each(to_jsonb(OLD)) AS old_values(key, value) USING (key)
    WHERE new_values.value IS DISTINCT FROM old_values.value
      AND new_values.key NOT IN ('updated_at')
  ) delta;

  IF v_changes <> '{}'::jsonb THEN
    INSERT INTO public.logs_auditoria_loja(store_id, changed_by, changes)
    VALUES (NEW.id, auth.uid(), v_changes);
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.concluir_visita_consultoria(p_visita_id uuid)
RETURNS public.visitas_consultoria
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_visita public.visitas_consultoria;
  v_exige_evidencia boolean;
  v_tem_evidencia boolean;
BEGIN
  SELECT * INTO v_visita FROM public.visitas_consultoria WHERE id = p_visita_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Visita nao encontrada';
  END IF;

  v_exige_evidencia := EXISTS (
    SELECT 1
    FROM public.etapas_modelo_visita_consultoria s
    JOIN public.clientes_consultoria c ON c.id = v_visita.client_id
    WHERE s.program_key = COALESCE(c.program_template_key, 'pmr_7')
      AND s.visit_number = v_visita.visit_number
      AND NULLIF(BTRIM(COALESCE(s.evidence_required, '')), '') IS NOT NULL
  );

  v_tem_evidencia := EXISTS (
    SELECT 1 FROM public.evidencias_visita e WHERE e.visita_id = p_visita_id
  );

  IF v_exige_evidencia AND NOT v_tem_evidencia THEN
    RAISE EXCEPTION 'Esta visita exige evidencia antes da conclusao';
  END IF;

  UPDATE public.visitas_consultoria
  SET status = 'concluida', updated_at = now()
  WHERE id = p_visita_id
  RETURNING * INTO v_visita;

  RETURN v_visita;
END;
$$;

COMMIT;
