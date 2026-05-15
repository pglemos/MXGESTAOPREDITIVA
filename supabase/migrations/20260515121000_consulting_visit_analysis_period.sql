-- ============================================================
-- Visit analysis period
-- ============================================================
-- The period is meeting context for reports and indicators. It does not
-- replace strategic planning periods or monthly closing data.

ALTER TABLE public.visitas_consultoria
  ADD COLUMN IF NOT EXISTS analysis_period_start date,
  ADD COLUMN IF NOT EXISTS analysis_period_end date,
  ADD COLUMN IF NOT EXISTS analysis_period_preset text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'visitas_consultoria_analysis_period_valid'
  ) THEN
    ALTER TABLE public.visitas_consultoria
      ADD CONSTRAINT visitas_consultoria_analysis_period_valid
      CHECK (
        analysis_period_start IS NULL
        OR analysis_period_end IS NULL
        OR analysis_period_end >= analysis_period_start
      );
  END IF;
END $$;

ALTER TABLE public.visitas_consultoria
  DROP CONSTRAINT IF EXISTS visitas_consultoria_analysis_period_preset_valid;

ALTER TABLE public.visitas_consultoria
  ADD CONSTRAINT visitas_consultoria_analysis_period_preset_valid
  CHECK (
    analysis_period_preset IS NULL
    OR analysis_period_preset IN (
      'current_month',
      'previous_month',
      'current_quarter',
      'previous_quarter',
      'custom'
    )
  );
