ALTER TABLE public.produtos_digitais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_matrix_digital_products_select" ON public.produtos_digitais;
DROP POLICY IF EXISTS "produtos_digitais_select_scoped" ON public.produtos_digitais;

CREATE POLICY "produtos_digitais_select_scoped"
ON public.produtos_digitais
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR (
    status = 'ativo'
    AND EXISTS (
      SELECT 1
      FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.active IS TRUE
        AND target_roles @> ARRAY[public.normalize_mx_role(u.role)]::text[]
    )
  )
);

DROP POLICY IF EXISTS "role_matrix_digital_products_write" ON public.produtos_digitais;
DROP POLICY IF EXISTS "produtos_digitais_write_admin" ON public.produtos_digitais;

CREATE POLICY "produtos_digitais_write_admin"
ON public.produtos_digitais
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

NOTIFY pgrst, 'reload schema';

