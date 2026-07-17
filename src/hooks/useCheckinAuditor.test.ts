import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

// MX-22.3 (GAP 2/AC-3): fetchOwnRequests é o viabilizador técnico do
// Histórico do vendedor — lê as PRÓPRIAS solicitações (todos os status),
// diferente de fetchPendingRequests (escopo gestor/loja, só 'pending').
// Teste via contrato de código-fonte, mesmo padrão de CheckinForm.test.ts/
// CheckinHeader.test.ts: mockar supabase para um render-hook completo se
// mostrou frágil neste projeto quando a suíte inteira roda junto.
const source = readFileSync(new URL('./useCheckinAuditor.ts', import.meta.url), 'utf8')

describe('useCheckinAuditor — fetchOwnRequests (MX-22.3)', () => {
  test('existe e é exportado pelo hook', () => {
    expect(source).toContain('const fetchOwnRequests = useCallback(')
    expect(source).toMatch(/return \{[^}]*fetchOwnRequests[^}]*\}/)
  })

  test('filtra pelo seller_id do próprio usuário logado (RLS seller_id = auth.uid()), não pelo storeId da loja', () => {
    expect(source).toContain("eq('seller_id', profile.id)")
  })

  test('não restringe a status=pending — diferente de fetchPendingRequests (escopo gestor)', () => {
    const fetchOwnBlock = source.slice(source.indexOf('const fetchOwnRequests'))
    expect(fetchOwnBlock).not.toContain("eq('status', 'pending')")
  })
})

describe('useCheckinAuditor — fetchStoreRequests (MX-22.5)', () => {
  test('existe e é exportado pelo hook', () => {
    expect(source).toContain('const fetchStoreRequests = useCallback(')
    expect(source).toMatch(/return \{[^}]*fetchStoreRequests[^}]*\}/)
  })

  test('filtra pelo storeId (escopo gestor/loja), sem restringir status — RLS já cobre todos os status para manager/owner', () => {
    const block = source.slice(
      source.indexOf('const fetchStoreRequests'),
      source.indexOf('const fetchOwnRequests'),
    )
    expect(block).toContain("eq('store_id', storeId)")
    expect(block).not.toContain("eq('status', 'pending')")
  })
})
