-- Add agd_prev_day metrics to daily_checkins for correct funnel modeling
-- Migration: 20260403000010_fix_checkin_temporal_metrics.sql

ALTER TABLE public.daily_checkins 
ADD COLUMN IF NOT EXISTS agd_cart_prev_day INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS agd_net_prev_day INTEGER DEFAULT 0;

COMMENT ON COLUMN public.daily_checkins.agd_cart_prev_day IS 'Agendamentos de carteira que estavam marcados para o dia de referência (ontem)';
COMMENT ON COLUMN public.daily_checkins.agd_net_prev_day IS 'Agendamentos de internet que estavam marcados para o dia de referência (ontem)';
COMMENT ON COLUMN public.daily_checkins.agd_cart_today IS 'Agendamentos de carteira marcados para hoje (D-0)';
COMMENT ON COLUMN public.daily_checkins.agd_net_today IS 'Agendamentos de internet marcados para hoje (D-0)';
