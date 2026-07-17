BEGIN;

-- Authenticated application RPCs: remove inherited/public execution and grant
-- only to signed-in application sessions and service automation.
REVOKE ALL ON FUNCTION public.admin_archive_store(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_archive_store(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_create_store(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_create_store(jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_restore_store(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_restore_store(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_update_store(uuid,jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_store(uuid,jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.exportar_contatos_cadastros_mx() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.exportar_contatos_cadastros_mx() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.process_import_data(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_import_data(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.upsert_funnel_metrics_snapshot(date,date,text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_funnel_metrics_snapshot(date,date,text) TO authenticated, service_role;

-- Cron configuration and observability helpers are infrastructure operations,
-- not end-user RPC endpoints.
REVOKE ALL ON FUNCTION public.append_audit_log(text,text,jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.append_audit_log(text,text,jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.configure_google_meet_ata_cron(text,text,text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.configure_google_meet_ata_cron(text,text,text) TO service_role;

REVOKE ALL ON FUNCTION public.configure_monthly_report_cron(text,text,text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.configure_monthly_report_cron(text,text,text) TO service_role;

REVOKE ALL ON FUNCTION public.configure_morning_report_cron(text,text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.configure_morning_report_cron(text,text) TO service_role;

REVOKE ALL ON FUNCTION public.configure_weekly_feedback_cron(text,text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.configure_weekly_feedback_cron(text,text) TO service_role;

REVOKE ALL ON FUNCTION public.get_correlation_id() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_correlation_id() TO service_role;

REVOKE ALL ON FUNCTION public.log_rpc_error(text,text,text,uuid,jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_rpc_error(text,text,text,uuid,jsonb) TO service_role;

COMMIT;

-- DOWN
-- BEGIN;
-- GRANT EXECUTE ON FUNCTION public.admin_archive_store(uuid) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.admin_create_store(jsonb) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.admin_restore_store(uuid) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.admin_update_store(uuid,jsonb) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.exportar_contatos_cadastros_mx() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.process_import_data(uuid) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.upsert_funnel_metrics_snapshot(date,date,text) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.append_audit_log(text,text,jsonb) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.configure_google_meet_ata_cron(text,text,text) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.configure_monthly_report_cron(text,text,text) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.configure_morning_report_cron(text,text) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.configure_weekly_feedback_cron(text,text) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.get_correlation_id() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.log_rpc_error(text,text,text,uuid,jsonb) TO PUBLIC, anon, authenticated, service_role;
-- COMMIT;
