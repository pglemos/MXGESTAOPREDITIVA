import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('./AgendaD1Panel.tsx', import.meta.url), 'utf8')
const compactSource = source.replace(/\s+/g, ' ')

describe('Agenda D+1 canonical RPC contract', () => {
  test('records contact attempts through the canonical RPC', () => {
    expect(source).toContain("supabase.rpc('record_d1_contact_action'")
  })

  test('changes confirmation through the canonical RPC', () => {
    expect(source).toContain("supabase.rpc('update_d1_confirmation'")
    expect(compactSource).toContain("'Solicitou reagendamento': 'solicitou_reagendamento'")
    expect(compactSource).toContain("'Sem resposta': 'sem_resposta'")
  })

  test('preserves the original appointment date', () => {
    expect(source).toContain('A agenda original não foi alterada')
  })

  test('keeps seller notification for cancellation and reschedule outcomes', () => {
    expect(source).toContain('outcome === "Solicitou reagendamento"')
    expect(source).toContain('outcome === "Cancelou"')
    expect(source).toContain('sendNotification({')
  })
})
