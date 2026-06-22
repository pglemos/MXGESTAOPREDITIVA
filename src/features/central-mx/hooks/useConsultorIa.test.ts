import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { scopeToDb } from '@/features/dashboard-loja/lib/scopeType'

const hookSource = readFileSync(new URL('./useConsultorIa.ts', import.meta.url), 'utf8')

describe('useConsultorIa scope contract', () => {
  test('uses the canonical score scope enum when querying store suggestions', () => {
    expect(scopeToDb('loja')).toBe('store')
    expect(hookSource).toContain(".eq('scope_type', CONSULTOR_IA_STORE_SCOPE_TYPE)")
    expect(hookSource).not.toContain(".eq('scope_type', 'loja')")
  })

  test('uses the rules-based RPC when generating suggestions', () => {
    expect(hookSource).toContain("supabase.rpc('consultor_ia_sugerir_acao'")
    expect(hookSource).toContain('p_store_id: storeId')
    expect(hookSource).toContain('p_period: period ?? null')
  })
})
