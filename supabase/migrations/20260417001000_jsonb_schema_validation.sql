-- ============================================================
-- STORY-TD-017 (DB-10): JSONB Schema Validation
-- Adds CHECK constraints on business-critical JSONB columns
-- Audit/log tables left without validation (append-only by design)
-- ============================================================

ALTER TABLE public.feedbacks
  ADD CONSTRAINT feedbacks_team_avg_json_has_keys
  CHECK (jsonb_typeof(team_avg_json) = 'object' AND team_avg_json ? 'leads'),
  ADD CONSTRAINT feedbacks_diagnostic_json_structure
  CHECK (jsonb_typeof(diagnostic_json) = 'object');

ALTER TABLE public.automation_configs
  ADD CONSTRAINT automation_configs_ai_context_is_string
  CHECK (ai_context IS NULL OR jsonb_typeof(ai_context::jsonb) IS NOT NULL OR pg_typeof(ai_context) = 'text');
