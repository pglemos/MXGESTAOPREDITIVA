-- ============================================================
-- Harden consulting visits role scope
-- ============================================================
-- Store roles must not read internal MX consulting visit records directly.
-- Owner/manager/seller value is delivered through scoped store dashboards,
-- not through the internal PMR execution table.

ALTER TABLE public.visitas_consultoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consulting_visits_select ON public.visitas_consultoria;
DROP POLICY IF EXISTS visitas_consultoria_select ON public.visitas_consultoria;
CREATE POLICY visitas_consultoria_select ON public.visitas_consultoria
  FOR SELECT TO authenticated
  USING (
    public.eh_admin_master_mx(auth.uid())
    OR public.eh_area_interna_mx(auth.uid())
    OR consultant_id = auth.uid()
    OR auxiliary_consultant_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.atribuicoes_consultoria ac
      WHERE ac.client_id = visitas_consultoria.client_id
        AND ac.user_id = auth.uid()
        AND ac.active = true
    )
  );

DROP POLICY IF EXISTS consulting_visits_write ON public.visitas_consultoria;
DROP POLICY IF EXISTS visitas_consultoria_write ON public.visitas_consultoria;
CREATE POLICY visitas_consultoria_write ON public.visitas_consultoria
  FOR ALL TO authenticated
  USING (public.eh_area_interna_mx(auth.uid()))
  WITH CHECK (public.eh_area_interna_mx(auth.uid()));

COMMENT ON POLICY visitas_consultoria_select ON public.visitas_consultoria
  IS 'Restricts internal PMR visit records to MX internal users, assigned consultants and explicit consulting assignments.';
