-- ============================================================================
-- Migration: 20260626130000_ev1_6_janela_atraso_liberacao.sql
-- Story:     MX-EV1-20260626 (docs/stories/story-MX-EV1-20260626-janela-atraso-liberacao.md)
-- Epic:      EV-1.6 (docs/prd/modulo-vendedor/01-epic-fechamento.md#EV-1.6)
--
-- ESCOPO:
--   1. Tabela `fechamento_liberacoes` — registro auditável de solicitação e
--      liberação de fechamento atrasado (hoje só existe em localStorage).
--   2. Token opaco (gen_random_bytes + hash sha256 armazenado, nunca o token
--      em si) com expiração de 24h — equivalente em segurança a um link de
--      "magic link"/reset de senha: só quem tem o token original consegue
--      validar, o servidor nunca guarda o segredo em texto puro.
--   3. RPCs SECURITY DEFINER para criar a solicitação, consultar por token
--      (para a página de liberação) e liberar por token — sem INSERT/UPDATE
--      direto via REST nessa tabela (RLS só permite SELECT).
--   4. CORREÇÃO CRÍTICA: `checkin_validation_kit` ganha `p_liberado boolean`
--      e deixa de rejeitar com `time_window_closed` quando a liberação existe
--      — hoje a liberação nunca tinha efeito real porque o RPC bloqueava de
--      qualquer forma depois das 09:45.
--   5. `submit_checkin` passa a derivar a liberação da própria tabela
--      `fechamento_liberacoes` (EXISTS por vendedor+data+status='liberado'),
--      não do payload do client — remove a necessidade de confiar no client
--      sobre se há liberação ou não.
--   Aditivo e reversível (bloco DOWN comentado ao final).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Tabela fechamento_liberacoes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fechamento_liberacoes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id         uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  store_id            uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  data_fechamento     date NOT NULL,
  data_hora_solicitacao timestamptz NOT NULL DEFAULT now(),
  status              text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'liberado')),
  liberado_por_id     uuid REFERENCES public.usuarios(id),
  liberado_por_nome   text,
  data_hora_liberacao timestamptz,
  motivo_liberacao    text,
  token_hash          text NOT NULL,
  token_expira_em     timestamptz NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fechamento_liberacoes_vendedor_data
  ON public.fechamento_liberacoes (vendedor_id, data_fechamento);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fechamento_liberacoes_token_hash
  ON public.fechamento_liberacoes (token_hash);

COMMENT ON TABLE public.fechamento_liberacoes IS
  'Solicitações e liberações de Fechamento Diário atrasado (Especificação Funcional, §3-5). token_hash = sha256 do token opaco enviado por WhatsApp; o token em si nunca é persistido.';

ALTER TABLE public.fechamento_liberacoes ENABLE ROW LEVEL SECURITY;

-- SELECT: vendedor vê as próprias; gerente/supervisor/dono da loja e
-- admin_mx/master veem tudo da(s) loja(s) sob sua gestão.
DROP POLICY IF EXISTS fechamento_liberacoes_select ON public.fechamento_liberacoes;
CREATE POLICY fechamento_liberacoes_select ON public.fechamento_liberacoes
  FOR SELECT
  USING (
    vendedor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.role IN ('administrador_geral', 'administrador_mx', 'consultor_mx')
    )
    OR EXISTS (
      SELECT 1 FROM public.vinculos_loja vl
      WHERE vl.user_id = auth.uid()
        AND vl.store_id = fechamento_liberacoes.store_id
        AND vl.role IN ('gerente', 'dono')
        AND coalesce(vl.is_active, true) = true
    )
  );

-- Sem política de INSERT/UPDATE: escrita só via RPCs SECURITY DEFINER abaixo.

