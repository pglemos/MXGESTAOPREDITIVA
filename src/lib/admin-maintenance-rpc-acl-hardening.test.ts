import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717210000_revoke_anon_admin_maintenance_rpcs.sql', import.meta.url),
  'utf8',
)
const compactSql = sql.replace(/\s+/g, ' ').trim()

const authenticatedRpcs = [
  'admin_archive_store(uuid)',
  'admin_create_store(jsonb)',
  'admin_restore_store(uuid)',
  'admin_update_store(uuid,jsonb)',
  'exportar_contatos_cadastros_mx()',
  'process_import_data(uuid)',
  'upsert_funnel_metrics_snapshot(date,date,text)',
] as const

const serviceOnlyRpcs = [
  'append_audit_log(text,text,jsonb)',
  'configure_google_meet_ata_cron(text,text,text)',
  'configure_monthly_report_cron(text,text,text)',
  'configure_morning_report_cron(text,text)',
  'configure_weekly_feedback_cron(text,text)',
  'get_correlation_id()',
  'log_rpc_error(text,text,text,uuid,jsonb)',
] as const

describe('admin and maintenance RPC ACL hardening', () => {
  test('removes anonymous access while preserving authenticated application RPCs', () => {
    for (const fn of authenticatedRpcs) {
      expect(compactSql).toContain(
        `REVOKE ALL ON FUNCTION public.${fn} FROM PUBLIC, anon`,
      )
      expect(compactSql).toContain(
        `GRANT EXECUTE ON FUNCTION public.${fn} TO authenticated, service_role`,
      )
    }
  })

  test('restricts cron configurators and internal helpers to service_role', () => {
    for (const fn of serviceOnlyRpcs) {
      expect(compactSql).toContain(
        `REVOKE ALL ON FUNCTION public.${fn} FROM PUBLIC, anon, authenticated`,
      )
      expect(compactSql).toContain(
        `GRANT EXECUTE ON FUNCTION public.${fn} TO service_role`,
      )
    }
  })

  test('changes privileges only', () => {
    expect(compactSql).not.toMatch(/\bCREATE\s+OR\s+REPLACE\s+FUNCTION\b/i)
    expect(compactSql).not.toMatch(/\bDROP\s+FUNCTION\b/i)
    expect(compactSql).not.toMatch(/\bALTER\s+FUNCTION\b/i)
  })

  test('is transactional and documents rollback', () => {
    expect(compactSql.startsWith('BEGIN;')).toBe(true)
    expect(compactSql).toContain('-- DOWN')
    expect(compactSql).toContain('COMMIT;')
  })
})
