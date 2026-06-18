import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260617007000_vendedor_sprint3_4_dados.sql', import.meta.url)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('vendedor sprint 3/4 data migration contract', () => {
  test('cria seller_product_categories com RLS escopado', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.seller_product_categories')
    expect(sql).toContain("CHECK (proficiency = ANY (ARRAY['iniciante', 'em_desenvolvimento', 'domina', 'especialista']))")
    expect(sql).toContain('ALTER TABLE public.seller_product_categories ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('CREATE POLICY seller_product_categories_seller_rw')
    expect(sql).toContain('seller_id = auth.uid()')
    expect(sql).toContain('public.is_manager_of(store_id)')
    expect(sql).toContain('public.is_owner_of(store_id)')
  })

  test('adiciona updated_by nas tabelas operacionais auditadas', () => {
    const sql = readMigration()

    for (const table of [
      'clientes',
      'oportunidades',
      'agendamentos',
      'atendimentos',
      'vendedor_perfil',
      'pdi_plano_acao',
      'aulas_ao_vivo',
      'devolutiva_acoes',
      'execution_actions',
    ]) {
      expect(sql).toContain(`'${table}'`)
    }

    expect(sql).toContain('ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL')
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.mx_set_updated_by()')
    expect(sql).toContain('CREATE TRIGGER trg_%I_updated_by BEFORE UPDATE')
    expect(sql).toContain('FOR EACH ROW EXECUTE FUNCTION public.mx_set_updated_by()')
  })
})
