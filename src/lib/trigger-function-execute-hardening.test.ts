import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717200000_revoke_trigger_function_execute.sql', import.meta.url),
  'utf8',
)
const compactSql = sql.replace(/\s+/g, ' ').trim()

const triggerFunctions = [
  'archive_score_calculation()',
  'audit_vendedor_perfil_profissional()',
  'bloquear_self_update_usuarios_sensivel()',
  'check_orphan_users_after_membership_deletion()',
  'enforce_feedback_seller_ack_only()',
  'enforce_observation_author_role()',
  'expandir_destino_notificacao_regularizacao()',
  'handle_new_user()',
  'log_planos_acao_changes()',
  'log_store_meta_rules_changes()',
  'log_store_update_changes()',
  'mx_set_updated_by()',
  'notify_manager_on_checkin()',
  'notify_manager_on_correction_request()',
  'proteger_campos_oficiais_vendedor_perfil()',
  'sync_notification_reads()',
] as const

describe('trigger function execute hardening migration', () => {
  test('revokes direct execution from every API-facing role', () => {
    for (const fn of triggerFunctions) {
      expect(compactSql).toContain(
        `REVOKE ALL ON FUNCTION public.${fn} FROM PUBLIC, anon, authenticated, service_role`,
      )
    }
  })

  test('prevents future public functions from receiving implicit PUBLIC execute', () => {
    expect(compactSql).toContain(
      'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC',
    )
  })

  test('does not drop, replace, disable or detach any trigger', () => {
    expect(compactSql).not.toMatch(/\bDROP\s+(?:FUNCTION|TRIGGER)\b/i)
    expect(compactSql).not.toMatch(/\bDISABLE\s+TRIGGER\b/i)
    expect(compactSql).not.toMatch(/\bCREATE\s+OR\s+REPLACE\s+FUNCTION\b/i)
  })

  test('is transactional and documents rollback', () => {
    expect(compactSql.startsWith('BEGIN;')).toBe(true)
    expect(compactSql).toContain('-- DOWN')
    expect(compactSql).toContain('COMMIT;')
  })
})
