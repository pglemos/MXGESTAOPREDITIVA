import { describe, expect, it } from 'vitest'
import type { CheckinWithTotals } from '@/types/database'
import {
  buildLeadConferenceRows,
  getLeadConferencePeriod,
  getLeadConferenceRowDifference,
  summarizeLeadConference,
} from './lead-conference'

describe('lead conference', () => {
  it('calcula períodos fechados a partir da data selecionada', () => {
    expect(getLeadConferencePeriod('current_week', '2026-07-12')).toEqual({ start: '2026-07-06', end: '2026-07-12' })
    expect(getLeadConferencePeriod('previous_month', '2026-07-12')).toEqual({ start: '2026-06-01', end: '2026-06-30' })
  })

  it('agrega internet e carteira por vendedor sem misturar canais', () => {
    const rows = buildLeadConferenceRows(
      [{ id: 'seller-1', name: 'Ana' }, { id: 'seller-2', name: 'Bia' }],
      [
        { seller_user_id: 'seller-1', leads_net_prev_day: 3, leads_prev_day: 2 } as CheckinWithTotals,
        { seller_user_id: 'seller-1', leads_net_prev_day: 4, leads_prev_day: 1 } as CheckinWithTotals,
      ],
    )
    expect(rows[0]).toMatchObject({ internetMx: 7, carteiraMx: 3 })
    expect(rows[1]).toMatchObject({ internetMx: 0, carteiraMx: 0 })
  })

  it('só conclui o resumo quando todos os valores oficiais foram informados', () => {
    const incomplete = [{
      sellerId: 'seller-1', sellerName: 'Ana', internetMx: 7, internetOfficial: 8, carteiraMx: 3, carteiraOfficial: null,
    }]
    expect(summarizeLeadConference(incomplete).complete).toBe(false)

    const complete = [{ ...incomplete[0], carteiraOfficial: 1 }]
    expect(getLeadConferenceRowDifference(complete[0])).toBe(-1)
    expect(summarizeLeadConference(complete)).toEqual({
      totalMx: 10,
      totalOfficial: 9,
      totalDifference: -1,
      divergentSellers: 1,
      complete: true,
    })
  })
})
