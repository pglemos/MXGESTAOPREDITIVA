-- ============================================================================
-- RLS Regression Matrix — Runner
-- Executa todas as 8 suites em sequência. Cada arquivo é auto-isolado
-- (BEGIN ... ROLLBACK).
--
-- Pré-requisitos: setup.sql + _helpers.sql já carregados na mesma sessão.
--
-- Uso (local):
--   psql "$DATABASE_URL" \
--     -f supabase/tests/rls-matrix/setup.sql \
--     -f supabase/tests/rls-matrix/_helpers.sql \
--     -f supabase/tests/rls-matrix/runner.sql
-- ============================================================================
\set ON_ERROR_STOP on

\echo === RLS Matrix: lancamentos_diarios ===
\i supabase/tests/rls-matrix/lancamentos_diarios.test.sql

\echo === RLS Matrix: usuarios ===
\i supabase/tests/rls-matrix/usuarios.test.sql

\echo === RLS Matrix: vendedores_loja ===
\i supabase/tests/rls-matrix/vendedores_loja.test.sql

\echo === RLS Matrix: vinculos_loja ===
\i supabase/tests/rls-matrix/vinculos_loja.test.sql

\echo === RLS Matrix: lojas ===
\i supabase/tests/rls-matrix/lojas.test.sql

\echo === RLS Matrix: metas ===
\i supabase/tests/rls-matrix/metas.test.sql

\echo === RLS Matrix: logs_auditoria ===
\i supabase/tests/rls-matrix/logs_auditoria.test.sql

\echo === RLS Matrix: role_assignments_audit ===
\i supabase/tests/rls-matrix/role_assignments_audit.test.sql

\echo === RLS Matrix: feature_flags ===
\i supabase/tests/rls-matrix/feature_flags.test.sql

\echo === RLS Matrix: COMPLETE ===
