-- Story MX-AUDIT-20260710 / Fase 1
-- Alinha a referência D-1/D0 com o frontend, torna o fechamento diário
-- imutável e restaura os campos de disciplina removidos pela redefinição de
-- 09/07. A trava horária permanece desativada por decisão de produto.

-- A próxima migration usa o novo estado em uma transação separada. Manter o
-- enum evita uma alteração destrutiva de tipo (e preserva contratos gerados).
ALTER TYPE public.correction_status ADD VALUE IF NOT EXISTS 'cancelled';

CREATE OR REPLACE FUNCTION public.submit_checkin(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  v_official_reference date;
  v_is_internal boolean := false;
  v_can_manage_store boolean := false;
  v_checkin_id uuid;
  v_liberado boolean := false;
  v_liberado_por_id uuid;
  v_liberado_por_nome text;
  v_data_hora_liberacao timestamptz;
  v_disciplina_base numeric;
  v_finalizado_apos_prazo boolean := false;
  v_penalizacao_pp numeric := 0;
  v_disciplina_final numeric;
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

  -- Antes de 12h, D-1 continua oficial somente enquanto não houver um
  -- fechamento diário realmente submetido para vendedor + loja. Assim que
  -- D-1 é concluído, D0 abre imediatamente, igual ao contexto ativo do React.
  v_official_reference := v_now_sp::date;
  IF extract(hour from v_now_sp) < 12 AND NOT EXISTS (
    SELECT 1
      FROM public.lancamentos_diarios ld
     WHERE ld.seller_user_id = v_seller_id
       AND ld.store_id = v_store_id
       AND ld.reference_date = v_now_sp::date - 1
       AND ld.metric_scope = 'daily'
       AND ld.submitted_at IS NOT NULL
       AND coalesce(ld.submission_status, '') <> 'draft'
       AND (
         coalesce(ld.leads_prev_day, 0) > 0
         OR coalesce(ld.agd_cart_prev_day, 0) > 0
         OR coalesce(ld.agd_net_prev_day, 0) > 0
         OR coalesce(ld.agd_cart_today, 0) > 0
         OR coalesce(ld.agd_net_today, 0) > 0
         OR coalesce(ld.vnd_porta_prev_day, 0) > 0
         OR coalesce(ld.vnd_cart_prev_day, 0) > 0
         OR coalesce(ld.vnd_net_prev_day, 0) > 0
         OR coalesce(ld.visit_prev_day, 0) > 0
         OR nullif(trim(coalesce(ld.zero_reason, '')), '') IS NOT NULL
       )
  ) THEN
    v_official_reference := v_now_sp::date - 1;
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM public.vinculos_loja
     WHERE user_id = v_caller_id
       AND store_id = v_store_id
       AND role IN ('dono', 'gerente')
       AND coalesce(is_active, true) = true
  ) INTO v_can_manage_store;

  IF v_scope_text = 'daily' THEN
    IF v_caller_role <> 'vendedor' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Registro diário é permitido apenas para vendedor.');
    END IF;
    IF v_seller_id <> v_caller_id THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Registro diário deve ser feito pelo próprio vendedor.');
    END IF;
    IF v_reference_date <> v_official_reference THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Registro diário aceita somente a data operacional ativa.');
    END IF;
  ELSIF v_scope_text = 'historical' THEN
    IF NOT (v_is_internal OR v_can_manage_store OR (v_caller_role = 'vendedor' AND v_seller_id = v_caller_id)) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Lançamento histórico é permitido apenas ao próprio vendedor ou à gestão autorizada.');
    END IF;
  ELSIF NOT (v_is_internal OR v_can_manage_store) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ajuste técnico é restrito a gestores e perfis internos MX.');
  END IF;

  IF v_reference_date > v_now_sp::date THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Lançamentos não podem usar data futura.');
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

  IF NOT v_is_internal AND NOT EXISTS (
    SELECT 1
      FROM public.vendedores_loja
     WHERE seller_user_id = v_seller_id
       AND store_id = v_store_id
       AND coalesce(is_active, true) = true
       AND (started_at IS NULL OR started_at <= v_reference_date)
       AND (ended_at IS NULL OR ended_at >= v_reference_date)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Vendedor não está ativo nesta loja no período informado.');
  END IF;

  IF v_scope_text = 'daily' AND EXISTS (
    SELECT 1
      FROM public.lancamentos_diarios ld
     WHERE ld.seller_user_id = v_seller_id
       AND ld.store_id = v_store_id
       AND ld.reference_date = v_reference_date
       AND ld.metric_scope = 'daily'
       AND ld.submitted_at IS NOT NULL
       AND coalesce(ld.submission_status, '') <> 'draft'
       AND (
         coalesce(ld.leads_prev_day, 0) > 0
         OR coalesce(ld.agd_cart_prev_day, 0) > 0
         OR coalesce(ld.agd_net_prev_day, 0) > 0
         OR coalesce(ld.agd_cart_today, 0) > 0
         OR coalesce(ld.agd_net_today, 0) > 0
         OR coalesce(ld.vnd_porta_prev_day, 0) > 0
         OR coalesce(ld.vnd_cart_prev_day, 0) > 0
         OR coalesce(ld.vnd_net_prev_day, 0) > 0
         OR coalesce(ld.visit_prev_day, 0) > 0
         OR nullif(trim(coalesce(ld.zero_reason, '')), '') IS NOT NULL
       )
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Fechamento já concluído para esta data. Use o histórico para solicitar correção.');
  END IF;

  SELECT fl.liberado_por_id, fl.liberado_por_nome, fl.data_hora_liberacao
    INTO v_liberado_por_id, v_liberado_por_nome, v_data_hora_liberacao
    FROM public.fechamento_liberacoes fl
   WHERE fl.vendedor_id = v_seller_id
     AND fl.data_fechamento = v_reference_date
     AND fl.status = 'liberado'
   ORDER BY fl.data_hora_liberacao DESC
   LIMIT 1;

  v_liberado := v_liberado_por_id IS NOT NULL;
  v_disciplina_base := LEAST(100, GREATEST(0, coalesce((p_payload->>'pontuacao_disciplina_base')::numeric, 0)));
  v_finalizado_apos_prazo := v_scope_text IN ('daily', 'historical')
    AND coalesce((p_payload->>'submitted_late')::boolean, false)
    AND v_liberado;
  v_penalizacao_pp := CASE WHEN v_finalizado_apos_prazo THEN 10 ELSE 0 END;
  v_disciplina_final := LEAST(100, GREATEST(0, v_disciplina_base - v_penalizacao_pp));

  INSERT INTO public.lancamentos_diarios (
    seller_user_id, store_id, reference_date, submitted_at, metric_scope,
    submission_status, submitted_late, edit_locked_at,
    leads_prev_day, leads_net_prev_day, agd_cart_prev_day, agd_net_prev_day,
    agd_cart_today, agd_net_today, vnd_porta_prev_day, vnd_cart_prev_day,
    vnd_net_prev_day, visit_prev_day, zero_reason, note, created_by, updated_at,
    pontuacao_disciplina_base, pontuacao_disciplina_final,
    finalizado_apos_prazo, penalizacao_atraso_aplicada, percentual_penalizacao_atraso,
    fechamento_liberado, liberado_por_id, liberado_por_nome, data_hora_liberacao
  ) VALUES (
    v_seller_id, v_store_id, v_reference_date,
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
    v_caller_id, now(), v_disciplina_base, v_disciplina_final,
    v_finalizado_apos_prazo, v_finalizado_apos_prazo, v_penalizacao_pp,
    v_liberado, v_liberado_por_id, v_liberado_por_nome, v_data_hora_liberacao
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
  WHERE EXCLUDED.metric_scope <> 'daily'
     OR NOT (
       lancamentos_diarios.submitted_at IS NOT NULL
       AND coalesce(lancamentos_diarios.submission_status, '') <> 'draft'
       AND (
         coalesce(lancamentos_diarios.leads_prev_day, 0) > 0
         OR coalesce(lancamentos_diarios.agd_cart_prev_day, 0) > 0
         OR coalesce(lancamentos_diarios.agd_net_prev_day, 0) > 0
         OR coalesce(lancamentos_diarios.agd_cart_today, 0) > 0
         OR coalesce(lancamentos_diarios.agd_net_today, 0) > 0
         OR coalesce(lancamentos_diarios.vnd_porta_prev_day, 0) > 0
         OR coalesce(lancamentos_diarios.vnd_cart_prev_day, 0) > 0
         OR coalesce(lancamentos_diarios.vnd_net_prev_day, 0) > 0
         OR coalesce(lancamentos_diarios.visit_prev_day, 0) > 0
         OR nullif(trim(coalesce(lancamentos_diarios.zero_reason, '')), '') IS NOT NULL
       )
     )
  RETURNING id INTO v_checkin_id;

  IF v_checkin_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Fechamento já concluído para esta data. Use o histórico para solicitar correção.');
  END IF;

  RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object('id', v_checkin_id));
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_checkin(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_checkin(jsonb) TO authenticated;
