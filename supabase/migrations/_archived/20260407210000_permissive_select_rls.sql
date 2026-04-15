-- FINAL RLS PEFORMANCE BOOST: Granting more permissive SELECT for core entities to eliminate overhead.

-- 1. memberships: Everyone authenticated can see who is in which store (safe for this business model)
DROP POLICY IF EXISTS role_matrix_memberships_select ON public.memberships;
CREATE POLICY role_matrix_memberships_select ON public.memberships
    FOR SELECT TO authenticated
    USING (true); -- Seeing membership list is not a security risk here

-- 2. stores: Everyone authenticated can see the store list names
DROP POLICY IF EXISTS role_matrix_stores_select ON public.stores;
CREATE POLICY role_matrix_stores_select ON public.stores
    FOR SELECT TO authenticated
    USING (true); -- Store names and IDs are public within the app

-- 3. users: Everyone authenticated can see other users (needed for names in lists)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
CREATE POLICY "Public profiles for authenticated" ON public.users
    FOR SELECT TO authenticated
    USING (true);

-- Keep WRITE policies restricted
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.memberships IS 'RLS optimized: SELECT is open to authenticated, WRITE is restricted to admin.';
