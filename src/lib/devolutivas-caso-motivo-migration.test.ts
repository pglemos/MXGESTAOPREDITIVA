import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260616230000_devolutivas_caso_motivo.sql', import.meta.url)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('devolutivas caso motivo migration contract', () => {
  test('adiciona campo de caso/motivo documentado', () => {
    const sql = readMigration()

    expect(sql).toContain('ADD COLUMN IF NOT EXISTS caso_motivo text')
    expect(sql).toContain('devolutiva')
    expect(sql).toContain('documentacao')
  })

  test('restringe quando informado sem quebrar linhas antigas nulas', () => {
    const sql = readMigration()

    expect(sql).toContain('devolutivas_caso_motivo_not_blank')
    expect(sql).toContain('caso_motivo IS NULL OR length(btrim(caso_motivo)) >= 8')
  })
})
