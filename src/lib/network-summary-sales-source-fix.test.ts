import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260723150000_network_summary_sales_source_fix.sql', import.meta.url),
  'utf8',
)
// Only the UP portion defines the live function; the "-- DOWN" comment block
// documents the previous (buggy) behavior on purpose and must keep it.
const upSql = sql.slice(0, sql.indexOf('-- DOWN'))

describe('get_resumo_rede_periodo sales source fix', () => {
  test('counts sales from the official eventos_comerciais read model, not lancamentos_diarios', () => {
    expect(upSql).toContain("ec.tipo_evento = 'venda_realizada'")
    expect(upSql).toContain('from public.eventos_comerciais ec')
    expect(upSql).not.toContain('vnd_net_prev_day')
    expect(upSql).not.toContain('vnd_porta_prev_day')
    expect(upSql).not.toContain('vnd_cart_prev_day')
  })

  test('keeps leads/agendamentos/visitas sourced from lancamentos_diarios (not part of the bug)', () => {
    expect(sql).toContain('from public.lancamentos_diarios l')
    expect(sql).toContain('l.leads_prev_day')
    expect(sql).toContain('l.agd_net_today')
    expect(sql).toContain('l.visit_prev_day')
  })

  test('keeps store rows even when only one side of the union has data', () => {
    expect(sql).toContain('full outer join activity_by_store a on a.store_id = s.store_id')
  })

  test('preserves authorization, validation and error logging behavior', () => {
    expect(sql).toContain('public.eh_area_interna_mx()')
    expect(sql).toContain("'forbidden_global_read'")
    expect(sql).toContain("'invalid_date_range'")
    expect(sql).toContain("'date_range_too_large'")
    expect(sql).toContain("public.log_rpc_error(")
    expect(sql).toContain('revoke all on function public.get_resumo_rede_periodo(date, date, text) from public')
    expect(sql).toContain('revoke all on function public.get_resumo_rede_periodo(date, date, text) from anon')
    expect(sql).toContain('grant execute on function public.get_resumo_rede_periodo(date, date, text) to authenticated')
  })
})
