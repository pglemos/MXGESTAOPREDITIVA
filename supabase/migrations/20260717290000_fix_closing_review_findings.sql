BEGIN;

-- Follow-up to 20260717280000_harden_closing_regularization_authorization.sql.
-- This migration is separate because the previous definitions were already
-- applied to production before review completed.

CREATE OR REPLACE FUNCTION public.aplicar_regularizacao_fechamento(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_request public.solicitacoes_correcao_lancamento%ROWTYPE;
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Não autenticado.');
  END IF;

  SELECT * INTO v_request
    FROM public.solicitacoes_correcao_lancamento
   WHERE id = p_request_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Solicitação não encontrada.');
  END IF;

  -- Authorize before returning status-specific information.
  IF NOT (
    public.eh_administrador_mx(v_caller)
    OR public.is_manager_of(v_request.store_id)
    OR public.is_owner_of(v_request.store_id)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  IF v_request.status = 'approved' AND v_request.applied_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object('already_applied', true));
  END IF;

  IF v_request.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Solicitação já processada.');
  END IF;

  SELECT to_jsonb(ld) INTO v_old
    FROM public.lancamentos_diarios ld
   WHERE ld.id = v_request.checkin_id
     AND ld.store_id = v_request.store_id
     AND ld.seller_user_id = v_request.seller_id
   FOR UPDATE;

  IF v_old IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Fechamento original não encontrado ou fora do escopo da solicitação.');
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
    )
    FROM public.lancamentos_diarios ld
    WHERE ld.id = v_request.checkin_id
      AND ld.store_id = v_request.store_id
      AND ld.seller_user_id = v_request.seller_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'O fechamento mudou após a solicitação. Refaça a regularização.');
  END IF;

  IF (v_old->>'metric_scope') = 'historical' AND EXISTS (
    SELECT 1
    FROM public.lancamentos_diarios ld
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
   WHERE id = v_request.checkin_id
     AND store_id = v_request.store_id
     AND seller_user_id = v_request.seller_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Fechamento saiu do escopo durante a aplicação.');
  END IF;

  SELECT to_jsonb(ld) INTO v_new
    FROM public.lancamentos_diarios ld
   WHERE ld.id = v_request.checkin_id
     AND ld.store_id = v_request.store_id
     AND ld.seller_user_id = v_request.seller_id;

  INSERT INTO public.checkin_audit_logs (
    checkin_id, correction_request_id, changed_by, old_values, new_values, change_type
  ) VALUES (
    v_request.checkin_id, v_request.id, v_caller, v_old, v_new, 'approved_regularization'
  );

  UPDATE public.solicitacoes_correcao_lancamento
     SET status = 'approved',
         auditor_id = v_caller,
         reviewed_at = now(),
         applied_at = now(),
         impact = jsonb_build_object('indicators', 'recalculate_once'),
         updated_at = now()
   WHERE id = v_request.id
     AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Solicitação mudou durante a aplicação.');
  END IF;

  INSERT INTO public.notificacoes (
    sender_id, recipient_id, title, message, target_type, store_id,
    type, priority, link
  ) VALUES (
    v_caller, v_request.seller_id, 'Regularização aprovada',
    'A correção do fechamento foi aprovada e aplicada.', 'user', v_request.store_id,
    'regularizacao', 'high', '/vendedor/terminal-mx'
  );

  RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object('already_applied', false));
END;
$function$;

