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
  })
})
