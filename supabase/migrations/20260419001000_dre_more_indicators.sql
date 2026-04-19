-- ============================================================
-- Add Volume Leads and Agendamentos to DRE
-- ============================================================

ALTER TABLE public.consulting_financials
  ADD COLUMN IF NOT EXISTS volume_leads integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS volume_agendamentos integer DEFAULT 0;
