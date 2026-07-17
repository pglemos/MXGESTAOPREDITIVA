import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717292000_harden_pdi_development_recommendations.sql', import.meta.url),
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

const generatorSignatures = [
  'public.gerar_recomendacoes_desenvolvimento_feedback(uuid)',
  'public.gerar_recomendacoes_desenvolvimento_pdi(uuid)',
]
const allSignatures = [
  ...generatorSignatures,
  'public.get_pdi_print_bundle(uuid)',
]

describe('PDI development recommendation authorization migration', () => {
  test('requires identity or explicit service-role handling in every sensitive RPC', () => {
    for (const functionName of [
      'gerar_recomendacoes_desenvolvimento_feedback(',
      'gerar_recomendacoes_desenvolvimento_pdi(',
      'get_pdi_print_bundle(',
    ]) {
      const body = extractFunction(functionName)
      expect(body).toContain("v_caller uuid := auth.uid()")
      expect(body).toContain("v_is_service_role boolean := auth.role() = 'service_role'")
      expect(body).toContain("RAISE EXCEPTION 'Sessao invalida.' USING ERRCODE = '42501'")
      expect(body).toContain("SECURITY DEFINER SET search_path TO 'public'")
    }
  })

  test('binds feedback generation to source and store management scope', () => {
    const body = extractFunction('gerar_recomendacoes_desenvolvimento_feedback(')

    expect(body).toContain('v_feedback.manager_id = v_caller')
    expect(body).toContain('public.eh_area_interna_mx(v_caller)')
    expect(body).toContain('public.is_manager_of(v_feedback.store_id)')
    expect(body).toContain('public.is_owner_of(v_feedback.store_id)')
    expect(body).toContain("public.tem_papel_loja(v_feedback.store_id, ARRAY['vendedor'], v_feedback.seller_id)")
    expect(body).toContain("RAISE EXCEPTION 'Sem permissao para gerar recomendacoes deste feedback.' USING ERRCODE = '42501'")
  })

  test('binds PDI generation to the assigned manager and store management scope', () => {
    const body = extractFunction('gerar_recomendacoes_desenvolvimento_pdi(')

    expect(body).toContain('v_sessao.gerente_id = v_caller')
    expect(body).toContain('public.eh_area_interna_mx(v_caller)')
    expect(body).toContain('public.is_manager_of(v_sessao.loja_id)')
    expect(body).toContain('public.is_owner_of(v_sessao.loja_id)')
    expect(body).toContain("public.tem_papel_loja(v_sessao.loja_id, ARRAY['vendedor'], v_sessao.colaborador_id)")
    expect(body).toContain("RAISE EXCEPTION 'Sem permissao para gerar recomendacoes deste PDI.' USING ERRCODE = '42501'")
  })

  test('serializes generation and enforces durable source idempotency', () => {
    const feedback = extractFunction('gerar_recomendacoes_desenvolvimento_feedback(')
    const pdi = extractFunction('gerar_recomendacoes_desenvolvimento_pdi(')

    for (const body of [feedback, pdi]) {
      const lock = body.indexOf('PERFORM pg_advisory_xact_lock(v_generation_lock_key)')
      expect(lock).toBeGreaterThanOrEqual(0)
      expect(body.indexOf('INSERT INTO public.recomendacoes_desenvolvimento')).toBeGreaterThan(lock)
    }

    expect(compactSql).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS recomendacoes_desenvolvimento_feedback_source_uidx ON public.recomendacoes_desenvolvimento (source_type, source_id) WHERE source_type = 'feedback' AND source_id IS NOT NULL",
    )
    expect(compactSql).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS recomendacoes_desenvolvimento_pdi_reason_uidx ON public.recomendacoes_desenvolvimento (source_type, source_id, reason) WHERE source_type = 'pdi' AND source_id IS NOT NULL",
    )
    expect(feedback).toContain("ON CONFLICT (source_type, source_id) WHERE source_type = 'feedback' AND source_id IS NOT NULL")
    expect(pdi).toContain("ON CONFLICT (source_type, source_id, reason) WHERE source_type = 'pdi' AND source_id IS NOT NULL")
  })

  test('derives creator identity and preserves progressed recommendations', () => {
    const feedback = extractFunction('gerar_recomendacoes_desenvolvimento_feedback(')
    const pdi = extractFunction('gerar_recomendacoes_desenvolvimento_pdi(')

    expect(feedback).toContain('v_effective_creator := COALESCE(v_caller, v_feedback.manager_id)')
    expect(pdi).toContain('v_effective_creator := COALESCE(v_caller, v_sessao.gerente_id)')
    for (const body of [feedback, pdi]) {
      expect(body).toContain("WHERE public.recomendacoes_desenvolvimento.status = 'recommended'")
      expect(body).toContain('created_by = v_effective_creator')
    }
  })

  test('records auditable generation attempts', () => {
    for (const functionName of [
      'gerar_recomendacoes_desenvolvimento_feedback(',
      'gerar_recomendacoes_desenvolvimento_pdi(',
    ]) {
      const body = extractFunction(functionName)
      expect(body).toContain('INSERT INTO public.logs_auditoria')
      expect(body).toContain("'generate_development_recommendations'")
      expect(body).toContain("'recomendacoes_desenvolvimento'")
      expect(body).toContain("'affected_count', v_count")
    }
  })

  test('keeps the PDI print bundle private while preserving authorized access', () => {
    const body = extractFunction('get_pdi_print_bundle(')

    expect(body).toContain('v_is_service_role OR public.eh_area_interna_mx(v_caller)')
    expect(body).toContain('public.is_owner_of(s.loja_id)')
    expect(body).toContain('public.is_manager_of(s.loja_id)')
    expect(body).toContain('s.colaborador_id = v_caller')
    expect(body).toContain('s.gerente_id = v_caller')
    expect(body).toContain("RAISE EXCEPTION 'Sessao nao encontrada ou sem acesso.' USING ERRCODE = '42501'")
  })

  test('removes anonymous execution while preserving authenticated and service entry points', () => {
    for (const signature of allSignatures) {
      expect(compactSql).toContain(`REVOKE ALL ON FUNCTION ${signature} FROM PUBLIC, anon, authenticated, service_role`)
      expect(compactSql).toContain(`GRANT EXECUTE ON FUNCTION ${signature} TO authenticated, service_role`)
    }
  })

  test('uses one transaction and documents rollback', () => {
    expect(compactSql.startsWith('BEGIN;')).toBe(true)
    expect(compactSql).toContain('-- DOWN')
    expect(compactSql.endsWith('COMMIT;')).toBe(true)
  })
})
