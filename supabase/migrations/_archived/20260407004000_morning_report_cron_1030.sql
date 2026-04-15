-- STORY-05: Agendamento do relatorio matinal oficial as 10:30 BRT

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.configure_morning_report_cron(
    p_function_url text,
    p_bearer_token text
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
    WHERE jobname = 'mx-morning-report-1030';

    v_sql := format(
        $cron$
        SELECT net.http_post(
            url := %L,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', %L
            ),
            body := jsonb_build_object('source', 'cron')
        );
        $cron$,
        p_function_url,
        'Bearer ' || p_bearer_token
    );

    PERFORM cron.schedule(
        'mx-morning-report-1030',
        '30 13 * * *',
        v_sql
    );
END;
$$;

REVOKE ALL ON FUNCTION public.configure_morning_report_cron(text, text) FROM PUBLIC;