-- ----------------------------------------------------------------------------
-- 2. RPC: solicitar_liberacao_fechamento — vendedor solicita liberação
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.solicitar_liberacao_fechamento(
  p_data_fechamento date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_store_id uuid;
  v_raw_token text;
  v_token_hash text;
  v_id uuid;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Não autenticado.');
  END IF;

  SELECT store_id INTO v_store_id
    FROM public.vendedores_loja
   WHERE seller_user_id = v_caller_id
     AND coalesce(is_active, true) = true
   ORDER BY started_at DESC
   LIMIT 1;

  IF v_store_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Vendedor sem vínculo ativo com loja.');
  END IF;

  v_raw_token := encode(gen_random_bytes(32), 'base64');
  v_raw_token := translate(v_raw_token, '+/=', '-_');
  v_token_hash := encode(digest(v_raw_token, 'sha256'), 'hex');

  INSERT INTO public.fechamento_liberacoes (
    vendedor_id, store_id, data_fechamento, status, token_hash, token_expira_em
  ) VALUES (
    v_caller_id, v_store_id, p_data_fechamento, 'pendente', v_token_hash, now() + interval '24 hours'
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object('id', v_id, 'token', v_raw_token, 'store_id', v_store_id));
END;
$$;

GRANT EXECUTE ON FUNCTION public.solicitar_liberacao_fechamento(date) TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. RPC: consultar_liberacao_por_token — página de liberação consulta dados
--    (sem expor token_hash), só para gerente/supervisor/dono/admin.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consultar_liberacao_por_token(
  p_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_role text;
  v_row record;
  v_token_hash text;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Não autenticado.');
  END IF;

  SELECT role INTO v_caller_role FROM public.usuarios WHERE id = v_caller_id;

  IF v_caller_role NOT IN ('gerente', 'supervisor', 'administrador', 'dono', 'administrador_geral', 'administrador_mx') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Apenas gestores podem consultar liberações.');
  END IF;

  v_token_hash := encode(digest(p_token, 'sha256'), 'hex');

  SELECT fl.id, fl.vendedor_id, u.name AS vendedor_nome, fl.data_fechamento,
         fl.data_hora_solicitacao, fl.status, fl.store_id, fl.token_expira_em
    INTO v_row
    FROM public.fechamento_liberacoes fl
    JOIN public.usuarios u ON u.id = fl.vendedor_id
   WHERE fl.token_hash = v_token_hash;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Solicitação não encontrada ou link inválido.');
  END IF;

  IF v_row.token_expira_em < now() AND v_row.status = 'pendente' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Este link de liberação expirou. Solicite um novo pelo WhatsApp.');
  END IF;

  -- Gestor só vê solicitações da(s) loja(s) sob sua gestão (admin_mx vê tudo)
  IF v_caller_role NOT IN ('administrador_geral', 'administrador_mx') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.vinculos_loja vl
      WHERE vl.user_id = v_caller_id AND vl.store_id = v_row.store_id
        AND vl.role IN ('gerente', 'dono') AND coalesce(vl.is_active, true) = true
    ) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Você não tem acesso a esta loja.');
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object(
    'id', v_row.id,
    'vendedorId', v_row.vendedor_id,
    'vendedorNome', v_row.vendedor_nome,
    'dataFechamento', v_row.data_fechamento,
    'dataHoraSolicitacao', v_row.data_hora_solicitacao,
    'status', v_row.status
  ));
END;
$$;

