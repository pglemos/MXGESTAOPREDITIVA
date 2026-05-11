-- Expand Agenda MX full-scope access to the active Admin Master MX allowlist.

CREATE OR REPLACE FUNCTION public.eh_admin_master_mx(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    WHERE u.id = uid
      AND u.active = true
      AND u.role = 'administrador_geral'
      AND (
        lower(u.email) IN (
          'danieljsvendas@gmail.com',
          'joseroberto20161@gmail.com'
        )
        OR lower(u.name) LIKE 'daniel%'
      )
  )
$$;

COMMENT ON FUNCTION public.eh_admin_master_mx(uuid)
  IS 'Identifica Admin Master MX autorizado a visualizar todas as agendas de consultores.';
