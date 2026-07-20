BEGIN;

-- Security hardening for operational broadcast fan-out.
--
-- Previous state:
-- - PUBLIC/anon could execute this SECURITY DEFINER RPC through PostgREST;
-- - the function did not validate auth.uid(), role, store scope, or sender identity;
-- - a caller could provide an arbitrary p_sender_id and fan out notifications globally.
--
-- Required behavior:
-- - global broadcast: service_role or internal MX team only;
-- - store broadcast: service_role, internal MX team, manager, or owner of the store;
-- - authenticated callers cannot spoof sender_id;
-- - anon has no EXECUTE privilege;
-- - service_role remains supported for scheduled/backend jobs.

CREATE OR REPLACE FUNCTION public.send_broadcast_notification(
  p_title text,
  p_message text,
  p_type text DEFAULT 'system'::text,
  p_priority text DEFAULT 'medium'::text,
  p_store_id uuid DEFAULT NULL::uuid,
  p_target_role text DEFAULT 'todos'::text,
  p_link text DEFAULT NULL::text,
  p_sender_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_effective_sender uuid;
  v_user_record record;
  v_broadcast_id uuid := gen_random_uuid();
BEGIN
  IF auth.role() <> 'service_role' AND v_caller IS NULL THEN
    RAISE EXCEPTION 'Sessao invalida.' USING ERRCODE = '42501';
  END IF;

  IF p_store_id IS NULL THEN
    IF auth.role() <> 'service_role'
      AND NOT public.eh_area_interna_mx(v_caller)
    THEN
      RAISE EXCEPTION 'Broadcast global restrito a equipe interna MX.' USING ERRCODE = '42501';
    END IF;
  ELSIF auth.role() <> 'service_role'
    AND NOT public.eh_area_interna_mx(v_caller)
    AND NOT public.is_manager_of(p_store_id)
    AND NOT public.is_owner_of(p_store_id)
  THEN
    RAISE EXCEPTION 'Broadcast da loja restrito a gestao autorizada.' USING ERRCODE = '42501';
  END IF;

  v_effective_sender := CASE WHEN auth.role() = 'service_role' THEN p_sender_id ELSE v_caller END;

  FOR v_user_record IN
    SELECT DISTINCT
      u.id AS user_id,
      CASE WHEN p_store_id IS NULL THEN NULL ELSE p_store_id END AS resolved_store_id
    FROM public.usuarios u
    LEFT JOIN public.vinculos_loja v ON v.user_id = u.id
    WHERE u.active = true
      AND (p_store_id IS NULL OR v.store_id = p_store_id)
      AND (
        p_target_role = 'todos'
        OR u.role = p_target_role
        OR v.role = p_target_role
      )
  LOOP
    INSERT INTO public.notificacoes (
      recipient_id,
      store_id,
      sender_id,
      broadcast_id,
      title,
      message,
      type,
      priority,
      link,
      read,
      created_at,
      target_type,
      target_store_id,
      target_role,
      sent_at
    ) VALUES (
      v_user_record.user_id,
      v_user_record.resolved_store_id,
      v_effective_sender,
      v_broadcast_id,
      p_title,
      p_message,
      p_type,
      p_priority,
      p_link,
      false,
      now(),
      CASE WHEN p_store_id IS NULL THEN 'all' ELSE 'store' END,
      p_store_id,
      CASE WHEN p_target_role = 'todos' THEN NULL ELSE p_target_role END,
      now()
    );
  END LOOP;

  RETURN v_broadcast_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.send_broadcast_notification(text,text,text,text,uuid,text,text,uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_broadcast_notification(text,text,text,text,uuid,text,text,uuid)
  TO authenticated, service_role;

-- DOWN
-- Restore the previous function body from migration
-- 20260407160000_reconcile_epic09_12_end_to_end.sql if rollback is required,
-- then restore the prior grants. This rollback intentionally reopens the security
-- exposure and must only be used during an incident with explicit approval.
-- GRANT EXECUTE ON FUNCTION public.send_broadcast_notification(text,text,text,text,uuid,text,text,uuid)
--   TO PUBLIC, anon, authenticated, service_role;

COMMIT;
