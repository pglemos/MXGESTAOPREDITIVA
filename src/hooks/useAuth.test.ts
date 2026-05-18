import { describe, expect, it } from 'bun:test'
import { pickSimulationStore } from './useAuth'
import type { Store } from '@/types/database'

const baseStore: Store = {
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

describe('pickSimulationStore', () => {
  it('uses the active preferred store when available', () => {
    expect(pickSimulationStore([
      baseStore,
      { ...baseStore, id: 'store-2', name: 'Loja B' },
    ], 'store-2')?.id).toBe('store-2')
  })

  it('falls back to the MX sandbox store for direct simulation links', () => {
    expect(pickSimulationStore([
      baseStore,
      { ...baseStore, id: 'sandbox', name: 'MX CONSULTORIA' },
    ])?.id).toBe('sandbox')
  })

  it('falls back to the first active store when no sandbox is present', () => {
    expect(pickSimulationStore([
      { ...baseStore, id: 'inactive', active: false },
      { ...baseStore, id: 'active' },
    ])?.id).toBe('active')
  })
})
