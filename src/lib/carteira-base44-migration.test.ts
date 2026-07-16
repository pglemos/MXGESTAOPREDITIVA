import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync('supabase/migrations/20260716190000_carteira_base44_parity.sql', 'utf8')

describe('carteira Base44 parity migration', () => {
  test('creates persistent missions without importing the monolithic Base44 entity', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.carteira_missoes')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.carteira_missao_itens')
    expect(sql).not.toContain('CREATE TABLE public.CarteiraCliente')
  })

  test('provides idempotent transactional save and mission functions', () => {
    for (const token of [
      'CREATE OR REPLACE FUNCTION public.carteira_salvar_cliente',
      'CREATE OR REPLACE FUNCTION public.carteira_iniciar_missao',
      'CREATE OR REPLACE FUNCTION public.carteira_atualizar_missao',
      'idempotency_key',
      'FOR UPDATE',
    ]) {
      expect(sql).toContain(token)
    }
  })

  test('adds future opportunity and do-not-contact state to the normalized client', () => {
    expect(sql).toContain('do_not_contact')
    expect(sql).toContain('reactivation_at')
  })
})