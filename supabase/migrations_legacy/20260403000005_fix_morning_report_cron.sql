-- Fix Morning Report Cron Schedule to 10:30 (Legacy Rule)
-- Migration: 20260403000005_fix_morning_report_cron.sql

UPDATE automation_configs 
SET schedule_cron = '30 10 * * *',
    updated_at = NOW()
WHERE report_type = 'morning';

-- Ensure timezone is set for delivery rules
UPDATE store_delivery_rules
SET timezone = 'America/Sao_Paulo'
WHERE timezone IS NULL;
