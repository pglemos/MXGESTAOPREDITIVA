-- ============================================================
-- STORY-TD-016 (DB-01): Shadow Column Removal
-- Drops 11 shadow columns and their bidi-sync triggers
-- Frontend confirmed: no component reads these directly
-- ============================================================

DROP TRIGGER IF EXISTS sync_daily_checkins_canonical ON public.daily_checkins;
DROP FUNCTION IF EXISTS public.sync_daily_checkins_canonical();

DROP TRIGGER IF EXISTS pdis_sync_legacy_shadow_columns ON public.pdis;
DROP FUNCTION IF EXISTS public.sync_pdi_legacy_shadow_columns();

ALTER TABLE public.daily_checkins
  DROP COLUMN IF EXISTS user_id,
  DROP COLUMN IF EXISTS date,
  DROP COLUMN IF EXISTS leads,
  DROP COLUMN IF EXISTS agd_cart,
  DROP COLUMN IF EXISTS agd_net,
  DROP COLUMN IF EXISTS vnd_porta,
  DROP COLUMN IF EXISTS vnd_cart,
  DROP COLUMN IF EXISTS vnd_net,
  DROP COLUMN IF EXISTS visitas;

ALTER TABLE public.pdis
  DROP COLUMN IF EXISTS objective,
  DROP COLUMN IF EXISTS action;
