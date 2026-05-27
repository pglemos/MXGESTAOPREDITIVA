-- ============================================================================
-- Migration: 20260527100000_canonical_roles_schema.sql
-- Story:     MX-2.1 (docs/stories/story-MX-02-20260527-schema-roles.md)
-- Epic:      EPIC-MX-02 (Sistema de Perfis & Permissões)
-- PRD:       docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md §3
-- ADR:       docs/adr/ADR-MX-001-canonical-roles-schema.md
--
-- VERSÃO 2 (2026-05-27) — adaptada após introspecção do schema real:
--   Tabela `public.roles` JÁ EXISTE com schema (id, name, description, created_at)
--   e 4 rows (admin, dono, gerente, vendedor).
--   Tabela `public.user_roles` (M:N) existe vazia (preparada, não usada).
--   `public.usuarios.role` (string) é o que está ativamente em uso (241 rows).
--
-- ESTRATÉGIA ADAPTATIVA (não-destrutiva):
--   1. ESTENDE tabela `roles` com novas colunas (code, name_pt, name_en, hierarchy_level, is_master_loja, updated_at)
--   2. UPDATE dos 4 rows existentes mapeando para codes canônicos
--   3. INSERT dos 7 roles canônicos faltantes
--   4. ADD COLUMN usuarios.role_id (nullable, FK) — coexistência com usuarios.role string
--   5. BACKFILL usuarios.role_id baseado em usuarios.role
--   6. Trigger unicidade Master por loja
--   7. RLS read-public, write-service
--
-- PRESERVADO: usuarios.role (string) e user_roles (bridge vazia) intactos.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. ESTENDE tabela `roles` existente com novas colunas
-- ----------------------------------------------------------------------------

ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS code            text;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS name_pt         text;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS name_en         text;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS hierarchy_level smallint;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS is_master_loja  boolean NOT NULL DEFAULT false;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS updated_at      timestamptz NOT NULL DEFAULT now();

COMMENT ON TABLE  public.roles IS
  'Catálogo canônico dos 10 perfis MX Performance (PRD §3) + meta-role admin_mx. Estendido em 2026-05-27 — ver ADR-MX-001.';
COMMENT ON COLUMN public.roles.code IS
  'Identificador estável em inglês usado por código (RoleCode TS union).';
COMMENT ON COLUMN public.roles.is_master_loja IS
  'TRUE para code=master (Dono da loja, PRD §3 perfil 1). NÃO confundir com admin_mx (eh_admin_master_mx() — consultor MX externo).';
COMMENT ON COLUMN public.roles.hierarchy_level IS
  '0–100. Master=100, Diretor=90, admin_mx=95 (meta), Gerente=70, Consultor=60, demais=40–50.';

-- ----------------------------------------------------------------------------
-- 2. UPDATE dos 4 rows existentes — mapeamento canônico
-- ----------------------------------------------------------------------------

UPDATE public.roles SET code='admin_mx',     name_pt='Admin Master MX', name_en='MX Admin Master',  hierarchy_level=95,  is_master_loja=false WHERE lower(name) = 'admin'    AND code IS NULL;
UPDATE public.roles SET code='master',       name_pt='Master / Dono',   name_en='Master / Owner',   hierarchy_level=100, is_master_loja=true  WHERE lower(name) = 'dono'     AND code IS NULL;
UPDATE public.roles SET code='sales_manager', name_pt='Gerente Comercial', name_en='Sales Manager', hierarchy_level=70,  is_master_loja=false WHERE lower(name) = 'gerente'  AND code IS NULL;
UPDATE public.roles SET code='seller',       name_pt='Vendedor',        name_en='Seller',           hierarchy_level=40,  is_master_loja=false WHERE lower(name) = 'vendedor' AND code IS NULL;

-- ----------------------------------------------------------------------------
-- 3. INSERT dos 7 roles canônicos faltantes (director, marketing, product, finance, hr, operations, consultant)
-- ----------------------------------------------------------------------------

INSERT INTO public.roles (name, description, code, name_pt, name_en, hierarchy_level, is_master_loja) VALUES
  ('director',   'Diretor / Sócio — visão executiva (.docx §40–§41)',                                          'director',   'Diretor / Sócio',   'Director / Partner',  90, false),
  ('marketing',  'Marketing — leads, campanhas, canais (.docx §50–§53)',                                       'marketing',  'Marketing',         'Marketing',           50, false),
  ('product',    'Produto — estoque, giro, margem (.docx §54–§57)',                                            'product',    'Produto',           'Product',             50, false),
  ('finance',    'Financeiro / Administrativo — DRE, margem, fluxo (.docx §58–§61)',                           'finance',    'Financeiro',        'Finance',             50, false),
  ('hr',         'RH — treinamentos, PDIs, feedbacks, clima (.docx §62–§66)',                                  'hr',         'RH',                'HR',                  50, false),
  ('operations', 'Operações — preparação, pós-venda, entrega (.docx §67–§70)',                                 'operations', 'Operações',         'Operations',          50, false),
  ('consultant', 'Consultor MX — análise consultiva, READ-ONLY no Score (FR-SCORE-5, .docx §259–§264)',        'consultant', 'Consultor MX',      'MX Consultant',       60, false)
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Constraints após popular dados
-- ----------------------------------------------------------------------------

