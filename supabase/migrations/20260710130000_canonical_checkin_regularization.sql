-- Story MX-AUDIT-20260710 / Fase 2
-- Consolida regularizações em solicitacoes_correcao_lancamento. A tabela
-- regularizacao_fechamento permanece apenas para leitura legada.

ALTER TABLE public.solicitacoes_correcao_lancamento
  ADD COLUMN IF NOT EXISTS original_values jsonb,
  ADD COLUMN IF NOT EXISTS delta jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS applied_at timestamptz,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS requested_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS impact jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.solicitacoes_correcao_lancamento
   SET requested_by = seller_id
 WHERE requested_by IS NULL;

CREATE INDEX IF NOT EXISTS idx_solicitacoes_correcao_status_store
  ON public.solicitacoes_correcao_lancamento (store_id, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_solicitacoes_correcao_pending_idempotency
  ON public.solicitacoes_correcao_lancamento (seller_id, checkin_id, idempotency_key)
  WHERE status = 'pending' AND idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_solicitacoes_correcao_checkin_status
  ON public.solicitacoes_correcao_lancamento (checkin_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_correcao_requested_by
  ON public.solicitacoes_correcao_lancamento (requested_by)
  WHERE requested_by IS NOT NULL;

ALTER TABLE public.solicitacoes_correcao_lancamento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS manager_view_store_requests ON public.solicitacoes_correcao_lancamento;
DROP POLICY IF EXISTS seller_manage_own_requests ON public.solicitacoes_correcao_lancamento;
DROP POLICY IF EXISTS solicitacoes_correcao_select ON public.solicitacoes_correcao_lancamento;
CREATE POLICY solicitacoes_correcao_select ON public.solicitacoes_correcao_lancamento
  FOR SELECT TO authenticated
  USING (
    seller_id = (SELECT auth.uid())
    OR public.eh_administrador_mx((SELECT auth.uid()))
    OR public.is_manager_of(store_id)
    OR public.is_owner_of(store_id)
  );

UPDATE public.solicitacoes_correcao_lancamento scr
   SET original_values = jsonb_build_object(
         'leads_prev_day', ld.leads_prev_day,
         'agd_cart_prev_day', ld.agd_cart_prev_day,
         'agd_net_prev_day', ld.agd_net_prev_day,
         'agd_cart_today', ld.agd_cart_today,
         'agd_net_today', ld.agd_net_today,
         'vnd_porta_prev_day', ld.vnd_porta_prev_day,
         'vnd_cart_prev_day', ld.vnd_cart_prev_day,
         'vnd_net_prev_day', ld.vnd_net_prev_day,
         'visit_prev_day', ld.visit_prev_day,
         'zero_reason', ld.zero_reason,
         'note', ld.note
       )
  FROM public.lancamentos_diarios ld
 WHERE ld.id = scr.checkin_id
   AND scr.original_values IS NULL;

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
    'agd_cart_prev_day', coalesce(v_checkin.agd_cart_prev_day, 0),
    'agd_net_prev_day', coalesce(v_checkin.agd_net_prev_day, 0),
    'agd_cart_today', coalesce(v_checkin.agd_cart_today, 0),
    'agd_net_today', coalesce(v_checkin.agd_net_today, 0),
    'vnd_porta_prev_day', coalesce(v_checkin.vnd_porta_prev_day, 0),
    'vnd_cart_prev_day', coalesce(v_checkin.vnd_cart_prev_day, 0),
    'vnd_net_prev_day', coalesce(v_checkin.vnd_net_prev_day, 0),
    'visit_prev_day', coalesce(v_checkin.visit_prev_day, 0),
    'zero_reason', v_checkin.zero_reason,
    'note', v_checkin.note
  );

  v_requested := jsonb_build_object(
    'leads_prev_day', greatest(0, coalesce((p_requested_values->>'leads_prev_day')::integer, (p_requested_values->>'leads')::integer, (v_original->>'leads_prev_day')::integer)),
    'agd_cart_prev_day', greatest(0, coalesce((p_requested_values->>'agd_cart_prev_day')::integer, (v_original->>'agd_cart_prev_day')::integer)),
    'agd_net_prev_day', greatest(0, coalesce((p_requested_values->>'agd_net_prev_day')::integer, (v_original->>'agd_net_prev_day')::integer)),
    'agd_cart_today', greatest(0, coalesce((p_requested_values->>'agd_cart_today')::integer, (p_requested_values->>'agd_cart')::integer, (v_original->>'agd_cart_today')::integer)),
    'agd_net_today', greatest(0, coalesce((p_requested_values->>'agd_net_today')::integer, (p_requested_values->>'agd_net')::integer, (v_original->>'agd_net_today')::integer)),
    'vnd_porta_prev_day', greatest(0, coalesce((p_requested_values->>'vnd_porta_prev_day')::integer, (p_requested_values->>'vnd_porta')::integer, (v_original->>'vnd_porta_prev_day')::integer)),
    'vnd_cart_prev_day', greatest(0, coalesce((p_requested_values->>'vnd_cart_prev_day')::integer, (p_requested_values->>'vnd_cart')::integer, (v_original->>'vnd_cart_prev_day')::integer)),
    'vnd_net_prev_day', greatest(0, coalesce((p_requested_values->>'vnd_net_prev_day')::integer, (p_requested_values->>'vnd_net')::integer, (v_original->>'vnd_net_prev_day')::integer)),
    'visit_prev_day', greatest(0, coalesce((p_requested_values->>'visit_prev_day')::integer, (p_requested_values->>'visitas')::integer, (v_original->>'visit_prev_day')::integer)),
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
      'agd_cart_prev_day', coalesce(ld.agd_cart_prev_day, 0),
      'agd_net_prev_day', coalesce(ld.agd_net_prev_day, 0),
      'agd_cart_today', coalesce(ld.agd_cart_today, 0),
      'agd_net_today', coalesce(ld.agd_net_today, 0),
      'vnd_porta_prev_day', coalesce(ld.vnd_porta_prev_day, 0),
      'vnd_cart_prev_day', coalesce(ld.vnd_cart_prev_day, 0),
      'vnd_net_prev_day', coalesce(ld.vnd_net_prev_day, 0),
      'visit_prev_day', coalesce(ld.visit_prev_day, 0),
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
         agd_cart_prev_day = (v_request.requested_values->>'agd_cart_prev_day')::integer,
         agd_net_prev_day = (v_request.requested_values->>'agd_net_prev_day')::integer,
         agd_cart_today = (v_request.requested_values->>'agd_cart_today')::integer,
         agd_net_today = (v_request.requested_values->>'agd_net_today')::integer,
         vnd_porta_prev_day = (v_request.requested_values->>'vnd_porta_prev_day')::integer,
         vnd_cart_prev_day = (v_request.requested_values->>'vnd_cart_prev_day')::integer,
         vnd_net_prev_day = (v_request.requested_values->>'vnd_net_prev_day')::integer,
         visit_prev_day = (v_request.requested_values->>'visit_prev_day')::integer,
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

CREATE OR REPLACE FUNCTION public.rejeitar_regularizacao_fechamento(p_request_id uuid, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_request public.solicitacoes_correcao_lancamento%ROWTYPE;
BEGIN
  SELECT * INTO v_request FROM public.solicitacoes_correcao_lancamento WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Solicitação não encontrada.'); END IF;
  IF v_request.status <> 'pending' THEN RETURN jsonb_build_object('ok', false, 'error', 'Solicitação já processada.'); END IF;
  IF NOT (public.eh_administrador_mx(auth.uid()) OR public.is_manager_of(v_request.store_id) OR public.is_owner_of(v_request.store_id)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  UPDATE public.solicitacoes_correcao_lancamento
     SET status = 'rejected', auditor_id = auth.uid(), reviewed_at = now(),
         rejection_reason = nullif(trim(coalesce(p_reason, '')), ''), updated_at = now()
   WHERE id = p_request_id;

  INSERT INTO public.notificacoes (sender_id, recipient_id, title, message, target_type, store_id, type, priority, link)
  VALUES (auth.uid(), v_request.seller_id, 'Regularização rejeitada',
          coalesce(nullif(trim(p_reason), ''), 'A gestão rejeitou a solicitação de correção.'),
          'user', v_request.store_id, 'regularizacao', 'medium', '/vendedor/terminal-mx');
  RETURN jsonb_build_object('ok', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancelar_regularizacao_fechamento(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_request public.solicitacoes_correcao_lancamento%ROWTYPE;
BEGIN
  SELECT * INTO v_request FROM public.solicitacoes_correcao_lancamento WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Solicitação não encontrada.'); END IF;
  IF v_request.seller_id <> auth.uid() AND v_request.requested_by <> auth.uid() THEN RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.'); END IF;
  IF v_request.status <> 'pending' THEN RETURN jsonb_build_object('ok', false, 'error', 'Somente solicitação pendente pode ser cancelada.'); END IF;

  UPDATE public.solicitacoes_correcao_lancamento
     SET status = 'cancelled', cancelled_at = now(), updated_at = now()
   WHERE id = p_request_id;
  RETURN jsonb_build_object('ok', true);
END;
$function$;

DROP FUNCTION IF EXISTS public.approve_correction_request(uuid);
CREATE FUNCTION public.approve_correction_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE v_result jsonb;
BEGIN
  v_result := public.aplicar_regularizacao_fechamento(request_id);
  IF NOT coalesce((v_result->>'ok')::boolean, false) THEN RAISE EXCEPTION '%', v_result->>'error'; END IF;
END;
$function$;

DROP FUNCTION IF EXISTS public.reject_correction_request(uuid);
CREATE FUNCTION public.reject_correction_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE v_result jsonb;
BEGIN
  v_result := public.rejeitar_regularizacao_fechamento(request_id, NULL);
  IF NOT coalesce((v_result->>'ok')::boolean, false) THEN RAISE EXCEPTION '%', v_result->>'error'; END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.solicitar_regularizacao_fechamento(uuid, jsonb, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aplicar_regularizacao_fechamento(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rejeitar_regularizacao_fechamento(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancelar_regularizacao_fechamento(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approve_correction_request(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_correction_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.solicitar_regularizacao_fechamento(uuid, jsonb, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aplicar_regularizacao_fechamento(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rejeitar_regularizacao_fechamento(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancelar_regularizacao_fechamento(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_correction_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_correction_request(uuid) TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.solicitacoes_correcao_lancamento FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.regularizacao_fechamento FROM anon, authenticated;

COMMENT ON TABLE public.solicitacoes_correcao_lancamento IS
  'Fonte canônica de regularização de fechamentos: solicitar, aprovar/aplicar, rejeitar e cancelar via RPC.';
COMMENT ON TABLE public.regularizacao_fechamento IS
  'LEGADA somente leitura. Novos fluxos usam solicitacoes_correcao_lancamento e RPCs canônicas.';
