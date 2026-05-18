-- Story 1.8 — Habilita RLS em tabelas faltantes
-- DB-013/019: role_assignments_audit, roles, historico_regras_metas_loja
-- Backups migration_backup_*_20260503 são escopo de Story 1.7 (drop)
-- Referência: docs/reviews/sprint-1-quick-verifications.md §2

-- =====================================================
-- 1. role_assignments_audit — admin-only
-- =====================================================
ALTER TABLE IF EXISTS public.role_assignments_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS role_assignments_audit_select ON public.role_assignments_audit;
CREATE POLICY role_assignments_audit_select
  ON public.role_assignments_audit
  FOR SELECT
  TO authenticated
  USING (public.eh_administrador_mx());

-- Sem INSERT/UPDATE/DELETE policies → bloqueia escrita via PostgREST
-- (apenas service_role bypassa, conforme padrão Supabase)

-- =====================================================
-- 2. roles — referência pública internamente
-- =====================================================
ALTER TABLE IF EXISTS public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_select ON public.roles;
CREATE POLICY roles_select
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Sem policies de escrita → bloqueia INSERT/UPDATE/DELETE via PostgREST

-- =====================================================
-- 3. historico_regras_metas_loja — admin MX + dono/gerente da loja
-- (renomeada de store_meta_rules_history em 20260430230000)
-- =====================================================
ALTER TABLE IF EXISTS public.historico_regras_metas_loja ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS historico_regras_metas_loja_select ON public.historico_regras_metas_loja;
CREATE POLICY historico_regras_metas_loja_select
  ON public.historico_regras_metas_loja
  FOR SELECT
  TO authenticated
  USING (
    public.eh_area_interna_mx()
    OR public.tem_papel_loja(store_id, ARRAY['dono', 'gerente'])
  );

-- Escrita via trigger ou service_role apenas (sem policy INSERT/UPDATE/DELETE)

-- =====================================================
-- DOWN (rollback emergencial)
-- =====================================================
-- ALTER TABLE public.role_assignments_audit DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.historico_regras_metas_loja DISABLE ROW LEVEL SECURITY;
