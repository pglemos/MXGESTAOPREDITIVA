import { existsSync } from 'node:fs'

const migrationsRoot = new URL('../../supabase/migrations/', import.meta.url)

describe('Supabase automated migration directory', () => {
  test.each([
    '20260521120000_drop_migration_backups_pii.sql',
    '20260521130000_db016_revoke_lancamentos_diarios.sql',
    '20260521131000_db016_revoke_rollback.sql',
  ])('keeps manual or rollback script %s outside the automatic chain', (fileName) => {
    expect(existsSync(new URL(fileName, migrationsRoot))).toBe(false)
    expect(existsSync(new URL(`_archived/${fileName}`, migrationsRoot))).toBe(true)
  })
})
