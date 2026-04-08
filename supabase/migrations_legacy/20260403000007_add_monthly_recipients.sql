-- Add monthly_recipients to store_delivery_rules
-- Migration: 20260403000007_add_monthly_recipients.sql

ALTER TABLE public.store_delivery_rules 
ADD COLUMN IF NOT EXISTS monthly_recipients TEXT[] DEFAULT '{}';

-- Initialize with matinal_recipients if empty
UPDATE public.store_delivery_rules
SET monthly_recipients = matinal_recipients
WHERE array_length(monthly_recipients, 1) IS NULL;
