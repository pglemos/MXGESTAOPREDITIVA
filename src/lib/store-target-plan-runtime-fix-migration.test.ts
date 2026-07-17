import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717044100_store_target_plan_runtime_fix.sql', import.meta.url),
  'utf8',
)

describe('StoreTargetPlan runtime fix', () => {
  test('uses an unambiguous target reference date variable', () => {
    expect(sql).toContain('target_reference_date date :=')
    expect(sql).toContain('ld.reference_date BETWEEN month_start AND target_reference_date')
    expect(sql).toContain('stp.reference_date=target_reference_date')
    expect(sql).not.toContain('stp.reference_date=reference_date')
  })

  test('replaces the function and keeps explicit grants', () => {
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.consolidate_store_target_plan')
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.consolidate_store_target_plan(uuid,date) FROM anon')
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.consolidate_store_target_plan(uuid,date) TO authenticated, service_role')
  })
})
