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

  test('protege leitura e escrita pelo escopo real da loja', () => {
    const sql = readMigration()

    expect(sql).toContain('ALTER TABLE public.solicitacoes_consultoria ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain("public.can_access_mx_scope('store'::public.score_scope_type, store_id)")
    expect(sql).toContain('created_by = auth.uid()')
    expect(sql).toContain('consultant_user_id = auth.uid()')
    expect(sql).not.toContain('USING (true)')
  })

  test('impede vínculo de cliente com loja divergente', () => {
    const sql = readMigration()

    expect(sql).toContain('clientes_consultoria.primary_store_id = solicitacoes_consultoria.store_id')
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.validate_consulting_request_scope')
    expect(sql).toContain('BEFORE INSERT OR UPDATE OF store_id, client_id, consultant_user_id')
  })
})
