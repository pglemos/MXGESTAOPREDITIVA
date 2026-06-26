import { describe, expect, test } from 'bun:test'
import {
  buildDailyRoutineReminder,
  calculateDailyRoutineDiscipline,
  DAILY_ROUTINE_MVP_FIELDS,
  deriveDailyRoutineSlots,
  isProductionZero,
  resolveCloseDayReminderSchedule,
  resolveCurrentRoutineSlotKey,
  resolveRoutineOffsets,
  resolveRoutineTimesFromWorkday,
} from './daily-routine'

describe('daily routine helpers', () => {
  test('keeps the MVP fields tied to lancamentos_diarios', () => {
    expect(DAILY_ROUTINE_MVP_FIELDS.map((field) => field.key)).toEqual([
      'leads_prev_day',
      'agd_cart_prev_day',
      'agd_net_prev_day',
      'agd_cart_today',
      'agd_net_today',
      'visit_prev_day',
      'vnd_porta_prev_day',
      'vnd_cart_prev_day',
      'vnd_net_prev_day',
      'note',
      'zero_reason',
    ])
    expect(DAILY_ROUTINE_MVP_FIELDS.every((field) => field.source === 'lancamentos_diarios')).toBe(true)
  })

  test('detects production zero without mixing it with discipline', () => {
    expect(isProductionZero({
      leads_prev_day: 0,
      agd_cart_today: 0,
      agd_net_today: 0,
      visit_prev_day: 0,
      vnd_porta_prev_day: 0,
      vnd_cart_prev_day: 0,
      vnd_net_prev_day: 0,
    })).toBe(true)

    expect(isProductionZero({
      leads_prev_day: 1,
      agd_cart_today: 0,
      agd_net_today: 0,
      visit_prev_day: 0,
      vnd_porta_prev_day: 0,
      vnd_cart_prev_day: 0,
      vnd_net_prev_day: 0,
    })).toBe(false)
  })

  test('calculates seller discipline by daily submissions only', () => {
    const discipline = calculateDailyRoutineDiscipline({
      sellerId: 'seller-1',
      referenceDates: ['2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14'],
      checkins: [
        { seller_user_id: 'seller-1', reference_date: '2026-05-11', metric_scope: 'daily' },
        { seller_user_id: 'seller-1', reference_date: '2026-05-12', metric_scope: 'adjustment' },
        { seller_user_id: 'seller-1', reference_date: '2026-05-13', metric_scope: 'daily' },
        { seller_user_id: 'seller-2', reference_date: '2026-05-14', metric_scope: 'daily' },
      ],
    })

    expect(discipline).toEqual({
      expected_days: 4,
      submitted_days: 2,
      pending_days: 2,
      percentage: 50,
      status: 'attention',
      label: 'Disciplina em atencao',
    })
  })

  test('builds a stable reminder payload for one seller and date', () => {
    const reminder = buildDailyRoutineReminder({
      seller: { id: 'seller-1', name: 'Ana' },
      storeId: 'store-1',
      referenceDate: '2026-05-14',
    })

    expect(reminder.dedupe_key).toBe('daily-routine:store-1:seller-1:2026-05-14')
    expect(reminder.recipient_id).toBe('seller-1')
  expect(reminder.link).toBe('/vendedor/terminal-mx')
  })

  test('resolves close-day reminder from profile schedule', () => {
    expect(resolveCloseDayReminderSchedule({
      enabled: true,
      reminderTime: null,
      workEndTime: '18:00:00',
      workDays: ['seg', 'ter'],
    })).toEqual({
      enabled: true,
      time: '18:00',
      workDays: ['seg', 'ter'],
    link: '/vendedor/terminal-mx',
    })

    expect(resolveCloseDayReminderSchedule({
      enabled: false,
      reminderTime: '17:45',
      workEndTime: '18:00',
      workDays: ['seg'],
    }).enabled).toBe(false)
  })

  test('derives daily routine checks from real event counters', () => {
    const slots = deriveDailyRoutineSlots({
      workStartTime: '09:00',
      workEndTime: '18:00',
      atendimentosHoje: 5,
      minimumAtendimentos: 5,
      clientesCriadosHoje: 1,
      clientesAtualizadosHoje: 2,
      agendamentosCriadosHoje: 1,
      acoesListaQuenteHoje: 1,
      fechamentoDiarioFeito: true,
    })

    expect(slots.map(slot => [slot.key, slot.state])).toEqual([
      ['mentalidade', 'not_required'],
      ['organizacao', 'done'],
      ['novos_leads', 'done'],
      ['prospeccao', 'done'],
      ['atendimento', 'done'],
      ['lista_quente', 'done'],
      ['fechamento', 'done'],
    ])
    expect(slots[0].progress).toBe('Sem fonte obrigatória')
    expect(slots[4].progress).toBe('5/5 atendimentos')
  })

  test('keeps routine pending when real event counters are below target', () => {
    const slots = deriveDailyRoutineSlots({
      atendimentosHoje: 2,
      minimumAtendimentos: 5,
      clientesCriadosHoje: 0,
      clientesAtualizadosHoje: 0,
      agendamentosCriadosHoje: 0,
      acoesListaQuenteHoje: 0,
      fechamentoDiarioFeito: false,
    })

    expect(slots.find(slot => slot.key === 'atendimento')?.state).toBe('pending')
    expect(slots.find(slot => slot.key === 'atendimento')?.progress).toBe('2/5 atendimentos')
    expect(slots.find(slot => slot.key === 'fechamento')?.state).toBe('pending')
  })

  test('spreads routine times inside seller workday when available', () => {
    expect(resolveRoutineTimesFromWorkday({
      workStartTime: '09:00',
      workEndTime: '18:00',
      slotCount: 4,
    })).toEqual(['09:00', '12:00', '15:00', '18:00'])

    expect(resolveRoutineTimesFromWorkday({
      workStartTime: null,
      workEndTime: '18:00',
      slotCount: 3,
    })).toEqual(['08:00', '08:15', '08:55'])
  })
})

