import { eachDayOfInterval, format, parseISO } from 'date-fns'
import type { CheckinWithTotals } from '@/types/database'

export function averageDiscipline(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null
}

export function buildDisciplineTrend(checkins: CheckinWithTotals[], start: string, end: string) {
  return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).map(day => {
    const key = format(day, 'yyyy-MM-dd')
    const values = checkins
      .filter(checkin => checkin.reference_date === key)
      .map(checkin => checkin.pontuacao_disciplina_final)
      .filter((value): value is number => typeof value === 'number')
    return { date: key, label: format(day, 'dd/MM'), value: averageDiscipline(values) }
  })
}

export function buildClosingSummary(checkins: CheckinWithTotals[]) {
  return checkins.reduce((summary, checkin) => ({
    showroomVisits: summary.showroomVisits + (checkin.visitas_porta_prev_day || 0),
    carteiraLeads: summary.carteiraLeads + (checkin.leads_prev_day || 0),
    carteiraVisits: summary.carteiraVisits + (checkin.visitas_cart_prev_day || 0),
    internetLeads: summary.internetLeads + (checkin.leads_net_prev_day || 0),
    internetVisits: summary.internetVisits + (checkin.visitas_net_prev_day || 0),
    sales: summary.sales + (checkin.vnd_porta_prev_day || 0) + (checkin.vnd_cart_prev_day || 0) + (checkin.vnd_net_prev_day || 0),
  }), { showroomVisits: 0, carteiraLeads: 0, carteiraVisits: 0, internetLeads: 0, internetVisits: 0, sales: 0 })
}
