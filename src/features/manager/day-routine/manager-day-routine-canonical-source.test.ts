import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const containerSource = readFileSync(
  new URL('./ManagerDayRoutine.container.tsx', import.meta.url),
  'utf8',
)

describe('ManagerDayRoutine canonical sources', () => {
  test('uses the canonical correction requests instead of the legacy regularization table', () => {
    expect(containerSource).toContain(".from('solicitacoes_correcao_lancamento')")
    expect(containerSource).not.toContain(".from('regularizacao_fechamento')")
  })

  test('uses the explicit D+1 confirmation taxonomy instead of attendance status', () => {
    expect(containerSource).toContain(".select('id,confirmation_status')")
    expect(containerSource).toContain('status: row.confirmation_status')
  })

  test('refreshes persisted automatic manager tasks through the canonical RPC', () => {
    expect(containerSource).toContain("supabase.rpc('refresh_manager_daily_tasks'")
    expect(containerSource).toContain('p_manager_user_id: profile.id')
    expect(containerSource).toContain('p_store_id: storeId')
  })
})
