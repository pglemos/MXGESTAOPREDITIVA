-- Corrige as três tabelas públicas sinalizadas sem RLS pelo Supabase Security Advisor.
-- Backups permanecem acessíveis apenas por papéis administrativos/service_role.

BEGIN;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_backup_lancamentos_diarios_duplicates_20260503 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_backup_vendedores_loja_duplicates_20260503 ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.user_roles FROM anon, authenticated;
REVOKE ALL ON TABLE public.migration_backup_lancamentos_diarios_duplicates_20260503 FROM anon, authenticated;
REVOKE ALL ON TABLE public.migration_backup_vendedores_loja_duplicates_20260503 FROM anon, authenticated;

GRANT SELECT ON TABLE public.user_roles TO authenticated;

DROP POLICY IF EXISTS user_roles_read_own_or_admin ON public.user_roles;
CREATE POLICY user_roles_read_own_or_admin
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.eh_administrador_mx((SELECT auth.uid()))
);

DROP POLICY IF EXISTS user_roles_write_denied ON public.user_roles;
CREATE POLICY user_roles_write_denied
ON public.user_roles
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

COMMENT ON TABLE public.user_roles IS
  'Bridge legado de papéis. Autorização oficial permanece em public.usuarios.role e capabilities; leitura restrita por RLS.';
COMMENT ON TABLE public.migration_backup_lancamentos_diarios_duplicates_20260503 IS
  'Backup técnico de migration; sem acesso por anon/authenticated.';
COMMENT ON TABLE public.migration_backup_vendedores_loja_duplicates_20260503 IS
  'Backup técnico de migration; sem acesso por anon/authenticated.';

COMMIT;
