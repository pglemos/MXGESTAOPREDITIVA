import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'

describe('manager sales realtime migration', () => {
  it('adds the canonical closing table to Supabase Realtime idempotently', () => {
    const sql = readFileSync(
      'supabase/migrations/20260714184925_manager_sales_realtime_sync.sql',
      'utf8',
    )

    expect(sql).toContain("to_regclass('public.lancamentos_diarios')")
    expect(sql).toContain("pubname = 'supabase_realtime'")
    expect(sql).toContain("tablename = 'lancamentos_diarios'")
    expect(sql).toContain('ALTER PUBLICATION supabase_realtime ADD TABLE public.lancamentos_diarios')
  })
})
