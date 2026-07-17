import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717220000_harden_process_import_data_authorization.sql', import.meta.url),
  'utf8',
)
const compactSql = sql.replace(/\s+/g, ' ').trim()

describe('process_import_data authorization hardening', () => {
  test('checks internal MX authorization before touching the import batch', () => {
    const authGuard = compactSql.indexOf('IF NOT public.eh_area_interna_mx() THEN')
    const firstBatchRead = compactSql.indexOf('FROM public.logs_reprocessamento')

    expect(authGuard).toBeGreaterThan(-1)
    expect(firstBatchRead).toBeGreaterThan(authGuard)
    expect(compactSql).toContain("RAISE EXCEPTION 'Acesso negado: reprocessamento restrito à equipe interna MX.'")
    expect(compactSql).toContain("USING ERRCODE = '42501'")
  })

  test('keeps process_import_data executable only by authenticated and service_role', () => {
    expect(compactSql).toContain(
      'REVOKE ALL ON FUNCTION public.process_import_data(uuid) FROM PUBLIC, anon, authenticated, service_role',
    )
    expect(compactSql).toContain(
      'GRANT EXECUTE ON FUNCTION public.process_import_data(uuid) TO authenticated, service_role',
    )
  })

  test('preserves security definer and a fixed search_path', () => {
    expect(compactSql).toContain('SECURITY DEFINER')
    expect(compactSql).toContain("SET search_path TO 'public'")
  })

  test('is transactional and documents rollback', () => {
    expect(compactSql.startsWith('BEGIN;')).toBe(true)
    expect(compactSql).toContain('-- DOWN')
    expect(compactSql).toContain('COMMIT;')
  })
})
