-- ============================================================================
-- Migration: 20260527120000_role_rls_helpers.sql
-- Story:     MX-2.2 (docs/stories/story-MX-02-20260527-rls-policies.md)
-- Epic:      EPIC-MX-02 (Sistema de Perfis & Permissões)
-- Depende de: 20260527100000_canonical_roles_schema.sql
--
-- ESCOPO LIMITADO (de propósito):
--   Apenas helper functions canônicas. NÃO altera policies existentes nesta
--   migration — substituição de policies temporárias permissivas (MX-7.1 §10)
--   ficará em story de follow-up após validação dos helpers em PR.
--
-- Helpers entregues:
--   - current_user_role_code()                — retorna roles.code do auth.uid()
--   - current_user_role_codes()                — array de codes (cobre vinculos_loja M:N)
--   - user_has_role(text[])                    — true se user tem qualquer code da lista
--   - user_has_min_hierarchy(smallint)         — true se user tem role com hierarchy >= N
--   - user_is_master_loja(uuid)                — true se user é master de uma loja específica
--
-- Todas STABLE + SECURITY DEFINER + search_path lockado.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. current_user_role_code — retorna o code canônico do usuário atual
--    (prioriza usuarios.role_id; fallback para mapeamento de usuarios.role string)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role_code(uid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- preferred: role_id já populado
    (SELECT r.code FROM public.usuarios u JOIN public.roles r ON r.id = u.role_id WHERE u.id = uid),
    -- fallback: mapear usuarios.role string para code canônico
    (SELECT CASE
       WHEN lower(u.role) IN ('admin','administrador_geral','administrador_mx') THEN 'admin_mx'
       WHEN lower(u.role) IN ('dono','owner')           THEN 'master'
       WHEN lower(u.role) IN ('gerente','manager')      THEN 'sales_manager'
       WHEN lower(u.role) IN ('vendedor','seller')      THEN 'seller'
       WHEN lower(u.role) IN ('consultor','consultor_mx') THEN 'consultant'
       ELSE NULL
     END
     FROM public.usuarios u WHERE u.id = uid)
  );
$$;

COMMENT ON FUNCTION public.current_user_role_code(uuid) IS
  'Retorna roles.code canônico do usuário (default auth.uid()). Usa role_id se populado; fallback para mapeamento de usuarios.role string.';

-- ----------------------------------------------------------------------------
-- 2. current_user_role_codes — array de codes (cobre M:N via vinculos_loja)
--    Inclui role canônico de usuarios + todos os roles de vinculos_loja ativos.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role_codes(uid uuid DEFAULT auth.uid())
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT DISTINCT code FROM (
      -- Code de usuarios (1 row)
      SELECT public.current_user_role_code(uid) AS code
      UNION ALL
      -- Codes de vinculos_loja (M:N, possivelmente vários)
      SELECT CASE
        WHEN lower(v.role) IN ('dono','owner','master')          THEN 'master'
        WHEN lower(v.role) IN ('gerente','manager','sales_manager') THEN 'sales_manager'
        WHEN lower(v.role) IN ('vendedor','seller')              THEN 'seller'
        WHEN lower(v.role) IN ('consultor','consultor_mx','consultant') THEN 'consultant'
        ELSE NULL
      END AS code
      FROM public.vinculos_loja v
      WHERE v.user_id = uid AND v.is_active = true
    ) all_codes
    WHERE code IS NOT NULL
  );
$$;

COMMENT ON FUNCTION public.current_user_role_codes(uuid) IS
  'Retorna array de roles.code canônicos do usuário (default auth.uid()). Combina usuarios.role + vinculos_loja.role (M:N) ativos.';

-- ----------------------------------------------------------------------------
-- 3. user_has_role — helper booleano para policies
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_has_role(p_codes text[], uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM unnest(public.current_user_role_codes(uid)) AS uc
    WHERE uc = ANY(p_codes)
  );
$$;

COMMENT ON FUNCTION public.user_has_role(text[], uuid) IS
  'True se usuário tem qualquer um dos roles canônicos passados em p_codes.';

-- ----------------------------------------------------------------------------
-- 4. user_has_min_hierarchy — helper hierárquico
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_has_min_hierarchy(p_min smallint, uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM unnest(public.current_user_role_codes(uid)) AS uc
    JOIN public.roles r ON r.code = uc
    WHERE r.hierarchy_level >= p_min
  );
$$;

COMMENT ON FUNCTION public.user_has_min_hierarchy(smallint, uuid) IS
  'True se usuário tem algum role com hierarchy_level >= p_min. Master=100, Director=90, admin_mx=95, Sales Mgr=70, Consultant=60, Operations/HR/etc=50, Seller=40.';

-- ----------------------------------------------------------------------------
-- 5. user_is_master_loja — master específico de uma loja
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_is_master_loja(p_loja_id uuid, uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vinculos_loja v
    WHERE v.user_id = uid
      AND v.store_id = p_loja_id
      AND v.is_active = true
      AND lower(v.role) IN ('dono','owner','master')
  );
$$;

COMMENT ON FUNCTION public.user_is_master_loja(uuid, uuid) IS
  'True se usuário é Master ativo da loja específica (via vinculos_loja). NOTA: produção atualmente permite múltiplos Masters/loja — ver story Master-por-loja.';

COMMIT;

-- ============================================================================
-- DOWN (manual rollback)
-- BEGIN;
--   DROP FUNCTION IF EXISTS public.user_is_master_loja(uuid, uuid);
--   DROP FUNCTION IF EXISTS public.user_has_min_hierarchy(smallint, uuid);
--   DROP FUNCTION IF EXISTS public.user_has_role(text[], uuid);
--   DROP FUNCTION IF EXISTS public.current_user_role_codes(uuid);
--   DROP FUNCTION IF EXISTS public.current_user_role_code(uuid);
-- COMMIT;
-- ============================================================================
