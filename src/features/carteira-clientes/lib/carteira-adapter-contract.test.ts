import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test'
import { SELLER_SIMULATION_CONTEXT_KEY } from '@/lib/auth/simulationContext'

let authenticatedUserId: string | null = null

mock.module('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: mock(() => ({ data: { subscription: { unsubscribe: () => {} } } })),
      getUser: mock(async () => ({ data: { user: authenticatedUserId ? { id: authenticatedUserId } : null } })),
    },
  },
}))

const {
  installCarteiraBase44Adapter,
  resolveCarteiraExecutionContext,
} = await import('./installCarteiraBase44Adapter')

afterAll(() => mock.restore())

beforeEach(() => {
  authenticatedUserId = null
  window.sessionStorage.clear()
})

describe('carteira Base44 adapter contract', () => {
  test('installs the real vehicle-arrival entity required by Plano de Ataque', () => {
    const base44 = { entities: {} } as {
      entities: Record<string, { filter?: unknown; create?: unknown }>
    }

    installCarteiraBase44Adapter(base44)

    expect(typeof base44.entities.VeiculoChegado?.filter).toBe('function')
    expect(typeof base44.entities.VeiculoChegado?.create).toBe('function')
  })

  test('resolves the simulated seller instead of persisting as the authenticated admin', async () => {
    authenticatedUserId = 'admin-1'
    window.sessionStorage.setItem(SELLER_SIMULATION_CONTEXT_KEY, JSON.stringify({
      role: 'vendedor',
      userId: 'seller-1',
      storeId: 'store-1',
    }))

    await expect(resolveCarteiraExecutionContext()).resolves.toEqual({
      authenticatedUserId: 'admin-1',
      sellerUserId: 'seller-1',
      storeId: 'store-1',
      isSimulation: true,
    })
  })

  test('keeps the authenticated seller context when there is no simulation', async () => {
    authenticatedUserId = 'seller-real'

    await expect(resolveCarteiraExecutionContext()).resolves.toEqual({
      authenticatedUserId: 'seller-real',
      sellerUserId: 'seller-real',
      storeId: null,
      isSimulation: false,
    })
  })
})
