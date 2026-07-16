import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = 'supabase/migrations/20260716210000_carteira_base44_security_hardening.sql'
const rollbackPath = 'supabase/rollbacks/20260716210000_carteira_base44_security_hardening.sql'
const validationPath = 'supabase/migrations/20260716213000_carteira_base44_idempotency_validation.sql'
const validationRollbackPath = 'supabase/rollbacks/20260716213000_carteira_base44_idempotency_validation.sql'
const conflictPath = 'supabase/migrations/20260716214000_carteira_concurrency_conflict_nonretryable.sql'
const conflictRollbackPath = 'supabase/rollbacks/20260716214000_carteira_concurrency_conflict_nonretryable.sql'
const ledgerPath = 'supabase/migrations/20260716215000_carteira_mission_idempotency_ledger.sql'
const ledgerRollbackPath = 'supabase/rollbacks/20260716215000_carteira_mission_idempotency_ledger.sql'
const ledgerIndexPath = 'supabase/migrations/20260716215500_carteira_mission_ledger_user_fk_index.sql'
const ledgerIndexRollbackPath = 'supabase/rollbacks/20260716215500_carteira_mission_ledger_user_fk_index.sql'
const legacyDisablePath = 'supabase/migrations/20260716220000_carteira_disable_legacy_rpc_entrypoints.sql'
const legacyRollbackPath = 'supabase/rollbacks/20260716220000_carteira_disable_legacy_rpc_entrypoints.sql'

describe('carteira Base44 security hardening migration', () => {
  test('replaces direct RPC access with validated v2 entrypoints', () => {
    const sql = readFileSync(migrationPath, 'utf8')
    for (const token of [
      'carteira_salvar_cliente_v2',
      'carteira_iniciar_missao_v2',
      'carteira_atualizar_missao_v2',
      'pg_advisory_xact_lock',
      'seller_user_id = v_user',
      "lower(vl.role) IN ('vendedor', 'seller')",
      'REVOKE ALL ON FUNCTION public.carteira_salvar_cliente(jsonb, text) FROM PUBLIC, anon',
      'REVOKE ALL ON TABLE public.carteira_missoes FROM anon',
      'REVOKE ALL ON TABLE public.carteira_missao_itens FROM anon',
    ]) expect(sql).toContain(token)
  })

  test('validates mission clients and persists item state atomically', () => {
    const sql = readFileSync(validationPath, 'utf8')
    expect(readFileSync(migrationPath, 'utf8')).toContain('Cliente de missão inválido ou fora do escopo do vendedor.')
    expect(sql).toContain('expected_revision é obrigatório.')
    expect(sql).toContain('Status de item da missão inválido.')
    expect(sql).toContain('last_mutation_key = v_scoped_key')
    expect(sql).toContain('UPDATE public.carteira_missao_itens')
    expect(sql).toContain('expected_revision')
    expect(sql).toContain('Conflito de concorrência na missão.')
  })

  test('deduplicates vehicle registration and ships a forward-only rollback', () => {
    const sql = readFileSync(validationPath, 'utf8')
    const rollback = readFileSync(validationRollbackPath, 'utf8')
    expect(sql).toContain('veiculos_estoque_created_by_idempotency_key_key')
    expect(sql).toContain('UNIQUE (created_by, idempotency_key)')
    expect(sql).toContain('carteira_atualizar_missao_v2(uuid, jsonb, text)')
    expect(rollback).toContain('-- DOWN')
    expect(rollback).toContain('DROP FUNCTION IF EXISTS public.carteira_atualizar_missao_v2(uuid, jsonb, text)')
  })

  test('maps stale mission revisions to a non-retryable HTTP conflict', () => {
    const sql = readFileSync(conflictPath, 'utf8')
    const rollback = readFileSync(conflictRollbackPath, 'utf8')
    expect(sql).toContain("RAISE sqlstate 'PT409'")
    expect(sql).toContain("message = 'Conflito de concorrência na missão.'")
    expect(sql).not.toContain("ERRCODE = '40001'")
    expect(rollback).toContain("ERRCODE = '40001'")
  })

  test('persists replay results by mission, user, key and canonical payload hash', () => {
    const sql = readFileSync(ledgerPath, 'utf8')
    const rollback = readFileSync(ledgerRollbackPath, 'utf8')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.carteira_missao_mutations')
    expect(sql).toContain('PRIMARY KEY (missao_id, user_id, idempotency_key)')
    expect(sql).toContain('v_payload_hash text := md5(p_payload::text)')
    expect(sql).toContain('Chave de idempotência reutilizada com payload diferente.')
    expect(sql).toContain('INSERT INTO public.carteira_missao_mutations')
    expect(sql).toContain('REVOKE ALL ON TABLE public.carteira_missao_mutations FROM PUBLIC, anon, authenticated')
    expect(rollback).toContain('DROP TABLE IF EXISTS public.carteira_missao_mutations')
  })

  test('indexes the ledger user foreign key with an executable rollback', () => {
    const sql = readFileSync(ledgerIndexPath, 'utf8')
    const rollback = readFileSync(ledgerIndexRollbackPath, 'utf8')
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS carteira_missao_mutations_user_id_idx')
    expect(sql).toContain('ON public.carteira_missao_mutations (user_id)')
    expect(rollback).toContain('DROP INDEX IF EXISTS public.carteira_missao_mutations_user_id_idx')
  })

  test('ships an executable rollback companion', () => {
    const rollback = readFileSync(rollbackPath, 'utf8')
    expect(rollback).toContain('-- DOWN')
    expect(rollback).toContain('DROP FUNCTION IF EXISTS public.carteira_salvar_cliente_v2')
    expect(rollback).toContain('DROP FUNCTION IF EXISTS public.carteira_iniciar_missao_v2')
    expect(rollback).toContain('GRANT EXECUTE ON FUNCTION public.carteira_salvar_cliente(jsonb, text) TO authenticated')
  })

  test('finishes the zero-downtime rollout by disabling legacy RPCs', () => {
    const disable = readFileSync(legacyDisablePath, 'utf8')
    const rollback = readFileSync(legacyRollbackPath, 'utf8')
    expect(disable).toContain('REVOKE EXECUTE ON FUNCTION public.carteira_salvar_cliente(jsonb, text) FROM authenticated')
    expect(disable).toContain('REVOKE EXECUTE ON FUNCTION public.carteira_iniciar_missao(jsonb, text) FROM authenticated')
    expect(disable).toContain('REVOKE EXECUTE ON FUNCTION public.carteira_atualizar_missao(uuid, jsonb) FROM authenticated')
    expect(rollback).toContain('GRANT EXECUTE ON FUNCTION public.carteira_salvar_cliente(jsonb, text) TO authenticated')
    expect(rollback).toContain('GRANT EXECUTE ON FUNCTION public.carteira_iniciar_missao(jsonb, text) TO authenticated')
    expect(rollback).toContain('GRANT EXECUTE ON FUNCTION public.carteira_atualizar_missao(uuid, jsonb) TO authenticated')
  })
})
