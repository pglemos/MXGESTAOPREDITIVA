import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260718223000_owner_consultant_requests.sql', import.meta.url)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('owner consultant request migration contract', () => {
  test('cria uma fonte canônica e auditável para solicitações', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.solicitacoes_consultoria')
    expect(sql).toContain('store_id uuid NOT NULL REFERENCES public.lojas(id)')
    expect(sql).toContain('client_id uuid REFERENCES public.clientes_consultoria(id)')
    expect(sql).toContain('consultant_user_id uuid REFERENCES public.usuarios(id)')
    expect(sql).toContain('context_snapshot jsonb NOT NULL DEFAULT')
    expect(sql).toContain('status text NOT NULL DEFAULT')
  })

  test('cria caminhos de acesso para todas as chaves estrangeiras relevantes', () => {
    const sql = readMigration()

    expect(sql).toContain('idx_solicitacoes_consultoria_client_id')
    expect(sql).toContain('ON public.solicitacoes_consultoria(client_id)')
    expect(sql).toContain('idx_solicitacoes_consultoria_consultant_user_id')
    expect(sql).toContain('ON public.solicitacoes_consultoria(consultant_user_id)')
  })

  test('protege leitura e escrita pelo escopo executivo, sem liberar gerente', () => {
    const sql = readMigration()

    expect(sql).toContain('ALTER TABLE public.solicitacoes_consultoria ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('public.user_is_master_loja(store_id, (SELECT auth.uid()))')
    expect(sql).toContain("public.tem_papel_loja(store_id, ARRAY['dono'], (SELECT auth.uid()))")
    expect(sql).toContain('public.is_owner_of(store_id)')
    expect(sql).toContain('created_by = (SELECT auth.uid())')
    expect(sql).toContain('consultant_user_id = (SELECT auth.uid())')
    expect(sql).not.toContain("ARRAY['dono', 'gerente']")
    expect(sql).not.toContain('USING (true)')
  })

  test('mantém uma única policy permissiva para update', () => {
    const sql = readMigration()

    expect(sql).toContain('DROP POLICY IF EXISTS solicitacoes_consultoria_cancel_own')
    expect(sql).not.toContain('CREATE POLICY solicitacoes_consultoria_cancel_own')
    expect(sql.match(/CREATE POLICY solicitacoes_consultoria_update/g)?.length).toBe(1)
  })

  test('impede vínculo de cliente com loja divergente', () => {
    const sql = readMigration()

    expect(sql).toContain('clientes_consultoria.primary_store_id = NEW.store_id')
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.validate_consulting_request_scope')
    expect(sql).toContain('BEFORE INSERT OR UPDATE OF store_id, client_id, consultant_user_id')
  })
})
