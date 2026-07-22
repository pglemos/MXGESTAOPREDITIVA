import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260722172357_allow_internal_mx_read_store_target_plans.sql', import.meta.url),
  'utf8',
)

describe('store target plans — leitura interna MX', () => {
  it('libera somente SELECT para a área interna sem ampliar a consolidação', () => {
    expect(sql).toContain('FOR SELECT TO authenticated')
    expect(sql).toContain('public.eh_area_interna_mx((SELECT auth.uid()))')
    expect(sql).not.toContain('GRANT EXECUTE ON FUNCTION public.consolidate_store_target_plan')
    expect(sql).toContain('-- DOWN')
  })
})
