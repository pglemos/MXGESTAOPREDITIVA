import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = 'supabase/migrations/20260721110000_carteira_simulacao_vendedor.sql'
const rollbackPath = 'supabase/rollbacks/20260721110000_carteira_simulacao_vendedor.sql'

describe('carteira seller simulation migration', () => {
  test('authorizes only internal MX callers acting for an active seller in the requested store', () => {
    const sql = readFileSync(migrationPath, 'utf8')

    for (const token of [
      'carteira_salvar_cliente_simulado_v1',
      'v_caller uuid := auth.uid()',
      "p_payload->>'acting_seller_user_id'",
      "p_payload->>'acting_store_id'",
      'public.eh_area_interna_mx(v_caller)',
      "lower(vl.role) IN ('vendedor', 'seller')",
      'vl.is_active = true',
      'seller_user_id = v_user',
      'loja_id = v_store_id',
      "'simulated_by'",
      "'acting_seller_user_id'",
      "'acting_store_id'",
      'REVOKE ALL ON FUNCTION public.carteira_salvar_cliente_simulado_v1(jsonb, text) FROM PUBLIC, anon',
      'GRANT EXECUTE ON FUNCTION public.carteira_salvar_cliente_simulado_v1(jsonb, text) TO authenticated',
    ]) expect(sql).toContain(token)
  })

  test('keeps idempotency scoped by caller and target seller and ships an executable rollback', () => {
    const sql = readFileSync(migrationPath, 'utf8')
    const rollback = readFileSync(rollbackPath, 'utf8')

    expect(sql).toContain("v_caller::text || ':' || v_user::text || ':' || p_idempotency_key")
    expect(sql).toContain('pg_advisory_xact_lock')
    expect(rollback).toContain('-- DOWN')
    expect(rollback).toContain('DROP FUNCTION IF EXISTS public.carteira_salvar_cliente_simulado_v1(jsonb, text)')
  })
})
