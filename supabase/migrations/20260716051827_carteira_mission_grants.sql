-- Reconstruida a partir de supabase_migrations.schema_migrations (producao).
-- Nao havia arquivo local para esta migration ja aplicada em prod; texto abaixo e fiel ao que rodou.

GRANT SELECT ON TABLE public.carteira_missoes TO authenticated;
GRANT SELECT ON TABLE public.carteira_missao_itens TO authenticated;
