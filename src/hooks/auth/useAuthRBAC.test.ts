/**
 * useAuthRBAC — cobertura da derivação de effectiveRole/effectiveStoreId e do
 * fluxo de simulação de papel (startSimulation/stopSimulation).
 *
 * Antes deste arquivo o hook não tinha nenhum teste unitário direto — só
 * verificação de que o módulo exporta uma função (`useAuth.spec.ts`). Como
 * `effectiveRole`/`effectiveStoreId` decidem qual identidade e loja o app
 * inteiro usa, uma regressão silenciosa aqui vaza dado entre perfis.
 *
 * IMPORTANTE: `profile`, `vinculos_loja` e `setActiveStoreId` precisam ser
 * referências ESTÁVEIS entre renders (const fora do callback do renderHook).
 * O hook tem um useEffect que depende de `profile`/`setActiveStoreId`; se
 * essas referências mudarem a cada render (ex.: objeto/array/arrow-function
 * criado inline dentro do callback), o efeito re-executa a cada render,
 * chama os setters de simulação com valores "iguais mas em nova referência"
 * (ex.: `setSimulationMemberships([])`), React não bail-out por identidade,
 * e o teste entra em loop infinito de render.
 */
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { User as AppUser, Store } from '@/types/database'
import type { StoreMembership } from './authTypes'

type QueryResponse<T> = { data: T | null; error: { message: string } | null }

let lojasResponse: QueryResponse<unknown[]> = { data: [], error: null }
let vinculosResponse: QueryResponse<unknown[]> = { data: [], error: null }

function makeBuilder(response: QueryResponse<unknown>) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    then: (resolve: (v: QueryResponse<unknown>) => void, reject: (e: unknown) => void) =>
      Promise.resolve(response).then(resolve, reject),
  }
  return builder
}

mock.module('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'lojas') return makeBuilder(lojasResponse)
      if (table === 'vinculos_loja') return makeBuilder(vinculosResponse)
      return makeBuilder({ data: [], error: null })
    },
  },
}))

const { useAuthRBAC } = await import('./useAuthRBAC')

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

