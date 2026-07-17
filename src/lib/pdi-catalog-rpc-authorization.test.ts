import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717295000_harden_pdi_catalog_rpcs.sql', import.meta.url),
  'utf8',
)
const compactSql = sql.replace(/\s+/g, ' ').trim()

function extractFunction(name: string) {
  const marker = `CREATE OR REPLACE FUNCTION public.${name}`
  const start = compactSql.indexOf(marker)
  expect(start).toBeGreaterThanOrEqual(0)

  const next = compactSql.indexOf('CREATE OR REPLACE FUNCTION public.', start + marker.length)
  return compactSql.slice(start, next === -1 ? compactSql.length : next)
}

const catalogSignatures = [
  'public.get_pdi_form_template(uuid)',
  'public.get_suggested_actions(uuid)',
]
const helperSignatures = [
  'public.mx_development_theme_from_text(text)',
  'public.mx_first_active_training_for_theme(text,uuid)',
]

describe('PDI catalog RPC authorization migration', () => {
  test('requires identity or service role in both frontend catalog RPCs', () => {
    for (const name of ['get_pdi_form_template(', 'get_suggested_actions(']) {
      const body = extractFunction(name)
      expect(body).toContain('v_caller uuid := auth.uid()')
      expect(body).toContain("v_is_service_role boolean := auth.role() = 'service_role'")
      expect(body).toContain("RAISE EXCEPTION 'Sessao invalida.' USING ERRCODE = '42501'")
      expect(body).toContain("SECURITY DEFINER SET search_path TO 'public'")
    }
  })

  test('preserves the PDI template response shape and ordering', () => {
    const body = extractFunction('get_pdi_form_template(')

    expect(body).toContain("'escala', COALESCE(v_escala, '[]'::jsonb)")
    expect(body).toContain("'competencias', COALESCE(v_competencias, '[]'::jsonb)")
    expect(body).toContain("'frases', COALESCE(v_frases, '[]'::jsonb)")
    expect(body).toContain('ORDER BY nota ASC')
    expect(body).toContain('ORDER BY tipo DESC, ordem ASC')
    expect(body).toContain("RAISE EXCEPTION 'Cargo do PDI nao localizado.'")
  })

  test('preserves suggested action keys and deterministic ordering', () => {
    const body = extractFunction('get_suggested_actions(')

    expect(body).toContain("'id', id")
    expect(body).toContain("'descricao_acao', descricao_acao")
    expect(body).toContain('WHERE competencia_id = p_competencia_id')
    expect(body).toContain('ORDER BY id ASC')
    expect(body).toContain("RETURN COALESCE(v_actions, '[]'::jsonb)")
  })

  test('removes anonymous execution while preserving authenticated catalog access', () => {
    for (const signature of catalogSignatures) {
      expect(compactSql).toContain(
        `REVOKE ALL ON FUNCTION ${signature} FROM PUBLIC, anon, authenticated, service_role`,
      )
      expect(compactSql).toContain(
        `GRANT EXECUTE ON FUNCTION ${signature} TO authenticated, service_role`,
      )
    }
  })

  test('makes helper functions internal to protected database flows', () => {
    for (const signature of helperSignatures) {
      expect(compactSql).toContain(
        `REVOKE ALL ON FUNCTION ${signature} FROM PUBLIC, anon, authenticated, service_role`,
      )
      expect(compactSql).toContain(`GRANT EXECUTE ON FUNCTION ${signature} TO service_role`)
      expect(compactSql).not.toContain(
        `GRANT EXECUTE ON FUNCTION ${signature} TO authenticated`,
      )
    }
  })

  test('uses one transaction and documents rollback', () => {
    expect(compactSql.startsWith('BEGIN;')).toBe(true)
    expect(compactSql).toContain('-- DOWN')
    expect(compactSql.endsWith('COMMIT;')).toBe(true)
  })
})
