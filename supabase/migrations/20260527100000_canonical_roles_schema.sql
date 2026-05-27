-- ============================================================================
-- Migration: 20260527100000_canonical_roles_schema.sql
-- Story:     MX-2.1 (docs/stories/story-MX-02-20260527-schema-roles.md)
-- Epic:      EPIC-MX-02 (Sistema de Perfis & Permissões)
-- PRD:       docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md §3
-- ADR:       docs/adr/ADR-MX-001-canonical-roles-schema.md
--
-- ESTRATÉGIA: aditiva, não-destrutiva.
--   - Cria tabela canônica `roles` com 10 perfis (codes em EN estável)
--   - Adiciona `usuarios.role_id` (nullable) coexistindo com `usuarios.role` legado
--   - Backfill via mapa documentado em ADR-MX-001
--   - Preserva 100% de `usuarios.role` string e função eh_admin_master_mx()
--
-- ROLLBACK: ver bloco DOWN ao final
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Tabela canônica `roles`
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.roles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text NOT NULL UNIQUE,
  name_pt          text NOT NULL,
  name_en          text NOT NULL,
  description      text,
  hierarchy_level  smallint NOT NULL CHECK (hierarchy_level BETWEEN 0 AND 100),
  is_master_loja   boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.roles IS
  'Catálogo canônico dos 10 perfis do MX Performance (PRD §3). NÃO confundir com usuarios.role (string legado) — coexistência transitória conforme ADR-MX-001.';
COMMENT ON COLUMN public.roles.code IS
  'Identificador estável em inglês usado por código (RoleCode TS union).';
COMMENT ON COLUMN public.roles.is_master_loja IS
  'TRUE para o perfil ''master'' (Dono da loja, PRD §3 perfil 1). NÃO confundir com Admin Master MX (eh_admin_master_mx() — entidade ortogonal, fora deste schema).';
COMMENT ON COLUMN public.roles.hierarchy_level IS
  '0–100. Maior = mais privilégio. Master=100, Diretor=90, Gerente=70, Consultor=60, demais=40–50.';

-- ----------------------------------------------------------------------------
-- 2. Seed dos 10 perfis canônicos
-- ----------------------------------------------------------------------------

