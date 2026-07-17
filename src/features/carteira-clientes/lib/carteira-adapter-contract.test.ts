import { afterAll, describe, expect, mock, test } from 'bun:test'

mock.module('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: mock(() => ({ data: { subscription: { unsubscribe: () => {} } } })),
      getUser: mock(async () => ({ data: { user: null } })),
    },
  },
}))

const { installCarteiraBase44Adapter } = await import('./installCarteiraBase44Adapter')

afterAll(() => mock.restore())

describe('carteira Base44 adapter contract', () => {
  test('installs the real vehicle-arrival entity required by Plano de Ataque', () => {
    const base44 = { entities: {} } as {
      entities: Record<string, { filter?: unknown; create?: unknown }>
    }

    installCarteiraBase44Adapter(base44)

    expect(typeof base44.entities.VeiculoChegado?.filter).toBe('function')
    expect(typeof base44.entities.VeiculoChegado?.create).toBe('function')
  })
})
