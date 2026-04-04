-- Fix Weekly Report Cron Schedule to Monday 08:00 (AIOX Method)
-- Migration: 20260403000006_fix_weekly_report_cron.sql

UPDATE automation_configs 
SET schedule_cron = '0 8 * * 1',
    updated_at = NOW()
WHERE report_type = 'weekly';
