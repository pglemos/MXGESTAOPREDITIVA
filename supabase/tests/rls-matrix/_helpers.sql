-- ============================================================================
-- RLS Regression Matrix — Helpers comuns
-- ----------------------------------------------------------------------------
-- Funções utilitárias usadas pelos test files. Carregar UMA vez antes do runner.
-- ============================================================================

SET search_path = public, pg_catalog;

-- Conta linhas visíveis (SELECT) para o role atual, em uma tabela arbitrária.
CREATE OR REPLACE FUNCTION rls_matrix.visible_count(p_table regclass)
RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_count bigint;
BEGIN
  EXECUTE format('SELECT count(*) FROM %s', p_table) INTO v_count;
  RETURN v_count;
END;
$$;

-- Tenta INSERT mínimo na tabela e retorna true se sucedeu (rollback aplicado fora).
-- Caller deve estar dentro de um SAVEPOINT para reverter efeito colateral.
CREATE OR REPLACE FUNCTION rls_matrix.try_insert(p_sql text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  EXECUTE p_sql;
  RETURN true;
EXCEPTION
  WHEN insufficient_privilege OR check_violation OR raise_exception THEN
    RETURN false;
  WHEN OTHERS THEN
    -- RLS viola via 0 rows affected (não exception) — caller trata via RETURNING
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION rls_matrix.visible_count(regclass) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rls_matrix.try_insert(text) TO anon, authenticated;
