import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717260000_harden_broadcast_notification_authorization.sql', import.meta.url),
  'utf8',
)
const compactSql = sql.replace(/\s+/g, ' ').trim()

describe('broadcast notification authorization migration', () => {
  test('keeps the canonical RPC signature and fixed search_path', () => {
    expect(compactSql).toContain('send_broadcast_notification(p_title text, p_message text, p_type text')
    expect(compactSql).toContain("SECURITY DEFINER SET search_path TO 'public'")
  })

  test('denies anonymous execution and preserves authenticated and service roles', () => {
    expect(compactSql).toContain('REVOKE ALL ON FUNCTION public.send_broadcast_notification')
    expect(compactSql).toContain('FROM PUBLIC, anon, authenticated, service_role')
    expect(compactSql).toContain('GRANT EXECUTE ON FUNCTION public.send_broadcast_notification')
    expect(compactSql).toContain('TO authenticated, service_role')
  })

  test('allows global fan-out only for service role or internal MX users', () => {
    expect(compactSql).toContain("auth.role() = 'service_role'")
    expect(compactSql).toContain('public.eh_area_interna_mx(v_caller)')
    expect(compactSql).toContain('Broadcast global restrito')
  })

  test('allows store fan-out only for authorized store management', () => {
    expect(compactSql).toContain('public.is_manager_of(p_store_id)')
    expect(compactSql).toContain('public.is_owner_of(p_store_id)')
    expect(compactSql).toContain('Broadcast da loja restrito')
  })

  test('does not trust p_sender_id for authenticated callers', () => {
    expect(compactSql).toContain("CASE WHEN auth.role() = 'service_role' THEN p_sender_id ELSE v_caller END")
  })

  test('is transactional and documents rollback', () => {
    expect(compactSql.startsWith('BEGIN;')).toBe(true)
    expect(compactSql).toContain('-- DOWN')
    expect(compactSql).toContain('COMMIT;')
  })
})
