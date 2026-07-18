import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260718224500_owner_consultant_bridge.sql', import.meta.url)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('owner consultant bridge migration contract', () => {
  test('expõe somente o vínculo consultivo necessário para a loja', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.get_owner_consultant_contact')
    expect(sql).toContain('RETURNS TABLE')
    expect(sql).toContain('consultant_name text')
    expect(sql).toContain('consultant_email text')
    expect(sql).toContain('consultant_phone text')
    expect(sql).toContain('LIMIT 1')
  })

  test('valida o escopo antes de consultar atribuições internas', () => {
    const sql = readMigration()

    expect(sql).toContain('SECURITY DEFINER')
    expect(sql).toContain('SET search_path = public')
    expect(sql).toContain('public.user_is_master_loja(p_store_id, auth.uid())')
    expect(sql).toContain("public.tem_papel_loja(p_store_id, ARRAY['dono'], auth.uid())")
    expect(sql).toContain('RAISE EXCEPTION')
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.get_owner_consultant_contact(uuid) FROM PUBLIC')
  })
})
