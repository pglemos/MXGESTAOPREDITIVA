BEGIN;

REVOKE ALL ON FUNCTION public.ack_alert(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ack_alert(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.begin_password_change() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.begin_password_change() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.buscar_cliente_loja_por_telefone(text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.buscar_cliente_loja_por_telefone(text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.complete_password_change() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_password_change() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.dismiss_alert(uuid,text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dismiss_alert(uuid,text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.registrar_venda_direta(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.registrar_venda_direta(jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.resolve_alert(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.resolve_alert(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.solicitar_liberacao_fechamento(date) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.solicitar_liberacao_fechamento(date) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.solicitar_regularizacao_fechamento(uuid,jsonb,text,text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.solicitar_regularizacao_fechamento(uuid,jsonb,text,text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.submit_checkin(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_checkin(jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.submeter_quiz_treinamento(uuid,jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submeter_quiz_treinamento(uuid,jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.update_my_profile(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_my_profile(jsonb) TO authenticated, service_role;

COMMIT;

-- DOWN
-- BEGIN;
-- GRANT EXECUTE ON FUNCTION public.ack_alert(uuid) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.begin_password_change() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.buscar_cliente_loja_por_telefone(text) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.complete_password_change() TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.dismiss_alert(uuid,text) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.registrar_venda_direta(jsonb) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.resolve_alert(uuid) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.solicitar_liberacao_fechamento(date) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.solicitar_regularizacao_fechamento(uuid,jsonb,text,text) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.submit_checkin(jsonb) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.submeter_quiz_treinamento(uuid,jsonb) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.update_my_profile(jsonb) TO PUBLIC, anon, authenticated, service_role;
-- COMMIT;
