-- Fix Monthly Report Cron Schedule to 1st of month 07:00 (AIOX Method)
-- Migration: 20260403000008_add_monthly_report_cron.sql

INSERT INTO automation_configs (report_type, schedule_cron, ai_context, recipients)
VALUES ('monthly', '0 7 1 * *', 'Você é um diretor de operações. Analise o fechamento do mês, parabenize os campeões e estabeleça o tom para o novo ciclo.', '[]')
ON CONFLICT (report_type) DO UPDATE 
SET schedule_cron = EXCLUDED.schedule_cron,
    updated_at = NOW();
