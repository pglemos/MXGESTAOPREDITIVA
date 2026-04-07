-- MX Official Automation Schedules
-- Migration: 20260403000010_mx_official_schedules.sql

-- 1. Matinal Oficial (10:30 Diário)
UPDATE automation_configs 
SET schedule_cron = '30 10 * * *',
    is_active = true,
    updated_at = NOW()
WHERE report_type = 'morning';

-- 2. Feedback Semanal (12:30 Segunda-feira)
UPDATE automation_configs 
SET schedule_cron = '30 12 * * 1',
    is_active = true,
    updated_at = NOW()
WHERE report_type = 'weekly';

-- 3. Fechamento Mensal (08:00 Dia 1º)
UPDATE automation_configs 
SET schedule_cron = '0 8 1 * *',
    is_active = true,
    updated_at = NOW()
WHERE report_type = 'monthly';

-- Ensure all stores have delivery rules initialized
INSERT INTO store_delivery_rules (store_id, timezone)
SELECT id, 'America/Sao_Paulo'
FROM stores
ON CONFLICT (store_id) DO UPDATE 
SET timezone = 'America/Sao_Paulo' WHERE store_delivery_rules.timezone IS NULL;
