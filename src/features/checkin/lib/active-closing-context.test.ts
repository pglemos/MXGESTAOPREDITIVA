import { describe, expect, test } from 'bun:test'
import type { DailyCheckin } from '@/types/database'
import { resolveActiveClosingContext } from './active-closing-context'

const closing = (date: string) => ({
  id: `checkin-${date}`,
  reference_date: date,
  metric_scope: 'daily',
  submitted_at: `${date}T11:00:00.000Z`,
  submission_status: 'on_time',
  visit_prev_day: 1,
}) as DailyCheckin

const draftClosing = (date: string) => ({
  ...closing(date),
  submitted_at: null,
  submission_status: 'draft',
}) as DailyCheckin

const emptySubmittedClosing = (date: string) => ({
  ...closing(date),
  leads_prev_day: 0,
  agd_cart_prev_day: 0,
  agd_net_prev_day: 0,
  agd_cart_today: 0,
  agd_net_today: 0,
  vnd_porta_prev_day: 0,
  vnd_cart_prev_day: 0,
  vnd_net_prev_day: 0,
  visit_prev_day: 0,
  zero_reason: null,
}) as DailyCheckin

const justifiedZeroClosing = (date: string) => ({
  ...emptySubmittedClosing(date),
  zero_reason: 'Folga',
}) as DailyCheckin

describe('resolveActiveClosingContext', () => {
  test('before noon keeps D-1 main date when previous closing is pending', () => {
    const ctx = resolveActiveClosingContext({
      today: '2026-07-09',
      yesterday: '2026-07-08',
      now: new Date('2026-07-09T11:15:00.000Z'),
      yesterdayClosing: null,
      todayClosing: null,
    })

    expect(ctx.mainDate).toBe('2026-07-08')
    expect(ctx.mainLabel).toBe('Ontem')
    expect(ctx.previousCard).toBeNull()
    expect(ctx.canEditMainForm).toBe(true)
  })

  test('before noon releases D0 immediately when D-1 was submitted', () => {
    const ctx = resolveActiveClosingContext({
      today: '2026-07-09',
      yesterday: '2026-07-08',
      now: new Date('2026-07-09T11:15:00.000Z'),
      yesterdayClosing: closing('2026-07-08'),
      todayClosing: null,
    })

    expect(ctx.mainDate).toBe('2026-07-09')
    expect(ctx.mainLabel).toBe('Hoje')
    expect(ctx.previousCard?.type).toBe('previous_done')
    expect(ctx.isMainDateSubmitted).toBe(false)
  })

  test('before noon treats D-1 draft as pending and keeps D-1 editable', () => {
    const ctx = resolveActiveClosingContext({
      today: '2026-07-09',
      yesterday: '2026-07-08',
      now: new Date('2026-07-09T11:15:00.000Z'),
      yesterdayClosing: draftClosing('2026-07-08'),
      todayClosing: null,
    })

    expect(ctx.mainDate).toBe('2026-07-08')
    expect(ctx.mainCheckin?.reference_date).toBe('2026-07-08')
    expect(ctx.previousCard).toBeNull()
    expect(ctx.canEditMainForm).toBe(true)
  })

  test('after noon always uses D0 and shows pending previous card', () => {
    const ctx = resolveActiveClosingContext({
      today: '2026-07-09',
      yesterday: '2026-07-08',
      now: new Date('2026-07-09T15:01:00.000Z'),
      yesterdayClosing: null,
      todayClosing: null,
    })

    expect(ctx.mainDate).toBe('2026-07-09')
    expect(ctx.mainLabel).toBe('Hoje')
    expect(ctx.previousCard?.type).toBe('previous_pending')
    expect(ctx.canEditMainForm).toBe(true)
  })

  test('after noon treats D-1 draft as previous pending alert', () => {
    const ctx = resolveActiveClosingContext({
      today: '2026-07-09',
      yesterday: '2026-07-08',
      now: new Date('2026-07-09T15:01:00.000Z'),
      yesterdayClosing: draftClosing('2026-07-08'),
      todayClosing: null,
    })

    expect(ctx.mainDate).toBe('2026-07-09')
    expect(ctx.previousCard?.type).toBe('previous_pending')
    expect(ctx.canEditMainForm).toBe(true)
  })

  test('after noon keeps D0 open when only D-1 was submitted', () => {
    const ctx = resolveActiveClosingContext({
      today: '2026-07-09',
      yesterday: '2026-07-08',
      now: new Date('2026-07-09T15:01:00.000Z'),
      yesterdayClosing: closing('2026-07-08'),
      todayClosing: null,
    })

    expect(ctx.mainDate).toBe('2026-07-09')
    expect(ctx.isMainDateSubmitted).toBe(false)
    expect(ctx.canEditMainForm).toBe(true)
    expect(ctx.previousCard?.type).toBe('previous_done')
  })

  test('after noon blocks only D0 when D0 was submitted', () => {
    const ctx = resolveActiveClosingContext({
      today: '2026-07-09',
      yesterday: '2026-07-08',
      now: new Date('2026-07-09T15:01:00.000Z'),
      yesterdayClosing: closing('2026-07-08'),
      todayClosing: closing('2026-07-09'),
    })

    expect(ctx.mainDate).toBe('2026-07-09')
    expect(ctx.mainCheckin?.reference_date).toBe('2026-07-09')
    expect(ctx.isMainDateSubmitted).toBe(true)
    expect(ctx.canEditMainForm).toBe(false)
    expect(ctx.mode).toBe('today_submitted')
    expect(ctx.previousCard?.type).toBe('previous_done')
  })

  test('after noon reopens D0 when submitted row is empty and has no zero justification', () => {
    const ctx = resolveActiveClosingContext({
      today: '2026-07-09',
      yesterday: '2026-07-08',
      now: new Date('2026-07-09T15:01:00.000Z'),
      yesterdayClosing: closing('2026-07-08'),
      todayClosing: emptySubmittedClosing('2026-07-09'),
    })

    expect(ctx.mainDate).toBe('2026-07-09')
    expect(ctx.isMainDateSubmitted).toBe(false)
    expect(ctx.canEditMainForm).toBe(true)
    expect(ctx.mode).toBe('today_open')
  })

  test('after noon keeps justified zero D0 closed', () => {
    const ctx = resolveActiveClosingContext({
      today: '2026-07-09',
      yesterday: '2026-07-08',
      now: new Date('2026-07-09T15:01:00.000Z'),
      yesterdayClosing: closing('2026-07-08'),
      todayClosing: justifiedZeroClosing('2026-07-09'),
    })

    expect(ctx.isMainDateSubmitted).toBe(true)
    expect(ctx.canEditMainForm).toBe(false)
    expect(ctx.mode).toBe('today_submitted')
  })
})