INSERT INTO public.roles (code, name_pt, name_en, description, hierarchy_level, is_master_loja) VALUES
  ('master',        'Master / Dono',          'Master / Owner',           'Acesso total à loja, visão estratégica, libera acessos (.docx §37–§39).', 100, true),
  ('director',      'Diretor / Sócio',        'Director / Partner',       'Visão executiva (.docx §40–§41).',                                          90,  false),
  ('sales_manager', 'Gerente Comercial',      'Sales Manager',            'Gestão da equipe comercial, execução operacional (.docx §42–§44).',         70,  false),
  ('seller',        'Vendedor',               'Seller',                   'Rotina operacional, metas, agenda, desenvolvimento (.docx §45–§49).',       40,  false),
  ('marketing',     'Marketing',              'Marketing',                'Leads, campanhas, canais (.docx §50–§53).',                                 50,  false),
  ('product',       'Produto',                'Product',                  'Estoque, giro, margem (.docx §54–§57).',                                    50,  false),
  ('finance',       'Financeiro',             'Finance',                  'DRE, margem, fluxo (.docx §58–§61).',                                       50,  false),
  ('hr',            'RH',                     'HR',                       'Treinamentos, PDIs, feedbacks, clima (.docx §62–§66).',                     50,  false),
  ('operations',    'Operações',              'Operations',               'Preparação, pós-venda, entrega (.docx §67–§70).',                           50,  false),
  ('consultant',    'Consultor MX',           'MX Consultant',            'Análise consultiva, planos de ação, observações qualitativas. READ-ONLY no Score (FR-SCORE-5, .docx §259–§264).', 60, false)
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Coluna nova `usuarios.role_id` (nullable, FK opcional inicialmente)
-- ----------------------------------------------------------------------------

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.roles(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.usuarios.role_id IS
  'FK canônica para roles. Coexiste com usuarios.role (string legado) durante migração — ver ADR-MX-001.';

CREATE INDEX IF NOT EXISTS idx_usuarios_role_id ON public.usuarios(role_id) WHERE role_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 4. Backfill: mapeia `usuarios.role` (string) → `usuarios.role_id` (FK)
--    Conforme mapa em ADR-MX-001 §2.
-- ----------------------------------------------------------------------------

UPDATE public.usuarios u
SET role_id = r.id
FROM public.roles r
WHERE u.role_id IS NULL
  AND (
    (lower(u.role) IN ('dono', 'owner')               AND r.code = 'master')         OR
    (lower(u.role) IN ('gerente', 'manager')          AND r.code = 'sales_manager')  OR
    (lower(u.role) IN ('vendedor', 'seller')          AND r.code = 'seller')         OR
    (lower(u.role) IN ('consultor', 'consultor_mx')   AND r.code = 'consultant')
  );

-- NOTA: roles legados 'admin', 'administrador_geral', 'administrador_mx', 'todos'
--       NÃO são mapeados — são meta-roles MX (consultor externo, allowlist),
--       ortogonais aos 10 perfis canônicos da loja. Ver ADR-MX-001 §2.

-- ----------------------------------------------------------------------------
-- 5. Trigger garantindo unicidade do Master por loja
--    (apenas 1 usuário com role.code='master' por usuarios.loja_id)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_single_master_per_loja()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_master_role_id uuid;
  v_existing_count integer;
BEGIN
  SELECT id INTO v_master_role_id FROM public.roles WHERE code = 'master' LIMIT 1;

  IF NEW.role_id = v_master_role_id AND NEW.loja_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_existing_count
    FROM public.usuarios
    WHERE loja_id = NEW.loja_id
      AND role_id = v_master_role_id
      AND id <> NEW.id;

    IF v_existing_count > 0 THEN
      RAISE EXCEPTION 'Já existe um usuário com role=master para loja %. Apenas 1 Master por loja é permitido (ADR-MX-001).', NEW.loja_id
        USING ERRCODE = 'unique_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_single_master_per_loja IS
  'Garante unicidade de role=master por loja (ADR-MX-001 §2).';

DROP TRIGGER IF EXISTS trg_enforce_single_master_per_loja ON public.usuarios;
CREATE TRIGGER trg_enforce_single_master_per_loja
  BEFORE INSERT OR UPDATE OF role_id, loja_id
  ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_master_per_loja();

-- ----------------------------------------------------------------------------
-- 6. updated_at auto-touch
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
-- 7. RLS — leitura pública do catálogo (codes são públicos, sem dados sensíveis)
-- ----------------------------------------------------------------------------

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_read_authenticated ON public.roles;
CREATE POLICY roles_read_authenticated
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Apenas service_role / superuser pode INSERT/UPDATE/DELETE (gestão via migration)
DROP POLICY IF EXISTS roles_write_service ON public.roles;
CREATE POLICY roles_write_service
  ON public.roles
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMIT;

-- ============================================================================
-- DOWN MIGRATION (manual rollback)
-- ============================================================================
-- BEGIN;
--   DROP TRIGGER IF EXISTS trg_enforce_single_master_per_loja ON public.usuarios;
--   DROP FUNCTION IF EXISTS public.enforce_single_master_per_loja();
--   DROP TRIGGER IF EXISTS trg_roles_touch_updated_at ON public.roles;
--   DROP FUNCTION IF EXISTS public.roles_touch_updated_at();
--   DROP INDEX IF EXISTS public.idx_usuarios_role_id;
--   ALTER TABLE public.usuarios DROP COLUMN IF EXISTS role_id;
--   DROP POLICY IF EXISTS roles_read_authenticated ON public.roles;
--   DROP POLICY IF EXISTS roles_write_service ON public.roles;
--   DROP TABLE IF EXISTS public.roles;
--   -- usuarios.role (string legado) NÃO é tocada — preservada intacta
-- COMMIT;
-- ============================================================================
