import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(new URL('../../supabase/migrations/20260710150000_official_seller_performance.sql', import.meta.url), 'utf8')

describe('official seller performance read model', () => {
  test('uses official sale events and finalized daily closings only', () => {
    expect(sql).toContain("ec.tipo_evento = 'venda_realizada'")
    expect(sql).toContain("ld.metric_scope = 'daily'")
    expect(sql).toContain("coalesce(ld.submission_status, '') <> 'draft'")
  })

  test('exposes realized/projected sales and commissions separately', () => {
    expect(sql).toContain('vendas_realizadas bigint')
    expect(sql).toContain('vendas_projetadas numeric')
    expect(sql).toContain('comissao_realizada numeric')
    expect(sql).toContain('comissao_projetada numeric')
  })

  test('tracks pending and applied regularizations without double application', () => {
    expect(sql).toContain("scr.status = 'pending'")
    expect(sql).toContain("scr.status = 'approved' AND scr.applied_at IS NOT NULL")
  })

  test('limits non-internal management to stores they manage or own', () => {
    expect(sql).toContain('public.is_manager_of(vl.store_id) OR public.is_owner_of(vl.store_id)')
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.vendedor_performance_oficial')
  })
})
