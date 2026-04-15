-- ============================================================
-- STORY-TD-010 (DB-12): Legacy FK ON DELETE Actions
-- Adds explicit ON DELETE behavior to legacy FKs
-- System uses soft-delete for stores/users — risk is low
-- ============================================================

-- daily_checkins: preserve data when user deactivated, cascade on store delete
ALTER TABLE public.daily_checkins
  DROP CONSTRAINT IF EXISTS daily_checkins_user_id_fkey,
  ADD CONSTRAINT daily_checkins_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.daily_checkins
  DROP CONSTRAINT IF EXISTS daily_checkins_store_id_fkey,
  ADD CONSTRAINT daily_checkins_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

-- feedbacks: preserve seller/manager data, cascade on store
ALTER TABLE public.feedbacks
  DROP CONSTRAINT IF EXISTS feedbacks_store_id_fkey,
  ADD CONSTRAINT feedbacks_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

ALTER TABLE public.feedbacks
  DROP CONSTRAINT IF EXISTS feedbacks_seller_id_fkey,
  ADD CONSTRAINT feedbacks_seller_id_fkey
    FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.feedbacks
  DROP CONSTRAINT IF EXISTS feedbacks_manager_id_fkey,
  ADD CONSTRAINT feedbacks_manager_id_fkey
    FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- pdis: preserve seller/manager data, cascade on store
ALTER TABLE public.pdis
  DROP CONSTRAINT IF EXISTS pdis_store_id_fkey,
  ADD CONSTRAINT pdis_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

ALTER TABLE public.pdis
  DROP CONSTRAINT IF EXISTS pdis_seller_id_fkey,
  ADD CONSTRAINT pdis_seller_id_fkey
    FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.pdis
  DROP CONSTRAINT IF EXISTS pdis_manager_id_fkey,
  ADD CONSTRAINT pdis_manager_id_fkey
    FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- goals: cascade on both (goals are per-user per-store)
ALTER TABLE public.goals
  DROP CONSTRAINT IF EXISTS goals_store_id_fkey,
  ADD CONSTRAINT goals_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

ALTER TABLE public.goals
  DROP CONSTRAINT IF EXISTS goals_user_id_fkey,
  ADD CONSTRAINT goals_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- notifications: cascade on recipient
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_recipient_id_fkey,
  ADD CONSTRAINT notifications_recipient_id_fkey
    FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- goal_logs: cascade on goal
ALTER TABLE public.goal_logs
  DROP CONSTRAINT IF EXISTS goal_logs_goal_id_fkey,
  ADD CONSTRAINT goal_logs_goal_id_fkey
    FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE;
