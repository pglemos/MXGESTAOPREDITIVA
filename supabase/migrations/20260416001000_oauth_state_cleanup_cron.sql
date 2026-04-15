-- ============================================================
-- STORY-TD-011 (DB-14): OAuth State Cleanup Cron
-- Schedules pg_cron job to cleanup consumed/expired OAuth states
-- every 15 minutes from consulting_google_oauth_states
-- ============================================================

SELECT cron.schedule(
  'cleanup-oauth-states',
  '*/15 * * * *',
  $$
  DELETE FROM public.consulting_google_oauth_states
  WHERE (consumed_at IS NOT NULL OR expires_at < now())
    AND created_at < now() - interval '1 hour'
  $$
);
