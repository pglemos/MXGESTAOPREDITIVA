import { beforeEach, describe, expect, it } from 'bun:test'
import {
  SELLER_SIMULATION_CONTEXT_KEY,
  clearSimulationContext,
  readSimulationContext,
  writeSimulationContext,
  type SimulationExecutionContext,
} from './simulationContext'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

const validContext: SimulationExecutionContext = {
  role: 'vendedor',
  userId: 'seller-1',
  storeId: 'store-1',
}

let storage: MemoryStorage

beforeEach(() => {
  storage = new MemoryStorage()
})

describe('simulation execution context', () => {
  it('persiste e recupera a identidade efetiva do vendedor simulado', () => {
    writeSimulationContext(validContext, storage)

    expect(readSimulationContext(storage)).toEqual(validContext)
    expect(storage.getItem(SELLER_SIMULATION_CONTEXT_KEY)).not.toBeNull()
  })

  it('rejeita conteúdo inválido ou contexto que não seja de vendedor', () => {
    storage.setItem(SELLER_SIMULATION_CONTEXT_KEY, '{json quebrado')
    expect(readSimulationContext(storage)).toBeNull()

    storage.setItem(SELLER_SIMULATION_CONTEXT_KEY, JSON.stringify({
      role: 'gerente',
      userId: 'manager-1',
      storeId: 'store-1',
    }))
    expect(readSimulationContext(storage)).toBeNull()

    storage.setItem(SELLER_SIMULATION_CONTEXT_KEY, JSON.stringify({
      role: 'vendedor',
      userId: '',
      storeId: 'store-1',
    }))
    expect(readSimulationContext(storage)).toBeNull()
  })

  it('remove o contexto ao encerrar a simulação', () => {
    writeSimulationContext(validContext, storage)
    clearSimulationContext(storage)

    expect(readSimulationContext(storage)).toBeNull()
    expect(storage.getItem(SELLER_SIMULATION_CONTEXT_KEY)).toBeNull()
  })
})
