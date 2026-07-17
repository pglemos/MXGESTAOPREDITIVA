import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717044000_store_target_plan_persistence.sql', import.meta.url),
  'utf8',
)

describe('persisted StoreTargetPlan', () => {
  test('supports the four exact horizons from the managerial specification', () => {
    expect(sql).toContain("ARRAY['hoje','esta_semana','esta_dezena','este_mes']")
    expect(sql).toContain("WHEN 'esta_semana'")
    expect(sql).toContain("WHEN 'esta_dezena'")
  })

  test('uses store calendar exceptions before the default projection mode', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.store_calendar_exceptions')
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.is_store_operational_date')
    expect(sql).toContain('exception_row.is_operational')
    expect(sql).toContain("projection_mode = 'calendar'")
  })

  test('preserves fractional proportional goals and sub-one daily pace', () => {
    expect(sql).toContain('monthly_goal * business_days_elapsed / business_days_total')
    expect(sql).toContain('required_sales/horizon_days')
    expect(sql).toContain("'1 venda a cada '")
  })

  test('uses 30 days, then 90 days, then the configured 3:1 fallback', () => {
    expect(sql).toContain('history_start := reference_date - 29')
    expect(sql).toContain('history_start := reference_date - 89')
    expect(sql).toContain('appointments_per_sale numeric NOT NULL DEFAULT 3')
    expect(sql).toContain('configured_ratio')
  })

  test('writes a new immutable version only when the source hash changes', () => {
    expect(sql).toContain('source_hash text')
    expect(sql).toContain('latest_source_hash = calculated_source_hash')
    expect(sql).toContain('COALESCE(MAX(version),0)+1')
    expect(sql).not.toContain('UPDATE public.store_target_plans')
    expect(sql).not.toContain('DELETE FROM public.store_target_plans')
  })

  test('checks store scope and removes anonymous execution', () => {
    expect(sql).toContain('public.is_manager_of(p_store_id)')
    expect(sql).toContain('public.is_owner_of(p_store_id)')
    expect(sql).toContain('public.eh_administrador_mx(caller_id)')
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.consolidate_store_target_plan(uuid,date) FROM anon')
  })
})
