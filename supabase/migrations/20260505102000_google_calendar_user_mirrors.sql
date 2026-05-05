-- Mirrors central MX calendar events into connected admin master personal calendars.

CREATE TABLE IF NOT EXISTS public.espelhos_agenda_google_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  source_kind text NOT NULL CHECK (source_kind IN ('visit', 'schedule_event')),
  source_id uuid NOT NULL,
  google_event_id text,
  synced_at timestamptz,
  sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT espelhos_agenda_google_usuario_unique UNIQUE (user_id, source_kind, source_id)
);

DROP TRIGGER IF EXISTS update_espelhos_agenda_google_usuario_updated_at ON public.espelhos_agenda_google_usuario;
CREATE TRIGGER update_espelhos_agenda_google_usuario_updated_at
BEFORE UPDATE ON public.espelhos_agenda_google_usuario
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

ALTER TABLE public.espelhos_agenda_google_usuario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS espelhos_agenda_google_usuario_owner_select ON public.espelhos_agenda_google_usuario;
CREATE POLICY espelhos_agenda_google_usuario_owner_select
  ON public.espelhos_agenda_google_usuario
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.eh_administrador_mx(auth.uid()));

COMMENT ON TABLE public.espelhos_agenda_google_usuario
  IS 'Controle de espelhamento de eventos da Agenda Central MX nas agendas pessoais conectadas por usuario.';
