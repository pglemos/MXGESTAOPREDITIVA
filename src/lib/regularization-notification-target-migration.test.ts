import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260710170000_fix_regularization_notification_targets.sql', import.meta.url),
  'utf8',
)

describe('regularization notification target compatibility', () => {
  test('normalizes direct user notifications to the legacy all target', () => {
    expect(sql).toContain("IF NEW.target_type = 'user'")
    expect(sql).toContain("NEW.target_type := 'all'")
  })

  test('fans role notifications out to active managers and owners with recipient ids', () => {
    expect(sql).toContain("IF NEW.target_type = 'role'")
    expect(sql).toContain('recipient_id, sender_id, store_id')
    expect(sql).toContain("vl.role = 'dono'")
    expect(sql).toContain('RETURN NULL')
  })
})
