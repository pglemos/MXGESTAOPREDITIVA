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

describe('closing regularization authorization migration', () => {
  test('requires authenticated identity in all mutating implementations', () => {
    expect(compactSql).toMatch(/CREATE OR REPLACE FUNCTION public\.aplicar_regularizacao_fechamento\(p_request_id uuid\)/)
    expect(compactSql).toMatch(/CREATE OR REPLACE FUNCTION public\.cancelar_regularizacao_fechamento\(p_request_id uuid\)/)
    expect(compactSql).toMatch(/CREATE OR REPLACE FUNCTION public\.rejeitar_regularizacao_fechamento\(p_request_id uuid, p_reason text/)
    expect(compactSql).toMatch(/CREATE OR REPLACE FUNCTION public\.enviar_cobranca_diaria\(p_recipient_id uuid, p_store_id uuid/)

    const authGuards = compactSql.match(/IF v_caller IS NULL THEN RETURN jsonb_build_object\('ok', false, 'error', 'Não autenticado\.'\); END IF;/g) ?? []
    expect(authGuards.length).toBe(4)
  })

  test('uses positive ownership checks for cancellation', () => {
    expect(compactSql).toContain('IF NOT (v_request.seller_id = v_caller OR v_request.requested_by = v_caller) THEN')
    expect(compactSql).not.toContain('v_request.seller_id <> auth.uid()')
  })

  test('reconciles the correction request with the linked daily closing before approval', () => {
    expect(compactSql).toContain('WHERE ld.id = v_request.checkin_id AND ld.store_id = v_request.store_id AND ld.seller_user_id = v_request.seller_id')
    expect(compactSql).toContain("'Fechamento original não encontrado ou fora do escopo da solicitação.'")
  })

  test('keeps store-management authorization for approval and rejection', () => {
    expect(compactSql).toContain('public.eh_administrador_mx(v_caller)')
    expect(compactSql).toContain('public.is_manager_of(v_request.store_id)')
    expect(compactSql).toContain('public.is_owner_of(v_request.store_id)')
  })

  test('limits daily charges to active sellers in the same store', () => {
    expect(compactSql).toContain("public.tem_papel_loja(p_store_id, ARRAY['vendedor'], p_recipient_id)")
    expect(compactSql).toContain("'Destinatário não pertence à equipe de vendedores desta loja.'")
  })

  test('uses the authenticated caller for audit and notification sender fields', () => {
    expect(compactSql).toContain('changed_by, old_values, new_values, change_type')
    expect(compactSql).toContain('v_request.checkin_id, v_request.id, v_caller, v_old, v_new')
    expect(compactSql).toContain('auditor_id = v_caller')
    expect(compactSql).toContain('VALUES (v_caller, v_request.seller_id')
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
