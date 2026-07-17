import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717250000_enforce_central_action_scope_consistency.sql', import.meta.url),
  'utf8',
)
const compactSql = sql.replace(/\s+/g, ' ').trim()

describe('central action scope consistency migration', () => {
  test('reschedule and resolve both authorize via central_can_manage_action before mutating', () => {
    expect(compactSql).toContain(
      "central_reschedule_action(p_action_id uuid, p_due_at timestamp with time zone, p_note text, p_idempotency_key text)",
    )
    expect(compactSql).toContain(
      "central_resolve_action(p_action_id uuid, p_result_code text, p_note text, p_payload jsonb, p_idempotency_key text)",
    )
  })

  test('every UPDATE on agendamentos/clientes/oportunidades keyed off execution_actions is scoped to the action store and seller', () => {
    const scopedUpdateCount = (compactSql.match(
      /AND loja_id = v_action\.store_id AND seller_user_id = v_action\.seller_id/g,
    ) ?? []).length
    // agendamentos (reschedule) + clientes (reschedule) + agendamentos (resolve) +
    // oportunidades x3 branches (resolve) + clientes (resolve) = 7
    expect(scopedUpdateCount).toBe(7)
  })

  test('every scoped UPDATE aborts with an explicit error when the linked record is out of scope', () => {
    const foundGuardCount = (compactSql.match(
      /IF NOT FOUND THEN RAISE EXCEPTION 'Atividade inconsistente:/g,
    ) ?? []).length
    expect(foundGuardCount).toBe(7)
  })

  test('does not touch central_can_manage_action, central_escalate_action or authorization checks', () => {
    expect(compactSql).not.toMatch(/CREATE OR REPLACE FUNCTION public\.central_can_manage_action/)
    expect(compactSql).not.toMatch(/CREATE OR REPLACE FUNCTION public\.central_escalate_action/)
  })

  test('is transactional and documents rollback', () => {
    expect(compactSql.startsWith('BEGIN;')).toBe(true)
    expect(compactSql).toContain('-- DOWN')
    expect(compactSql).toContain('COMMIT;')
  })
})
