import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migration = readFileSync(
  new URL('../../supabase/migrations/20260710120000_harden_submit_checkin_operational_date.sql', import.meta.url),
  'utf8',
)

describe('submit_checkin operational date hardening migration', () => {
  test('libera D0 antes de 12h somente após D-1 realmente finalizado', () => {
    expect(migration).toContain("extract(hour from v_now_sp) < 12 AND NOT EXISTS")
    expect(migration).toContain("ld.reference_date = v_now_sp::date - 1")
    expect(migration).toContain("coalesce(ld.submission_status, '') <> 'draft'")
    expect(migration).toContain("nullif(trim(coalesce(ld.zero_reason, '')), '') IS NOT NULL")
  })

  test('protege fechamento diário finalizado inclusive em corrida de upsert', () => {
    expect(migration).toContain('Fechamento já concluído para esta data. Use o histórico para solicitar correção.')
    expect(migration).toContain("WHERE EXCLUDED.metric_scope <> 'daily'")
    expect(migration).toContain('IF v_checkin_id IS NULL THEN')
  })

  test('mantém histórico próprio e disciplina persistida sem reativar trava horária', () => {
    expect(migration).toContain("v_scope_text = 'historical'")
    expect(migration).toContain('pontuacao_disciplina_final')
    expect(migration).not.toContain('Prazo oficial encerrado às 09h30')
  })
})
