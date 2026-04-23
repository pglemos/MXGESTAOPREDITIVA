-- Migration: Add projection_mode to store_meta_rules
-- Date: 2026-04-23
-- Author: Orion (AIOX Master)

-- Add the missing column to the table
ALTER TABLE public.store_meta_rules 
ADD COLUMN IF NOT EXISTS projection_mode text DEFAULT 'calendar' CHECK (projection_mode IN ('calendar', 'business'));

-- Comment for documentation
COMMENT ON COLUMN public.store_meta_rules.projection_mode IS 'Mode for calculating sales projections: calendar (default) or business days.';

-- Ensure existing records have the default
UPDATE public.store_meta_rules SET projection_mode = 'calendar' WHERE projection_mode IS NULL;
