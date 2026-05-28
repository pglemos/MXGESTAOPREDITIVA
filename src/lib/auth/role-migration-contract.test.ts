import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import {
  MX_ROLE_CODES,
  ROLE_CODES,
  isCanonicalRoleCode,
  toCanonicalRoleCode,
} from './roles'

const rolesMigration = readFileSync(
  new URL('../../../supabase/migrations/20260527100000_canonical_roles_schema.sql', import.meta.url),
  'utf8',
)

const helpersMigration = readFileSync(
  new URL('../../../supabase/migrations/20260527120000_role_rls_helpers.sql', import.meta.url),
  'utf8',
)

describe('canonical role migration contract', () => {
  test('exports the ten PRD role codes and the MX admin meta-role separately', () => {
    expect(ROLE_CODES).toEqual([
      'master',
      'director',
      'sales_manager',
      'seller',
      'marketing',
      'product',
      'finance',
      'hr',
      'operations',
      'consultant',
    ])

    expect(MX_ROLE_CODES).toEqual([...ROLE_CODES, 'admin_mx'])
    expect(isCanonicalRoleCode('master')).toBe(true)
    expect(isCanonicalRoleCode('admin_mx')).toBe(false)
  })

  test('maps legacy runtime roles to canonical database role codes', () => {
    expect(toCanonicalRoleCode('dono')).toBe('master')
    expect(toCanonicalRoleCode('owner')).toBe('master')
    expect(toCanonicalRoleCode('gerente')).toBe('sales_manager')
    expect(toCanonicalRoleCode('manager')).toBe('sales_manager')
    expect(toCanonicalRoleCode('vendedor')).toBe('seller')
    expect(toCanonicalRoleCode('seller')).toBe('seller')
    expect(toCanonicalRoleCode('consultor_mx')).toBe('consultant')
    expect(toCanonicalRoleCode('administrador_geral')).toBe('admin_mx')
    expect(toCanonicalRoleCode('financeiro')).toBe('finance')
  })

  test('keeps the roles migration additive and non-destructive', () => {
    expect(rolesMigration).toContain('ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS code')
    expect(rolesMigration).toContain('ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.roles(id) ON DELETE RESTRICT')
    expect(rolesMigration).toContain('PRESERVADO: usuarios.role (string)')
    expect(rolesMigration).toContain('user_roles (bridge vazia) intactos')
    expect(rolesMigration).toContain("ALTER TABLE public.roles ADD CONSTRAINT roles_code_unique UNIQUE (code)")
    expect(rolesMigration).toContain('ALTER TABLE public.roles ALTER COLUMN code SET NOT NULL')
  })

  test('keeps role seed, backfill and RLS helper mappings aligned', () => {
    for (const roleCode of MX_ROLE_CODES) {
      expect(rolesMigration).toContain(roleCode)
    }

    expect(rolesMigration).toContain("(lower(u.role) IN ('admin', 'administrador_geral', 'administrador_mx')  AND r.code = 'admin_mx')")
    expect(rolesMigration).toContain("(lower(u.role) IN ('dono', 'owner')                                     AND r.code = 'master')")
    expect(rolesMigration).toContain("(lower(u.role) IN ('gerente', 'manager')                                AND r.code = 'sales_manager')")
    expect(rolesMigration).toContain("(lower(u.role) IN ('vendedor', 'seller')                                AND r.code = 'seller')")
    expect(rolesMigration).toContain("(lower(u.role) IN ('consultor', 'consultor_mx')                         AND r.code = 'consultant')")

    expect(helpersMigration).toContain("WHEN lower(u.role) IN ('admin','administrador_geral','administrador_mx') THEN 'admin_mx'")
    expect(helpersMigration).toContain("WHEN lower(v.role) IN ('dono','owner','master')          THEN 'master'")
    expect(helpersMigration).toContain('COMMENT ON FUNCTION public.user_has_role(text[], uuid) IS')
  })
})
