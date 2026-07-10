-- ============================================================================
-- Migration: 20260710190000_p0_02_regularizacao_canal_split.sql
-- Origem:    Auditoria Integral 2026-07-10 (P0-02/P0-06)
--
-- ESCOPO: a migration 20260710180000 (P0-02) corrigiu o round-trip de canal
--   no envio direto do Fechamento Diário (submit_checkin), mas o fluxo de
--   Regularização (solicitar_regularizacao_fechamento /
--   aplicar_regularizacao_fechamento, criados em 20260710130000) tem o mesmo
--   problema: não conhece leads_net_prev_day nem visitas_porta/cart/net
--   _prev_day, então uma regularização aprovada não preserva nem atualiza a
--   distribuição por canal — o próprio documento de auditoria cita
--   Histórico E Regularização como afetados pelo P0-02.
--
--   Também corrige um bug real e independente encontrado ao auditar este
--   fluxo (P0-06): o client (CheckinHeader.tsx) enviava
--   agd_cart_prev_day/agd_net_prev_day fixos em 0 em toda solicitação,
--   zerando os agendamentos D-1 do vendedor em qualquer regularização
--   aprovada, mesmo quando ninguém pretendia alterar esses campos. O client
--   foi corrigido para omitir essas chaves; esta migration apenas garante
--   que a ausência da chave continua preservando o valor original (já era o
--   comportamento correto do coalesce existente — mantido aqui sem mudança).
--
--   Aditivo e reversível (bloco DOWN comentado ao final).
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.solicitar_regularizacao_fechamento(
  p_checkin_id uuid,
  p_requested_values jsonb,
  p_reason text,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_caller_id uuid := auth.uid();
  v_checkin public.lancamentos_diarios%ROWTYPE;
  v_original jsonb;
  v_requested jsonb;
  v_delta jsonb;
  v_key text;
  v_request_id uuid;
  v_has_visitas_canal boolean;
  v_visitas_porta integer;
  v_visitas_cart integer;
  v_visitas_net integer;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Não autenticado.');
  END IF;
  IF length(trim(coalesce(p_reason, ''))) < 8 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Informe uma justificativa com pelo menos 8 caracteres.');
  END IF;

  SELECT * INTO v_checkin
    FROM public.lancamentos_diarios
   WHERE id = p_checkin_id
   FOR SHARE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Fechamento não encontrado.');
  END IF;

  IF v_checkin.seller_user_id <> v_caller_id
     AND NOT public.eh_administrador_mx(v_caller_id)
     AND NOT public.is_manager_of(v_checkin.store_id)
     AND NOT public.is_owner_of(v_checkin.store_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  IF v_checkin.metric_scope NOT IN ('daily', 'historical') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Somente fechamento diário ou lançamento histórico pode ser regularizado.');
  END IF;

  IF v_checkin.metric_scope = 'daily' AND NOT (
    v_checkin.submitted_at IS NOT NULL
    AND coalesce(v_checkin.submission_status, '') <> 'draft'
    AND (
      coalesce(v_checkin.leads_prev_day, 0) + coalesce(v_checkin.agd_cart_prev_day, 0)
      + coalesce(v_checkin.agd_net_prev_day, 0) + coalesce(v_checkin.agd_cart_today, 0)
      + coalesce(v_checkin.agd_net_today, 0) + coalesce(v_checkin.vnd_porta_prev_day, 0)
      + coalesce(v_checkin.vnd_cart_prev_day, 0) + coalesce(v_checkin.vnd_net_prev_day, 0)
      + coalesce(v_checkin.visit_prev_day, 0) > 0
      OR nullif(trim(coalesce(v_checkin.zero_reason, '')), '') IS NOT NULL
    )
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Rascunhos e placeholders diários não podem ser regularizados.');
  END IF;

  v_original := jsonb_build_object(
    'leads_prev_day', coalesce(v_checkin.leads_prev_day, 0),
    'leads_net_prev_day', coalesce(v_checkin.leads_net_prev_day, 0),
    'agd_cart_prev_day', coalesce(v_checkin.agd_cart_prev_day, 0),
    'agd_net_prev_day', coalesce(v_checkin.agd_net_prev_day, 0),
    'agd_cart_today', coalesce(v_checkin.agd_cart_today, 0),
    'agd_net_today', coalesce(v_checkin.agd_net_today, 0),
    'vnd_porta_prev_day', coalesce(v_checkin.vnd_porta_prev_day, 0),
    'vnd_cart_prev_day', coalesce(v_checkin.vnd_cart_prev_day, 0),
    'vnd_net_prev_day', coalesce(v_checkin.vnd_net_prev_day, 0),
    'visit_prev_day', coalesce(v_checkin.visit_prev_day, 0),
    'visitas_porta_prev_day', v_checkin.visitas_porta_prev_day,
    'visitas_cart_prev_day', v_checkin.visitas_cart_prev_day,
    'visitas_net_prev_day', v_checkin.visitas_net_prev_day,
    'zero_reason', v_checkin.zero_reason,
    'note', v_checkin.note
  );

  -- Distribuição de visitas por canal: só recalcula quando o client envia
  -- pelo menos uma das 3 chaves (nomes de coluna OU nomes de form
  -- leads_cart-style, para compatibilidade); caso contrário preserva o
  -- valor original (nunca inventa, mesmo padrão de submit_checkin/P0-02).
  v_has_visitas_canal := (p_requested_values ? 'visitas_porta_prev_day')
    OR (p_requested_values ? 'visitas_cart_prev_day')
    OR (p_requested_values ? 'visitas_net_prev_day')
    OR (p_requested_values ? 'visitas_porta')
    OR (p_requested_values ? 'visitas_cart')
    OR (p_requested_values ? 'visitas_net');

  IF v_has_visitas_canal THEN
    v_visitas_porta := greatest(0, coalesce((p_requested_values->>'visitas_porta_prev_day')::integer, (p_requested_values->>'visitas_porta')::integer, 0));
    v_visitas_cart  := greatest(0, coalesce((p_requested_values->>'visitas_cart_prev_day')::integer, (p_requested_values->>'visitas_cart')::integer, 0));
    v_visitas_net   := greatest(0, coalesce((p_requested_values->>'visitas_net_prev_day')::integer, (p_requested_values->>'visitas_net')::integer, 0));
  ELSE
    v_visitas_porta := (v_original->>'visitas_porta_prev_day')::integer;
    v_visitas_cart  := (v_original->>'visitas_cart_prev_day')::integer;
    v_visitas_net   := (v_original->>'visitas_net_prev_day')::integer;
  END IF;

  v_requested := jsonb_build_object(
    'leads_prev_day', greatest(0, coalesce((p_requested_values->>'leads_prev_day')::integer, (p_requested_values->>'leads_cart')::integer, (p_requested_values->>'leads')::integer, (v_original->>'leads_prev_day')::integer)),
    'leads_net_prev_day', greatest(0, coalesce((p_requested_values->>'leads_net_prev_day')::integer, (p_requested_values->>'leads_net')::integer, (v_original->>'leads_net_prev_day')::integer)),
    'agd_cart_prev_day', greatest(0, coalesce((p_requested_values->>'agd_cart_prev_day')::integer, (v_original->>'agd_cart_prev_day')::integer)),
    'agd_net_prev_day', greatest(0, coalesce((p_requested_values->>'agd_net_prev_day')::integer, (v_original->>'agd_net_prev_day')::integer)),
    'agd_cart_today', greatest(0, coalesce((p_requested_values->>'agd_cart_today')::integer, (p_requested_values->>'agd_cart')::integer, (v_original->>'agd_cart_today')::integer)),
    'agd_net_today', greatest(0, coalesce((p_requested_values->>'agd_net_today')::integer, (p_requested_values->>'agd_net')::integer, (v_original->>'agd_net_today')::integer)),
    'vnd_porta_prev_day', greatest(0, coalesce((p_requested_values->>'vnd_porta_prev_day')::integer, (p_requested_values->>'vnd_porta')::integer, (v_original->>'vnd_porta_prev_day')::integer)),
    'vnd_cart_prev_day', greatest(0, coalesce((p_requested_values->>'vnd_cart_prev_day')::integer, (p_requested_values->>'vnd_cart')::integer, (v_original->>'vnd_cart_prev_day')::integer)),
    'vnd_net_prev_day', greatest(0, coalesce((p_requested_values->>'vnd_net_prev_day')::integer, (p_requested_values->>'vnd_net')::integer, (v_original->>'vnd_net_prev_day')::integer)),
    'visit_prev_day', CASE WHEN v_has_visitas_canal THEN v_visitas_porta + v_visitas_cart + v_visitas_net
                            ELSE greatest(0, coalesce((p_requested_values->>'visit_prev_day')::integer, (p_requested_values->>'visitas')::integer, (v_original->>'visit_prev_day')::integer)) END,
    'visitas_porta_prev_day', v_visitas_porta,
    'visitas_cart_prev_day', v_visitas_cart,
    'visitas_net_prev_day', v_visitas_net,
    'zero_reason', nullif(trim(coalesce(p_requested_values->>'zero_reason', v_original->>'zero_reason', '')), ''),
    'note', nullif(trim(coalesce(p_requested_values->>'note', v_original->>'note', '')), '')
  );

  SELECT coalesce(jsonb_object_agg(k.key, jsonb_build_object(
           'original', v_original -> (k.key),
           'solicitado', v_requested -> (k.key)
         )), '{}'::jsonb)
    INTO v_delta
    FROM jsonb_object_keys(v_requested) AS k(key)
   WHERE v_original -> (k.key) IS DISTINCT FROM v_requested -> (k.key);

  IF v_delta = '{}'::jsonb THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nenhuma alteração foi informada.');
  END IF;

  v_key := v_caller_id::text || ':' || p_checkin_id::text || ':' || coalesce(
    nullif(trim(p_idempotency_key), ''),
    md5(v_requested::text || trim(p_reason))
  );

  PERFORM pg_advisory_xact_lock(hashtextextended('regularizacao:' || p_checkin_id::text, 0));

  SELECT id INTO v_request_id
    FROM public.solicitacoes_correcao_lancamento
   WHERE seller_id = v_checkin.seller_user_id
     AND checkin_id = p_checkin_id
     AND idempotency_key = v_key
     AND status = 'pending'
   LIMIT 1;

  IF v_request_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object('id', v_request_id, 'duplicate', true));
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.solicitacoes_correcao_lancamento
     WHERE checkin_id = p_checkin_id AND status = 'pending'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Já existe uma regularização pendente para este fechamento.');
  END IF;

  BEGIN
    INSERT INTO public.solicitacoes_correcao_lancamento (
      checkin_id, seller_id, store_id, requested_values, original_values,
      delta, reason, status, idempotency_key, requested_by, impact, updated_at
    ) VALUES (
      p_checkin_id, v_checkin.seller_user_id, v_checkin.store_id, v_requested,
      v_original, v_delta, trim(p_reason), 'pending', v_key, v_caller_id,
      jsonb_build_object('indicators', 'pending_excluded'), now()
    ) RETURNING id INTO v_request_id;
  EXCEPTION WHEN unique_violation THEN
    SELECT id INTO v_request_id
      FROM public.solicitacoes_correcao_lancamento
     WHERE seller_id = v_checkin.seller_user_id
       AND checkin_id = p_checkin_id
       AND idempotency_key = v_key
       AND status = 'pending'
     LIMIT 1;
  END;

  INSERT INTO public.notificacoes (
    sender_id, title, message, target_type, target_store_id, store_id,
    target_role, type, priority, link
  ) VALUES (
    v_caller_id, 'Nova regularização de fechamento',
    'Há uma solicitação pendente para revisão da gestão.', 'role',
    v_checkin.store_id, v_checkin.store_id, 'gerente', 'regularizacao', 'high',
    '/gerente/rotina?aba=ajustes'
  );

  RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object('id', v_request_id, 'duplicate', false));
END;
$function$;

CREATE OR REPLACE FUNCTION public.aplicar_regularizacao_fechamento(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_request public.solicitacoes_correcao_lancamento%ROWTYPE;
  v_old jsonb;
  v_new jsonb;
BEGIN
  SELECT * INTO v_request
    FROM public.solicitacoes_correcao_lancamento
   WHERE id = p_request_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Solicitação não encontrada.');
  END IF;
  IF v_request.status = 'approved' AND v_request.applied_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object('already_applied', true));
  END IF;
  IF v_request.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Solicitação já processada.');
  END IF;
  IF NOT (public.eh_administrador_mx(auth.uid()) OR public.is_manager_of(v_request.store_id) OR public.is_owner_of(v_request.store_id)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  SELECT to_jsonb(ld) INTO v_old
    FROM public.lancamentos_diarios ld
   WHERE ld.id = v_request.checkin_id
   FOR UPDATE;

  IF v_old IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Fechamento original não encontrado.');
  END IF;

  IF v_request.original_values IS DISTINCT FROM (
    SELECT jsonb_build_object(
      'leads_prev_day', coalesce(ld.leads_prev_day, 0),
      'leads_net_prev_day', coalesce(ld.leads_net_prev_day, 0),
      'agd_cart_prev_day', coalesce(ld.agd_cart_prev_day, 0),
      'agd_net_prev_day', coalesce(ld.agd_net_prev_day, 0),
      'agd_cart_today', coalesce(ld.agd_cart_today, 0),
      'agd_net_today', coalesce(ld.agd_net_today, 0),
      'vnd_porta_prev_day', coalesce(ld.vnd_porta_prev_day, 0),
      'vnd_cart_prev_day', coalesce(ld.vnd_cart_prev_day, 0),
      'vnd_net_prev_day', coalesce(ld.vnd_net_prev_day, 0),
      'visit_prev_day', coalesce(ld.visit_prev_day, 0),
      'visitas_porta_prev_day', ld.visitas_porta_prev_day,
      'visitas_cart_prev_day', ld.visitas_cart_prev_day,
      'visitas_net_prev_day', ld.visitas_net_prev_day,
      'zero_reason', ld.zero_reason,
      'note', ld.note
    ) FROM public.lancamentos_diarios ld WHERE ld.id = v_request.checkin_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'O fechamento mudou após a solicitação. Refaça a regularização.');
  END IF;

  IF (v_old->>'metric_scope') = 'historical' AND EXISTS (
    SELECT 1 FROM public.lancamentos_diarios ld
     WHERE ld.seller_user_id = v_request.seller_id
       AND ld.store_id = v_request.store_id
       AND ld.reference_date = (v_old->>'reference_date')::date
       AND ld.metric_scope = 'daily'
       AND ld.id <> v_request.checkin_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Já existe fechamento diário para esta data. Refaça a regularização sobre o registro oficial.');
  END IF;

  UPDATE public.lancamentos_diarios
     SET metric_scope = CASE WHEN metric_scope = 'historical' THEN 'daily'::public.checkin_scope ELSE metric_scope END,
         submitted_at = CASE WHEN metric_scope = 'historical' THEN now() ELSE submitted_at END,
         submission_status = CASE WHEN metric_scope = 'historical' THEN 'late' ELSE submission_status END,
         submitted_late = CASE WHEN metric_scope = 'historical' THEN true ELSE submitted_late END,
         edit_locked_at = CASE WHEN metric_scope = 'historical' THEN now() ELSE edit_locked_at END,
         leads_prev_day = (v_request.requested_values->>'leads_prev_day')::integer,
         leads_net_prev_day = (v_request.requested_values->>'leads_net_prev_day')::integer,
         agd_cart_prev_day = (v_request.requested_values->>'agd_cart_prev_day')::integer,
         agd_net_prev_day = (v_request.requested_values->>'agd_net_prev_day')::integer,
         agd_cart_today = (v_request.requested_values->>'agd_cart_today')::integer,
         agd_net_today = (v_request.requested_values->>'agd_net_today')::integer,
         vnd_porta_prev_day = (v_request.requested_values->>'vnd_porta_prev_day')::integer,
         vnd_cart_prev_day = (v_request.requested_values->>'vnd_cart_prev_day')::integer,
         vnd_net_prev_day = (v_request.requested_values->>'vnd_net_prev_day')::integer,
         visit_prev_day = (v_request.requested_values->>'visit_prev_day')::integer,
         visitas_porta_prev_day = (v_request.requested_values->>'visitas_porta_prev_day')::integer,
         visitas_cart_prev_day = (v_request.requested_values->>'visitas_cart_prev_day')::integer,
         visitas_net_prev_day = (v_request.requested_values->>'visitas_net_prev_day')::integer,
         zero_reason = nullif(v_request.requested_values->>'zero_reason', ''),
         note = nullif(v_request.requested_values->>'note', ''),
         updated_at = now()
   WHERE id = v_request.checkin_id;

  SELECT to_jsonb(ld) INTO v_new
    FROM public.lancamentos_diarios ld
   WHERE ld.id = v_request.checkin_id;

  INSERT INTO public.checkin_audit_logs (
    checkin_id, correction_request_id, changed_by, old_values, new_values, change_type
  ) VALUES (
    v_request.checkin_id, v_request.id, auth.uid(), v_old, v_new, 'approved_regularization'
  );

  UPDATE public.solicitacoes_correcao_lancamento
     SET status = 'approved', auditor_id = auth.uid(), reviewed_at = now(),
         applied_at = now(), impact = jsonb_build_object('indicators', 'recalculate_once'), updated_at = now()
   WHERE id = v_request.id;

  INSERT INTO public.notificacoes (
    sender_id, recipient_id, title, message, target_type, store_id,
    type, priority, link
  ) VALUES (
    auth.uid(), v_request.seller_id, 'Regularização aprovada',
    'A correção do fechamento foi aprovada e aplicada.', 'user', v_request.store_id,
    'regularizacao', 'high', '/vendedor/terminal-mx'
  );

  RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object('already_applied', false));
END;
$function$;

COMMIT;

-- ============================================================================
-- DOWN (rollback emergencial)
-- ============================================================================
-- BEGIN;
--   Reverter solicitar_regularizacao_fechamento e aplicar_regularizacao_fechamento
--   para as versões de 20260710130000_canonical_checkin_regularization.sql.
-- COMMIT;
