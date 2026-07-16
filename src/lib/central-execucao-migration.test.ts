import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = 'supabase/migrations/20260716170000_central_execucao_canonical_queue.sql'
const sql = readFileSync(migrationPath, 'utf8')

describe('Central de Execução canonical queue migration', () => {
  test('evolui execution_actions sem criar uma fila concorrente', () => {
    expect(sql).toContain('ALTER TABLE public.execution_actions')
    expect(sql).not.toContain('CREATE TABLE public.atividades_execucao')

    for (const column of [
      'cliente_id',
      'oportunidade_id',
      'agendamento_id',
      'evento_id',
      'activity_type',
      'result_code',
      'idempotency_key',
      'manager_required',
    ]) {
      expect(sql).toContain(column)
    }
  })

  test('preserva fontes existentes e adiciona origens comerciais', () => {
    for (const source of ['pdi', 'feedback', 'funil', 'manual', 'agendamento', 'cliente', 'sistema']) {
      expect(sql).toContain(`'${source}'`)
    }
  })

  test('inclui as RPCs transacionais e mecanismos de idempotência', () => {
    for (const rpc of [
      'central_create_manual_action',
      'central_sync_appointment_action',
      'central_reschedule_action',
      'central_resolve_action',
      'central_escalate_action',
    ]) {
      expect(sql).toContain(`FUNCTION public.${rpc}`)
    }

    expect(sql).toContain('FOR UPDATE')
    expect(sql).toContain('idempotency_key')
    expect(sql).toContain('SECURITY DEFINER')
    expect(sql).toContain('SET search_path = public')
  })

  test('backfill e sincronização são idempotentes', () => {
    expect(sql).toContain('central:agendamento:')
    expect(sql).toContain('ON CONFLICT')
    expect(sql).toContain('central_sync_appointment_action')
    expect(sql).toContain('trg_central_sync_agendamento_action')
  })

  test('não transforma eventos comerciais em registros editáveis', () => {
    expect(sql).not.toMatch(/UPDATE\s+public\.eventos_comerciais/i)
    expect(sql).not.toMatch(/DELETE\s+FROM\s+public\.eventos_comerciais/i)
  })
})
