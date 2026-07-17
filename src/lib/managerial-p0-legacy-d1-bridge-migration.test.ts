import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717042000_managerial_p0_legacy_d1_bridge.sql', import.meta.url),
  'utf8',
)

describe('legacy Agenda D+1 compatibility bridge', () => {
  test('bridges current manager UI audit events into canonical appointment state', () => {
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.bridge_d1_audit_to_canonical')
    expect(sql).toContain("NEW.tipo_alteracao = 'agenda_d1_whatsapp'")
    expect(sql).toContain("NEW.tipo_alteracao = 'agenda_d1_telefone'")
    expect(sql).toContain("NEW.tipo_alteracao = 'agenda_d1_confirmacao'")
    expect(sql).toContain('confirmation_status = canonical_status')
  })

  test('never changes the official appointment date for a reschedule request', () => {
    expect(sql).toContain("canonical_status := 'solicitou_reagendamento'")
    expect(sql).not.toContain('SET data_hora =')
  })

  test('records the inferred appointment and actor in canonical audit', () => {
    expect(sql).toContain('INSERT INTO public.d1_contact_audit')
    expect(sql).toContain('appointment_row.id')
    expect(sql).toContain('NEW.usuario_id')
  })

  test('repairs manual execution action inserts used by Minha Rotina', () => {
    expect(sql).toContain("ALTER COLUMN activity_type SET DEFAULT 'comercial'")
  })
})
