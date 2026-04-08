-- OPTIMIZATION: Bypassing recursive RLS lookups for core membership and store checks.

-- 1. Redefine helper functions to be extremely fast
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    -- Using a subquery with LIMIT 1 is faster than EXISTS in some PG versions
    SELECT role = 'admin' AND active = TRUE 
    FROM public.users 
    WHERE id = auth.uid() 
    LIMIT 1;
$$;

-- 2. Update stores select policy to be more direct
DROP POLICY IF EXISTS role_matrix_stores_select ON public.stores;
CREATE POLICY role_matrix_stores_select ON public.stores
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_admin()) 
        OR id IN (SELECT store_id FROM public.memberships WHERE user_id = auth.uid())
    );

-- 3. Update memberships select policy
DROP POLICY IF EXISTS role_matrix_memberships_select ON public.memberships;
CREATE POLICY role_matrix_memberships_select ON public.memberships
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_admin())
        OR user_id = auth.uid()
        -- Avoid calling is_owner_of/is_manager_of here to prevent deep recursion
        OR store_id IN (
            SELECT store_id 
            FROM public.memberships 
            WHERE user_id = auth.uid() 
              AND role IN ('dono', 'gerente')
        )
    );

COMMENT ON POLICY role_matrix_stores_select ON public.stores IS 'Acesso otimizado para membros da loja.';
COMMENT ON POLICY role_matrix_memberships_select ON public.memberships IS 'Acesso otimizado para membros e gestores.';
