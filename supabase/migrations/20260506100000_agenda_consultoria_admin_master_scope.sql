-- Agenda MX privacy: only Daniel/admin master can see every consultant calendar.

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
        lower(u.email) = 'danieljsvendas@gmail.com'
        OR lower(u.name) LIKE 'daniel%'
      )
  )
$$;

DROP POLICY IF EXISTS visitas_consultoria_select ON public.visitas_consultoria;
CREATE POLICY visitas_consultoria_select ON public.visitas_consultoria
  FOR SELECT TO authenticated
  USING (
    public.eh_admin_master_mx(auth.uid())
    OR consultant_id = auth.uid()
    OR auxiliary_consultant_id = auth.uid()
  );

DROP POLICY IF EXISTS consulting_schedule_events_select ON public.eventos_agenda_consultoria;
DROP POLICY IF EXISTS eventos_agenda_consultoria_select ON public.eventos_agenda_consultoria;
CREATE POLICY eventos_agenda_consultoria_select ON public.eventos_agenda_consultoria
  FOR SELECT TO authenticated
  USING (
    public.eh_admin_master_mx(auth.uid())
    OR responsible_user_id = auth.uid()
    OR (responsible_user_id IS NULL AND created_by = auth.uid())
  );

COMMENT ON FUNCTION public.eh_admin_master_mx(uuid)
  IS 'Identifica o admin master MX autorizado a visualizar todas as agendas de consultores.';
