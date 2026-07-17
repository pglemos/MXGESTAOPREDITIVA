BEGIN;

-- Fase 3.3 — Endurecimento de RPCs SECURITY DEFINER de escopo (Central/Carteira/vendedor/checkin).
-- Advisor security: `anon_security_definer_function_executable`.
-- Estas 6 funções são chamadas pelo frontend SEMPRE em contexto authenticated
-- (verificado em src/: useExecutionActions.ts, hooks de PDI/checkin/performance),
-- portanto anon nunca precisa de EXECUTE. Cada uma já guarda auth.uid() e escopa
-- por seller/loja internamente, mas remover o EXECUTE de anon fecha o vetor de
-- chamada direta via PostgREST RPC sem sessão (defesa em profundidade).
-- authenticated permanece com EXECUTE (caminho legítimo do app).

REVOKE EXECUTE ON FUNCTION public.vendedor_concluir_execution_action(p_action_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.vendedor_enviar_pdi_acao_central(p_acao_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.vendedor_vincular_conteudo_pdi_acao(p_acao_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.vendedor_performance_oficial(p_start_date date, p_end_date date, p_store_id uuid, p_seller_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.checkin_validation_kit(p_caller_id uuid, p_seller_id uuid, p_store_id uuid, p_reference_date date, p_scope text, p_now timestamp with time zone, p_liberado boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.pode_lancar_checkin(p_store_id uuid, p_seller_id uuid, p_reference_date date, uid uuid) FROM anon;

COMMIT;

-- DOWN
-- BEGIN;
-- GRANT EXECUTE ON FUNCTION public.vendedor_concluir_execution_action(p_action_id uuid) TO anon;
-- GRANT EXECUTE ON FUNCTION public.vendedor_enviar_pdi_acao_central(p_acao_id uuid) TO anon;
-- GRANT EXECUTE ON FUNCTION public.vendedor_vincular_conteudo_pdi_acao(p_acao_id uuid) TO anon;
-- GRANT EXECUTE ON FUNCTION public.vendedor_performance_oficial(p_start_date date, p_end_date date, p_store_id uuid, p_seller_id uuid) TO anon;
-- GRANT EXECUTE ON FUNCTION public.checkin_validation_kit(p_caller_id uuid, p_seller_id uuid, p_store_id uuid, p_reference_date date, p_scope text, p_now timestamp with time zone, p_liberado boolean) TO anon;
-- GRANT EXECUTE ON FUNCTION public.pode_lancar_checkin(p_store_id uuid, p_seller_id uuid, p_reference_date date, uid uuid) TO anon;
-- COMMIT;
