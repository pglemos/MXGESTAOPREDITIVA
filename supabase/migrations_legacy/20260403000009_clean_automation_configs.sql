-- Add unique constraint to report_type in automation_configs
-- Migration: 20260403000009_clean_automation_configs.sql

ALTER TABLE public.automation_configs 
ADD CONSTRAINT automation_configs_report_type_key UNIQUE (report_type);

-- Ensure we have all three types
INSERT INTO automation_configs (report_type, schedule_cron, ai_context)
VALUES 
('morning', '30 10 * * *', 'Consultor sênior focado em números diários.'),
('weekly', '0 8 * * 1', 'Analista de tendências semanais.'),
('monthly', '0 7 1 * *', 'Diretor de operações focado em fechamento.')
ON CONFLICT (report_type) DO UPDATE 
SET schedule_cron = EXCLUDED.schedule_cron,
    updated_at = NOW();
