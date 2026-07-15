import { describe, expect, test } from 'bun:test'
import type { CheckinCorrectionRequest, CheckinFormData, DailyCheckin } from '@/types/database'
import {
  actionsForHistoryRowState,
  latestRequestForCheckin,
  resolveHistoryRowState,
} from './checkin-history-state'

const closing = (date: string) => ({
  id: `checkin-${date}`,
  reference_date: date,
  metric_scope: 'daily',
  submitted_at: `${date}T11:00:00.000Z`,
  submission_status: 'on_time',
  visit_prev_day: 1,
}) as DailyCheckin

const request = (overrides: Partial<CheckinCorrectionRequest> = {}) => ({
  id: 'req-1',
  checkin_id: 'checkin-2026-07-09',
  seller_id: 'seller-1',
  store_id: 'store-1',
  requested_values: {} as CheckinFormData,
  reason: 'Correção de registro',
  status: 'pending',
  auditor_id: null,
  reviewed_at: null,
  created_at: '2026-07-09T18:00:00.000Z',
  ...overrides,
} as unknown as CheckinCorrectionRequest)

describe('resolveHistoryRowState (MX-22.3 — Spec §8.1)', () => {
  test('sem lançamento, sem solicitação, antes do prazo (12:00 SP de D+1) = pendente', () => {
    const state = resolveHistoryRowState({
      date: '2026-07-09',
      checkin: null,
      latestRequest: null,
      now: new Date('2026-07-10T14:59:00.000Z'), // 11:59 SP
      isToday: false,
    })
    expect(state).toBe('pendente')
  })

  test('sem lançamento, sem solicitação, depois do prazo = fora_do_horario', () => {
    const state = resolveHistoryRowState({
      date: '2026-07-09',
      checkin: null,
      latestRequest: null,
      now: new Date('2026-07-10T15:01:00.000Z'), // 12:01 SP
      isToday: false,
    })
    expect(state).toBe('fora_do_horario')
  })

  test('lançamento finalizado, sem solicitação = finalizado', () => {
    const state = resolveHistoryRowState({
      date: '2026-07-09',
      checkin: closing('2026-07-09'),
      latestRequest: null,
      now: new Date('2026-07-10T18:00:00.000Z'),
      isToday: false,
    })
    expect(state).toBe('finalizado')
  })

  test('data de hoje, sem lançamento finalizado = em_andamento (não pendente/fora_do_horario)', () => {
    const state = resolveHistoryRowState({
      date: '2026-07-10',
      checkin: null,
      latestRequest: null,
      now: new Date('2026-07-10T14:00:00.000Z'),
      isToday: true,
    })
    expect(state).toBe('em_andamento')
  })

  test('solicitação pending tem precedência sobre lançamento finalizado = aguardando_aprovacao', () => {
    const state = resolveHistoryRowState({
      date: '2026-07-09',
      checkin: closing('2026-07-09'),
      latestRequest: request({ status: 'pending' }),
      now: new Date('2026-07-10T18:00:00.000Z'),
      isToday: false,
    })
    expect(state).toBe('aguardando_aprovacao')
  })

  test('solicitação approved = aprovado', () => {
    const state = resolveHistoryRowState({
      date: '2026-07-09',
      checkin: closing('2026-07-09'),
      latestRequest: request({ status: 'approved' }),
      now: new Date('2026-07-10T18:00:00.000Z'),
      isToday: false,
    })
    expect(state).toBe('aprovado')
  })

  test('solicitação rejected = recusado', () => {
    const state = resolveHistoryRowState({
      date: '2026-07-09',
      checkin: closing('2026-07-09'),
      latestRequest: request({ status: 'rejected' }),
      now: new Date('2026-07-10T18:00:00.000Z'),
      isToday: false,
    })
    expect(state).toBe('recusado')
  })

  test('rejected seguido de nova solicitação pending = aguardando_aprovacao (transição rejected → pending)', () => {
    // O chamador é responsável por passar a MAIS RECENTE (latestRequestForCheckin já faz isso).
    const state = resolveHistoryRowState({
      date: '2026-07-09',
      checkin: closing('2026-07-09'),
      latestRequest: request({ status: 'pending', created_at: '2026-07-11T10:00:00.000Z' }),
      now: new Date('2026-07-11T18:00:00.000Z'),
      isToday: false,
    })
    expect(state).toBe('aguardando_aprovacao')
  })
})

describe('actionsForHistoryRowState (Spec §8.2)', () => {
  test('finalizado → Ver detalhes + Ajustar', () => {
    expect(actionsForHistoryRowState('finalizado')).toEqual(['ver_detalhes', 'ajustar'])
  })

  test('pendente e fora_do_horario → Regularizar', () => {
    expect(actionsForHistoryRowState('pendente')).toEqual(['regularizar'])
    expect(actionsForHistoryRowState('fora_do_horario')).toEqual(['regularizar'])
  })

  test('aguardando_aprovacao → Ver solicitação, nunca Ajustar/Regularizar (guard de duplicidade pending do servidor)', () => {
    const actions = actionsForHistoryRowState('aguardando_aprovacao')
    expect(actions).toEqual(['ver_solicitacao'])
    expect(actions).not.toContain('ajustar')
    expect(actions).not.toContain('regularizar')
  })

  test('aprovado → Ver versão original + Ver versão aprovada + Ver auditoria', () => {
    expect(actionsForHistoryRowState('aprovado')).toEqual([
      'ver_versao_original',
      'ver_versao_aprovada',
      'ver_auditoria',
    ])
  })

  test('recusado → Ver motivo da recusa + Criar nova versão (reabre o drawer normal)', () => {
    expect(actionsForHistoryRowState('recusado')).toEqual(['ver_motivo_recusa', 'criar_nova_versao'])
  })
})

describe('latestRequestForCheckin', () => {
  test('retorna null quando não há solicitação para o checkin', () => {
    expect(latestRequestForCheckin([], 'checkin-1')).toBeNull()
    expect(latestRequestForCheckin([request({ checkin_id: 'outro' })], 'checkin-1')).toBeNull()
  })

  test('retorna a mais recente por created_at entre várias do mesmo checkin (rejected → nova pending)', () => {
    const older = request({ id: 'req-old', checkin_id: 'checkin-1', status: 'rejected', created_at: '2026-07-09T10:00:00.000Z' })
    const newer = request({ id: 'req-new', checkin_id: 'checkin-1', status: 'pending', created_at: '2026-07-11T10:00:00.000Z' })
    const result = latestRequestForCheckin([older, newer], 'checkin-1')
    expect(result?.id).toBe('req-new')
  })
})
