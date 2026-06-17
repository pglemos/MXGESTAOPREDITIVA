import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260616214000_vendedor_perfil_mix_canais_funil.sql', import.meta.url)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('vendedor perfil mix canais migration contract', () => {
  test('adiciona percentuais manuais opcionais por canal do funil', () => {
    const sql = readMigration()

    expect(sql).toContain('ADD COLUMN IF NOT EXISTS mix_canal_internet_pct numeric(5,2)')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS mix_canal_carteira_pct numeric(5,2)')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS mix_canal_porta_pct numeric(5,2)')
  })

  test('limita cada percentual entre 0 e 100 sem exigir soma exata', () => {
    const sql = readMigration()

    expect(sql).toContain('vendedor_perfil_mix_canal_internet_pct_range')
    expect(sql).toContain('mix_canal_internet_pct >= 0 AND mix_canal_internet_pct <= 100')
    expect(sql).toContain('vendedor_perfil_mix_canal_carteira_pct_range')
    expect(sql).toContain('mix_canal_carteira_pct >= 0 AND mix_canal_carteira_pct <= 100')
    expect(sql).toContain('vendedor_perfil_mix_canal_porta_pct_range')
    expect(sql).toContain('mix_canal_porta_pct >= 0 AND mix_canal_porta_pct <= 100')
    expect(sql).not.toContain('mix_canal_internet_pct + mix_canal_carteira_pct + mix_canal_porta_pct')
  })
})
