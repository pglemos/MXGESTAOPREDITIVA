-- Story 1.5 (DB-002) — Wrap SQLERRM em RPCs
-- Cria tabela de auditoria de erros internos + helper de logging + refatora submit_checkin
-- para não vazar SQLERRM ao cliente (info-disclosure / OWASP A05).
--
-- Pattern documentado em docs/reviews/submit-checkin-rpc-audit.md §4.
-- Idempotente (CREATE TABLE IF NOT EXISTS, CREATE OR REPLACE FUNCTION).

-- =====================================================
-- 1) Tabela de log de erros internos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rpc_error_log (
  trace_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rpc_name   text NOT NULL,
  sqlstate   text NOT NULL,
  sqlerrm    text NOT NULL,
  caller_id  uuid,
  payload    jsonb,
  context    jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rpc_error_log_created_at_idx
  ON public.rpc_error_log (created_at DESC);

CREATE INDEX IF NOT EXISTS rpc_error_log_rpc_name_idx
  ON public.rpc_error_log (rpc_name);

ALTER TABLE public.rpc_error_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rpc_error_log_select ON public.rpc_error_log;
CREATE POLICY rpc_error_log_select ON public.rpc_error_log
  FOR SELECT TO authenticated
  USING (public.eh_administrador_mx());

-- Sem policies de INSERT/UPDATE/DELETE: gravação só via helper SECURITY DEFINER.
REVOKE ALL ON public.rpc_error_log FROM authenticated, anon;
GRANT SELECT ON public.rpc_error_log TO authenticated;

COMMENT ON TABLE public.rpc_error_log IS
  'Story 1.5/DB-002: log interno de erros de RPC. Cliente recebe apenas trace_id; SQLERRM nunca é exposto.';

-- =====================================================
-- 2) Helper: log_rpc_error
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_rpc_error(
  p_rpc_name text,
  p_sqlstate text,
  p_sqlerrm  text,
  p_caller_id uuid DEFAULT auth.uid(),
  p_payload  jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trace_id uuid;
BEGIN
  INSERT INTO public.rpc_error_log(rpc_name, sqlstate, sqlerrm, caller_id, payload)
  VALUES (p_rpc_name, p_sqlstate, p_sqlerrm, p_caller_id, p_payload)
  RETURNING trace_id INTO v_trace_id;
  RETURN v_trace_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_rpc_error(text, text, text, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_rpc_error(text, text, text, uuid, jsonb) TO authenticated;

COMMENT ON FUNCTION public.log_rpc_error(text, text, text, uuid, jsonb) IS
  'Story 1.5/DB-002: grava erro interno e retorna trace_id para o cliente. NÃO expõe SQLERRM.';

-- =====================================================
-- 3) Refator submit_checkin — wrap SQLERRM
-- =====================================================
CREATE OR REPLACE FUNCTION public.submit_checkin(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_role text;
  v_store_id uuid;
  v_seller_id uuid;
  v_reference_date date;
  v_scope text := coalesce(p_payload->>'metric_scope', 'daily');
  v_official_reference date := ((timezone('America/Sao_Paulo', now()))::date - 1);
  v_current_sp_time time := (timezone('America/Sao_Paulo', now()))::time;
  v_is_internal boolean := false;
  v_can_manage_store boolean := false;
  v_checkin_id uuid;
BEGIN
  SELECT role
    INTO v_caller_role
    FROM public.usuarios
   WHERE id = v_caller_id
     AND active = true;

  IF v_caller_role IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Usuário não autenticado ou inativo.');
  END IF;

  v_is_internal := v_caller_role IN ('administrador_geral', 'administrador_mx', 'consultor_mx');

  v_store_id := nullif(p_payload->>'store_id', '')::uuid;
  v_seller_id := nullif(p_payload->>'seller_id', '')::uuid;
  v_reference_date := nullif(p_payload->>'reference_date', '')::date;

  IF v_store_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'store_id é obrigatório.');
  END IF;

  IF v_reference_date IS NULL THEN
    v_reference_date := v_official_reference;
  END IF;

  IF v_reference_date <> v_official_reference THEN
    RETURN jsonb_build_object('ok', false, 'error', 'reference_date deve ser o dia útil anterior.');
  END IF;

  IF NOT v_is_internal THEN
    SELECT EXISTS (
      SELECT 1
        FROM public.vinculos_loja vl
       WHERE vl.usuario_id = v_caller_id
         AND vl.store_id = v_store_id
         AND vl.papel IN ('gerente', 'subgerente', 'vendedor', 'consultor')
         AND coalesce(vl.active, true) = true
    )
    INTO v_can_manage_store;

    IF NOT v_can_manage_store THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Sem permissão para registrar check-in nesta loja.');
    END IF;
  END IF;

  IF v_scope = 'seller' AND v_seller_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'seller_id é obrigatório para escopo seller.');
  END IF;

  INSERT INTO public.checkins_diarios AS cd (
    store_id, seller_id, reference_date, metric_scope,
    leads_prev_day, agd_cart_prev_day, agd_net_prev_day,
    agd_cart_today, agd_net_today,
    vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day,
    visit_prev_day, zero_reason, note, created_by, updated_at
  )
  VALUES (
    v_store_id, v_seller_id, v_reference_date, v_scope,
    nullif(p_payload->>'leads_prev_day','')::int,
    nullif(p_payload->>'agd_cart_prev_day','')::int,
    nullif(p_payload->>'agd_net_prev_day','')::int,
    nullif(p_payload->>'agd_cart_today','')::int,
    nullif(p_payload->>'agd_net_today','')::int,
    nullif(p_payload->>'vnd_porta_prev_day','')::int,
    nullif(p_payload->>'vnd_cart_prev_day','')::int,
    nullif(p_payload->>'vnd_net_prev_day','')::int,
    nullif(p_payload->>'visit_prev_day','')::int,
    nullif(p_payload->>'zero_reason',''),
    nullif(p_payload->>'note',''),
    v_caller_id,
    now()
  )
  ON CONFLICT (store_id, coalesce(seller_id, '00000000-0000-0000-0000-000000000000'::uuid), reference_date, metric_scope)
  DO UPDATE SET
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
    updated_at = now()
  RETURNING id INTO v_checkin_id;

  RETURN jsonb_build_object(
    'ok', true,
    'data', jsonb_build_object('id', v_checkin_id)
  );
EXCEPTION
  WHEN others THEN
    DECLARE
      v_trace_id uuid;
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
