import { describe, expect, test } from 'bun:test'
import { resolveStoreId } from './resolveStoreId'

function fakeSupabase(rows: Array<{ store_id: string }>) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: () => Promise.resolve({ data: rows, error: null }),
          }),
        }),
      }),
    }),
  } as any
}

describe('resolveStoreId', () => {
  test('retorna o store_id do vínculo ativo', async () => {
    const client = fakeSupabase([{ store_id: 'loja-123' }])
    const result = await resolveStoreId(client, 'vendedor-1')
    expect(result).toBe('loja-123')
  })

  test('retorna null quando vendedor não tem vínculo ativo', async () => {
    const client = fakeSupabase([])
    const result = await resolveStoreId(client, 'vendedor-1')
    expect(result).toBeNull()
  })
})