CREATE OR REPLACE FUNCTION public.rejeitar_regularizacao_fechamento(
  p_request_id uuid,
  p_reason text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_request public.solicitacoes_correcao_lancamento%ROWTYPE;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Não autenticado.');
  END IF;

  SELECT * INTO v_request
  FROM public.solicitacoes_correcao_lancamento
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Solicitação não encontrada.');
  END IF;

  -- Authorize before returning status-specific information.
  IF NOT (
    public.eh_administrador_mx(v_caller)
    OR public.is_manager_of(v_request.store_id)
    OR public.is_owner_of(v_request.store_id)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  IF v_request.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Solicitação já processada.');
  END IF;

  UPDATE public.solicitacoes_correcao_lancamento
     SET status = 'rejected',
         auditor_id = v_caller,
         reviewed_at = now(),
         rejection_reason = nullif(trim(coalesce(p_reason, '')), ''),
         updated_at = now()
   WHERE id = p_request_id
     AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Solicitação mudou durante a rejeição.');
  END IF;

  INSERT INTO public.notificacoes (
    sender_id, recipient_id, title, message, target_type, store_id, type, priority, link
  ) VALUES (
    v_caller, v_request.seller_id, 'Regularização rejeitada',
    coalesce(nullif(trim(p_reason), ''), 'A gestão rejeitou a solicitação de correção.'),
    'user', v_request.store_id, 'regularizacao', 'medium', '/vendedor/terminal-mx'
  );

  RETURN jsonb_build_object('ok', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancelar_regularizacao_fechamento(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_request public.solicitacoes_correcao_lancamento%ROWTYPE;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Não autenticado.');
  END IF;

  SELECT * INTO v_request
  FROM public.solicitacoes_correcao_lancamento
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Solicitação não encontrada.');
  END IF;

  -- IS NOT TRUE blocks both FALSE and NULL from nullable requested_by values.
  IF (v_request.seller_id = v_caller OR v_request.requested_by = v_caller) IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  IF v_request.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Somente solicitação pendente pode ser cancelada.');
  END IF;

  UPDATE public.solicitacoes_correcao_lancamento
     SET status = 'cancelled',
         cancelled_at = now(),
         updated_at = now()
   WHERE id = p_request_id
     AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Solicitação mudou durante o cancelamento.');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.enviar_cobranca_diaria(
  p_recipient_id uuid,
  p_store_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_priority text DEFAULT 'high'::text,
  p_link text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_existing_id uuid;
  v_new_id uuid;
  v_business_date date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_charge_lock_key bigint;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Não autenticado.');
  END IF;

  IF p_type NOT IN ('routine', 'checkin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tipo de cobrança inválido.');
  END IF;

  IF p_store_id IS NULL OR NOT (
    public.eh_administrador_mx(v_caller)
    OR public.is_manager_of(p_store_id)
    OR public.is_owner_of(p_store_id)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  IF NOT public.tem_papel_loja(p_store_id, ARRAY['vendedor'], p_recipient_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Destinatário não pertence à equipe de vendedores desta loja.');
  END IF;

  -- Serialize this sender/recipient/store/type/business-day idempotency key.
  v_charge_lock_key := hashtextextended(
    concat_ws(
      '|',
      'enviar_cobranca_diaria',
      v_caller::text,
      p_recipient_id::text,
      p_store_id::text,
      p_type,
      v_business_date::text
    ),
    0
  );
  PERFORM pg_advisory_xact_lock(v_charge_lock_key);

  SELECT id INTO v_existing_id
  FROM public.notificacoes
  WHERE recipient_id = p_recipient_id
    AND sender_id = v_caller
    AND store_id = p_store_id
    AND type = p_type
    AND created_at >= (v_business_date::timestamp AT TIME ZONE 'America/Sao_Paulo')
    AND created_at < ((v_business_date + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true, 'id', v_existing_id);
  END IF;

  INSERT INTO public.notificacoes (
    recipient_id, sender_id, store_id, title, message, type, priority, link, target_type, read
  ) VALUES (
    p_recipient_id, v_caller, p_store_id, p_title, p_message, p_type, p_priority, p_link, 'user', false
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'id', v_new_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.aplicar_regularizacao_fechamento(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.aplicar_regularizacao_fechamento(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.cancelar_regularizacao_fechamento(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancelar_regularizacao_fechamento(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.rejeitar_regularizacao_fechamento(uuid,text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rejeitar_regularizacao_fechamento(uuid,text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.enviar_cobranca_diaria(uuid,uuid,text,text,text,text,text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enviar_cobranca_diaria(uuid,uuid,text,text,text,text,text) TO authenticated, service_role;

-- DOWN
-- Reapply 20260717280000_harden_closing_regularization_authorization.sql only
-- with explicit incident approval. Doing so restores the nullable cancellation
-- bypass, request-status disclosure, and race-prone charge idempotency.

COMMIT;
