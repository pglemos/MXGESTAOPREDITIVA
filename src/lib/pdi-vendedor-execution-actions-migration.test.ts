import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260617006000_pdi_vendedor_execucao_actions.sql', import.meta.url)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('pdi vendedor execution actions migration contract', () => {
  test('cria persistencia propria para a Central de Execucao', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.execution_actions')
    expect(sql).toContain("source_type text NOT NULL CHECK (source_type = ANY (ARRAY['pdi', 'feedback', 'funil', 'manual']))")
    expect(sql).toContain("status text NOT NULL DEFAULT 'pendente'")
    expect(sql).toContain('execution_actions_seller_status_due_idx')
  })

  test('mantem RLS e leitura escopada ao vendedor ou lideranca da loja', () => {
    const sql = readMigration()

    expect(sql).toContain('ALTER TABLE public.execution_actions ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('CREATE POLICY execution_actions_select_operacional')
    expect(sql).toContain('seller_id = auth.uid()')
    expect(sql).toContain('public.is_owner_of(store_id)')
    expect(sql).toContain('public.is_manager_of(store_id)')
  })

  test('expoe RPCs security definer para acoes do proprio PDI do vendedor', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.vendedor_criar_pdi_acao')
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.vendedor_atualizar_pdi_acao_status')
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.vendedor_enviar_pdi_acao_central')
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.vendedor_concluir_execution_action')
    expect(sql).toContain('SECURITY DEFINER')
    expect(sql).toContain('AND s.colaborador_id = auth.uid()')
  })
})
