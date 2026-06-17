import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260616235000_remuneracao_modelos_configuraveis.sql', import.meta.url)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('remuneracao modelos configuraveis migration contract', () => {
  test('adiciona modelos de regra sem remover os existentes', () => {
    const sql = readMigration()

    expect(sql).toContain("ALTER TYPE public.remuneracao_regra_tipo ADD VALUE IF NOT EXISTS 'percentual_faturamento'")
    expect(sql).toContain("ALTER TYPE public.remuneracao_regra_tipo ADD VALUE IF NOT EXISTS 'comissao_categoria'")
    expect(sql).toContain("ALTER TYPE public.remuneracao_regra_tipo ADD VALUE IF NOT EXISTS 'comissao_equipe'")
  })

  test('adiciona tipo_veiculo opcional para regra por categoria', () => {
    const sql = readMigration()

    expect(sql).toContain('ADD COLUMN IF NOT EXISTS tipo_veiculo text')
    expect(sql).toContain('remuneracao_regras_tipo_veiculo_check')
    expect(sql).toContain("tipo_veiculo IN ('carro', 'moto', 'caminhao')")
    expect(sql).toContain("COALESCE(tipo_veiculo, '')")
  })
})
