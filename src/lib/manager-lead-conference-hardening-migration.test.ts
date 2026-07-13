import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const migrationUrl = new URL(
  '../../supabase/migrations/20260713031616_manager_lead_conference_hardening.sql',
  import.meta.url,
)

function readMigration(): string {
  expect(existsSync(fileURLToPath(migrationUrl))).toBe(true)
  return readFileSync(migrationUrl, 'utf8')
}

describe('manager lead conference hardening migration contract', () => {
  test('mantem a RPC como unico caminho de escrita autenticada', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.save_manager_lead_conference')
    expect(sql).toContain('SECURITY DEFINER')
    expect(sql).toContain("SET search_path TO 'public'")
    expect(sql).toContain(
      'REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.manager_lead_conferences FROM authenticated',
    )
    expect(sql).toContain(
      'REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.manager_lead_conference_items FROM authenticated',
    )
    expect(sql).toContain('GRANT SELECT ON TABLE public.manager_lead_conferences TO authenticated')
    expect(sql).toContain('GRANT SELECT ON TABLE public.manager_lead_conference_items TO authenticated')
    expect(sql).toContain(
      'GRANT EXECUTE ON FUNCTION public.save_manager_lead_conference(uuid, text, date, date, jsonb) TO authenticated',
    )
  })

  test('conta vendedor divergente quando qualquer canal diverge', () => {
    const sql = readMigration()

    expect(sql).toMatch(
      /WHERE \(internet_official - internet_mx\) <> 0\s+OR \(carteira_official - carteira_mx\) <> 0/,
    )
    expect(sql).not.toContain(
      'WHERE (internet_official - internet_mx) + (carteira_official - carteira_mx) <> 0',
    )
  })

  test('preserva a validacao de vendedor ativo na loja ao executar como definer', () => {
    const sql = readMigration()

    expect(sql).toContain('FROM public.vendedores_loja seller')
    expect(sql).toContain('seller.store_id = p_store_id')
    expect(sql).toContain('seller.seller_user_id = item.seller_user_id')
    expect(sql).toContain('seller.is_active = true')
    expect(sql).toContain("RAISE EXCEPTION 'Vendedor fora do escopo da unidade.'")
  })

  test('aplica correcao forward-only sem recriar ou remover tabelas', () => {
    const sql = readMigration()

    expect(sql).not.toMatch(/CREATE\s+TABLE/i)
    expect(sql).not.toMatch(/DROP\s+TABLE/i)
    expect(sql).not.toContain('migration repair')
  })
})
