import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260617004000_feedback_action_catalog.sql', import.meta.url)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('feedback action catalog migration contract', () => {
  test('creates versioned feedback action catalog', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.feedback_action_catalog')
    expect(sql).toContain('catalog_version integer NOT NULL')
    expect(sql).toContain('action_key text NOT NULL')
    expect(sql).toContain('action_template text NOT NULL')
    expect(sql).toContain('flow_metadata jsonb NOT NULL DEFAULT')
    expect(sql).toContain('UNIQUE (catalog_version, action_key)')
  })

  test('seeds required operational actions and keeps rollback manual', () => {
    const sql = readMigration()

    expect(sql).toContain('retornos_qualificados_diarios')
    expect(sql).toContain('confirmacao_visita')
    expect(sql).toContain('argumentacao_financiamento')
    expect(sql).toContain('retomar_clientes_parados')
    expect(sql).toContain('DELETE FROM public.feedback_action_catalog')
  })
})