GRANT EXECUTE ON FUNCTION public.consultar_liberacao_por_token(text) TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. RPC: liberar_fechamento_por_token — efetiva a liberação
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.liberar_fechamento_por_token(
  p_token text,
  p_motivo text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_role text;
  v_caller_nome text;
  v_row record;
  v_token_hash text;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Não autenticado.');
  END IF;

  SELECT role, name INTO v_caller_role, v_caller_nome FROM public.usuarios WHERE id = v_caller_id;

  IF v_caller_role NOT IN ('gerente', 'supervisor', 'administrador', 'dono', 'administrador_geral', 'administrador_mx') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Apenas gerente, supervisor, administrador ou dono podem liberar.');
  END IF;

  v_token_hash := encode(digest(p_token, 'sha256'), 'hex');

  SELECT * INTO v_row FROM public.fechamento_liberacoes WHERE token_hash = v_token_hash;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Solicitação não encontrada ou link inválido.');
  END IF;

  IF v_row.status = 'liberado' THEN
    RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object('alreadyLiberado', true));
  END IF;

  IF v_row.token_expira_em < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Este link de liberação expirou. Solicite um novo pelo WhatsApp.');
  END IF;

  IF v_caller_role NOT IN ('administrador_geral', 'administrador_mx') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.vinculos_loja vl
      WHERE vl.user_id = v_caller_id AND vl.store_id = v_row.store_id
        AND vl.role IN ('gerente', 'dono') AND coalesce(vl.is_active, true) = true
    ) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Você não tem acesso a esta loja.');
    END IF;
  END IF;

  UPDATE public.fechamento_liberacoes
     SET status = 'liberado',
         liberado_por_id = v_caller_id,
         liberado_por_nome = v_caller_nome,
         data_hora_liberacao = now(),
         motivo_liberacao = nullif(trim(coalesce(p_motivo, '')), '')
   WHERE id = v_row.id;

  -- Se já existir lançamento daquele dia (regularização tardia), grava a
  -- liberação nele também (EV-1.5). Se ainda não existir, submit_checkin vai
  -- consultar fechamento_liberacoes diretamente no momento do envio.
  UPDATE public.lancamentos_diarios
     SET fechamento_liberado = true,
         liberado_por_id = v_caller_id,
         liberado_por_nome = v_caller_nome,
         data_hora_liberacao = now()
   WHERE seller_user_id = v_row.vendedor_id
     AND reference_date = v_row.data_fechamento
     AND metric_scope IN ('daily', 'historical');

  RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object('alreadyLiberado', false));
END;
$$;

GRANT EXECUTE ON FUNCTION public.liberar_fechamento_por_token(text, text) TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. checkin_validation_kit: bypassa time_window_closed quando liberado
--    DROP explícito da assinatura antiga — adicionar p_liberado muda a
--    assinatura (overload), CREATE OR REPLACE não substitui, só cria uma
--    função nova ao lado da antiga (ambiguidade em COMMENT/chamadas sem cast).
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.checkin_validation_kit(uuid, uuid, uuid, date, text, timestamptz);

