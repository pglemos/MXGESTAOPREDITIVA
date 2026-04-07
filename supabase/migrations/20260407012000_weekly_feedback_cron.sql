-- EPIC-07: Agendamento do Feedback Semanal Oficial (Segunda 12:30 BRT)

-- Garante que o cron rodara toda segunda-feira as 12:30 BRT (15:30 UTC)
SELECT cron.schedule(
    'mx-weekly-feedback-official',
    '30 15 * * 1',
    $$ SELECT net.http_post(
        url := 'https://' || current_setting('project.ref') || '.supabase.co/functions/v1/feedback-semanal',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || current_setting('project.service_key')),
        body := jsonb_build_object('source', 'cron_weekly_official')
    ) $$
);

COMMENT ON COLUMN public.reprocess_logs.source_type IS 'Identificador do processo (ex: matinal-id-date, semanal-id-range).';
