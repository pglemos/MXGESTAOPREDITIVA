BEGIN;

-- =====================================================================
-- Fase 3 — Remediação sistêmica de grants (P0)
-- Referência: docs/auditorias/2026-07-17-remediacao-central-carteira-inventario.md
--
-- Achado revalidado em prod (fbhcmzzgwjdgkctlfvbo) nesta data:
--   * 179 de 195 tabelas public ainda concediam a `anon` o template default do
--     Supabase (SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER),
--     incluindo tabelas sensíveis (usuarios, password_change_challenges,
--     tokens_oauth_consultoria, logs_acesso_sensivel, *_audit_log, roles).
--   * 185 tabelas concediam a `authenticated` TRUNCATE/TRIGGER/REFERENCES —
--     privilégios que NÃO são cobertos por RLS (RLS só filtra
--     SELECT/INSERT/UPDATE/DELETE).
--   * Causa raiz: DEFAULT PRIVILEGES do owner `postgres` em public concedem
--     anon=arwdDxtm e authenticated=arwdDxtm a TODA tabela futura — por isso
--     revogações tabela-a-tabela (migration 20260717240000, 6 tabelas) não
--     encerram o problema: cada nova tabela reintroduz o grant.
--
-- Estratégia:
--   1. anon: zero privilégio em qualquer tabela public (app é auth-only; nenhuma
--      policy referencia anon/public — verificado em pg_policies). RLS já bloqueia
--      DML de anon, mas TRUNCATE burla RLS; remoção total fecha a superfície.
--   2. authenticated: manter SELECT/INSERT/UPDATE/DELETE (governados por RLS),
--      remover TRUNCATE/TRIGGER/REFERENCES (burlam RLS) de todas as tabelas.
--   3. DEFAULT PRIVILEGES: parar de reconceder em tabelas/sequences futuras.
--   4. service_role permanece intacto (role de backend confiável, bypassa RLS
--      por design e não é exposto ao cliente).
-- =====================================================================

-- 1) anon: revogar tudo em todas as tabelas existentes de public
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- 2) authenticated: remover privilégios que burlam RLS de todas as tabelas
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.%I FROM authenticated',
      r.tablename
    );
  END LOOP;
END $$;

-- 3) Raiz: default privileges do owner `postgres` (dono das tabelas criadas via migration)
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM authenticated;

COMMIT;

-- DOWN (reversão — reintroduz o template default do Supabase; não recomendado)
-- BEGIN;
-- ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
--   GRANT ALL ON TABLES TO anon;
-- ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
--   GRANT ALL ON SEQUENCES TO anon;
-- ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
--   GRANT TRUNCATE, TRIGGER, REFERENCES ON TABLES TO authenticated;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
-- DO $$
-- DECLARE r record;
-- BEGIN
--   FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
--     EXECUTE format('GRANT TRUNCATE, TRIGGER, REFERENCES ON public.%I TO authenticated', r.tablename);
--   END LOOP;
-- END $$;
-- COMMIT;
