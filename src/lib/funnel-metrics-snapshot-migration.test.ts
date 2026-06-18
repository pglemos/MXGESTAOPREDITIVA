import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260617009000_funnel_metrics_snapshot.sql', import.meta.url)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('funnel metrics snapshot migration contract', () => {
  test('cria tabela historica do funil com periodo, vendedor, loja e agregados', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.funnel_metrics')
    expect(sql).toContain('loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE')
    expect(sql).toContain('seller_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE')
    expect(sql).toContain('period_start date NOT NULL')
    expect(sql).toContain('period_end date NOT NULL')
    expect(sql).toContain("channels jsonb NOT NULL DEFAULT '{}'::jsonb")
    expect(sql).toContain("totals jsonb NOT NULL DEFAULT '{}'::jsonb")
    expect(sql).toContain('CONSTRAINT funnel_metrics_unique_period UNIQUE (seller_user_id, period_start, period_end, period_key)')
    expect(sql).toContain('CONSTRAINT funnel_metrics_period_valid CHECK (period_end >= period_start)')
  })

  test('mantem RLS escopado e bloqueia escrita direta autenticada', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.mx_can_read_funnel_metrics')
    expect(sql).toContain('ALTER TABLE public.funnel_metrics ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('CREATE POLICY funnel_metrics_select_scoped')
    expect(sql).toContain('USING (public.mx_can_read_funnel_metrics(loja_id, seller_user_id))')
    expect(sql).toContain('CREATE POLICY funnel_metrics_insert_block_authenticated')
    expect(sql).toContain('CREATE POLICY funnel_metrics_update_block_authenticated')
    expect(sql).toContain('CREATE POLICY funnel_metrics_delete_block_authenticated')
    expect(sql).toContain('p_seller_user_id = auth.uid()')
    expect(sql).toContain('public.is_manager_of(p_loja_id)')
    expect(sql).toContain('public.is_owner_of(p_loja_id)')
    expect(sql).toContain("public.user_has_role(ARRAY['admin_mx', 'master', 'consultant'])")
    expect(sql).not.toContain('USING (true)')
    expect(sql).not.toContain('WITH CHECK (true)')
  })

  test('expoe RPC security definer para upsert idempotente do snapshot', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.upsert_funnel_metrics_snapshot')
    expect(sql).toContain('SECURITY DEFINER')
    expect(sql).toContain('v_seller_id uuid := auth.uid()')
    expect(sql).toContain("RAISE EXCEPTION 'Periodo invalido para snapshot do funil.'")
    expect(sql).toContain('FROM public.vinculos_loja vl')
    expect(sql).toContain('FROM public.oportunidades o')
    expect(sql).toContain('jsonb_object_agg')
    expect(sql).toContain('ON CONFLICT (seller_user_id, period_start, period_end, period_key)')
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.upsert_funnel_metrics_snapshot(date, date, text) TO authenticated')
  })

  test('nao contem rollback destrutivo do snapshot novo', () => {
    const sql = readMigration()

    expect(sql).not.toMatch(/DROP\s+TABLE\s+(IF\s+EXISTS\s+)?public\.funnel_metrics/i)
  })
})
