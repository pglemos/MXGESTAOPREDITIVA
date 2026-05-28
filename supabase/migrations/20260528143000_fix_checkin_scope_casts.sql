-- Hotfix: align lancamentos_diarios RPCs with enum column metric_scope.
-- Context: remote Supabase lint reported text/checkin_scope mismatch after MX Wave 3.

BEGIN;

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
  v_scope_text text := coalesce(nullif(p_payload->>'metric_scope', ''), 'daily');
  v_scope public.checkin_scope;
  v_checkin_id uuid;
  v_validation record;
BEGIN
  IF v_scope_text NOT IN ('daily', 'adjustment', 'historical') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Escopo de check-in inválido.');
  END IF;

  v_scope := v_scope_text::public.checkin_scope;
  v_store_id := nullif(p_payload->>'store_id', '')::uuid;
  v_seller_id := coalesce(nullif(p_payload->>'seller_user_id', '')::uuid, v_caller_id);
  v_reference_date := nullif(p_payload->>'reference_date', '')::date;

  SELECT * INTO v_validation
    FROM public.checkin_validation_kit(v_caller_id, v_seller_id, v_store_id, v_reference_date, v_scope_text);

  IF NOT v_validation.ok THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', v_validation.error_message,
      'error_code', v_validation.error_code
    );
  END IF;

  INSERT INTO public.lancamentos_diarios (
    seller_user_id, store_id, reference_date, submitted_at, metric_scope,
    submission_status, submitted_late, edit_locked_at,
    leads_prev_day, agd_cart_prev_day, agd_net_prev_day,
    agd_cart_today, agd_net_today,
    vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day,
    visit_prev_day, zero_reason, note, created_by, updated_at
  ) VALUES (
    v_seller_id, v_store_id, v_reference_date,
    coalesce(nullif(p_payload->>'submitted_at', '')::timestamptz, now()),
    v_scope,
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
    v_caller_id, now()
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
    updated_at = now()
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

CREATE OR REPLACE FUNCTION public.get_lancamentos_por_loja_periodo(
  p_store_id uuid,
  p_start_date date,
  p_end_date date,
  p_scope text DEFAULT 'daily'
)
RETURNS SETOF public.lancamentos_diarios
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_scope public.checkin_scope := coalesce(nullif(p_scope, ''), 'daily')::public.checkin_scope;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.pode_ler_lancamentos_loja(p_store_id)
     AND NOT EXISTS (
       SELECT 1 FROM public.lancamentos_diarios
        WHERE store_id = p_store_id
          AND seller_user_id = v_caller_id
       LIMIT 1
     ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
    SELECT *
      FROM public.lancamentos_diarios
     WHERE store_id = p_store_id
       AND metric_scope = v_scope
       AND reference_date BETWEEN p_start_date AND p_end_date
       AND (
         public.pode_ler_lancamentos_loja(p_store_id)
         OR seller_user_id = v_caller_id
       )
     ORDER BY reference_date DESC, seller_user_id;
EXCEPTION
  WHEN others THEN
    PERFORM public.log_rpc_error(
      'get_lancamentos_por_loja_periodo',
      SQLSTATE, SQLERRM,
      v_caller_id,
      jsonb_build_object('store_id', p_store_id, 'start', p_start_date, 'end', p_end_date, 'scope', p_scope)
    );
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_lancamentos_por_loja_periodo(uuid, date, date, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_lancamentos_por_vendedor_periodo(
  p_seller_id uuid,
  p_store_id uuid,
  p_start_date date,
  p_end_date date,
  p_scope text DEFAULT 'daily'
)
RETURNS SETOF public.lancamentos_diarios
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_scope public.checkin_scope := coalesce(nullif(p_scope, ''), 'daily')::public.checkin_scope;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  IF v_caller_id <> p_seller_id
     AND NOT public.pode_ler_lancamentos_loja(p_store_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
    SELECT *
      FROM public.lancamentos_diarios
     WHERE seller_user_id = p_seller_id
       AND store_id = p_store_id
       AND metric_scope = v_scope
       AND reference_date BETWEEN p_start_date AND p_end_date
     ORDER BY reference_date DESC;
EXCEPTION
  WHEN others THEN
    PERFORM public.log_rpc_error(
      'get_lancamentos_por_vendedor_periodo',
      SQLSTATE, SQLERRM,
      v_caller_id,
      jsonb_build_object('seller_id', p_seller_id, 'store_id', p_store_id, 'start', p_start_date, 'end', p_end_date, 'scope', p_scope)
    );
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_lancamentos_por_vendedor_periodo(uuid, uuid, date, date, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_lancamento_por_dia(
  p_seller_id uuid,
  p_store_id uuid,
  p_reference_date date,
  p_scope text DEFAULT 'daily'
)
RETURNS public.lancamentos_diarios
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_scope public.checkin_scope := coalesce(nullif(p_scope, ''), 'daily')::public.checkin_scope;
  v_row public.lancamentos_diarios;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  IF v_caller_id <> p_seller_id
     AND NOT public.pode_ler_lancamentos_loja(p_store_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'P0001';
  END IF;

  SELECT *
    INTO v_row
    FROM public.lancamentos_diarios
   WHERE seller_user_id = p_seller_id
     AND store_id = p_store_id
     AND reference_date = p_reference_date
     AND metric_scope = v_scope
   LIMIT 1;

  RETURN v_row;
EXCEPTION
  WHEN others THEN
    PERFORM public.log_rpc_error(
      'get_lancamento_por_dia',
      SQLSTATE, SQLERRM,
      v_caller_id,
      jsonb_build_object('seller_id', p_seller_id, 'store_id', p_store_id, 'date', p_reference_date, 'scope', p_scope)
    );
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_lancamento_por_dia(uuid, uuid, date, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_lancamentos_rede_periodo(
  p_start_date date,
  p_end_date date,
  p_scope text DEFAULT 'daily'
)
RETURNS SETOF public.lancamentos_diarios
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_scope public.checkin_scope := coalesce(nullif(p_scope, ''), 'daily')::public.checkin_scope;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.eh_area_interna_mx() THEN
    RAISE EXCEPTION 'forbidden_global_read' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
    SELECT *
      FROM public.lancamentos_diarios
     WHERE metric_scope = v_scope
       AND reference_date BETWEEN p_start_date AND p_end_date
     ORDER BY reference_date DESC, store_id, seller_user_id;
EXCEPTION
  WHEN others THEN
    PERFORM public.log_rpc_error(
      'get_lancamentos_rede_periodo',
      SQLSTATE, SQLERRM,
      v_caller_id,
      jsonb_build_object('start', p_start_date, 'end', p_end_date, 'scope', p_scope)
    );
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_lancamentos_rede_periodo(date, date, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_lancamentos_referencia_dia(
  p_reference_date date,
  p_scope text DEFAULT 'daily'
)
RETURNS SETOF public.lancamentos_diarios
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_scope public.checkin_scope := coalesce(nullif(p_scope, ''), 'daily')::public.checkin_scope;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.eh_area_interna_mx() THEN
    RAISE EXCEPTION 'forbidden_global_read' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
    SELECT *
      FROM public.lancamentos_diarios
     WHERE metric_scope = v_scope
       AND reference_date = p_reference_date
     ORDER BY store_id, seller_user_id;
EXCEPTION
  WHEN others THEN
    PERFORM public.log_rpc_error(
      'get_lancamentos_referencia_dia',
      SQLSTATE, SQLERRM,
      v_caller_id,
      jsonb_build_object('date', p_reference_date, 'scope', p_scope)
    );
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_lancamentos_referencia_dia(date, text) TO authenticated;

COMMIT;
