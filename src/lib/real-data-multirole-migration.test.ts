import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  'supabase/migrations/20260722024951_serialize_routine_and_scope_consultant_contact.sql',
  'utf8',
)

describe('real-data multi-role database contract', () => {
  test('allows the manager route only through requested-store scope', () => {
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.get_owner_consultant_contact(p_store_id uuid)')
    expect(sql).toContain('public.is_manager_of(p_store_id)')
    expect(sql).not.toMatch(/role\s*=\s*['"]gerente['"]/i)
  })

  test('keeps the security-definer RPC closed by default', () => {
    expect(sql).toContain('SECURITY DEFINER')
    expect(sql).toContain('SET search_path = public')
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.get_owner_consultant_contact(uuid) FROM PUBLIC')
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.get_owner_consultant_contact(uuid) TO authenticated')
  })

  test('is transactional', () => {
    expect(sql.trimStart().startsWith('BEGIN;')).toBe(true)
    expect(sql.trimEnd().endsWith('COMMIT;')).toBe(true)
  })
})
