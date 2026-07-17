-- Reconstruida a partir de supabase_migrations.schema_migrations (producao).
-- Nao havia arquivo local para esta migration ja aplicada em prod; texto abaixo e fiel ao que rodou.

REVOKE EXECUTE ON FUNCTION public.carteira_salvar_cliente(jsonb, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.carteira_iniciar_missao(jsonb, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.carteira_atualizar_missao(uuid, jsonb) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.carteira_salvar_cliente(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.carteira_iniciar_missao(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.carteira_atualizar_missao(uuid, jsonb) TO authenticated;
