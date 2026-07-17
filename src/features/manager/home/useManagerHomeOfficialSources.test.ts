import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const hookSource = readFileSync(new URL('./useManagerHomeOfficialSources.ts', import.meta.url), 'utf8')
const dashboardSource = readFileSync(
  new URL('../../dashboard-loja/sections/ManagerSellerParityHome.tsx', import.meta.url),
  'utf8',
)

describe('Manager Dashboard official sources', () => {
  test('consolidates and reads the same persisted Hoje plan used by Meta da Loja', () => {
    expect(hookSource).toContain("supabase.rpc('consolidate_store_target_plan'")
    expect(hookSource).toContain(".from('store_target_plans')")
    expect(hookSource).toContain(".eq('horizon', 'hoje')")
    expect(hookSource).toContain(".order('version', { ascending: false })")
  })

  test('counts only confirmed linked appointments with a defined modality', () => {
    expect(hookSource).toContain(".from('agendamentos')")
    expect(hookSource).toContain(".eq('confirmation_status', 'confirmado')")
    expect(hookSource).toContain(".not('modalidade', 'is', null)")
    expect(hookSource).toContain(".not('cliente_id', 'is', null)")
  })

  test('uses plan need and ratio instead of the fixed 22-day competing formula', () => {
    expect(dashboardSource).toContain('useManagerHomeOfficialSources')
    expect(dashboardSource).toContain('officialSources.plan?.required_sales')
    expect(dashboardSource).toContain('officialSources.plan?.appointments_per_sale')
    expect(dashboardSource).not.toContain('calculateSalesNeededToday(monthlyGoal, DIAS_UTEIS_MES_PADRAO, salesToday)')
  })

  test('reconciles total appointments with the seller breakdown', () => {
    expect(hookSource).toContain('appointmentsBySeller')
    expect(hookSource).toContain('totalAppointments: appointmentRows.length')
    expect(dashboardSource).toContain('officialSources.appointmentsBySeller.get(seller.id)')
  })
})
