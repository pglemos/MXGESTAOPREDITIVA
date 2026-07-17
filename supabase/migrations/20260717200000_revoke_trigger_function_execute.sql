BEGIN;

-- Trigger functions are infrastructure callbacks, not public RPC endpoints.
-- Existing triggers continue to invoke them inside the originating transaction;
-- only direct API execution is removed from API-facing roles.
REVOKE ALL ON FUNCTION public.archive_score_calculation() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.audit_vendedor_perfil_profissional() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.bloquear_self_update_usuarios_sensivel() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.check_orphan_users_after_membership_deletion() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.enforce_feedback_seller_ack_only() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.enforce_observation_author_role() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.expandir_destino_notificacao_regularizacao() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.log_planos_acao_changes() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.log_store_meta_rules_changes() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.log_store_update_changes() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.mx_set_updated_by() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.notify_manager_on_checkin() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.notify_manager_on_correction_request() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.proteger_campos_oficiais_vendedor_perfil() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.sync_notification_reads() FROM PUBLIC, anon, authenticated, service_role;

-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. Make future
-- RPC exposure explicit instead of inheriting access accidentally.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

COMMIT;

-- DOWN
-- BEGIN;
-- GRANT EXECUTE ON FUNCTION public.archive_score_calculation() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.audit_vendedor_perfil_profissional() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.bloquear_self_update_usuarios_sensivel() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.check_orphan_users_after_membership_deletion() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.enforce_feedback_seller_ack_only() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.enforce_observation_author_role() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.expandir_destino_notificacao_regularizacao() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.handle_new_user() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.log_planos_acao_changes() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.log_store_meta_rules_changes() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.log_store_update_changes() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.mx_set_updated_by() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.notify_manager_on_checkin() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.notify_manager_on_correction_request() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.proteger_campos_oficiais_vendedor_perfil() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.sync_notification_reads() TO PUBLIC, anon, authenticated, service_role;
-- ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO PUBLIC;
-- COMMIT;
