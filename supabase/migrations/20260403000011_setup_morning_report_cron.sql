-- Setup pg_cron to trigger the 'relatorio-matinal' Edge Function
-- Migration: 20260403000011_setup_morning_report_cron.sql

-- 1. Enable pg_cron and pg_net extensions
-- Note: These extensions are used to schedule and perform HTTP requests from the database.
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Schedule the morning report trigger
-- Job name: 'morning-report-trigger'
-- Schedule: '30 13 * * *' (13:30 UTC = 10:30 BRT)
-- Performs a POST request to the 'relatorio-matinal' Edge Function.
SELECT cron.schedule(
    'morning-report-trigger',
    '30 13 * * *',
    $$
    SELECT net.http_post(
        url := 'https://YOUR_PROJECT_REF.functions.supabase.co/relatorio-matinal',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
        ),
        body := '{}'::jsonb
    )
    $$
);
