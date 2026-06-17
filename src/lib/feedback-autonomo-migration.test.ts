import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260617003000_feedback_autonomo_sistema.sql', import.meta.url)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('feedback autonomo sistema migration contract', () => {
  test('permite devolutiva sistemica sem gerente humano', () => {
    const sql = readMigration()

    expect(sql).toContain('ALTER TABLE public.devolutivas')
    expect(sql).toContain('ALTER COLUMN manager_id DROP NOT NULL')
    expect(sql).toContain('COMMENT ON COLUMN public.devolutivas.manager_id')
    expect(sql).toContain('NULL para devolutivas sistemicas')
  })

  test('permite acao sistemica sem gerente e mantem RLS do vendedor autonomo', () => {
    const sql = readMigration()

    expect(sql).toContain('ALTER TABLE public.devolutiva_acoes')
    expect(sql).toContain('ALTER COLUMN manager_id DROP NOT NULL')
    expect(sql).toContain('devolutivas_insert_system_autonomo')
    expect(sql).toContain('devolutiva_acoes_insert_system_autonomo')
    expect(sql).toContain("diagnostic_json ->> 'origem' = 'sistema'")
    expect(sql).toContain('seller_id = auth.uid()')
    expect(sql).toContain('manager_id IS NULL')
  })
})
