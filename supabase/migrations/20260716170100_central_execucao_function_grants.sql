-- Supabase pode manter grants explicitos para anon/authenticated mesmo apos REVOKE FROM PUBLIC.
-- Helpers e funcao interna ficam restritos ao owner; somente RPCs de interface sao expostas a authenticated.

BEGIN;

REVOKE ALL ON FUNCTION public.central_can_access_store(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.central_can_manage_action(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.central_result_allowed(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.central_upsert_appointment_action_internal(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_central_sync_agendamento_action() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.central_sync_appointment_action(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.central_create_manual_action(jsonb, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.central_reschedule_action(uuid, timestamptz, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.central_resolve_action(uuid, text, text, jsonb, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.central_escalate_action(uuid, text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.central_sync_appointment_action(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.central_create_manual_action(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.central_reschedule_action(uuid, timestamptz, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.central_resolve_action(uuid, text, text, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.central_escalate_action(uuid, text, text) TO authenticated;

COMMIT;
