import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260617008000_score_rls_hardening.sql', import.meta.url)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('score RLS hardening migration contract', () => {
  test('substitui leitura permissiva por helper escopado', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.mx_can_read_score_scope')
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.mx_can_read_score_calculation')
    expect(sql).toContain('DROP POLICY IF EXISTS score_inputs_read ON public.score_inputs')
    expect(sql).toContain('DROP POLICY IF EXISTS score_calc_read ON public.score_calculations')
    expect(sql).toContain('DROP POLICY IF EXISTS score_history_read ON public.score_history')
    expect(sql).toContain('DROP POLICY IF EXISTS score_obs_read ON public.score_observations')
    expect(sql).toContain('USING (public.mx_can_read_score_scope(scope_type, scope_id))')
    expect(sql).toContain('USING (public.mx_can_read_score_calculation(calculation_id))')
    expect(sql).not.toContain('USING (true)')
  })

  test('bloqueia escrita direta de calculos e restringe observacoes consultivas', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE POLICY score_calculations_insert_block_authenticated')
    expect(sql).toContain('WITH CHECK (false)')
    expect(sql).toContain('CREATE POLICY score_observations_insert_consultive')
    expect(sql).toContain('auth.uid() = author_id')
    expect(sql).toContain("public.user_has_role(ARRAY['consultant', 'master', 'admin_mx'])")
    expect(sql).toContain('AND public.mx_can_read_score_calculation(calculation_id)')
  })

  test('mantem vendedor e lideranca de loja dentro do escopo permitido', () => {
    const sql = readMigration()

    expect(sql).toContain("p_scope_type = 'individual'::public.score_scope_type")
    expect(sql).toContain('AND p_scope_id = auth.uid()')
    expect(sql).toContain('FROM public.vinculos_loja seller_link')
    expect(sql).toContain('JOIN public.vinculos_loja leader_link')
    expect(sql).toContain("p_scope_type = 'store'::public.score_scope_type")
    expect(sql).toContain('public.is_manager_of(p_scope_id)')
    expect(sql).toContain('public.is_owner_of(p_scope_id)')
  })
})