-- code UNIQUE (após backfill garantido em #2 e #3)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='roles_code_unique') THEN
    ALTER TABLE public.roles ADD CONSTRAINT roles_code_unique UNIQUE (code);
  END IF;
END $$;

-- code NOT NULL (após popular)
ALTER TABLE public.roles ALTER COLUMN code SET NOT NULL;
ALTER TABLE public.roles ALTER COLUMN hierarchy_level SET NOT NULL;

-- ----------------------------------------------------------------------------
-- 5. Coluna nova `usuarios.role_id` (nullable, FK opcional inicialmente)
-- ----------------------------------------------------------------------------

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.roles(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.usuarios.role_id IS
  'FK canônica para roles. Coexiste com usuarios.role (string legado) e user_roles (M:N bridge, vazia) — ver ADR-MX-001.';

CREATE INDEX IF NOT EXISTS idx_usuarios_role_id ON public.usuarios(role_id) WHERE role_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 6. Backfill: mapeia `usuarios.role` (string) → `usuarios.role_id` (FK)
-- ----------------------------------------------------------------------------

UPDATE public.usuarios u
SET role_id = r.id
FROM public.roles r
WHERE u.role_id IS NULL
  AND (
    (lower(u.role) IN ('admin', 'administrador_geral', 'administrador_mx')  AND r.code = 'admin_mx')        OR
    (lower(u.role) IN ('dono', 'owner')                                     AND r.code = 'master')          OR
    (lower(u.role) IN ('gerente', 'manager')                                AND r.code = 'sales_manager')   OR
    (lower(u.role) IN ('vendedor', 'seller')                                AND r.code = 'seller')          OR
    (lower(u.role) IN ('consultor', 'consultor_mx')                         AND r.code = 'consultant')
  );

-- ----------------------------------------------------------------------------
-- 7. Unicidade Master por loja — TODO em story futura
-- ----------------------------------------------------------------------------
-- ADIADO: usuarios não tem loja_id direto. Modelo real é M:N via vinculos_loja.
-- Implementar constraint via trigger em vinculos_loja em story de follow-up
-- (entender modelo M:N: 1 user pode ser Master de várias lojas?).
-- Por ora, validação aplicacional (no frontend/backend) é suficiente.

-- ----------------------------------------------------------------------------
-- 8. Trigger updated_at em roles
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.roles_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_roles_touch_updated_at ON public.roles;
CREATE TRIGGER trg_roles_touch_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.roles_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 9. RLS — leitura pública do catálogo, write apenas service
-- ----------------------------------------------------------------------------

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_read_authenticated ON public.roles;
CREATE POLICY roles_read_authenticated
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS roles_write_service ON public.roles;
CREATE POLICY roles_write_service
  ON public.roles
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMIT;

-- ============================================================================
-- DOWN MIGRATION (manual rollback) — preserva os 4 rows originais e schema legado
-- ============================================================================
-- BEGIN;
--   DROP TRIGGER IF EXISTS trg_enforce_single_master_per_loja ON public.usuarios;
--   DROP FUNCTION IF EXISTS public.enforce_single_master_per_loja();
--   DROP TRIGGER IF EXISTS trg_roles_touch_updated_at ON public.roles;
--   DROP FUNCTION IF EXISTS public.roles_touch_updated_at();
--   DROP POLICY IF EXISTS roles_read_authenticated ON public.roles;
--   DROP POLICY IF EXISTS roles_write_service ON public.roles;
--   ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
--   DROP INDEX IF EXISTS public.idx_usuarios_role_id;
--   ALTER TABLE public.usuarios DROP COLUMN IF EXISTS role_id;
--   DELETE FROM public.roles WHERE name IN ('director','marketing','product','finance','hr','operations','consultant');
--   ALTER TABLE public.roles DROP CONSTRAINT IF EXISTS roles_code_unique;
--   ALTER TABLE public.roles DROP COLUMN IF EXISTS code, DROP COLUMN IF EXISTS name_pt, DROP COLUMN IF EXISTS name_en, DROP COLUMN IF EXISTS hierarchy_level, DROP COLUMN IF EXISTS is_master_loja, DROP COLUMN IF EXISTS updated_at;
--   -- roles 4 rows originais (admin/dono/gerente/vendedor) e usuarios.role string PRESERVADOS
-- COMMIT;
-- ============================================================================
