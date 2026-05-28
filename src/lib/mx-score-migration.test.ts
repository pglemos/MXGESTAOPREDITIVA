import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationsDir = new URL('../../supabase/migrations/', import.meta.url)
const scoreMigrationPath = new URL('20260527110000_score_engine_schema.sql', migrationsDir)
const touchedMigrationFiles = [
  '20260527110000_score_engine_schema.sql',
  '20260527120000_role_rls_helpers.sql',
  '20260527170000_executive_schema_rls_hardening.sql',
]

function readMigration(path: URL): string {
  return readFileSync(path, 'utf8')
}

describe('MX Score migration contract', () => {
  test('keeps PostgreSQL function comments signature-qualified', () => {
    const invalidFunctionComment = /COMMENT\s+ON\s+FUNCTION\s+public\.[a-zA-Z_][a-zA-Z0-9_]*\s+IS\b/

    const invalidFiles = touchedMigrationFiles
      .filter((fileName) => invalidFunctionComment.test(readMigration(new URL(fileName, migrationsDir))))

    expect(invalidFiles).toEqual([])
  })

  test('declares canonical score enums, tables and immutable write guards', () => {
    const sql = readMigration(scoreMigrationPath)

    expect(sql).toContain("CREATE TYPE public.score_scope_type AS ENUM ('store', 'department', 'individual', 'process')")
    expect(sql).toContain("CREATE TYPE public.score_dimension AS ENUM ('resultado', 'processo', 'disciplina')")
    expect(sql).toContain("CREATE TYPE public.score_band AS ENUM ('elite', 'excellent', 'good', 'attention', 'critical')")

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.score_inputs')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.score_calculations')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.score_history')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.score_observations')

    expect(sql).toContain('CREATE TRIGGER trg_prevent_score_calc_mutation')
    expect(sql).toContain('BEFORE UPDATE OR DELETE ON public.score_calculations')
    expect(sql).toContain('CREATE TRIGGER trg_prevent_score_history_mutation')
    expect(sql).toContain('BEFORE UPDATE OR DELETE ON public.score_history')
    expect(sql).toContain('CREATE TRIGGER trg_archive_score_calculation')
    expect(sql).toContain('AFTER INSERT ON public.score_calculations')
  })

  test('keeps score writes service-only and consultant input comment-only', () => {
    const sql = readMigration(scoreMigrationPath)

    expect(sql).toMatch(/CREATE POLICY score_calc_insert_service[\s\S]+FOR INSERT TO authenticated WITH CHECK \(false\)/)
    expect(sql).toMatch(/CREATE POLICY score_obs_write[\s\S]+FOR INSERT TO authenticated WITH CHECK \(auth\.uid\(\) = author_id\)/)
    expect(sql).toContain("v_role_code NOT IN ('consultant', 'master')")
    expect(sql).toContain('COMMENT ON FUNCTION public.get_score(public.score_scope_type, uuid, date) IS')
  })

  test('documents manual rollback for every score object created by the migration', () => {
    const sql = readMigration(scoreMigrationPath)

    expect(sql).toContain('-- DOWN MIGRATION (manual rollback)')
    expect(sql).toContain('DROP FUNCTION IF EXISTS public.get_score(public.score_scope_type, uuid, date)')
    expect(sql).toContain('DROP TRIGGER IF EXISTS trg_prevent_score_history_mutation ON public.score_history')
    expect(sql).toContain('DROP TRIGGER IF EXISTS trg_prevent_score_calc_mutation ON public.score_calculations')
    expect(sql).toContain('DROP TABLE IF EXISTS public.score_observations')
    expect(sql).toContain('DROP TABLE IF EXISTS public.score_history')
    expect(sql).toContain('DROP TABLE IF EXISTS public.score_calculations')
    expect(sql).toContain('DROP TABLE IF EXISTS public.score_inputs')
    expect(sql).toContain('DROP TYPE IF EXISTS public.score_band')
    expect(sql).toContain('DROP TYPE IF EXISTS public.score_dimension')
    expect(sql).toContain('DROP TYPE IF EXISTS public.score_scope_type')
  })
})
