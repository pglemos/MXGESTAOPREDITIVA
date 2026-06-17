import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260616222000_vendedor_perfil_vinculo_tipo.sql', import.meta.url)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('vendedor perfil vinculo tipo migration contract', () => {
  test('cria enum canonico para loja e autonomo', () => {
    const sql = readMigration()

    expect(sql).toContain("CREATE TYPE public.vendedor_vinculo_tipo AS ENUM ('loja', 'autonomo')")
  })

  test('adiciona vinculo_tipo no perfil com default loja', () => {
    const sql = readMigration()

    expect(sql).toContain("ADD COLUMN IF NOT EXISTS vinculo_tipo public.vendedor_vinculo_tipo NOT NULL DEFAULT 'loja'")
    expect(sql).toContain("SET vinculo_tipo = 'loja'")
    expect(sql).toContain('Fonte canonica do tipo de vinculo do vendedor')
  })
})
