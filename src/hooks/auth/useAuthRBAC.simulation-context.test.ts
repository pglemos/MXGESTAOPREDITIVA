import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { act, renderHook, waitFor } from '@testing-library/react'
import { SELLER_SIMULATION_CONTEXT_KEY } from '@/lib/auth/simulationContext'
import type { User as AppUser, Store } from '@/types/database'

const store: Store = {
  id: 'store-1',
  name: 'Loja A',
  manager_email: null,
  legal_name: null,
  cnpj: null,
  address: null,
  administrative_phone: null,
  partners: null,
  active: true,
  source_mode: 'hybrid',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const adminProfile: AppUser = {
  id: 'admin-1',
  name: 'Admin MX',
  email: 'admin@mx.com',
  role: 'administrador_mx',
  avatar_url: null,
  is_venda_loja: false,
  active: true,
  created_at: '2026-01-01T00:00:00.000Z',
}

const sellerProfile: AppUser = {
  ...adminProfile,
  id: 'seller-1',
  name: 'Vendedor Simulado',
  email: 'seller@mx.com',
  role: 'vendedor',
}

function makeBuilder(data: unknown[]) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    then: (resolve: (value: { data: unknown[]; error: null }) => void) =>
      Promise.resolve({ data, error: null }).then(resolve),
  }
  return builder
}

mock.module('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'lojas') return makeBuilder([store])
      if (table === 'vinculos_loja') return makeBuilder([{
        id: 'membership-1',
        user_id: 'seller-1',
        store_id: 'store-1',
        role: 'vendedor',
        created_at: '2026-01-01T00:00:00.000Z',
        store,
        users: sellerProfile,
      }])
      return makeBuilder([])
    },
  },
}))

const { useAuthRBAC } = await import('./useAuthRBAC')

beforeEach(() => {
  window.sessionStorage.clear()
})

describe('useAuthRBAC simulation execution context', () => {
  test('publishes and clears the effective seller identity', async () => {
    const setActiveStoreId = mock(() => {})
    const { result } = renderHook(() => useAuthRBAC({
      profile: adminProfile,
      vinculos_loja: [],
      activeStoreId: null,
      setActiveStoreId,
      loading: false,
    }))

    act(() => result.current.startSimulation('vendedor'))
    await waitFor(() => expect(result.current.isSimulating).toBe(true))

    expect(JSON.parse(window.sessionStorage.getItem(SELLER_SIMULATION_CONTEXT_KEY) || 'null')).toEqual({
      role: 'vendedor',
      userId: 'seller-1',
      storeId: 'store-1',
    })

    act(() => result.current.stopSimulation())
    expect(window.sessionStorage.getItem(SELLER_SIMULATION_CONTEXT_KEY)).toBeNull()
  })
})
