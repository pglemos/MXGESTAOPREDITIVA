ALTER TABLE public.visitas_consultoria
  ADD COLUMN IF NOT EXISTS google_meet_link text;

ALTER TABLE public.eventos_agenda_consultoria
  ADD COLUMN IF NOT EXISTS google_meet_link text;

COMMENT ON COLUMN public.visitas_consultoria.google_meet_link
  IS 'Link Google Meet criado automaticamente para visitas online sincronizadas com Google Calendar.';

COMMENT ON COLUMN public.eventos_agenda_consultoria.google_meet_link
  IS 'Link Google Meet criado automaticamente para eventos/aulas online sincronizados com Google Calendar.';
