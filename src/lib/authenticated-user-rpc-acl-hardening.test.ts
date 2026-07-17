import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717230000_revoke_anon_authenticated_user_rpcs.sql', import.meta.url),
  'utf8',
)
const compactSql = sql.replace(/\s+/g, ' ').trim()

const authenticatedUserRpcs = [
  'ack_alert(uuid)',
  'begin_password_change()',
  'buscar_cliente_loja_por_telefone(text)',
  'complete_password_change()',
  'dismiss_alert(uuid,text)',
  'registrar_venda_direta(jsonb)',
  'resolve_alert(uuid)',
  'solicitar_liberacao_fechamento(date)',
  'solicitar_regularizacao_fechamento(uuid,jsonb,text,text)',
  'submit_checkin(jsonb)',
  'submeter_quiz_treinamento(uuid,jsonb)',
  'update_my_profile(jsonb)',
] as const

describe('authenticated user RPC ACL hardening', () => {
  test('removes anonymous execution and preserves signed-in application access', () => {
    for (const fn of authenticatedUserRpcs) {
      expect(compactSql).toContain(
        `REVOKE ALL ON FUNCTION public.${fn} FROM PUBLIC, anon, authenticated, service_role`,
      )
      expect(compactSql).toContain(
        `GRANT EXECUTE ON FUNCTION public.${fn} TO authenticated, service_role`,
      )
    }
  })

  test('changes ACLs only', () => {
    expect(compactSql).not.toMatch(/\bCREATE\s+OR\s+REPLACE\s+FUNCTION\b/i)
    expect(compactSql).not.toMatch(/\bDROP\s+FUNCTION\b/i)
    expect(compactSql).not.toMatch(/\bALTER\s+FUNCTION\b/i)
  })

  test('does not alter token-based closing release functions', () => {
    expect(compactSql).not.toContain('consultar_liberacao_por_token')
    expect(compactSql).not.toContain('liberar_fechamento_por_token')
  })

  test('is transactional and documents rollback', () => {
    expect(compactSql.startsWith('BEGIN;')).toBe(true)
    expect(compactSql).toContain('-- DOWN')
    expect(compactSql).toContain('COMMIT;')
  })
})
