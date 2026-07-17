-- Carteira Base44: fase 2 do rollout sem downtime.
-- Aplicar somente depois que o frontend em produção estiver usando as RPCs v2.

BEGIN;

REVOKE EXECUTE ON FUNCTION public.carteira_salvar_cliente(jsonb, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.carteira_iniciar_missao(jsonb, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.carteira_atualizar_missao(uuid, jsonb) FROM authenticated;

COMMIT;

-- DOWN: use supabase/rollbacks/20260716220000_carteira_disable_legacy_rpc_entrypoints.sql.
