-- MX: restaura a regra de dia operacional/janela de fechamento (revertendo
-- 20260709110000, que havia removido o bloqueio de horário por completo).
--
-- Regra de negócio (reunião 09/07/2026):
--   - Dia operacional D fica aberto para lançamento de D 12h00 até D+1 09h30
--     (sem necessidade de liberação).
--   - D+1 09h31 até D+1 12h00: só é possível enviar/editar o fechamento de D
--     com liberação do gerente (fechamento_liberacoes.status = 'liberado').
--   - A partir de D+1 12h00, o dia operacional já rolou para D+1 — a
--     referência oficial passa a ser D+1, então o fechamento de D só pode
--     mais ser regularizado via Histórico (scope 'adjustment').
--
-- v_official_reference agora rola às 12h00 (America/Sao_Paulo), não à meia-
-- noite: antes das 12h ainda é o dia anterior; a partir das 12h já é hoje.
CREATE OR REPLACE FUNCTION public.submit_checkin(p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_role text;
  v_store_id uuid;
  v_seller_id uuid;
  v_reference_date date;
  v_scope_text text := coalesce(nullif(p_payload->>'metric_scope', ''), 'daily');
  v_scope public.checkin_scope;
  v_now_sp timestamp := timezone('America/Sao_Paulo', now());
  v_official_reference date := CASE
    WHEN extract(hour from v_now_sp) < 12 THEN (v_now_sp::date - 1)
    ELSE v_now_sp::date
  END;
  v_minutes_since_midnight integer := extract(hour from v_now_sp)::integer * 60 + extract(minute from v_now_sp)::integer;
  v_is_internal boolean := false;
  v_can_manage_store boolean := false;
  v_liberado boolean := false;
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

    -- Janela 09h31-12h00 (do dia seguinte à referência): exige liberação do
    -- gerente. Depois das 12h00 o próprio v_official_reference já rolou
    -- para o novo dia, então esta checagem nem chega a disparar para o dia
    -- antigo (o reference_date enviado deixa de bater com a oficial acima).
    IF v_minutes_since_midnight > 570 THEN
      SELECT EXISTS (
        SELECT 1
          FROM public.fechamento_liberacoes
         WHERE vendedor_id = v_seller_id
           AND data_fechamento = v_reference_date
           AND status = 'liberado'
      )
      INTO v_liberado;

      IF NOT v_liberado THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Prazo oficial encerrado às 09h30. Solicite liberação ao seu gerente para finalizar este fechamento.');
      END IF;
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
$function$;

-- DOWN (manual): reverter para a versão em 20260709110000 se necessário.
