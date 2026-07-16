CREATE TABLE IF NOT EXISTS public.reunioes_google_meet_atas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_kind text NOT NULL CHECK (source_kind IN ('visit', 'schedule_event')),
  source_id uuid NOT NULL,
  client_id uuid REFERENCES public.clientes_consultoria(id) ON DELETE SET NULL,
  title text,
  meeting_code text,
  google_meet_link text,
  conference_record_name text,
  transcript_name text,
  transcript_state text,
  transcript_text text,
  ata_text text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'no_meet', 'no_conference_record', 'no_transcript', 'transcript_not_ready', 'processed', 'failed')),
  error_message text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_kind, source_id)
);

CREATE INDEX IF NOT EXISTS reunioes_google_meet_atas_source_idx
  ON public.reunioes_google_meet_atas (source_kind, source_id);

CREATE INDEX IF NOT EXISTS reunioes_google_meet_atas_status_idx
  ON public.reunioes_google_meet_atas (status, processed_at);

DROP TRIGGER IF EXISTS reunioes_google_meet_atas_updated_at ON public.reunioes_google_meet_atas;
CREATE TRIGGER reunioes_google_meet_atas_updated_at
  BEFORE UPDATE ON public.reunioes_google_meet_atas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column_canonical();

ALTER TABLE public.reunioes_google_meet_atas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reunioes_google_meet_atas_select ON public.reunioes_google_meet_atas;
CREATE POLICY reunioes_google_meet_atas_select ON public.reunioes_google_meet_atas
  FOR SELECT TO authenticated
  USING (public.eh_area_interna_mx());

DROP POLICY IF EXISTS reunioes_google_meet_atas_write ON public.reunioes_google_meet_atas;
CREATE POLICY reunioes_google_meet_atas_write ON public.reunioes_google_meet_atas
  FOR ALL TO authenticated
  USING (public.eh_area_interna_mx())
  WITH CHECK (public.eh_area_interna_mx());

COMMENT ON TABLE public.reunioes_google_meet_atas
  IS 'Atas e transcricoes oficiais de reunioes Google Meet geradas para visitas, aulas e eventos online da agenda MX.';

COMMENT ON COLUMN public.reunioes_google_meet_atas.status
  IS 'Estado do processamento da ata: pending, no_meet, no_conference_record, no_transcript, transcript_not_ready, processed ou failed.';

CREATE OR REPLACE FUNCTION public.configure_google_meet_ata_cron(
  p_function_url text,
  p_cron_secret text,
  p_schedule text DEFAULT '*/30 * * * *'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, net
AS $$
DECLARE
  v_sql text;
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'mx-google-meet-ata';

  v_sql := format(
    $cron$
    SELECT net.http_post(
      url := %L,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-mx-cron-secret', %L
      ),
      body := jsonb_build_object('mode', 'process_due', 'limit', 10)
    );
    $cron$,
    p_function_url,
    p_cron_secret
  );

  PERFORM cron.schedule('mx-google-meet-ata', p_schedule, v_sql);
END;
$$;

REVOKE ALL ON FUNCTION public.configure_google_meet_ata_cron(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.configure_google_meet_ata_cron(text, text, text) TO service_role;

NOTIFY pgrst, 'reload schema';
