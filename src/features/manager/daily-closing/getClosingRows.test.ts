import { describe, expect, test } from 'bun:test'
import { getClosingRows } from './ManagerDailyClosing.container'
import type { CheckinCorrectionRequest, CheckinWithTotals } from '@/types/database'

// MX-22.5 (AC-6; Spec §10 "pendência gerencial"): reconciliação aditiva com a
// taxonomia de 7 estados de checkin-history-state.ts (22.3). `status`
// (getClosingStatus, binário) permanece intocado — historyState/historyActions
// são campos novos ao lado, verificados aqui só quanto à fiação (a lógica de
// resolveHistoryRowState já é testada em checkin-history-state.test.ts).
function baseCheckin(overrides: Partial<CheckinWithTotals> = {}): CheckinWithTotals {
  return {
    id: 'checkin-1',
    seller_user_id: 'seller-1',
    reference_date: '2026-07-10',
    metric_scope: 'historical',
    submitted_at: null,
    submission_status: null,
    submitted_late: null,
    ...overrides,
  } as CheckinWithTotals
}

function pendingRequest(checkinId: string): CheckinCorrectionRequest {
  return {
    id: 'req-1',
    checkin_id: checkinId,
    seller_id: 'seller-1',
    store_id: 'store-1',
    status: 'pending',
    created_at: '2026-07-11T10:00:00.000Z',
  } as CheckinCorrectionRequest
}

function rejectedRequest(checkinId: string): CheckinCorrectionRequest {
  return {
    id: 'req-2',
    checkin_id: checkinId,
    seller_id: 'seller-2',
    store_id: 'store-1',
    status: 'rejected',
    rejection_reason: 'Sem evidência',
    created_at: '2026-07-11T10:00:00.000Z',
  } as CheckinCorrectionRequest
}

describe('getClosingRows — taxonomia de pendência gerencial (MX-22.5 AC-6)', () => {
  test('vendedor com solicitação pending aparece como aguardando_aprovacao', () => {
    const seller = { id: 'seller-1', name: 'Ana' }
    const checkin = baseCheckin()
    const rows = getClosingRows(
      [seller],
      [],
      [],
      [pendingRequest(checkin.id)],
      '2026-07-10',
      false,
    )
    // Sem checkin em `checkins` (histórico não entra na lista de fechamentos
    // do dia) mas com solicitação: sem checkin_id, latestRequestForCheckin
    // não casa a solicitação — cai na régua de 12:00 já testada em 22.1/22.2.
    expect(rows[0].historyState).toBe('fora_do_horario')

    const rowsWithCheckin = getClosingRows(
      [seller],
      [checkin],
      [],
      [pendingRequest(checkin.id)],
      '2026-07-10',
      false,
    )
    expect(rowsWithCheckin[0].historyState).toBe('aguardando_aprovacao')
    expect(rowsWithCheckin[0].historyActions).toEqual(['ver_solicitacao'])
  })

  test('vendedor com solicitação recusada aparece como recusado', () => {
    const seller = { id: 'seller-2', name: 'Bruno' }
    const checkin = baseCheckin({ id: 'checkin-2', seller_user_id: 'seller-2' })
    const rows = getClosingRows(
      [seller],
      [checkin],
      [],
      [rejectedRequest(checkin.id)],
      '2026-07-10',
      false,
    )
    expect(rows[0].historyState).toBe('recusado')
    expect(rows[0].historyActions).toEqual(['ver_motivo_recusa', 'criar_nova_versao'])
  })

  test('vendedor sem checkin, sem solicitação, data já fora do horário (§7.2/22.1) aparece como fora_do_horario', () => {
    const seller = { id: 'seller-3', name: 'Carla' }
    const rows = getClosingRows([seller], [], [], [], '2020-01-01', false)
    expect(rows[0].historyState).toBe('fora_do_horario')
    expect(rows[0].historyActions).toEqual(['regularizar'])
  })

  test('sem `date`, historyState fica null e status binário existente não é afetado', () => {
    const seller = { id: 'seller-4', name: 'Duda' }
    const rows = getClosingRows([seller], [], [])
    expect(rows[0].historyState).toBeNull()
    expect(rows[0].historyActions).toEqual([])
    expect(rows[0].status).toBeTruthy()
  })
})
