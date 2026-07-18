-- ============================================================
-- DOWN
-- ============================================================

REVOKE ALL ON FUNCTION public.get_owner_consultant_contact(uuid) FROM authenticated;
DROP FUNCTION IF EXISTS public.get_owner_consultant_contact(uuid);