function makeProfile(overrides: Partial<AppUser> = {}): AppUser {
  return {
    id: 'user-1',
    name: 'Ana',
    email: 'ana@mx.com',
    role: 'administrador_mx',
    avatar_url: null,
    is_venda_loja: false,
    active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeMembership(overrides: Partial<StoreMembership> = {}): StoreMembership {
  return {
    id: 'membership-1',
    user_id: 'user-1',
    store_id: 'store-1',
    role: 'gerente',
    created_at: '2026-01-01T00:00:00.000Z',
    is_active: true,
    store: baseStore,
    ...overrides,
  } as StoreMembership
}

const EMPTY_MEMBERSHIPS: StoreMembership[] = []
const noop = () => {}

beforeEach(() => {
  lojasResponse = { data: [], error: null }
  vinculosResponse = { data: [], error: null }
  window.sessionStorage.clear()
})

describe('useAuthRBAC — derivação de baseRole/canSimulate', () => {
  it('deriva baseRole via normalizeRole a partir do profile', () => {
    const profile = makeProfile({ role: 'gerente' })
    const { result } = renderHook(() =>
      useAuthRBAC({
        profile,
        vinculos_loja: EMPTY_MEMBERSHIPS,
        activeStoreId: null,
        setActiveStoreId: noop,
        loading: false,
      }),
    )
    expect(result.current.baseRole).toBe('gerente')
  })

  it('baseRole é null quando não há profile', () => {
    const { result } = renderHook(() =>
      useAuthRBAC({
        profile: null,
        vinculos_loja: EMPTY_MEMBERSHIPS,
        activeStoreId: null,
        setActiveStoreId: noop,
        loading: false,
      }),
    )
    expect(result.current.baseRole).toBeNull()
  })

  it('canSimulate é true só para perfis internos MX (administrador/consultor), não para dono/gerente/vendedor', () => {
    const internalProfile = makeProfile({ role: 'administrador_mx' })
    const internal = renderHook(() =>
      useAuthRBAC({
        profile: internalProfile,
        vinculos_loja: EMPTY_MEMBERSHIPS,
        activeStoreId: null,
        setActiveStoreId: noop,
        loading: false,
      }),
    )
    expect(internal.result.current.canSimulate).toBe(true)

    const donoProfile = makeProfile({ role: 'dono' })
    const notInternal = renderHook(() =>
      useAuthRBAC({
        profile: donoProfile,
        vinculos_loja: EMPTY_MEMBERSHIPS,
        activeStoreId: null,
        setActiveStoreId: noop,
        loading: false,
      }),
    )
    expect(notInternal.result.current.canSimulate).toBe(false)
  })

  it('baseMembership prioriza o vínculo do activeStoreId sobre o primeiro da lista', () => {
    const profile = makeProfile()
    const memberships = [
      makeMembership({ id: 'm1', store_id: 'store-1' }),
      makeMembership({ id: 'm2', store_id: 'store-2' }),
    ]
    const { result } = renderHook(() =>
      useAuthRBAC({
        profile,
        vinculos_loja: memberships,
        activeStoreId: 'store-2',
        setActiveStoreId: noop,
        loading: false,
      }),
    )
    expect(result.current.baseMembership?.id).toBe('m2')
  })
})

describe('useAuthRBAC — effectiveRole/effectiveStoreId sem simulação', () => {
  it('espelham baseRole/profile quando não há simulação ativa', () => {
    const profile = makeProfile({ role: 'dono' })
    const { result } = renderHook(() =>
      useAuthRBAC({
        profile,
        vinculos_loja: EMPTY_MEMBERSHIPS,
        activeStoreId: null,
        setActiveStoreId: noop,
        loading: false,
      }),
    )
    expect(result.current.isSimulating).toBe(false)
    expect(result.current.effectiveRole).toBe('dono')
    expect(result.current.effectiveProfile).toBe(profile)
  })

  it('effectiveStoreId cai para o store_id do profile quando o perfil NÃO é interno MX e não há membership', () => {
    const profile = makeProfile({ role: 'vendedor', store_id: 'store-9' })
    const { result } = renderHook(() =>
      useAuthRBAC({
        profile,
        vinculos_loja: EMPTY_MEMBERSHIPS,
        activeStoreId: null,
        setActiveStoreId: noop,
        loading: false,
      }),
    )
    expect(result.current.effectiveStoreId).toBe('store-9')
  })

  it('effectiveStoreId fica null quando o perfil É interno MX, sem membership nem activeStoreId (não cai pro profile.store_id)', () => {
    const profile = makeProfile({ role: 'administrador_mx', store_id: 'store-9' })
    const { result } = renderHook(() =>
      useAuthRBAC({
        profile,
        vinculos_loja: EMPTY_MEMBERSHIPS,
        activeStoreId: null,
        setActiveStoreId: noop,
        loading: false,
      }),
    )
    expect(result.current.effectiveStoreId).toBeNull()
  })

  it('effectiveStoreId usa activeStoreId quando presente, mesmo pra perfil interno MX', () => {
    const profile = makeProfile({ role: 'administrador_mx' })
    const { result } = renderHook(() =>
      useAuthRBAC({
        profile,
        vinculos_loja: EMPTY_MEMBERSHIPS,
        activeStoreId: 'store-7',
        setActiveStoreId: noop,
        loading: false,
      }),
    )
    expect(result.current.effectiveStoreId).toBe('store-7')
  })
})

describe('useAuthRBAC — startSimulation/stopSimulation', () => {
  it('startSimulation não faz nada quando canSimulate é false (perfil não-interno)', () => {
    const profile = makeProfile({ role: 'gerente' })
    const { result } = renderHook(() =>
      useAuthRBAC({
        profile,
        vinculos_loja: EMPTY_MEMBERSHIPS,
        activeStoreId: null,
        setActiveStoreId: noop,
        loading: false,
      }),
    )

    act(() => {
      result.current.startSimulation('vendedor')
    })

    expect(result.current.simulationRole).toBeNull()
    expect(result.current.isSimulating).toBe(false)
    expect(window.sessionStorage.getItem('mx_role_simulation')).toBeNull()
  })

  it('startSimulation com sucesso: seleciona loja/membership e ativa effectiveRole simulado', async () => {
    lojasResponse = { data: [baseStore], error: null }
    const simulatedUser = makeProfile({ id: 'seller-1', role: 'vendedor', is_venda_loja: false })
    vinculosResponse = {
      data: [
        {
          id: 'mem-sim',
          user_id: 'seller-1',
          store_id: 'store-1',
          role: 'vendedor',
          created_at: '2026-01-01T00:00:00.000Z',
          store: baseStore,
          users: simulatedUser,
        },
      ],
      error: null,
    }
    const profile = makeProfile({ role: 'administrador_mx' })
    const setActiveStoreId = mock(() => {})
    const { result } = renderHook(() =>
      useAuthRBAC({
        profile,
        vinculos_loja: EMPTY_MEMBERSHIPS,
        activeStoreId: null,
        setActiveStoreId,
        loading: false,
      }),
    )

    act(() => {
      result.current.startSimulation('vendedor')
    })

    await waitFor(() => expect(result.current.isSimulating).toBe(true))

    expect(result.current.effectiveRole).toBe('vendedor')
    expect(result.current.effectiveProfile?.id).toBe('seller-1')
    expect(result.current.effectiveMembership?.store_id).toBe('store-1')
    expect(setActiveStoreId).toHaveBeenCalledWith('store-1')
    expect(window.sessionStorage.getItem('mx_role_simulation')).toBe('vendedor')
  })

  it('startSimulation sem usuário ativo pra simular: falha e reverte (stopSimulation interno)', async () => {
    lojasResponse = { data: [baseStore], error: null }
    vinculosResponse = { data: [], error: null }
    const profile = makeProfile({ role: 'administrador_mx' })
    const { result } = renderHook(() =>
      useAuthRBAC({
        profile,
        vinculos_loja: EMPTY_MEMBERSHIPS,
        activeStoreId: null,
        setActiveStoreId: noop,
        loading: false,
      }),
    )

    act(() => {
      result.current.startSimulation('vendedor')
    })

    await waitFor(() => expect(result.current.simulationRole).toBeNull())
    expect(result.current.isSimulating).toBe(false)
    expect(window.sessionStorage.getItem('mx_role_simulation')).toBeNull()
  })

  it('startSimulation com erro na busca de lojas: falha e reverte (stopSimulation interno)', async () => {
    lojasResponse = { data: null, error: { message: 'network down' } }
    const profile = makeProfile({ role: 'administrador_mx' })
    const { result } = renderHook(() =>
      useAuthRBAC({
        profile,
        vinculos_loja: EMPTY_MEMBERSHIPS,
        activeStoreId: null,
        setActiveStoreId: noop,
        loading: false,
      }),
    )

    act(() => {
      result.current.startSimulation('vendedor')
    })

    await waitFor(() => expect(result.current.simulationRole).toBeNull())
    expect(result.current.isSimulating).toBe(false)
  })

  it('stopSimulation limpa o estado e o sessionStorage', async () => {
    lojasResponse = { data: [baseStore], error: null }
    const simulatedUser = makeProfile({ id: 'seller-1', role: 'vendedor' })
    vinculosResponse = {
      data: [
        {
          id: 'mem-sim',
          user_id: 'seller-1',
          store_id: 'store-1',
          role: 'vendedor',
          created_at: '2026-01-01T00:00:00.000Z',
          store: baseStore,
          users: simulatedUser,
        },
      ],
      error: null,
    }
    const profile = makeProfile({ role: 'administrador_mx' })
    const { result } = renderHook(() =>
      useAuthRBAC({
        profile,
        vinculos_loja: EMPTY_MEMBERSHIPS,
        activeStoreId: null,
        setActiveStoreId: noop,
        loading: false,
      }),
    )

    act(() => {
      result.current.startSimulation('vendedor')
    })
    await waitFor(() => expect(result.current.isSimulating).toBe(true))

    act(() => {
      result.current.stopSimulation()
    })

    expect(result.current.isSimulating).toBe(false)
    expect(result.current.simulationRole).toBeNull()
    expect(result.current.effectiveRole).toBe('administrador_mx')
    expect(window.sessionStorage.getItem('mx_role_simulation')).toBeNull()
  })
})
