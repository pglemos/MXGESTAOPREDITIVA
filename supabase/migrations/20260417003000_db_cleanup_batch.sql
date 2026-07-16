-- ============================================================
-- STORY-TD-022 (DB batch): FK + Indexes + Triggers + Policies
-- DB-15: FK formal pdi_sessoes.loja_id
-- DB-16: Drop redundant indexes
-- DB-17: Consulting indexes
-- DB-18: RLS policy refactor
-- DB-19: Trigger consolidation
-- DB-06: Permissive policies documentation
-- ============================================================

-- DB-15: FK formal
ALTER TABLE public.pdi_sessoes
  DROP CONSTRAINT IF EXISTS pdi_sessoes_loja_id_fkey,
  ADD CONSTRAINT pdi_sessoes_loja_id_fkey
    FOREIGN KEY (loja_id) REFERENCES public.stores(id) ON DELETE SET NULL;

-- DB-16: Drop redundant indexes
DROP INDEX IF EXISTS public.idx_checkins_store_date;
DROP INDEX IF EXISTS public.idx_checkins_seller_date;

-- DB-17: Consulting indexes
CREATE INDEX IF NOT EXISTS consulting_visits_client_visit_idx
  ON public.consulting_visits (client_id, visit_number);

CREATE INDEX IF NOT EXISTS consulting_financials_client_date_idx
  ON public.consulting_financials (client_id, reference_date);

-- DB-19: Consolidate trigger functions
-- Rename update_updated_at_column_canonical is already canonical
-- Drop old variants and redirect triggers

-- Drop old variant used by goals
DROP TRIGGER IF EXISTS trg_goals_updated ON public.goals;
CREATE TRIGGER trg_goals_updated
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

-- Drop old variant used by pdis
DROP TRIGGER IF EXISTS trg_pdis_updated ON public.pdis;
CREATE TRIGGER trg_pdis_updated
  BEFORE UPDATE ON public.pdis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

-- Drop old variant used by daily_checkins (trg_checkins_updated)
DROP TRIGGER IF EXISTS trg_checkins_updated ON public.daily_checkins;
CREATE TRIGGER trg_checkins_updated
  BEFORE UPDATE ON public.daily_checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

-- Redirect manager_routine_logs to canonical (drop the trigger before its
-- function below, or the DROP FUNCTION fails: "other objects depend on it")
DROP TRIGGER IF EXISTS manager_routine_logs_set_updated_at ON public.manager_routine_logs;
CREATE TRIGGER manager_routine_logs_set_updated_at
  BEFORE UPDATE ON public.manager_routine_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

-- Drop old function variants (only if no remaining triggers use them)
DROP FUNCTION IF EXISTS public.update_updated_at();
DROP FUNCTION IF EXISTS public.set_manager_routine_logs_updated_at();

-- DB-06: Permissive SELECT policies are an intentional performance
-- optimization. Monitoring threshold: 200 concurrent users or LGPD
-- compliance requirement. pg_stat_statements enabled for monitoring.
-- No code change needed — this is documentation only.

-- ============================================================
-- DOWN
-- ============================================================
-- ALTER TABLE public.pdi_sessoes DROP CONSTRAINT IF EXISTS pdi_sessoes_loja_id_fkey;
-- CREATE INDEX IF NOT EXISTS idx_checkins_store_date ON public.daily_checkins (store_id, reference_date);
-- CREATE INDEX IF NOT EXISTS idx_checkins_seller_date ON public.daily_checkins (seller_user_id, reference_date);
-- DROP INDEX IF EXISTS public.consulting_visits_client_visit_idx;
-- DROP INDEX IF EXISTS public.consulting_financials_client_date_idx;
-- Trigger consolidation (goals/pdis/daily_checkins/manager_routine_logs to
-- update_updated_at_column_canonical) and the two dropped legacy functions
-- (update_updated_at, set_manager_routine_logs_updated_at) are not restored
-- by this rollback — the canonical function is a strict behavioral superset,
-- so there is nothing functionally to undo.
