-- CRITICAL FIX: Eliminating RLS recursion by using SECURITY DEFINER role-checkers.

-- 1. Secure role-checking function that bypasses RLS
CREATE OR REPLACE FUNCTION public.check_user_role_in_store(p_store_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.memberships
        WHERE store_id = p_store_id
          AND user_id = auth.uid()
          AND role = ANY(p_roles)
    )
$$;

-- 2. Refactor high-level checkers to use the secure one
CREATE OR REPLACE FUNCTION public.is_owner_of(p_store_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
    SELECT public.is_admin() OR public.check_user_role_in_store(p_store_id, ARRAY['dono'])
$$;

CREATE OR REPLACE FUNCTION public.is_manager_of(p_store_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
    SELECT public.is_admin() OR public.check_user_role_in_store(p_store_id, ARRAY['gerente'])
$$;

CREATE OR REPLACE FUNCTION public.is_member_of(p_store_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
    SELECT public.is_admin() OR public.check_user_role_in_store(p_store_id, ARRAY['dono', 'gerente', 'vendedor'])
$$;

-- 3. Update Policies to use these functions (they are now safe and non-recursive)

-- memberships
DROP POLICY IF EXISTS role_matrix_memberships_select ON public.memberships;
CREATE POLICY role_matrix_memberships_select ON public.memberships
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_admin())
        OR user_id = auth.uid()
        OR public.is_owner_of(store_id)
        OR public.is_manager_of(store_id)
    );

-- stores
DROP POLICY IF EXISTS role_matrix_stores_select ON public.stores;
CREATE POLICY role_matrix_stores_select ON public.stores
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_admin()) 
        OR public.is_member_of(id)
    );

-- daily_checkins
DROP POLICY IF EXISTS role_matrix_daily_checkins_select ON public.daily_checkins;
CREATE POLICY role_matrix_daily_checkins_select ON public.daily_checkins
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_admin()) 
        OR public.is_owner_of(store_id) 
        OR public.is_manager_of(store_id) 
        -- Fallback check for sellers
        OR seller_user_id = auth.uid()
    );

COMMENT ON FUNCTION public.check_user_role_in_store IS 'Internal checker that bypasses RLS to prevent recursion.';
