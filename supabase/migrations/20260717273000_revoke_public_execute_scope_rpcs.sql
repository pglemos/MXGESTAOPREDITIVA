BEGIN;

-- Correção da 20260717272000: revogar de `anon` não surtiu efeito porque estas
-- funções mantêm GRANT EXECUTE a PUBLIC (proacl "=X/postgres"), e anon herda via
-- PUBLIC. authenticated e service_role já possuem GRANT explícito, então revogar
-- de PUBLIC remove o acesso de anon preservando o caminho legítimo do app.

REVOKE EXECUTE ON FUNCTION public.vendedor_concluir_execution_action(p_action_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.vendedor_enviar_pdi_acao_central(p_acao_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.vendedor_vincular_conteudo_pdi_acao(p_acao_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.vendedor_performance_oficial(p_start_date date, p_end_date date, p_store_id uuid, p_seller_id uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.checkin_validation_kit(p_caller_id uuid, p_seller_id uuid, p_store_id uuid, p_reference_date date, p_scope text, p_now timestamp with time zone, p_liberado boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pode_lancar_checkin(p_store_id uuid, p_seller_id uuid, p_reference_date date, uid uuid) FROM PUBLIC;

-- Garantir que os papéis legítimos tenham EXECUTE explícito (idempotente).
GRANT EXECUTE ON FUNCTION public.vendedor_concluir_execution_action(p_action_id uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vendedor_enviar_pdi_acao_central(p_acao_id uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vendedor_vincular_conteudo_pdi_acao(p_acao_id uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vendedor_performance_oficial(p_start_date date, p_end_date date, p_store_id uuid, p_seller_id uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.checkin_validation_kit(p_caller_id uuid, p_seller_id uuid, p_store_id uuid, p_reference_date date, p_scope text, p_now timestamp with time zone, p_liberado boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pode_lancar_checkin(p_store_id uuid, p_seller_id uuid, p_reference_date date, uid uuid) TO authenticated, service_role;

COMMIT;

-- DOWN: GRANT EXECUTE ... TO PUBLIC nas 6 funções (não recomendado).
