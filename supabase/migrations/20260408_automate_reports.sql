-- PROJETO MX PERFORMANCE: AUTOMAÇÃO DE RELATÓRIOS
-- Este script configura o agendamento dos relatórios Matinal, Semanal e Mensal.

-- 0. Garantir extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Limpar agendamentos anteriores (silencioso)
DO $$ BEGIN PERFORM cron.unschedule('mx-matinal-report'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('mx-weekly-feedback'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('mx-monthly-report'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 2. Matinal: Diário às 08:30 BRT (11:30 UTC)
SELECT cron.schedule(
    'mx-matinal-report',
    '30 11 * * *',
    $$
    SELECT net.http_post(
        url := 'https://fbhcmzzgwjdgkctlfvbo.supabase.co/functions/v1/relatorio-matinal',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'mx-service-role-key' LIMIT 1)
        ),
        body := '{}'::jsonb
    );
    $$
);

-- 3. Semanal: Segunda-feira às 12:30 BRT (15:30 UTC)
SELECT cron.schedule(
    'mx-weekly-feedback',
    '30 15 * * 1',
    $$
    SELECT net.http_post(
        url := 'https://fbhcmzzgwjdgkctlfvbo.supabase.co/functions/v1/feedback-semanal',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'mx-service-role-key' LIMIT 1)
        ),
        body := '{}'::jsonb
    );
    $$
);

-- 4. Mensal: Todo dia 01 às 10:30 BRT (13:30 UTC)
SELECT cron.schedule(
    'mx-monthly-report',
    '30 13 1 * *',
    $$
    SELECT net.http_post(
        url := 'https://fbhcmzzgwjdgkctlfvbo.supabase.co/functions/v1/relatorio-mensal',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'mx-service-role-key' LIMIT 1)
        ),
        body := '{}'::jsonb
    );
    $$
);

-- 3. Mensal: Todo dia 01 às 10:30 BRT (13:30 UTC)
SELECT cron.schedule(
    'mx-monthly-report',
    '30 13 1 * *',
    $$
    SELECT net.http_post(
        url := 'https://fbhcmzzgwjdgkctlfvbo.supabase.co/functions/v1/relatorio-mensal',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'mx-service-role-key' LIMIT 1)
        ),
        body := '{}'::jsonb
    );
    $$
);
