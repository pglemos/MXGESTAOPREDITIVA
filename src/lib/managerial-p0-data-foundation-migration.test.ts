import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717040000_managerial_p0_data_foundation.sql', import.meta.url),
  'utf8',
)

describe('managerial P0 data foundation migration', () => {
  test('creates the six canonical snapshot/task tables required by the managerial spec', () => {
    for (const table of [
      'd1_snapshot_batches',
      'd1_snapshot_items',
      'manager_daily_tasks',
      'manager_routine_snapshots',
      'seller_routine_snapshots',
      'store_target_plans',
    ]) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`)
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`)
    }
  })

  test('keeps snapshots append-only and versioned', () => {
    expect(sql).toContain('UNIQUE (closing_id, version)')
    expect(sql).toContain('UNIQUE (seller_user_id, reference_date, version)')
    expect(sql).toContain('UNIQUE (manager_user_id, reference_date, version)')
    expect(sql).toContain('UNIQUE (store_id, reference_date, horizon, version)')
    expect(sql).not.toContain('DELETE FROM public.d1_snapshot_batches')
    expect(sql).not.toContain('DELETE FROM public.d1_snapshot_items')
  })

  test('defines official D+1 consolidation at 09:31 Sao Paulo without rewriting old versions', () => {
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.consolidate_d1_snapshot')
    expect(sql).toContain("timezone('America/Sao_Paulo', now())")
    expect(sql).toContain("local_now::time < time '09:31:00'")
    expect(sql).toContain("cron.schedule('mx-consolidate-d1-0931'")
    expect(sql).toContain("'31 * * * *'")
  })

  test('records late D+1 changes with before and after snapshots', () => {
    expect(sql).toContain('previous_snapshot jsonb')
    expect(sql).toContain('previous_snapshot, snapshot, changed_fields, official_batch_id, actor_id')
    expect(sql).toContain('changed_fields text[]')
    expect(sql).toContain('official_batch_id uuid')
    expect(sql).toContain('to_jsonb(OLD)')
    expect(sql).toContain('to_jsonb(NEW)')
  })

  test('uses canonical regularization source for manager tasks', () => {
    expect(sql).toContain('public.solicitacoes_correcao_lancamento')
    expect(sql).not.toContain('FROM public.regularizacao_fechamento')
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.refresh_manager_daily_tasks')
  })

  test('excludes technical errors and personal tasks from official manager score', () => {
    expect(sql).toContain("status <> 'technical_error'")
    expect(sql).toContain('counts_for_score = true')
    expect(sql).toContain('automatic = true')
  })
})
