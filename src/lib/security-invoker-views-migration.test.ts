import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717190000_security_invoker_views.sql', import.meta.url),
  'utf8',
)
const compactSql = sql.replace(/\s+/g, ' ')

const protectedViews = [
  'view_daily_team_status',
  'view_seller_tenure_status',
  'indice_felicidade_agregado',
  'view_sem_registro',
  'view_store_daily_production',
] as const

describe('security invoker views migration', () => {
  test('makes every exposed operational view respect caller RLS', () => {
    for (const view of protectedViews) {
      expect(compactSql).toContain(`ALTER VIEW public.${view} SET (security_invoker = true)`)
    }
  })

  test('removes anonymous access and limits authenticated users to SELECT', () => {
    for (const view of protectedViews) {
      expect(compactSql).toContain(`REVOKE ALL ON public.${view} FROM anon`)
      expect(compactSql).toContain(`REVOKE ALL ON public.${view} FROM authenticated`)
      expect(compactSql).toContain(`GRANT SELECT ON public.${view} TO authenticated`)
      expect(compactSql).toContain(`GRANT SELECT ON public.${view} TO service_role`)
    }
  })

  test('scopes happiness aggregates to the caller store unless the caller is internal MX', () => {
    expect(compactSql).toContain('CREATE OR REPLACE VIEW public.indice_felicidade_agregado')
    expect(compactSql).toContain('public.eh_area_interna_mx()')
    expect(compactSql).toContain("public.tem_papel_loja(r.loja_id, ARRAY['dono'::text, 'gerente'::text])")
    expect(compactSql).not.toContain("user_has_role(ARRAY['master'")
  })

  test('keeps the migration transactional', () => {
    expect(compactSql.startsWith('BEGIN;')).toBe(true)
    expect(compactSql.endsWith('COMMIT;')).toBe(true)
  })
})
