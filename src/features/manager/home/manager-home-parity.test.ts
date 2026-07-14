import { describe, expect, test } from 'bun:test'
import {
  AGENDAMENTOS_POR_VENDA,
  buildSuggestedAction,
  buildTodayReading,
  calculateAppointmentGap,
  calculateAppointmentTarget,
  calculateForecastCoverage,
  calculateSalesForecast,
  calculateSalesNeededToday,
  calculateSellerFinancialStatus,
  formatSales,
  getManagerCalendarDate,
  saleSuffix,
  sortTeamFocus,
  type ManagerTeamFocusItem,
} from './manager-home-parity'

describe('manager home Base44 parity', () => {
  test('usa a data civil de São Paulo sem a virada operacional das 12h', () => {
    expect(getManagerCalendarDate(new Date('2026-07-13T02:59:00.000Z'))).toBe('2026-07-12')
    expect(getManagerCalendarDate(new Date('2026-07-13T03:00:00.000Z'))).toBe('2026-07-13')
    expect(getManagerCalendarDate(new Date('2026-07-13T12:00:00.000Z'))).toBe('2026-07-13')
  })

  test('conta os dias úteis decorridos no mês pela data civil gerencial', async () => {
    const module = await import('./manager-home-parity') as Record<string, unknown>
    const countElapsedBusinessDays = module.countElapsedBusinessDays
    expect(typeof countElapsedBusinessDays).toBe('function')
    if (typeof countElapsedBusinessDays !== 'function') return
    expect(countElapsedBusinessDays('2026-07-01')).toBe(1)
    expect(countElapsedBusinessDays('2026-07-05')).toBe(3)
    expect(countElapsedBusinessDays('2026-07-13')).toBe(9)
  })

  test('resolve o intervalo mensal completo da data civil gerencial', async () => {
    const module = await import('./manager-home-parity') as Record<string, unknown>
    const getManagerMonthRange = module.getManagerMonthRange
    expect(typeof getManagerMonthRange).toBe('function')
    if (typeof getManagerMonthRange !== 'function') return
    expect(getManagerMonthRange('2026-07-13')).toEqual({
      start: '2026-07-01',
      end: '2026-07-31',
    })
    expect(getManagerMonthRange('2024-02-29')).toEqual({
      start: '2024-02-01',
      end: '2024-02-29',
    })
  })

  test('hidrata a busca da Rotina da Equipe a partir do clique no gráfico', async () => {
    const module = await import('./manager-home-parity') as Record<string, unknown>
    const getManagerTeamSearch = module.getManagerTeamSearch
    expect(typeof getManagerTeamSearch).toBe('function')
    if (typeof getManagerTeamSearch !== 'function') return

    expect(getManagerTeamSearch('?busca=Maria%20Silva')).toBe('Maria Silva')
    expect(getManagerTeamSearch('?busca=%20%20')).toBe('')
    expect(getManagerTeamSearch('?outra=chave')).toBe('')
  })

  test('mantém a regra Base44 de três agendamentos por venda e previsão decimal', () => {
    expect(AGENDAMENTOS_POR_VENDA).toBe(3)
    expect(calculateSalesForecast(0)).toBe(0)
    expect(calculateSalesForecast(4)).toBeCloseTo(1.3333333333)
    expect(formatSales(calculateSalesForecast(4))).toBe('1,3')
    expect(calculateSalesForecast(4, null)).toBeNull()
    expect(saleSuffix(1)).toBe('venda')
    expect(saleSuffix(1.3)).toBe('vendas')
  })

  test('calcula necessidade pela meta diária e vendas do dia', () => {
    expect(calculateSalesNeededToday(44, 22, 0)).toBe(2)
    expect(calculateSalesNeededToday(44, 22, 1)).toBe(1)
    expect(calculateSalesNeededToday(44, 22, 2)).toBe(0)
    expect(calculateSalesNeededToday(44, 0, 0)).toBe(0)
    expect(calculateSalesNeededToday(0, 22, 0)).toBeNull()
  })

  test('deriva meta, gap e cobertura pelos mesmos limites Base44', () => {
    expect(calculateAppointmentTarget(null)).toBeNull()
    expect(calculateAppointmentTarget(2)).toBe(6)
    expect(calculateAppointmentTarget(2, null)).toBeNull()
    expect(calculateAppointmentGap(0, null)).toBeNull()
    expect(calculateAppointmentGap(4, 6)).toBe(-2)
    expect(calculateForecastCoverage(1, null)).toBeNull()
    expect(calculateForecastCoverage(1, 0)).toBeNull()
    expect(calculateForecastCoverage(1, 2)).toBe(50)
  })

  test('reproduz todas as mensagens da Leitura do Dia', () => {
    expect(buildTodayReading(null, 2)).toBe('Base estatística insuficiente para projetar vendas.')
    expect(buildTodayReading(0, null)).toBe('Cadastre a meta da loja para ativar a previsibilidade.')
    expect(buildTodayReading(0, 0)).toBe('A necessidade de vendas do dia já foi atendida.')
    expect(buildTodayReading(0, 2)).toBe('A projeção ainda está 2 vendas abaixo do necessário.')
    expect(buildTodayReading(1, 2)).toBe('A projeção ainda está 1 venda abaixo do necessário.')
    expect(buildTodayReading(2, 2)).toBe('A projeção está alinhada à necessidade do dia.')
    expect(buildTodayReading(2.3, 2)).toBe('A projeção está 0,3 vendas acima da necessidade do dia.')
  })

  test('reproduz todas as ramificações da Ação sugerida', () => {
    expect(buildSuggestedAction(null, null, 2)).toContain('Base estatística insuficiente')
    expect(buildSuggestedAction(null, 0, null)).toBe('Cadastre a meta da loja para ativar a previsibilidade.')
    expect(buildSuggestedAction(0, 0, 0)).toBe('Prioridade do gerente: manter a agenda ativa e antecipar o próximo objetivo da loja.')
    expect(buildSuggestedAction(-1, 1, 2)).toBe('Prioridade do gerente: elevar a agenda do dia e acompanhar negociações com maior chance de fechamento.')
    expect(buildSuggestedAction(0, 1, 2)).toBe('Prioridade do gerente: proteger o comparecimento dos agendamentos e atuar nas negociações prioritárias.')
    expect(buildSuggestedAction(0, 2, 2)).toBe('Prioridade do gerente: confirmar a agenda e acompanhar a execução para sustentar o resultado previsto.')
    expect(buildSuggestedAction(1, 3, 2)).toBe('Prioridade do gerente: proteger a agenda confirmada e aproveitar o excedente para antecipar a meta.')
  })

  test('classifica o status financeiro na mesma ordem de prioridade', () => {
    expect(calculateSellerFinancialStatus(2, 2, 1, 100).status).toBe('pode_subir')
    expect(calculateSellerFinancialStatus(1, 0, 1, 100).status).toBe('proximo')
    expect(calculateSellerFinancialStatus(0, 0, 1, 100).status).toBe('atingida')
    expect(calculateSellerFinancialStatus(null, 0, 0, 79).status).toBe('abaixo_ritmo')
    expect(calculateSellerFinancialStatus(null, 0, 0, null).status).toBe('evolucao')
  })

  test('ordena a equipe por status, previsão e carros faltantes sem mutar a entrada', () => {
    const items: ManagerTeamFocusItem[] = [
      teamItem('evolving', 'evolucao', 3, null),
      teamItem('below', 'abaixo_ritmo', 1, null),
      teamItem('can-two', 'pode_subir', 2, 2),
      teamItem('can-one', 'pode_subir', 2, 1),
      teamItem('close', 'proximo', 4, 1),
    ]

    expect(sortTeamFocus(items).map(item => item.sellerId)).toEqual([
      'can-one',
      'can-two',
      'close',
      'below',
      'evolving',
    ])
    expect(items.map(item => item.sellerId)).toEqual(['evolving', 'below', 'can-two', 'can-one', 'close'])
  })
})

function teamItem(
  sellerId: string,
  status: ManagerTeamFocusItem['financialStatus']['status'],
  forecast: number,
  missingCars: number | null,
): ManagerTeamFocusItem {
  return {
    sellerId,
    sellerName: sellerId,
    appointmentsToday: 0,
    salesForecastToday: forecast,
    salesThisMonth: 0,
    nextCommissionBand: null,
    missingCarsToNextBand: missingCars,
    projectedAward: null,
    resultPercentage: null,
    financialStatus: {
      status,
      label: status,
      className: '',
    },
  }
}
