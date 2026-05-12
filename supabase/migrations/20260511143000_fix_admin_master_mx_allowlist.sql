-- Garante que os Admin Master MX oficiais visualizem a agenda geral do sistema.

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
      AND lower(u.email) IN (
        'gestao@mxconsultoria.com.br',
        'joseroberto20161@gmail.com',
        'marianedcs@gmail.com',
        'gedson.freire.localiza@gmail.com',
        'synvollt@gmail.com',
        'camarajoaoaugusto@gmail.com'
      )
  )
$$;

COMMENT ON FUNCTION public.eh_admin_master_mx(uuid)
  IS 'Identifica os Admin Master MX oficiais autorizados a visualizar todas as agendas de consultores.';
