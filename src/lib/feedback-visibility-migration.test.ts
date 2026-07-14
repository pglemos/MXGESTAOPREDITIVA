import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20260714193000_feedback_visibility_to_seller.sql'), 'utf8')

describe('feedback visibility migration contract', () => {
  it('adds a backwards-compatible seller visibility flag', () => {
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS visible_to_seller boolean NOT NULL DEFAULT true')
    expect(migration).toContain('COMMENT ON COLUMN public.devolutivas.visible_to_seller')
  })

  it('enforces the seller visibility decision in devolutiva and action RLS', () => {
    expect(migration).toContain('devolutivas.seller_id = auth.uid() AND devolutivas.visible_to_seller')
    expect(migration).toContain('AND devolutivas.visible_to_seller')
    expect(migration).toContain('DROP POLICY IF EXISTS devolutiva_acoes_select_own')
  })
})
