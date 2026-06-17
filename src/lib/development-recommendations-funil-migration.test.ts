import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260617005000_development_recommendations_funil_source.sql', import.meta.url)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('development recommendations funnel source migration contract', () => {
  test('allows funnel as a persisted recommendation source type', () => {
    const sql = readMigration()

    expect(sql).toContain('recomendacoes_desenvolvimento_source_type_check')
    expect(sql).toContain("'funil'")
    expect(sql).toContain("'feedback'")
    expect(sql).toContain("'pdi'")
    expect(sql).toContain("'manual'")
    expect(sql).toContain("'rotina'")
  })

  test('keeps rollback manual and non-destructive', () => {
    const sql = readMigration()

    expect(sql).toContain('DROP CONSTRAINT IF EXISTS recomendacoes_desenvolvimento_source_type_check')
    expect(sql).toContain('Manual rollback')
    expect(sql).not.toContain('DROP TABLE public.recomendacoes_desenvolvimento')
  })
})
