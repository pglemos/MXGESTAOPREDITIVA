-- Explicit execution grants for the new managerial P0 functions.
-- Trigger helpers must never be callable through PostgREST.

BEGIN;

REVOKE ALL ON FUNCTION public.consolidate_d1_snapshot(date,uuid,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consolidate_d1_snapshot(date,uuid,boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.consolidate_d1_snapshot(date,uuid,boolean) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.refresh_manager_daily_tasks(uuid,uuid,date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_manager_daily_tasks(uuid,uuid,date) FROM anon;
GRANT EXECUTE ON FUNCTION public.refresh_manager_daily_tasks(uuid,uuid,date) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.consolidate_manager_routine_snapshot(uuid,uuid,date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consolidate_manager_routine_snapshot(uuid,uuid,date) FROM anon;
GRANT EXECUTE ON FUNCTION public.consolidate_manager_routine_snapshot(uuid,uuid,date) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.record_d1_contact_action(uuid,text,text,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_d1_contact_action(uuid,text,text,text,jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_d1_contact_action(uuid,text,text,text,jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.update_d1_confirmation(uuid,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_d1_confirmation(uuid,text,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_d1_confirmation(uuid,text,text) TO authenticated;

REVOKE ALL ON FUNCTION public.run_d1_consolidation_clock() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_d1_consolidation_clock() TO service_role;

REVOKE ALL ON FUNCTION public.log_agenda_d1_late_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bridge_d1_audit_to_canonical() FROM PUBLIC, anon, authenticated;

COMMIT;
