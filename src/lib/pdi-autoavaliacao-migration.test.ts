import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260616234000_pdi_autoavaliacao_autonomo.sql', import.meta.url)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('PDI autoavaliacao migration contract', () => {
  test('registra origem da nota em avaliacoes de competencia', () => {
    const sql = readMigration()

    expect(sql).toContain('ADD COLUMN IF NOT EXISTS origem_nota text NOT NULL DEFAULT \'gestor\'')
    expect(sql).toContain('pdi_avaliacoes_competencia_origem_nota_check')
    expect(sql).toContain("origem_nota IN ('gestor', 'autoavaliacao')")
  })

  test('atualiza RPC para aceitar autoavaliacao sem metas/plano e sem loja', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.create_pdi_session_bundle(p_payload jsonb)')
    expect(sql).toContain("NULLIF(p_payload->>'loja_id', '')::UUID")
    expect(sql).toContain("jsonb_array_elements(COALESCE(p_payload->'metas', '[]'::jsonb))")
    expect(sql).toContain("jsonb_array_elements(COALESCE(p_payload->'plano_acao', '[]'::jsonb))")
    expect(sql).toContain("COALESCE(v_avaliacao->>'origem_nota', 'gestor')")
  })
})
