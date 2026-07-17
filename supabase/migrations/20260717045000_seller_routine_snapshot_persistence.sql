-- SUPERSEDED MIGRATION BUNDLE
--
-- Esta migration monolítica foi substituída pelas migrations versionadas que
-- correspondem exatamente ao ledger aplicado no Supabase de produção:
--
-- 20260717040955_seller_routine_snapshot_schema.sql
-- 20260717041036_seller_routine_snapshot_helpers.sql
-- 20260717041142_seller_routine_snapshot_consolidation.sql
-- 20260717041202_seller_routine_snapshot_cron.sql
--
-- Mantida como marcador no histórico do GitHub para não apagar um artefato já
-- revisado. É deliberadamente no-op para evitar recriar funções e políticas em
-- ambientes novos depois das migrations canônicas acima.

BEGIN;
COMMIT;
