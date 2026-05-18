-- ============================================================
-- Migration Template — Reversibility-Compliant
-- Story 0.7 / T-10 / X-11
--
-- Uso:
--   1. Copie este arquivo para `supabase/migrations/YYYYMMDDHHMMSS_<slug>.sql`
--   2. Substitua os blocos UP e DOWN com sua lógica
--   3. Valide localmente: `supabase db reset` (UP) e `npm run migration:test-reversibility`
--   4. Se a migration for "critical" (toca RLS, RPC, schema multi-tenant),
--      adicione label `migration:critical` no PR para acionar gate UP→DOWN→UP no CI
--
-- Regras obrigatórias:
--   ✅ Idempotente (CREATE TABLE IF NOT EXISTS, CREATE OR REPLACE FUNCTION, DROP IF EXISTS antes)
--   ✅ Bloco DOWN explícito (mesmo que seja "DROP da nova entidade")
--   ✅ search_path explícito em SECURITY DEFINER (CVE-2018-1058)
--   ✅ Para REVOKE de policy: prevê DOWN que restaura GRANT/policy anterior
--   ✅ Sem EXCEPTION WHEN others ... SQLERRM (use pattern Story 1.5)
-- ============================================================

-- ============================================================
-- UP
-- ============================================================
BEGIN;

-- Exemplo: adicionar coluna
-- ALTER TABLE public.<tabela> ADD COLUMN IF NOT EXISTS <coluna> <tipo>;

-- Exemplo: criar função SECURITY DEFINER
-- CREATE OR REPLACE FUNCTION public.<func>(...) RETURNS <type>
--   LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ ... $$;

-- Exemplo: criar policy RLS
-- ALTER TABLE public.<tabela> ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS <policy_name> ON public.<tabela>;
-- CREATE POLICY <policy_name> ON public.<tabela> ...;

-- Exemplo: REVOKE/GRANT
-- REVOKE INSERT, UPDATE ON public.<tabela> FROM authenticated;

COMMIT;

-- ============================================================
-- DOWN (obrigatório — não delete este bloco)
-- ============================================================
-- Para reverter, executar o bloco abaixo manualmente:
--
-- BEGIN;
-- ALTER TABLE public.<tabela> DROP COLUMN IF EXISTS <coluna>;
-- DROP FUNCTION IF EXISTS public.<func>(<args>);
-- DROP POLICY IF EXISTS <policy_name> ON public.<tabela>;
-- GRANT INSERT, UPDATE ON public.<tabela> TO authenticated;
-- COMMIT;
--
-- Validação pós-DOWN:
--   - Schema diff vs versão anterior deve ser zero
--   - Smoke tests existentes devem continuar verdes
-- ============================================================
