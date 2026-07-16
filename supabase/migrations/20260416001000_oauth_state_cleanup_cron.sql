-- ============================================================
-- STORY-TD-011 (DB-14): OAuth State Cleanup Cron
-- Schedules pg_cron job to cleanup consumed/expired OAuth states
-- every 15 minutes from consulting_google_oauth_states
-- ============================================================

-- Already enabled in prod (toggled via dashboard); missing only on a fresh
-- database replay (supabase db reset), which is what CI's RLS Regression
-- Matrix does. No-op where it already exists.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-oauth-states',
  '*/15 * * * *',
  $$
  DELETE FROM public.consulting_google_oauth_states
  WHERE (consumed_at IS NOT NULL OR expires_at < now())
    AND created_at < now() - interval '1 hour'
  $$
);

-- ============================================================
-- DOWN
-- ============================================================
-- The only change here is CREATE EXTENSION IF NOT EXISTS pg_cron, added so a
-- from-scratch database replay (supabase db reset) doesn't fail before the
-- schedule call below. pg_cron is already enabled in prod independently of
-- this migration (toggled via the dashboard) and may be relied on by other
-- schedules, so DROP EXTENSION is not a safe rollback here. To undo just the
-- cron job itself: SELECT cron.unschedule('cleanup-oauth-states');
