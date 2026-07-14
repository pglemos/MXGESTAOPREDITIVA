import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20260714192019_feedback_visibility_action_cleanup.sql'), 'utf8')

describe('feedback visibility action cleanup migration contract', () => {
  it('allows the owning manager to remove a stale seller action', () => {
    expect(migration).toContain('CREATE POLICY devolutiva_acoes_delete_manager')
    expect(migration).toContain('FOR DELETE TO authenticated')
    expect(migration).toContain('USING (manager_id = auth.uid())')
  })
})
