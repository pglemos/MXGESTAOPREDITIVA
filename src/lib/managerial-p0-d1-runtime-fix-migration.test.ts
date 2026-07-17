import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717041000_managerial_p0_d1_runtime_fix.sql', import.meta.url),
  'utf8',
)

describe('managerial P0 D+1 runtime fix', () => {
  test('calculates detailed and valid appointments into distinct variables', () => {
    expect(sql).toContain('INTO detailed_count, valid_count')
    expect(sql).not.toContain('INTO detailed_count, detailed_count, valid_count')
  })

  test('requires an explicit audited confirmation mutation', () => {
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.update_d1_confirmation')
    expect(sql).toContain("p_confirmation_status IN ('pendente','whatsapp_aberto','confirmado','sem_resposta','solicitou_reagendamento','cancelou','outro')")
    expect(sql).toContain("p_confirmation_status = 'outro' AND NULLIF(BTRIM(p_note),'') IS NULL")
    expect(sql).toContain('confirmed_by = caller_id')
    expect(sql).toContain('last_contact_at = now()')
  })

  test('audits WhatsApp and phone actions without pretending the message was sent', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.d1_contact_audit')
    expect(sql).toContain("action_type IN ('whatsapp_opened','phone_opened','confirmation_changed','seller_notified')")
    expect(sql).toContain('manager_user_id uuid NOT NULL')
    expect(sql).toContain('message_preview text')
  })

  test('checks manager, owner or Admin MX store scope before mutations', () => {
    expect(sql).toContain('public.is_manager_of(appointment_row.loja_id)')
    expect(sql).toContain('public.is_owner_of(appointment_row.loja_id)')
    expect(sql).toContain('public.eh_administrador_mx(caller_id)')
  })
})
