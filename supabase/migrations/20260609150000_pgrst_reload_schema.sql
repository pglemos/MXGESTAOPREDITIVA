-- ============================================================================
-- Migration: 20260609150000_pgrst_reload_schema.sql
-- Força o PostgREST a recarregar o schema cache para expor a RPC
-- public.compute_individual_score_mvp (criada em 20260609140000).
-- No-op de schema; apenas dispara o reload. Reexecutável.
-- ============================================================================

BEGIN;
  NOTIFY pgrst, 'reload schema';
COMMIT;