CREATE OR REPLACE FUNCTION public.checkin_validation_kit(
  p_caller_id uuid,
  p_seller_id uuid,
  p_store_id uuid,
  p_reference_date date,
  p_scope text DEFAULT 'daily',
  p_now timestamptz DEFAULT now(),
  p_liberado boolean DEFAULT false
)
RETURNS TABLE(ok boolean, error_code text, error_message text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_caller_active boolean;
  v_is_internal boolean;
  v_official_reference date := ((timezone('America/Sao_Paulo', p_now))::date - 1);
  v_current_sp_time time := (timezone('America/Sao_Paulo', p_now))::time;
BEGIN
  -- 1) Caller autenticado e ativo
  IF p_caller_id IS NULL THEN
    RETURN QUERY SELECT false, 'unauthenticated', 'Não autenticado.';
    RETURN;
  END IF;

  SELECT role, active
    INTO v_caller_role, v_caller_active
    FROM public.usuarios
   WHERE id = p_caller_id;

  IF v_caller_role IS NULL OR NOT coalesce(v_caller_active, false) THEN
    RETURN QUERY SELECT false, 'caller_inactive', 'Usuário não autenticado ou inativo.';
    RETURN;
  END IF;

  v_is_internal := v_caller_role IN ('administrador_geral', 'administrador_mx', 'consultor_mx');

  -- 2) Payload mínimo
  IF p_store_id IS NULL OR p_seller_id IS NULL OR p_reference_date IS NULL THEN
    RETURN QUERY SELECT false, 'incomplete_payload', 'Dados de checkin incompletos.';
    RETURN;
  END IF;

  -- 3) Scope válido
  IF p_scope NOT IN ('daily', 'adjustment', 'historical') THEN
    RETURN QUERY SELECT false, 'invalid_scope', 'Escopo de checkin inválido.';
    RETURN;
  END IF;

  -- 4) Admin MX bypassa demais regras (mas ainda valida payload e scope)
  IF v_is_internal THEN
    IF p_reference_date > v_official_reference THEN
      RETURN QUERY SELECT false, 'future_date', 'Lançamentos não podem usar data futura.';
      RETURN;
    END IF;

    RETURN QUERY SELECT true, NULL::text, NULL::text;
    RETURN;
  END IF;

  -- 5) Regras de vendedor (não-internal)

  -- 5.1) Scope daily: apenas vendedor
  IF p_scope = 'daily' THEN
    IF v_caller_role <> 'vendedor' THEN
      RETURN QUERY SELECT false, 'role_required', 'Registro diário é permitido apenas para vendedor.';
      RETURN;
    END IF;

    -- 5.2) Self-only (sem impersonation)
    IF p_caller_id <> p_seller_id THEN
      RETURN QUERY SELECT false, 'self_only', 'Registro diário deve ser feito pelo próprio vendedor.';
      RETURN;
    END IF;

    -- 5.3) Reference date deve ser a referência oficial (ontem)
    IF p_reference_date <> v_official_reference THEN
      RETURN QUERY SELECT false, 'invalid_reference_date', 'Registro diário aceita somente a referência oficial.';
      RETURN;
    END IF;
  END IF;

  -- 5.4) Janela horária 09:45 — BYPASSADA quando há liberação registrada
  --      (EV-1.6: antes desta correção, a liberação nunca tinha efeito real).
  IF p_scope IN ('daily', 'historical') AND NOT p_liberado THEN
    IF v_current_sp_time > time '09:45:00' THEN
      RETURN QUERY SELECT false, 'time_window_closed', 'Lançamentos diários ficam disponíveis somente até 09:45.';
      RETURN;
    END IF;
  END IF;

  -- 6) Data futura (qualquer scope)
  IF p_reference_date > v_official_reference THEN
    RETURN QUERY SELECT false, 'future_date', 'Lançamentos não podem usar data futura ou o dia corrente.';
    RETURN;
  END IF;

  -- 7) Vínculo de loja ativo
  IF NOT EXISTS (
    SELECT 1 FROM public.vinculos_loja
     WHERE user_id = p_seller_id
       AND store_id = p_store_id
       AND coalesce(is_active, true) = true
  ) THEN
    RETURN QUERY SELECT false, 'no_active_store_link', 'Usuário não possui vínculo ativo com a loja.';
    RETURN;
  END IF;

  -- 8) Vendedor ativo na loja (DB-001 generalizado)
  IF NOT EXISTS (
    SELECT 1 FROM public.vendedores_loja
     WHERE seller_user_id = p_seller_id
       AND store_id = p_store_id
       AND coalesce(is_active, true) = true
       AND (started_at IS NULL OR started_at <= p_reference_date)
       AND (ended_at IS NULL OR ended_at >= p_reference_date)
  ) THEN
    RETURN QUERY SELECT false, 'vendor_inactive', 'Vendedor não está ativo nesta loja no período informado.';
    RETURN;
  END IF;

  -- ✅ Todas validações passaram
  RETURN QUERY SELECT true, NULL::text, NULL::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.checkin_validation_kit(uuid, uuid, uuid, date, text, timestamptz, boolean) TO authenticated;

COMMENT ON FUNCTION public.checkin_validation_kit IS
  'DB-028 + EV-1.6: single source of truth para validação de checkin. p_liberado bypassa o bloqueio de 09:45 quando há liberação registrada em fechamento_liberacoes.';

