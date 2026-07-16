-- Carteira de Clientes Base44 1:1
-- Mantém o modelo normalizado do MX e adiciona somente persistência, segurança e
-- transações necessárias para a experiência observável no Base44.

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS do_not_contact boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS do_not_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS do_not_contact_reason text,
  ADD COLUMN IF NOT EXISTS reactivation_at timestamptz;

ALTER TABLE public.eventos_comerciais
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS eventos_comerciais_idempotency_key_uidx
  ON public.eventos_comerciais (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.carteira_missoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid NOT NULL,
  seller_user_id uuid NOT NULL,
  tipo_missao text NOT NULL,
  status text NOT NULL DEFAULT 'Preparando'
    CHECK (status IN ('Preparando', 'Enviando mensagens', 'Aguardando respostas', 'Respondendo clientes', 'Pausada', 'Concluída', 'Cancelada')),
  total_clientes integer NOT NULL DEFAULT 0 CHECK (total_clientes >= 0),
  clientes_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  mensagens_enviadas integer NOT NULL DEFAULT 0 CHECK (mensagens_enviadas >= 0),
  pulados integer NOT NULL DEFAULT 0 CHECK (pulados >= 0),
  aguardando_resposta integer NOT NULL DEFAULT 0 CHECK (aguardando_resposta >= 0),
  aguardando_sua_resposta integer NOT NULL DEFAULT 0 CHECK (aguardando_sua_resposta >= 0),
  concluidos integer NOT NULL DEFAULT 0 CHECK (concluidos >= 0),
  visitas_agendadas integer NOT NULL DEFAULT 0 CHECK (visitas_agendadas >= 0),
  propostas_solicitadas integer NOT NULL DEFAULT 0 CHECK (propostas_solicitadas >= 0),
  sem_interesse integer NOT NULL DEFAULT 0 CHECK (sem_interesse >= 0),
  nao_responderam integer NOT NULL DEFAULT 0 CHECK (nao_responderam >= 0),
  indice_atual integer NOT NULL DEFAULT 0 CHECK (indice_atual >= 0),
  iniciada_em timestamptz NOT NULL DEFAULT now(),
  pausada_em timestamptz,
  concluida_em timestamptz,
  idempotency_key text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

CREATE UNIQUE INDEX IF NOT EXISTS carteira_missoes_idempotency_uidx
  ON public.carteira_missoes (seller_user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS carteira_missoes_seller_status_idx
  ON public.carteira_missoes (seller_user_id, status, iniciada_em DESC);

CREATE TABLE IF NOT EXISTS public.carteira_missao_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  missao_id uuid NOT NULL REFERENCES public.carteira_missoes(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0 CHECK (ordem >= 0),
  status text NOT NULL DEFAULT 'Pendente'
    CHECK (status IN ('Pendente', 'Mensagem enviada', 'Aguardando resposta', 'Aguardando vendedor', 'Concluído', 'Pulado', 'Sem interesse', 'Não respondeu')),
  resultado text,
  mensagem_enviada_em timestamptz,
  respondido_em timestamptz,
  concluido_em timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (missao_id, cliente_id)
);

CREATE INDEX IF NOT EXISTS carteira_missao_itens_fila_idx
  ON public.carteira_missao_itens (missao_id, status, ordem);

ALTER TABLE public.carteira_missoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carteira_missao_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS carteira_missoes_seller_rw ON public.carteira_missoes;
CREATE POLICY carteira_missoes_seller_rw
  ON public.carteira_missoes
  FOR ALL
  USING (seller_user_id = auth.uid())
  WITH CHECK (seller_user_id = auth.uid());

DROP POLICY IF EXISTS carteira_missoes_store_read ON public.carteira_missoes;
CREATE POLICY carteira_missoes_store_read
  ON public.carteira_missoes
  FOR SELECT
  USING (
    is_manager_of(loja_id)
    OR is_owner_of(loja_id)
    OR user_has_role(ARRAY['admin_mx'::text, 'master'::text, 'consultant'::text])
  );

DROP POLICY IF EXISTS carteira_missao_itens_access ON public.carteira_missao_itens;
CREATE POLICY carteira_missao_itens_access
  ON public.carteira_missao_itens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.carteira_missoes m
      WHERE m.id = missao_id
        AND (
          m.seller_user_id = auth.uid()
          OR is_manager_of(m.loja_id)
          OR is_owner_of(m.loja_id)
          OR user_has_role(ARRAY['admin_mx'::text, 'master'::text, 'consultant'::text])
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.carteira_missoes m
      WHERE m.id = missao_id
        AND m.seller_user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.carteira_salvar_cliente(
  p_payload jsonb,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_store_id uuid;
  v_cliente_id uuid := NULLIF(p_payload->>'cliente_id', '')::uuid;
  v_oportunidade_id uuid := NULLIF(p_payload->>'oportunidade_id', '')::uuid;
  v_agendamento_id uuid := NULLIF(p_payload->>'agendamento_id', '')::uuid;
  v_evento_id uuid;
  v_phone text := NULLIF(BTRIM(COALESCE(p_payload->>'telefone', p_payload->>'whatsapp', '')), '');
  v_phone_normalized text := regexp_replace(COALESCE(v_phone, ''), '\D', '', 'g');
  v_new_opportunity boolean := COALESCE((p_payload->>'nova_oportunidade')::boolean, false);
  v_event_type crm_evento_tipo := COALESCE(NULLIF(p_payload->>'tipo_evento', '')::crm_evento_tipo, 'retorno_realizado'::crm_evento_tipo);
  v_existing_event record;
  v_existing_client record;
  v_existing_opportunity record;
  v_existing_appointment record;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT id, cliente_id, oportunidade_id, agendamento_id
      INTO v_existing_event
    FROM public.eventos_comerciais
    WHERE idempotency_key = p_idempotency_key
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'ok', true,
        'replayed', true,
        'cliente_id', v_existing_event.cliente_id,
        'oportunidade_id', v_existing_event.oportunidade_id,
        'agendamento_id', v_existing_event.agendamento_id,
        'evento_id', v_existing_event.id
      );
    END IF;
  END IF;

  IF v_cliente_id IS NOT NULL THEN
    SELECT * INTO v_existing_client
    FROM public.clientes
    WHERE id = v_cliente_id
      AND seller_user_id = v_user
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cliente não encontrado ou sem permissão.';
    END IF;

    v_store_id := v_existing_client.loja_id;
  ELSE
    SELECT vl.store_id INTO v_store_id
    FROM public.vinculos_loja vl
    WHERE vl.user_id = v_user
      AND vl.is_active = true
    ORDER BY vl.created_at DESC NULLS LAST
    LIMIT 1;

    IF v_store_id IS NULL THEN
      RAISE EXCEPTION 'Vendedor sem vínculo ativo com loja.';
    END IF;

    IF v_phone_normalized <> '' THEN
      SELECT * INTO v_existing_client
      FROM public.clientes
      WHERE seller_user_id = v_user
        AND loja_id = v_store_id
        AND COALESCE(telefone_normalizado, regexp_replace(COALESCE(telefone, ''), '\D', '', 'g')) = v_phone_normalized
      ORDER BY updated_at DESC
      LIMIT 1
      FOR UPDATE;

      IF FOUND THEN
        v_cliente_id := v_existing_client.id;
      END IF;
    END IF;
  END IF;

  IF v_cliente_id IS NULL THEN
    INSERT INTO public.clientes (
      loja_id,
      seller_user_id,
      nome,
      telefone,
      telefone_normalizado,
      canal_origem,
      status,
      proxima_acao,
      proxima_acao_em,
      potencial_negocio,
      observacoes,
      origem_modulo,
      created_by,
      updated_by,
      do_not_contact,
      do_not_contact_at,
      do_not_contact_reason,
      reactivation_at
    ) VALUES (
      v_store_id,
      v_user,
      COALESCE(NULLIF(BTRIM(p_payload->>'nome'), ''), 'Cliente sem nome'),
      v_phone,
      NULLIF(v_phone_normalized, ''),
      COALESCE(NULLIF(p_payload->>'canal_origem', '')::crm_canal, 'carteira'::crm_canal),
      COALESCE(NULLIF(p_payload->>'cliente_status', '')::crm_cliente_status, 'oportunidade'::crm_cliente_status),
      NULLIF(p_payload->>'proxima_acao', ''),
      NULLIF(p_payload->>'proxima_acao_em', '')::date,
      COALESCE(NULLIF(p_payload->>'potencial_negocio', '')::numeric, 0),
      NULLIF(p_payload->>'observacoes', ''),
      'carteira_base44',
      v_user,
      v_user,
      COALESCE((p_payload->>'do_not_contact')::boolean, false),
      CASE WHEN COALESCE((p_payload->>'do_not_contact')::boolean, false) THEN now() ELSE NULL END,
      NULLIF(p_payload->>'do_not_contact_reason', ''),
      NULLIF(p_payload->>'reactivation_at', '')::timestamptz
    )
    RETURNING id INTO v_cliente_id;
  ELSE
    UPDATE public.clientes
    SET
      nome = CASE WHEN p_payload ? 'nome' THEN COALESCE(NULLIF(BTRIM(p_payload->>'nome'), ''), nome) ELSE nome END,
      telefone = CASE WHEN p_payload ? 'telefone' OR p_payload ? 'whatsapp' THEN v_phone ELSE telefone END,
      telefone_normalizado = CASE WHEN p_payload ? 'telefone' OR p_payload ? 'whatsapp' THEN NULLIF(v_phone_normalized, '') ELSE telefone_normalizado END,
      canal_origem = CASE WHEN p_payload ? 'canal_origem' THEN (p_payload->>'canal_origem')::crm_canal ELSE canal_origem END,
      status = CASE WHEN p_payload ? 'cliente_status' THEN (p_payload->>'cliente_status')::crm_cliente_status ELSE status END,
      proxima_acao = CASE WHEN p_payload ? 'proxima_acao' THEN NULLIF(p_payload->>'proxima_acao', '') ELSE proxima_acao END,
      proxima_acao_em = CASE WHEN p_payload ? 'proxima_acao_em' THEN NULLIF(p_payload->>'proxima_acao_em', '')::date ELSE proxima_acao_em END,
      potencial_negocio = CASE WHEN p_payload ? 'potencial_negocio' THEN COALESCE(NULLIF(p_payload->>'potencial_negocio', '')::numeric, 0) ELSE potencial_negocio END,
      observacoes = CASE WHEN p_payload ? 'observacoes' THEN NULLIF(p_payload->>'observacoes', '') ELSE observacoes END,
      ultima_interacao = CASE WHEN COALESCE((p_payload->>'registrar_interacao')::boolean, false) THEN CURRENT_DATE ELSE ultima_interacao END,
      do_not_contact = CASE WHEN p_payload ? 'do_not_contact' THEN COALESCE((p_payload->>'do_not_contact')::boolean, false) ELSE do_not_contact END,
      do_not_contact_at = CASE
        WHEN p_payload ? 'do_not_contact' AND COALESCE((p_payload->>'do_not_contact')::boolean, false) THEN COALESCE(do_not_contact_at, now())
        WHEN p_payload ? 'do_not_contact' THEN NULL
        ELSE do_not_contact_at
      END,
      do_not_contact_reason = CASE WHEN p_payload ? 'do_not_contact_reason' THEN NULLIF(p_payload->>'do_not_contact_reason', '') ELSE do_not_contact_reason END,
      reactivation_at = CASE WHEN p_payload ? 'reactivation_at' THEN NULLIF(p_payload->>'reactivation_at', '')::timestamptz ELSE reactivation_at END,
      origem_modulo = 'carteira_base44',
      updated_at = now(),
      updated_by = v_user
    WHERE id = v_cliente_id;
  END IF;

  IF v_oportunidade_id IS NOT NULL THEN
    SELECT * INTO v_existing_opportunity
    FROM public.oportunidades
    WHERE id = v_oportunidade_id
      AND cliente_id = v_cliente_id
      AND seller_user_id = v_user
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Oportunidade não encontrada ou sem permissão.';
    END IF;
  ELSIF NOT v_new_opportunity THEN
    SELECT * INTO v_existing_opportunity
    FROM public.oportunidades
    WHERE cliente_id = v_cliente_id
      AND seller_user_id = v_user
      AND etapa NOT IN ('ganho'::crm_etapa_funil, 'perdido'::crm_etapa_funil)
    ORDER BY updated_at DESC, created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
      v_oportunidade_id := v_existing_opportunity.id;
    END IF;
  END IF;

  IF v_oportunidade_id IS NULL THEN
    INSERT INTO public.oportunidades (
      cliente_id,
      loja_id,
      seller_user_id,
      veiculo_interesse,
      valor_negociado,
      etapa,
      canal,
      sinal,
      financiamento,
      carro_avaliado,
      motivo_perda,
      origem_modulo,
      created_by,
      updated_by,
      idempotency_key
    ) VALUES (
      v_cliente_id,
      v_store_id,
      v_user,
      NULLIF(p_payload->>'veiculo_interesse', ''),
      COALESCE(NULLIF(p_payload->>'valor_negociado', '')::numeric, 0),
      COALESCE(NULLIF(p_payload->>'etapa', '')::crm_etapa_funil, 'prospeccao'::crm_etapa_funil),
      COALESCE(NULLIF(p_payload->>'canal', '')::crm_canal, NULLIF(p_payload->>'canal_origem', '')::crm_canal),
      COALESCE(NULLIF(p_payload->>'sinal', '')::numeric, 0),
      COALESCE(NULLIF(p_payload->>'financiamento', '')::crm_financiamento, 'nao_aplica'::crm_financiamento),
      COALESCE((p_payload->>'carro_avaliado')::boolean, false),
      NULLIF(p_payload->>'motivo_perda', ''),
      'carteira_base44',
      v_user,
      v_user,
      CASE WHEN v_new_opportunity THEN p_idempotency_key ELSE NULL END
    )
    RETURNING id INTO v_oportunidade_id;
  ELSE
    UPDATE public.oportunidades
    SET
      veiculo_interesse = CASE WHEN p_payload ? 'veiculo_interesse' THEN NULLIF(p_payload->>'veiculo_interesse', '') ELSE veiculo_interesse END,
      valor_negociado = CASE WHEN p_payload ? 'valor_negociado' THEN COALESCE(NULLIF(p_payload->>'valor_negociado', '')::numeric, 0) ELSE valor_negociado END,
      etapa = CASE WHEN p_payload ? 'etapa' THEN (p_payload->>'etapa')::crm_etapa_funil ELSE etapa END,
      canal = CASE WHEN p_payload ? 'canal' THEN NULLIF(p_payload->>'canal', '')::crm_canal ELSE canal END,
      sinal = CASE WHEN p_payload ? 'sinal' THEN COALESCE(NULLIF(p_payload->>'sinal', '')::numeric, 0) ELSE sinal END,
      financiamento = CASE WHEN p_payload ? 'financiamento' THEN (p_payload->>'financiamento')::crm_financiamento ELSE financiamento END,
      carro_avaliado = CASE WHEN p_payload ? 'carro_avaliado' THEN COALESCE((p_payload->>'carro_avaliado')::boolean, false) ELSE carro_avaliado END,
      motivo_perda = CASE WHEN p_payload ? 'motivo_perda' THEN NULLIF(p_payload->>'motivo_perda', '') ELSE motivo_perda END,
      closed_at = CASE
        WHEN p_payload ? 'etapa' AND (p_payload->>'etapa') IN ('ganho', 'perdido') THEN COALESCE(closed_at, now())
        WHEN p_payload ? 'etapa' THEN NULL
        ELSE closed_at
      END,
      origem_modulo = 'carteira_base44',
      updated_at = now(),
      updated_by = v_user
    WHERE id = v_oportunidade_id;
  END IF;

  IF NULLIF(p_payload->>'agendamento_data_hora', '') IS NOT NULL THEN
    IF v_agendamento_id IS NOT NULL THEN
      SELECT * INTO v_existing_appointment
      FROM public.agendamentos
      WHERE id = v_agendamento_id
        AND seller_user_id = v_user
      FOR UPDATE;
    ELSE
      SELECT * INTO v_existing_appointment
      FROM public.agendamentos
      WHERE oportunidade_id = v_oportunidade_id
        AND seller_user_id = v_user
        AND status IN ('confirmado'::crm_agendamento_status, 'aguardando'::crm_agendamento_status)
      ORDER BY data_hora DESC, updated_at DESC
      LIMIT 1
      FOR UPDATE;

      IF FOUND THEN
        v_agendamento_id := v_existing_appointment.id;
      END IF;
    END IF;

    IF v_agendamento_id IS NULL THEN
      INSERT INTO public.agendamentos (
        cliente_id,
        oportunidade_id,
        loja_id,
        seller_user_id,
        data_hora,
        canal,
        tipo,
        status,
        proxima_acao,
        observacoes,
        origem_modulo,
        created_by,
        updated_by
      ) VALUES (
        v_cliente_id,
        v_oportunidade_id,
        v_store_id,
        v_user,
        (p_payload->>'agendamento_data_hora')::timestamptz,
        COALESCE(NULLIF(p_payload->>'canal', '')::crm_canal, NULLIF(p_payload->>'canal_origem', '')::crm_canal),
        COALESCE(NULLIF(p_payload->>'agendamento_tipo', '')::crm_agendamento_tipo, 'visita'::crm_agendamento_tipo),
        COALESCE(NULLIF(p_payload->>'agendamento_status', '')::crm_agendamento_status, 'confirmado'::crm_agendamento_status),
        NULLIF(p_payload->>'proxima_acao', ''),
        NULLIF(p_payload->>'observacoes', ''),
        'carteira_base44',
        v_user,
        v_user
      )
      RETURNING id INTO v_agendamento_id;
    ELSE
      UPDATE public.agendamentos
      SET
        data_hora = (p_payload->>'agendamento_data_hora')::timestamptz,
        canal = CASE WHEN p_payload ? 'canal' THEN NULLIF(p_payload->>'canal', '')::crm_canal ELSE canal END,
        tipo = CASE WHEN p_payload ? 'agendamento_tipo' THEN (p_payload->>'agendamento_tipo')::crm_agendamento_tipo ELSE tipo END,
        status = CASE WHEN p_payload ? 'agendamento_status' THEN (p_payload->>'agendamento_status')::crm_agendamento_status ELSE status END,
        proxima_acao = CASE WHEN p_payload ? 'proxima_acao' THEN NULLIF(p_payload->>'proxima_acao', '') ELSE proxima_acao END,
        observacoes = CASE WHEN p_payload ? 'observacoes' THEN NULLIF(p_payload->>'observacoes', '') ELSE observacoes END,
        origem_modulo = 'carteira_base44',
        updated_at = now(),
        updated_by = v_user
      WHERE id = v_agendamento_id;
    END IF;
  END IF;

  INSERT INTO public.eventos_comerciais (
    cliente_id,
    oportunidade_id,
    agendamento_id,
    loja_id,
    seller_user_id,
    tipo_evento,
    canal,
    modalidade,
    data_evento,
    origem_modulo,
    observacao,
    metadata,
    created_by,
    idempotency_key
  ) VALUES (
    v_cliente_id,
    v_oportunidade_id,
    v_agendamento_id,
    v_store_id,
    v_user,
    v_event_type,
    COALESCE(NULLIF(p_payload->>'canal', '')::crm_canal, NULLIF(p_payload->>'canal_origem', '')::crm_canal),
    NULLIF(p_payload->>'modalidade', '')::crm_evento_modalidade,
    COALESCE(NULLIF(p_payload->>'data_evento', '')::timestamptz, now()),
    'carteira_base44',
    NULLIF(p_payload->>'evento_observacao', ''),
    COALESCE(p_payload->'evento_metadata', '{}'::jsonb),
    v_user,
    p_idempotency_key
  )
  RETURNING id INTO v_evento_id;

  RETURN jsonb_build_object(
    'ok', true,
    'replayed', false,
    'cliente_id', v_cliente_id,
    'oportunidade_id', v_oportunidade_id,
    'agendamento_id', v_agendamento_id,
    'evento_id', v_evento_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.carteira_iniciar_missao(
  p_payload jsonb,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_store_id uuid;
  v_missao_id uuid;
  v_existing_id uuid;
  v_client_id uuid;
  v_order integer := 0;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  SELECT vl.store_id INTO v_store_id
  FROM public.vinculos_loja vl
  WHERE vl.user_id = v_user
    AND vl.is_active = true
  ORDER BY vl.created_at DESC NULLS LAST
  LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Vendedor sem vínculo ativo com loja.';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM public.carteira_missoes
    WHERE seller_user_id = v_user
      AND idempotency_key = p_idempotency_key
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      RETURN jsonb_build_object('ok', true, 'replayed', true, 'missao_id', v_existing_id);
    END IF;
  END IF;

  INSERT INTO public.carteira_missoes (
    loja_id,
    seller_user_id,
    tipo_missao,
    status,
    total_clientes,
    clientes_ids,
    iniciada_em,
    idempotency_key,
    metadata,
    updated_by
  ) VALUES (
    v_store_id,
    v_user,
    COALESCE(NULLIF(p_payload->>'tipo_missao', ''), 'Missão comercial'),
    COALESCE(NULLIF(p_payload->>'status', ''), 'Preparando'),
    COALESCE((p_payload->>'total_clientes')::integer, jsonb_array_length(COALESCE(p_payload->'clientes_ids', '[]'::jsonb))),
    ARRAY(SELECT value::uuid FROM jsonb_array_elements_text(COALESCE(p_payload->'clientes_ids', '[]'::jsonb))),
    COALESCE(NULLIF(p_payload->>'iniciada_em', '')::timestamptz, now()),
    p_idempotency_key,
    COALESCE(p_payload->'metadata', '{}'::jsonb),
    v_user
  )
  RETURNING id INTO v_missao_id;

  FOR v_client_id IN
    SELECT value::uuid
    FROM jsonb_array_elements_text(COALESCE(p_payload->'clientes_ids', '[]'::jsonb))
  LOOP
    INSERT INTO public.carteira_missao_itens (missao_id, cliente_id, ordem)
    VALUES (v_missao_id, v_client_id, v_order)
    ON CONFLICT (missao_id, cliente_id) DO NOTHING;
    v_order := v_order + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'replayed', false, 'missao_id', v_missao_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.carteira_atualizar_missao(
  p_missao_id uuid,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_mission record;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  SELECT * INTO v_mission
  FROM public.carteira_missoes
  WHERE id = p_missao_id
    AND seller_user_id = v_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Missão não encontrada ou sem permissão.';
  END IF;

  UPDATE public.carteira_missoes
  SET
    status = CASE WHEN p_payload ? 'status' THEN p_payload->>'status' ELSE status END,
    mensagens_enviadas = CASE WHEN p_payload ? 'mensagens_enviadas' THEN GREATEST((p_payload->>'mensagens_enviadas')::integer, 0) ELSE mensagens_enviadas END,
    pulados = CASE WHEN p_payload ? 'pulados' THEN GREATEST((p_payload->>'pulados')::integer, 0) ELSE pulados END,
    aguardando_resposta = CASE WHEN p_payload ? 'aguardando_resposta' THEN GREATEST((p_payload->>'aguardando_resposta')::integer, 0) ELSE aguardando_resposta END,
    aguardando_sua_resposta = CASE WHEN p_payload ? 'aguardando_sua_resposta' THEN GREATEST((p_payload->>'aguardando_sua_resposta')::integer, 0) ELSE aguardando_sua_resposta END,
    concluidos = CASE WHEN p_payload ? 'concluidos' THEN GREATEST((p_payload->>'concluidos')::integer, 0) ELSE concluidos END,
    visitas_agendadas = CASE WHEN p_payload ? 'visitas_agendadas' THEN GREATEST((p_payload->>'visitas_agendadas')::integer, 0) ELSE visitas_agendadas END,
    propostas_solicitadas = CASE WHEN p_payload ? 'propostas_solicitadas' THEN GREATEST((p_payload->>'propostas_solicitadas')::integer, 0) ELSE propostas_solicitadas END,
    sem_interesse = CASE WHEN p_payload ? 'sem_interesse' THEN GREATEST((p_payload->>'sem_interesse')::integer, 0) ELSE sem_interesse END,
    nao_responderam = CASE WHEN p_payload ? 'nao_responderam' THEN GREATEST((p_payload->>'nao_responderam')::integer, 0) ELSE nao_responderam END,
    indice_atual = CASE WHEN p_payload ? 'indice_atual' THEN GREATEST((p_payload->>'indice_atual')::integer, 0) ELSE indice_atual END,
    pausada_em = CASE WHEN p_payload->>'status' = 'Pausada' THEN now() WHEN p_payload ? 'status' THEN NULL ELSE pausada_em END,
    concluida_em = CASE WHEN p_payload->>'status' = 'Concluída' THEN now() ELSE concluida_em END,
    metadata = metadata || COALESCE(p_payload->'metadata', '{}'::jsonb),
    updated_at = now(),
    updated_by = v_user
  WHERE id = p_missao_id;

  RETURN jsonb_build_object('ok', true, 'missao_id', p_missao_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.carteira_salvar_cliente(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.carteira_iniciar_missao(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.carteira_atualizar_missao(uuid, jsonb) TO authenticated;
