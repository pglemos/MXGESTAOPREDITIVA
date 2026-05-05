-- Track the Google account authorized by each OAuth token.
-- This lets admins distinguish the MX system login from the personal Google Calendar account.

ALTER TABLE public.tokens_oauth_consultoria
  ADD COLUMN IF NOT EXISTS google_email text;

CREATE INDEX IF NOT EXISTS tokens_oauth_consultoria_google_email_idx
  ON public.tokens_oauth_consultoria (lower(google_email))
  WHERE google_email IS NOT NULL;

COMMENT ON COLUMN public.tokens_oauth_consultoria.google_email
  IS 'E-mail da conta Google autorizada no OAuth Calendar/Drive.';

ALTER TABLE public.eventos_agenda_consultoria
  ADD COLUMN IF NOT EXISTS google_event_id_personal text;

COMMENT ON COLUMN public.eventos_agenda_consultoria.google_event_id_personal
  IS 'Event ID sincronizado na agenda Google pessoal do responsavel pelo evento/aula.';