-- ----------------------------------------------------------------------------
-- 6. submit_checkin: deriva liberação de fechamento_liberacoes (fonte real),
--    não do payload do client.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_checkin(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_store_id uuid;
  v_seller_id uuid;
  v_reference_date date;
  v_scope text := coalesce(nullif(p_payload->>'metric_scope', ''), 'daily');
  v_scope_enum public.checkin_scope;
  v_checkin_id uuid;
  v_validation record;
  -- Disciplina / atraso
  v_current_sp_time time := (timezone('America/Sao_Paulo', now()))::time;
  v_is_late_now boolean := v_current_sp_time > time '09:30:00';
  v_liberado boolean := false;
  v_finalizado_apos_prazo boolean;
  v_disciplina_base numeric;
  v_penalizacao_pp numeric;
  v_disciplina_final numeric;
  v_liberador record;
BEGIN
  IF v_scope NOT IN ('daily', 'adjustment', 'historical') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Escopo de check-in inválido.');
  END IF;
  v_scope_enum := v_scope::public.checkin_scope;

  v_store_id := nullif(p_payload->>'store_id', '')::uuid;
  v_seller_id := coalesce(nullif(p_payload->>'seller_user_id', '')::uuid, v_caller_id);
  v_reference_date := nullif(p_payload->>'reference_date', '')::date;

  -- Liberação real: existe solicitação liberada para este vendedor+data?
  -- (fonte única de verdade — não confia no payload do client)
  IF v_scope IN ('daily', 'historical') THEN
    SELECT liberado_por_id, liberado_por_nome, data_hora_liberacao
      INTO v_liberador
      FROM public.fechamento_liberacoes
     WHERE vendedor_id = v_seller_id
       AND data_fechamento = v_reference_date
       AND status = 'liberado'
     ORDER BY data_hora_liberacao DESC
     LIMIT 1;
    v_liberado := v_liberador.liberado_por_id IS NOT NULL;
  END IF;

  -- Validação centralizada (DB-028 + EV-1.6)
  SELECT * INTO v_validation
    FROM public.checkin_validation_kit(v_caller_id, v_seller_id, v_store_id, v_reference_date, v_scope, now(), v_liberado);

  IF NOT v_validation.ok THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', v_validation.error_message,
      'error_code', v_validation.error_code
    );
  END IF;

  v_disciplina_base := LEAST(100, GREATEST(0, coalesce((p_payload->>'pontuacao_disciplina_base')::numeric, 0)));

  IF v_scope IN ('daily', 'historical') THEN
    v_finalizado_apos_prazo := v_is_late_now AND v_liberado;
  ELSE
    v_finalizado_apos_prazo := false;
  END IF;

  v_penalizacao_pp := CASE WHEN v_finalizado_apos_prazo THEN 10 ELSE 0 END;
  v_disciplina_final := LEAST(100, GREATEST(0, v_disciplina_base - v_penalizacao_pp));

  INSERT INTO public.lancamentos_diarios (
    seller_user_id, store_id, reference_date, submitted_at, metric_scope,
    submission_status, submitted_late, edit_locked_at,
    leads_prev_day, agd_cart_prev_day, agd_net_prev_day,
    agd_cart_today, agd_net_today,
    vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day,
    visit_prev_day, zero_reason, note, created_by, updated_at,
    pontuacao_disciplina_base, pontuacao_disciplina_final,
    finalizado_apos_prazo, penalizacao_atraso_aplicada, percentual_penalizacao_atraso,
    fechamento_liberado, liberado_por_id, liberado_por_nome, data_hora_liberacao
  ) VALUES (
    v_seller_id, v_store_id, v_reference_date,
    coalesce(nullif(p_payload->>'submitted_at', '')::timestamptz, now()),
    v_scope_enum,
    coalesce(nullif(p_payload->>'submission_status', ''), 'on_time'),
    coalesce((p_payload->>'submitted_late')::boolean, false),
    nullif(p_payload->>'edit_locked_at', '')::timestamptz,
    coalesce((p_payload->>'leads_prev_day')::integer, 0),
    coalesce((p_payload->>'agd_cart_prev_day')::integer, 0),
    coalesce((p_payload->>'agd_net_prev_day')::integer, 0),
    coalesce((p_payload->>'agd_cart_today')::integer, 0),
    coalesce((p_payload->>'agd_net_today')::integer, 0),
    coalesce((p_payload->>'vnd_porta_prev_day')::integer, 0),
    coalesce((p_payload->>'vnd_cart_prev_day')::integer, 0),
    coalesce((p_payload->>'vnd_net_prev_day')::integer, 0),
    coalesce((p_payload->>'visit_prev_day')::integer, 0),
    nullif(trim(coalesce(p_payload->>'zero_reason', '')), ''),
    nullif(trim(coalesce(p_payload->>'note', '')), ''),
    v_caller_id, now(),
    v_disciplina_base, v_disciplina_final,
    v_finalizado_apos_prazo, v_finalizado_apos_prazo, v_penalizacao_pp,
    v_liberado, v_liberador.liberado_por_id, v_liberador.liberado_por_nome, v_liberador.data_hora_liberacao
  )
  ON CONFLICT (seller_user_id, store_id, reference_date, metric_scope)
  DO UPDATE SET
    submitted_at = EXCLUDED.submitted_at,
    submission_status = EXCLUDED.submission_status,
    submitted_late = EXCLUDED.submitted_late,
    edit_locked_at = EXCLUDED.edit_locked_at,
    leads_prev_day = EXCLUDED.leads_prev_day,
    agd_cart_prev_day = EXCLUDED.agd_cart_prev_day,
    agd_net_prev_day = EXCLUDED.agd_net_prev_day,
    agd_cart_today = EXCLUDED.agd_cart_today,
    agd_net_today = EXCLUDED.agd_net_today,
    vnd_porta_prev_day = EXCLUDED.vnd_porta_prev_day,
    vnd_cart_prev_day = EXCLUDED.vnd_cart_prev_day,
    vnd_net_prev_day = EXCLUDED.vnd_net_prev_day,
    visit_prev_day = EXCLUDED.visit_prev_day,
    zero_reason = EXCLUDED.zero_reason,
    note = EXCLUDED.note,
    created_by = EXCLUDED.created_by,
    updated_at = now(),
    pontuacao_disciplina_base = EXCLUDED.pontuacao_disciplina_base,
    pontuacao_disciplina_final = EXCLUDED.pontuacao_disciplina_final,
    finalizado_apos_prazo = EXCLUDED.finalizado_apos_prazo,
    penalizacao_atraso_aplicada = EXCLUDED.penalizacao_atraso_aplicada,
    percentual_penalizacao_atraso = EXCLUDED.percentual_penalizacao_atraso,
    fechamento_liberado = EXCLUDED.fechamento_liberado,
    liberado_por_id = EXCLUDED.liberado_por_id,
    liberado_por_nome = EXCLUDED.liberado_por_nome,
    data_hora_liberacao = EXCLUDED.data_hora_liberacao
  RETURNING id INTO v_checkin_id;

  RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object('id', v_checkin_id));
EXCEPTION
  WHEN others THEN
    DECLARE v_trace_id uuid;
    BEGIN
      v_trace_id := public.log_rpc_error('submit_checkin', SQLSTATE, SQLERRM, v_caller_id, p_payload);
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'Erro interno ao processar check-in. trace_id=' || v_trace_id::text,
        'trace_id', v_trace_id
      );
    END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_checkin(jsonb) TO authenticated;

COMMIT;

-- ============================================================================
-- DOWN (rollback emergencial)
-- ============================================================================
-- BEGIN;
--   DROP FUNCTION IF EXISTS public.liberar_fechamento_por_token(text, text);
--   DROP FUNCTION IF EXISTS public.consultar_liberacao_por_token(text);
--   DROP FUNCTION IF EXISTS public.solicitar_liberacao_fechamento(date);
--   DROP TABLE IF EXISTS public.fechamento_liberacoes;
--   -- Reverter checkin_validation_kit e submit_checkin para as versões de
--   -- 20260626120000_ev1_5_disciplina_persistida.sql.
-- COMMIT;
