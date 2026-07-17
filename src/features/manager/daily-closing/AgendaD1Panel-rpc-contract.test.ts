import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('./AgendaD1Panel.tsx', import.meta.url), 'utf8')
const compactSource = source.replace(/\s+/g, ' ')

describe('Agenda D+1 canonical RPC contract', () => {
  test('records contact attempts through the audited canonical RPC', () => {
    expect(source).toContain("supabase.rpc('record_d1_contact_action'")
    expect(source).not.toContain('d1_audit_log')
    expect(source).not.toContain('logs_compartilhamento_whatsapp')
    expect(source).not.toContain('message_text: message')
    expect(source).toContain('p_message_preview: null')
  })

  test('changes confirmation through update_d1_confirmation', () => {
    expect(source).toContain("supabase.rpc('update_d1_confirmation'")
    expect(compactSource).toContain("'Solicitou reagendamento': 'solicitou_reagendamento'")
    expect(compactSource).toContain("'Sem resposta': 'sem_resposta'")
    expect(compactSource).toContain("'Outro': 'outro'")
  })

  test('reads canonical confirmation fields from appointments', () => {
    expect(source).toContain('confirmation_status, confirmation_note, last_contact_at')
    expect(source).toContain('canonicalConfirmationLabel(row.confirmation_status)')
  })

  test('does not mutate the official appointment date during manager confirmation', () => {
    expect(source).not.toContain('.update({ data_hora:')
    expect(source).not.toContain('data_hora: newDate')
    expect(source).toContain('A agenda original não foi alterada')
  })

  test('keeps seller notification for cancellation and reschedule outcomes', () => {
    expect(source).toContain('outcome === "Solicitou reagendamento"')
    expect(source).toContain('outcome === "Cancelou"')
    expect(source).toContain('sendNotification({')
  })
})
