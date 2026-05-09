-- Story OPS-20260507: segundo passe yolo de RLS multi-role.
-- Fecha escalacao por self-update de usuarios e escrita de check-in fora da loja/vigencia.

CREATE OR REPLACE FUNCTION public.tem_papel_loja(p_loja_id uuid, p_papeis text[], uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.vinculos_loja v
    JOIN public.usuarios u ON u.id = v.user_id
    WHERE v.user_id = uid
      AND v.store_id = p_loja_id
      AND v.role = ANY (p_papeis)
      AND u.active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.pode_lancar_checkin(
  p_store_id uuid,
  p_seller_id uuid,
  p_reference_date date DEFAULT CURRENT_DATE,
  uid uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    uid = p_seller_id
    AND EXISTS (
      SELECT 1
      FROM public.usuarios u
      JOIN public.vinculos_loja v
        ON v.user_id = u.id
       AND v.store_id = p_store_id
       AND v.role = 'vendedor'
      JOIN public.vendedores_loja vl
        ON vl.seller_user_id = u.id
       AND vl.store_id = p_store_id
      WHERE u.id = uid
        AND u.active = true
        AND u.role = 'vendedor'
        AND vl.is_active = true
        AND (vl.started_at IS NULL OR vl.started_at <= p_reference_date)
        AND (vl.ended_at IS NULL OR vl.ended_at >= p_reference_date)
    )
$$;

CREATE OR REPLACE FUNCTION public.bloquear_self_update_usuarios_sensivel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = NEW.id AND NOT public.eh_administrador_mx(auth.uid()) THEN
    IF OLD.role IS DISTINCT FROM NEW.role
      OR OLD.active IS DISTINCT FROM NEW.active
      OR (to_jsonb(OLD)->'store_id') IS DISTINCT FROM (to_jsonb(NEW)->'store_id')
      OR OLD.email IS DISTINCT FROM NEW.email
      OR OLD.must_change_password IS DISTINCT FROM NEW.must_change_password
      OR OLD.is_venda_loja IS DISTINCT FROM NEW.is_venda_loja THEN
      RAISE EXCEPTION 'Self-update de campos sensiveis de usuario nao permitido';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bloquear_self_update_usuarios_sensivel ON public.usuarios;
CREATE TRIGGER bloquear_self_update_usuarios_sensivel
BEFORE UPDATE ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION public.bloquear_self_update_usuarios_sensivel();

DROP POLICY IF EXISTS lancamentos_diarios_insert ON public.lancamentos_diarios;
CREATE POLICY lancamentos_diarios_insert ON public.lancamentos_diarios
  FOR INSERT TO authenticated
  WITH CHECK (
    public.eh_area_interna_mx()
    OR public.pode_lancar_checkin(store_id, seller_user_id, reference_date)
  );

DROP POLICY IF EXISTS lancamentos_diarios_update ON public.lancamentos_diarios;
CREATE POLICY lancamentos_diarios_update ON public.lancamentos_diarios
  FOR UPDATE TO authenticated
  USING (
    public.eh_area_interna_mx()
    OR public.pode_lancar_checkin(store_id, seller_user_id, reference_date)
  )
  WITH CHECK (
    public.eh_area_interna_mx()
    OR public.pode_lancar_checkin(store_id, seller_user_id, reference_date)
  );
