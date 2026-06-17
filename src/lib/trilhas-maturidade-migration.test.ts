import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260616192000_trilhas_maturidade_vendedor.sql', import.meta.url)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('trilhas de maturidade migration contract', () => {
  test('permite track types N1-N4 mantendo os tipos existentes', () => {
    const sql = readMigration()

    expect(sql).toContain('trilhas_desenvolvimento_track_type_check')
    expect(sql).toContain("'novo_colaborador'")
    expect(sql).toContain("'reciclagem'")
    expect(sql).toContain("'institucional'")
    expect(sql).toContain("'maturidade_n1'")
    expect(sql).toContain("'maturidade_n2'")
    expect(sql).toContain("'maturidade_n3'")
    expect(sql).toContain("'maturidade_n4'")
  })

  test('semeia trilhas globais ativas com etapas obrigatorias por maturidade', () => {
    const sql = readMigration()

    expect(sql).toContain('Trilha MX - N1 Iniciante')
    expect(sql).toContain('Trilha MX - N2 Intermediario')
    expect(sql).toContain('Trilha MX - N3 Performance')
    expect(sql).toContain('Trilha MX - N4 Alta Performance')
    expect(sql).toContain('n1_rotina')
    expect(sql).toContain('n2_funil')
    expect(sql).toContain('n3_fechamento')
    expect(sql).toContain('n4_recorrencia')
    expect(sql).toContain('required')
  })

  test('declara RPC idempotente alinhada a regra de maturidade', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.resolve_vendedor_maturidade_track_type')
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.atribuir_trilha_maturidade_vendedor')
    expect(sql).toContain('SECURITY DEFINER')
    expect(sql).toContain('public.inicializar_progresso_trilha')
    expect(sql).toContain("public.resolve_vendedor_maturidade_track_type(v_tempo_mercado_anos, v_experiencia, v_cargo_atual)")
    expect(sql).toContain("WHEN v_score >= 4 THEN 'maturidade_n4'")
    expect(sql).toContain("WHEN v_score >= 3 THEN 'maturidade_n3'")
    expect(sql).toContain("WHEN v_score >= 2 THEN 'maturidade_n2'")
    expect(sql).toContain("ELSE 'maturidade_n1'")
  })
})
