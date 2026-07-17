import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'

describe('manager sales realtime migration', () => {
  it('adds the canonical closing table to Supabase Realtime idempotently', () => {
    const sql = readFileSync(
      'supabase/migrations/20260714185743_manager_sales_realtime_sync.sql',
      'utf8',
    )

    expect(sql).toContain("to_regclass('public.lancamentos_diarios')")
    expect(sql).toContain("pubname = 'supabase_realtime'")
    expect(sql).toContain("tablename = 'lancamentos_diarios'")
    expect(sql).toContain('ALTER PUBLICATION supabase_realtime ADD TABLE public.lancamentos_diarios')
  })

  it('adds official commercial events to Supabase Realtime in a later migration', () => {
    const sql = readFileSync(
      'supabase/migrations/20260714213501_manager_sales_official_realtime_sync.sql',
      'utf8',
    )

    expect(sql).toContain("to_regclass('public.eventos_comerciais')")
    expect(sql).toContain("tablename = 'eventos_comerciais'")
    expect(sql).toContain('ALTER PUBLICATION supabase_realtime ADD TABLE public.eventos_comerciais')
  })

  it('keeps the real LIAL seller accounts out of the synthetic Venda Loja bucket', () => {
    const sql = readFileSync(
      'supabase/migrations/20260714215439_lial_seller_role_flag_fix.sql',
      'utf8',
    )

    expect(sql).toContain("upper(l.name) = 'LIAL'")
    expect(sql).toContain("u.role = 'vendedor'")
    expect(sql).toContain('SET is_venda_loja = false')
    expect(sql).toContain('diellelages@gmail.com')
    expect(sql).toContain('gestaobrunosantos@gmail.com')
    expect(sql).toContain('joaodanielvdhf@gmail.com')
  })
})
