-- ============================================================
-- STORY-TD-018 (DB-11): Updated_at Triggers (2 Tables)
-- Only checkin_correction_requests and reprocess_logs
-- suffer UPDATE and lack updated_at
-- ============================================================

ALTER TABLE public.checkin_correction_requests
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.reprocess_logs
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP TRIGGER IF EXISTS update_checkin_correction_requests_updated_at ON public.checkin_correction_requests;
CREATE TRIGGER update_checkin_correction_requests_updated_at
  BEFORE UPDATE ON public.checkin_correction_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_reprocess_logs_updated_at ON public.reprocess_logs;
CREATE TRIGGER update_reprocess_logs_updated_at
  BEFORE UPDATE ON public.reprocess_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();
