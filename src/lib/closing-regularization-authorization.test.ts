import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717280000_harden_closing_regularization_authorization.sql', import.meta.url),
  'utf8',
)
const compactSql = sql.replace(/\s+/g, ' ').trim()

const signatures = [
  'public.aplicar_regularizacao_fechamento(uuid)',
  'public.approve_correction_request(uuid)',
  'public.cancelar_regularizacao_fechamento(uuid)',
  'public.rejeitar_regularizacao_fechamento(uuid,text)',
  'public.reject_correction_request(uuid)',
  'public.enviar_cobranca_diaria(uuid,uuid,text,text,text,text,text)',
]

function extractFunction(name: string) {
  const marker = `CREATE OR REPLACE FUNCTION public.${name}`
  const start = compactSql.indexOf(marker)
  expect(start).toBeGreaterThanOrEqual(0)

  const next = compactSql.indexOf('CREATE OR REPLACE FUNCTION public.', start + marker.length)
  return compactSql.slice(start, next === -1 ? compactSql.length : next)
}

const authGuard = "IF v_caller IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Não autenticado.'); END IF;"

describe('closing regularization authorization migration', () => {
  test('requires authenticated identity and local authorization in every mutating implementation', () => {
    const approval = extractFunction('aplicar_regularizacao_fechamento(')
    const rejection = extractFunction('rejeitar_regularizacao_fechamento(')
    const cancellation = extractFunction('cancelar_regularizacao_fechamento(')
    const charge = extractFunction('enviar_cobranca_diaria(')

    for (const body of [approval, rejection, cancellation, charge]) {
      expect(body).toContain(authGuard)
    }

    for (const body of [approval, rejection]) {
      expect(body).toContain('public.eh_administrador_mx(v_caller)')
      expect(body).toContain('public.is_manager_of(v_request.store_id)')
      expect(body).toContain('public.is_owner_of(v_request.store_id)')
    }

    expect(cancellation).toContain(
      'IF (v_request.seller_id = v_caller OR v_request.requested_by = v_caller) IS NOT TRUE THEN',
    )
    expect(charge).toContain("public.tem_papel_loja(p_store_id, ARRAY['vendedor'], p_recipient_id)")
  })

  test('authorizes request processors before revealing request status', () => {
    const approval = extractFunction('aplicar_regularizacao_fechamento(')
    const rejection = extractFunction('rejeitar_regularizacao_fechamento(')

    const approvalAuthorization = approval.indexOf('public.eh_administrador_mx(v_caller)')
    expect(approvalAuthorization).toBeGreaterThanOrEqual(0)
    expect(approvalAuthorization).toBeLessThan(approval.indexOf("IF v_request.status = 'approved'"))
    expect(approvalAuthorization).toBeLessThan(approval.indexOf("IF v_request.status <> 'pending'"))

    const rejectionAuthorization = rejection.indexOf('public.eh_administrador_mx(v_caller)')
    expect(rejectionAuthorization).toBeGreaterThanOrEqual(0)
    expect(rejectionAuthorization).toBeLessThan(rejection.indexOf("IF v_request.status <> 'pending'"))
  })

  test('uses null-safe positive ownership checks for cancellation', () => {
    const cancellation = extractFunction('cancelar_regularizacao_fechamento(')

    expect(cancellation).toContain(
      'IF (v_request.seller_id = v_caller OR v_request.requested_by = v_caller) IS NOT TRUE THEN',
    )
    expect(cancellation).not.toContain('v_request.seller_id <> auth.uid()')
    expect(cancellation).not.toContain('IF NOT (v_request.seller_id = v_caller OR v_request.requested_by = v_caller) THEN')
  })

  test('reconciles the correction request with the linked daily closing before approval', () => {
    const approval = extractFunction('aplicar_regularizacao_fechamento(')

    expect(approval).toContain('WHERE ld.id = v_request.checkin_id AND ld.store_id = v_request.store_id AND ld.seller_user_id = v_request.seller_id')
    expect(approval).toContain("'Fechamento original não encontrado ou fora do escopo da solicitação.'")
  })

  test('serializes daily charge idempotency before checking for an existing notification', () => {
    const charge = extractFunction('enviar_cobranca_diaria(')
    const lock = charge.indexOf('PERFORM pg_advisory_xact_lock(v_charge_lock_key)')
    const lookup = charge.indexOf('SELECT id INTO v_existing_id')

    expect(charge).toContain("v_business_date date := (now() AT TIME ZONE 'America/Sao_Paulo')::date")
    expect(lock).toBeGreaterThanOrEqual(0)
    expect(lookup).toBeGreaterThan(lock)
  })

  test('uses the authenticated caller for audit and notification sender fields', () => {
    const approval = extractFunction('aplicar_regularizacao_fechamento(')
    const rejection = extractFunction('rejeitar_regularizacao_fechamento(')

    expect(approval).toContain('changed_by, old_values, new_values, change_type')
    expect(approval).toContain('v_request.checkin_id, v_request.id, v_caller, v_old, v_new')
    expect(approval).toContain('auditor_id = v_caller')
    expect(approval).toMatch(/VALUES \( v_caller, v_request\.seller_id/)
    expect(rejection).toContain('auditor_id = v_caller')
    expect(rejection).toMatch(/VALUES \( v_caller, v_request\.seller_id/)
  })

  test('removes anonymous execution from all entry points', () => {
    for (const signature of signatures) {
      expect(compactSql).toContain(`REVOKE ALL ON FUNCTION ${signature} FROM PUBLIC, anon, authenticated, service_role`)
      expect(compactSql).toContain(`GRANT EXECUTE ON FUNCTION ${signature} TO authenticated, service_role`)
    }
  })

  test('uses fixed search paths and documents rollback', () => {
    const searchPathCount = (compactSql.match(/SECURITY DEFINER SET search_path TO 'public'/g) ?? []).length
    expect(searchPathCount).toBe(6)
    expect(compactSql.startsWith('BEGIN;')).toBe(true)
    expect(compactSql).toContain('-- DOWN')
    expect(compactSql).toContain('COMMIT;')
  })
})