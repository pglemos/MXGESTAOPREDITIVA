import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260714150000_definitive_daily_closing_window.sql', import.meta.url),
  'utf8',
)

describe('MX-22 definitive daily closing window migration', () => {
  test('separates the 12:00 daily closing window from the 09:30 Agenda D+1 snapshot', () => {
    expect(sql).toContain('continua válido até 12:00')
    expect(sql).toContain('09:30 é exclusivo do snapshot Agenda D+1')
  })

  test('computes lateness against the 12:00 deadline of reference_date + 1 day, not the wall clock', () => {
    expect(sql).toContain("(NEW.reference_date + INTERVAL '1 day') AT TIME ZONE 'America/Sao_Paulo'")
    expect(sql).toContain("NEW.submission_status := CASE WHEN is_late THEN 'late' ELSE 'on_time' END")
    expect(sql).toContain('NEW.submitted_late := is_late')
    // Not an unconditional on_time — that would erase real lateness detection.
    expect(sql).not.toContain("NEW.submission_status := 'on_time';\n      NEW.submitted_late := false;")
  })

  test('only clears penalty/discipline fields when the submission is actually on time', () => {
    expect(sql).toContain('IF NOT is_late THEN')
    expect(sql).toContain('NEW.finalizado_apos_prazo := false')
  })

  test('preserves atraso only when a historical regularization is approved', () => {
    expect(sql).toContain("OLD.metric_scope = 'historical'::public.checkin_scope")
  })

  test('guards one operational closing per seller, store, date and scope', () => {
    expect(sql).toContain('lancamentos_diarios_seller_store_reference_scope_key')
    expect(sql).toContain("contype = 'u'")
    expect(sql).not.toContain('CREATE UNIQUE INDEX IF NOT EXISTS lancamentos_diarios_operational_key')
    expect(sql).toContain('(seller_user_id, store_id, reference_date, metric_scope)')
  })
})