describe('Central de Execução — Rotina do Dia (âncoras fixas, spec §5.2)', () => {
  test('exemplo da jornada padrão 08:00-18:00 do spec', () => {
    expect(resolveRoutineOffsets({ workStartTime: '08:00', lunchEndTime: '13:00', workEndTime: '18:00' })).toEqual({
      mentalidade: '08:00',
      organizacao: '08:15',
      novos_leads: '08:45',
      prospeccao: '11:00',
      atendimento: '13:00',
      lista_quente: '16:00',
      fechamento: '17:00',
    })
  })

  test('Teste de Aceite 8: jornada 10h-20h recalcula automaticamente', () => {
    const schedule = resolveRoutineOffsets({ workStartTime: '10:00', lunchEndTime: '13:00', workEndTime: '20:00' })
    expect(schedule.mentalidade).toBe('10:00')
    expect(schedule.organizacao).toBe('10:15')
    expect(schedule.novos_leads).toBe('10:45')
    expect(schedule.prospeccao).toBe('13:00')
    expect(schedule.lista_quente).toBe('18:00')
    expect(schedule.fechamento).toBe('19:00')
  })

  test('usa padrão 08:00/13:00/18:00 quando o vendedor não cadastrou horário', () => {
    expect(resolveRoutineOffsets({})).toEqual(resolveRoutineOffsets({
      workStartTime: '08:00',
      lunchEndTime: '13:00',
      workEndTime: '18:00',
    }))
  })

  test('resolveCurrentRoutineSlotKey escolhe a última etapa já iniciada', () => {
    const schedule = resolveRoutineOffsets({ workStartTime: '08:00', lunchEndTime: '13:00', workEndTime: '18:00' })
    expect(resolveCurrentRoutineSlotKey(schedule, 7 * 60)).toBe('mentalidade') // antes do expediente
    expect(resolveCurrentRoutineSlotKey(schedule, 8 * 60 + 30)).toBe('organizacao')
    expect(resolveCurrentRoutineSlotKey(schedule, 14 * 60)).toBe('atendimento')
    expect(resolveCurrentRoutineSlotKey(schedule, 23 * 60)).toBe('fechamento')
  })
})
