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
  v_scope_text text := coalesce(nullif(p_payload->>'metric_scope', ''), 'daily');
  v_scope public.checkin_scope;
  v_official_reference date := ((timezone('America/Sao_Paulo', now()))::date - 1);
  v_current_sp_time time := (timezone('America/Sao_Paulo', now()))::time;
  v_is_internal boolean := false;
  v_can_manage_store boolean := false;
  v_checkin_id uuid;
BEGIN
  IF v_scope_text NOT IN ('daily', 'adjustment', 'historical') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Escopo de check-in inválido.');
  END IF;

  v_scope := v_scope_text::public.checkin_scope;

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
  v_seller_id := coalesce(nullif(p_payload->>'seller_user_id', '')::uuid, v_caller_id);
  v_reference_date := nullif(p_payload->>'reference_date', '')::date;

  IF v_store_id IS NULL OR v_seller_id IS NULL OR v_reference_date IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Payload de check-in incompleto.');
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM public.vinculos_loja
     WHERE user_id = v_caller_id
       AND store_id = v_store_id
       AND role IN ('dono', 'gerente')
       AND coalesce(is_active, true) = true
  )
  INTO v_can_manage_store;

  IF v_scope_text = 'daily' THEN
    IF v_caller_role <> 'vendedor' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Registro diário é permitido apenas para vendedor.');
    END IF;

    IF v_reference_date <> v_official_reference THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Registro diário aceita somente a referência oficial.');
    END IF;

    IF v_seller_id <> v_caller_id THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Registro diário deve ser feito pelo próprio vendedor.');
    END IF;

    IF v_current_sp_time > time '09:45:00' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Lançamentos diários ficam disponíveis somente até 09:45.');
    END IF;
  ELSE
    IF NOT (v_is_internal OR v_can_manage_store) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Ajuste técnico é restrito a gestores e perfis internos MX.');
    END IF;
  END IF;

  IF v_reference_date > v_official_reference THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Lançamentos não podem usar data futura ou o dia corrente.');
  END IF;

  IF NOT v_is_internal AND NOT EXISTS (
    SELECT 1
      FROM public.vinculos_loja
     WHERE user_id = v_seller_id
       AND store_id = v_store_id
       AND coalesce(is_active, true) = true
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Usuário não possui vínculo ativo com a loja.');
  END IF;

  INSERT INTO public.lancamentos_diarios (
    seller_user_id,
    store_id,
    reference_date,
    submitted_at,
    metric_scope,
    submission_status,
    submitted_late,
    edit_locked_at,
    leads_prev_day,
    leads_net_prev_day,
    agd_cart_prev_day,
    agd_net_prev_day,
    agd_cart_today,
    agd_net_today,
    vnd_porta_prev_day,
    vnd_cart_prev_day,
    vnd_net_prev_day,
    visit_prev_day,
    zero_reason,
    note,
    created_by,
    updated_at
  ) VALUES (
    v_seller_id,
    v_store_id,
    v_reference_date,
    coalesce(nullif(p_payload->>'submitted_at', '')::timestamptz, now()),
    v_scope,
    coalesce(nullif(p_payload->>'submission_status', ''), 'on_time'),
    coalesce((p_payload->>'submitted_late')::boolean, false),
    nullif(p_payload->>'edit_locked_at', '')::timestamptz,
    coalesce((p_payload->>'leads_prev_day')::integer, 0),
    coalesce((p_payload->>'leads_net_prev_day')::integer, 0),
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
    v_caller_id,
    now()
  )
  ON CONFLICT (seller_user_id, store_id, reference_date, metric_scope)
  DO UPDATE SET
    submitted_at = EXCLUDED.submitted_at,
    submission_status = EXCLUDED.submission_status,
    submitted_late = EXCLUDED.submitted_late,
    edit_locked_at = EXCLUDED.edit_locked_at,
    leads_prev_day = EXCLUDED.leads_prev_day,
    leads_net_prev_day = EXCLUDED.leads_net_prev_day,
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
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_checkin(jsonb) TO authenticated;
