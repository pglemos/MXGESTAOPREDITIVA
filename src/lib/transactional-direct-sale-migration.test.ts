import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260710140000_transactional_direct_sale_and_competence.sql', import.meta.url),
  'utf8',
)

describe('transactional direct sale migration', () => {
  test('creates opportunity, exactly one official sale event and optional delivery in one RPC', () => {
    expect(sql).toContain('FUNCTION public.registrar_venda_direta')
    expect(sql).toContain('INSERT INTO public.oportunidades')
    expect(sql).toContain("'venda_realizada'")
    expect(sql).toContain('INSERT INTO public.agendamentos')
    expect(sql).not.toContain("'atendimento_comercial_realizado'")
  })

  test('deduplicates by store and normalized phone under transaction lock', () => {
    expect(sql).toContain('idx_clientes_loja_telefone_normalizado')
    expect(sql).toContain('pg_advisory_xact_lock')
    expect(sql).toContain('loja_id = v_store_id AND telefone_normalizado = v_phone')
    expect(sql).toContain("v_store_id uuid := nullif(p_payload->>'store_id', '')::uuid")
    expect(sql).toContain('pode_ler_cliente_por_oportunidade')
  })

  test('keeps created_at real and stores explicit competence and idempotency', () => {
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS data_competencia date')
    expect(sql).toContain('idempotency_key')
    const rpc = sql.slice(sql.indexOf('FUNCTION public.registrar_venda_direta'))
    expect(rpc).not.toMatch(/INSERT INTO public\.(clientes|oportunidades)[\s\S]*created_at/)
    expect(rpc).toContain("v_caller_id::text || ':' || v_store_id::text")
    expect(rpc).toContain('Nenhum dado parcial foi mantido')
  })
})

describe('idempotência da venda direta (2.2.6, auditoria 2026-07-10)', () => {
  const rpc = sql.slice(sql.indexOf('FUNCTION public.registrar_venda_direta'))

  test('reenvio com a mesma chave devolve a venda existente com duplicate:true, sem novo evento', () => {
    expect(rpc).toContain("'duplicate', true")
    expect(rpc).toContain("WHERE idempotency_key = v_key || ':venda'")
  })

  test('revalida a chave depois do advisory lock (corrida entre duas chamadas simultâneas)', () => {
    expect(rpc).toContain('Revalida depois de adquirir o lock')
    const posLock = rpc.slice(rpc.indexOf('pg_advisory_xact_lock'))
    expect(posLock).toContain('WHERE idempotency_key = v_key')
  })

  test('unicidade garantida por índice parcial em oportunidades e eventos_comerciais', () => {
    expect(sql).toContain('CREATE UNIQUE INDEX IF NOT EXISTS idx_oportunidades_idempotency_key')
    expect(sql).toContain('CREATE UNIQUE INDEX IF NOT EXISTS idx_eventos_comerciais_idempotency_key')
    expect(sql).toContain('WHERE idempotency_key IS NOT NULL')
  })
})
