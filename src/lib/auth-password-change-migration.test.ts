import { describe, expect, test } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'

const migrationsRoot = new URL('../../supabase/migrations/', import.meta.url)

function readAllMigrations(): string {
  return readdirSync(migrationsRoot)
    .filter((fileName) => fileName.endsWith('.sql'))
    .map((fileName) => readFileSync(new URL(fileName, migrationsRoot), 'utf8'))
    .join('\n')
}

describe('auth password change migration contract', () => {
  test('permite somente a limpeza controlada da senha temporaria pelo RPC', () => {
    const sql = readAllMigrations()

    expect(sql).toContain("current_setting('mx.allow_password_change', true)")
    expect(sql).toContain('OLD.must_change_password IS TRUE')
    expect(sql).toContain('NEW.must_change_password IS FALSE')
    expect(sql).toContain("set_config('mx.allow_password_change', 'true', true)")
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.password_change_challenges')
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.begin_password_change()')
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.complete_password_change()')
    expect(sql).toContain('FOR UPDATE')
    expect(sql).toContain("interval '10 minutes'")
    expect(sql).toContain('FROM auth.users')
    expect(sql).toContain('v_auth_updated_at <= v_challenge.previous_auth_updated_at')
    expect(sql).toContain('DELETE FROM public.password_change_challenges')
    expect(sql).toContain('public.log_rpc_error(')
    expect(sql).toContain("'begin_password_change'")
    expect(sql).toContain("REVOKE ALL ON FUNCTION public.complete_password_change() FROM PUBLIC")
  })
})
