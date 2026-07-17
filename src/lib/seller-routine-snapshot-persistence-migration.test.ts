import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = [
  '20260717040955_seller_routine_snapshot_schema.sql',
  '20260717041036_seller_routine_snapshot_helpers.sql',
  '20260717041142_seller_routine_snapshot_consolidation.sql',
  '20260717041202_seller_routine_snapshot_cron.sql',
].map(file => readFileSync(new URL(`../../supabase/migrations/${file}`, import.meta.url), 'utf8')).join('\n')

describe('official SellerRoutineSnapshot persistence', () => {
  test('implements the exact 10/10/20/20/20/20 blocks', () => {
    expect(sql).toContain("access_points_value:=CASE WHEN d_access IN ('erro_geracao','nao_aplicavel') THEN NULL WHEN accessed THEN 10 ELSE 0 END")
    expect(sql).toContain('calculate_seller_routine_component(pending_expected_value,pending_resolved_value,10')
    expect(sql).toContain('calculate_seller_routine_component(attack_expected_value,attack_executed_value,20')
    expect(sql).toContain('calculate_seller_routine_component(prospecting_expected_value,prospecting_executed_value,20')
    expect(sql).toContain('LEAST(20,20.0*updates_completed_value/updates_expected_value)')
    expect(sql).toContain("closing_points_value:=CASE WHEN d_closing IN ('erro_geracao','nao_aplicavel') THEN NULL WHEN closing_official THEN 20 ELSE 0 END")
  })

  test('models non-applicable days and technical diagnostics without penalization', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.seller_day_eligibility')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.seller_routine_block_diagnostics')
    expect(sql).toContain("p_diagnostic_status IN ('erro_geracao','nao_aplicavel')")
    expect(sql).toContain("status_value:='nao_aplicavel'")
    expect(sql).toContain("denominator_value:=100")
    expect(sql).toContain("d_access IN ('erro_geracao','nao_aplicavel') THEN 10")
  })

  test('does not apply a global prospecting schedule to every seller', () => {
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS store_id uuid')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS seller_user_id uuid')
    expect(sql).toContain('p.store_id=p_store_id')
    expect(sql).toContain('(p.seller_user_id=s.seller_user_id OR p.seller_user_id IS NULL)')
  })

  test('gives 0 for update 0/0 on an eligible day', () => {
    expect(sql).toContain('WHEN updates_expected_value=0 THEN 0')
  })

  test('writes immutable versions only when the source hash changes', () => {
    expect(sql).toContain('source_hash text')
    expect(sql).toContain('previous_hash=hash_value')
    expect(sql).toContain('COALESCE(MAX(x.version),0)+1')
    expect(sql).not.toContain('UPDATE public.seller_routine_snapshots')
    expect(sql).not.toContain('DELETE FROM public.seller_routine_snapshots')
  })

  test('removes anonymous access and schedules periodic consolidation', () => {
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.consolidate_seller_routine_snapshots(uuid,date) FROM PUBLIC,anon')
    expect(sql).toContain('public.is_manager_of(p_store_id)')
    expect(sql).toContain('public.is_owner_of(p_store_id)')
    expect(sql).toContain("'mx-refresh-seller-routine-snapshots'")
    expect(sql).toContain("'15 * * * *'")
  })
})
