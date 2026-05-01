ALTER TABLE public.eventos_agenda_consultoria
  ADD COLUMN IF NOT EXISTS google_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS google_sync_error text;

COMMENT ON COLUMN public.eventos_agenda_consultoria.google_synced_at
  IS 'Timestamp da ultima sincronizacao bem-sucedida com a Agenda Central MX.';

COMMENT ON COLUMN public.eventos_agenda_consultoria.google_sync_error
  IS 'Ultimo erro de sincronizacao com a Agenda Central MX, quando houver.';

NOTIFY pgrst, 'reload schema';
