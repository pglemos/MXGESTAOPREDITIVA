import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = 'supabase/migrations/20260721150000_carteira_simulacao_inline_cleanup.sql'
const rollbackPath = 'supabase/rollbacks/20260721150000_carteira_simulacao_inline_cleanup.sql'

describe('carteira seller simulation inline cleanup', () => {
  test('inlines delegated execution into the existing v2 RPC and removes the helper', () => {
    const sql = readFileSync(migrationPath, 'utf8')

    for (const token of [
      'CREATE OR REPLACE FUNCTION public.carteira_salvar_cliente_v2',
      'v_caller uuid := auth.uid()',
      "p_payload ? 'acting_seller_user_id'",
      'public.eh_area_interna_mx(v_caller)',
      "lower(vl.role) IN ('vendedor', 'seller')",
      "'simulated_by'",
      "'acting_seller_user_id'",
      "'acting_store_id'",
      'PERFORM set_config(\'request.jwt.claim.sub\', v_user::text, true)',
      'PERFORM set_config(\'request.jwt.claim.sub\', v_caller::text, true)',
      'DROP FUNCTION IF EXISTS public.carteira_salvar_cliente_simulado_v1(jsonb, text)',
    ]) expect(sql).toContain(token)
  })

  test('keeps the public RPC signature stable and ships a rollback', () => {
    const sql = readFileSync(migrationPath, 'utf8')
    const rollback = readFileSync(rollbackPath, 'utf8')

    expect(sql).not.toContain('CREATE OR REPLACE FUNCTION public.carteira_salvar_cliente_simulado_v1')
    expect(sql).toContain("v_caller::text || ':' || v_user::text || ':' || p_idempotency_key")
    expect(rollback).toContain('-- DOWN')
    expect(rollback).toContain('CREATE OR REPLACE FUNCTION public.carteira_salvar_cliente_simulado_v1')
  })
})
