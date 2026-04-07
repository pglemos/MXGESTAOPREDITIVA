-- FINAL FIX: Sincronização de todos os horários oficiais da Metodologia MX
-- Matinal: 10:30 BRT (13:30 UTC)
-- Semanal: Segunda 12:30 BRT (15:30 UTC)

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
    -- 1. Limpar agendamentos antigos/conflitantes
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname IN ('morning-report', 'weekly-report', 'mx-morning-8am', 'mx-weekly-friday');
    
    -- 2. Garantir que os nomes oficiais existam ou sejam atualizados
    -- (O configure_morning_report_cron e configure_weekly_feedback_cron já fazem o unschedule interno)
END $$;

-- 3. Corrigir a tabela automation_configs (legado) para não confundir auditorias
UPDATE public.automation_configs
SET schedule_cron = '30 10 * * *'
WHERE report_type = 'morning';

UPDATE public.automation_configs
SET schedule_cron = '30 12 * * 1'
WHERE report_type = 'weekly';

-- 4. Notificar sucesso
COMMENT ON TABLE public.automation_configs IS 'Schedules alinhados com a Metodologia MX: Matinal 10:30, Semanal Seg 12:30';
