import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717050000_public_table_rls_hardening.sql', import.meta.url),
  'utf8',
)

describe('public support table RLS hardening', () => {
  test('enables RLS on the three tables flagged by the security advisor', () => {
    for (const table of [
      'user_roles',
      'migration_backup_lancamentos_diarios_duplicates_20260503',
      'migration_backup_vendedores_loja_duplicates_20260503',
    ]) {
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`)
      expect(sql).toContain(`REVOKE ALL ON TABLE public.${table} FROM anon, authenticated`)
    }
  })

  test('allows users to read only their own future bridge assignments', () => {
    expect(sql).toContain('CREATE POLICY user_roles_read_own_or_admin')
    expect(sql).toContain('user_id = (SELECT auth.uid())')
    expect(sql).toContain('public.eh_administrador_mx((SELECT auth.uid()))')
  })

  test('keeps direct user_roles mutation disabled for application roles', () => {
    expect(sql).toContain('CREATE POLICY user_roles_write_denied')
    expect(sql).toContain('USING (false)')
    expect(sql).toContain('WITH CHECK (false)')
  })

  test('does not create client policies for technical backup tables', () => {
    expect(sql).not.toContain('CREATE POLICY migration_backup_')
  })
})
