-- FIX: Ensure RLS policies for users and memberships are correctly set for authentication flow.

-- 1. users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
CREATE POLICY "Admins can view all profiles" ON public.users
    FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()));

-- 2. memberships table (Ensure it's enabled and has policies)
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own memberships" ON public.memberships;
CREATE POLICY "Users can view their own memberships" ON public.memberships
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Managers can view store memberships" ON public.memberships;
CREATE POLICY "Managers can view store memberships" ON public.memberships
    FOR SELECT TO authenticated
    USING ((SELECT public.is_manager_of(store_id)) OR (SELECT public.is_owner_of(store_id)));

-- 3. Ensure is_admin function is robust
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id = auth.uid()
          AND u.role = 'admin'
          AND u.active = TRUE
    )
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Verifica se o usuário atual é administrador do sistema.';
