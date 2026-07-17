import { describe, expect, test } from 'bun:test'
import {
  consumeWhatsappReturn,
  saveWhatsappDeparture,
  type StorageLike,
} from './whatsapp-return'

function memoryStorage(): StorageLike {
  const values = new Map<string, string>()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: key => { values.delete(key) },
  }
}

describe('WhatsApp return state', () => {
  test('consome uma saída válida apenas uma vez', () => {
    const storage = memoryStorage()
    saveWhatsappDeparture(storage, { actionId: 'a1', leftAt: 1_000 })

    expect(consumeWhatsappReturn(storage, 2_000)).toEqual({ actionId: 'a1', leftAt: 1_000 })
    expect(consumeWhatsappReturn(storage, 2_001)).toBeNull()
  })

  test('remove dados expirados ou inválidos', () => {
    const storage = memoryStorage()
    saveWhatsappDeparture(storage, { actionId: 'a1', leftAt: 1_000 })
    expect(consumeWhatsappReturn(storage, 1_000 + 12 * 60 * 60 * 1_000 + 1)).toBeNull()

    storage.setItem('ce_whatsapp_saida', '{invalid-json')
    expect(consumeWhatsappReturn(storage, 2_000)).toBeNull()
  })
})
