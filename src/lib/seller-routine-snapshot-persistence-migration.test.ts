import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717045000_seller_routine_snapshot_persistence.sql', import.meta.url),
  'utf8',
)

describe('official SellerRoutineSnapshot persistence', () => {
  test('implements the exact 10/10/20/20/20/20 blocks', () => {
    expect(sql).toContain('access_points_value:=CASE WHEN accessed THEN 10 ELSE 0 END')
    expect(sql).toContain('10.0*pending_resolved_value/pending_expected_value')
    expect(sql).toContain('20.0*attack_executed_value/attack_expected_value')
    expect(sql).toContain('20.0*prospecting_executed_value/prospecting_expected_value')
    expect(sql).toContain('20.0*updates_completed_value/updates_expected_value')
    expect(sql).toContain('closing_points_value:=CASE WHEN closing_official THEN 20 ELSE 0 END')
  })

  test('models non-applicable days and technical diagnostics without penalization', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.seller_day_eligibility')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.seller_routine_block_diagnostics')
    expect(sql).toContain("diagnostic_status IN ('erro_geracao','nao_aplicavel')")
    expect(sql).toContain("routine_status_value:='nao_aplicavel'")
    expect(sql).toContain('score_denominator_value:=score_denominator_value-block_weight')
  })

  test('does not apply a global prospecting schedule to every seller', () => {
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS store_id uuid')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS seller_user_id uuid')
    expect(sql).toContain('ps.store_id=p_store_id')
    expect(sql).toContain('(ps.seller_user_id=seller_row.seller_user_id OR ps.seller_user_id IS NULL)')
  })

  test('gives 0 for update 0/0 on an eligible day', () => {
    expect(sql).toContain('ELSIF updates_expected_value = 0 THEN')
    expect(sql).toContain('update_points_value:=0')
  })

  test('writes immutable versions only when the source hash changes', () => {
    expect(sql).toContain('source_hash text')
    expect(sql).toContain('latest_source_hash=calculated_source_hash')
    expect(sql).toContain('COALESCE(MAX(srs.version),0)+1')
    expect(sql).not.toContain('UPDATE public.seller_routine_snapshots')
    expect(sql).not.toContain('DELETE FROM public.seller_routine_snapshots')
  })

  test('removes anonymous access from the consolidation RPC', () => {
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.consolidate_seller_routine_snapshots(uuid,date) FROM anon')
    expect(sql).toContain('public.is_manager_of(p_store_id)')
    expect(sql).toContain('public.is_owner_of(p_store_id)')
  })
})
