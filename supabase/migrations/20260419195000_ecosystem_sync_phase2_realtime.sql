-- Migration: Ecosystem Sync Phase 2 - Realtime & Event Bus
-- Date: 2026-04-19
-- Author: Orion (AIOX Master)

-- ============================================================
-- 1. REALTIME ACTIVATION
-- ============================================================
-- Enable realtime for tables crucial to the Seller and Manager dashboards.

-- Ensure publication exists (it's created by Supabase by default, but safe to CREATE IF NOT EXISTS)
-- Add tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedbacks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pdis;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checkin_correction_requests;


-- ============================================================
-- 2. EVENT BUS: Manager Routine Notification Trigger
-- ============================================================
-- This trigger notifies the Manager's Event Bus whenever a seller submits a check-in.
-- The payload is broadcasted so the Manager Dashboard UI can show an alert immediately.

CREATE OR REPLACE FUNCTION notify_manager_on_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store_name text;
  v_seller_name text;
BEGIN
  -- Get context data for a richer notification
  SELECT name INTO v_seller_name FROM public.users WHERE id = NEW.user_id;
  SELECT name INTO v_store_name FROM public.stores WHERE id = NEW.store_id;

  -- Insert a notification record (assuming a generic notifications table exists, if not, we use pg_notify)
  -- We'll use pg_notify for realtime broadcasting
  PERFORM pg_notify(
    'manager_routine_events',
    json_build_object(
      'event_type', 'NEW_CHECKIN',
      'store_id', NEW.store_id,
      'seller_id', NEW.user_id,
      'seller_name', v_seller_name,
      'store_name', v_store_name,
      'date', NEW.date,
      'timestamp', now()
    )::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_manager_on_checkin ON public.daily_checkins;

CREATE TRIGGER trigger_notify_manager_on_checkin
AFTER INSERT ON public.daily_checkins
FOR EACH ROW
EXECUTE FUNCTION notify_manager_on_checkin();


-- ============================================================
-- 3. EVENT BUS: Notification on Correction Request
-- ============================================================

CREATE OR REPLACE FUNCTION notify_manager_on_correction_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seller_name text;
BEGIN
  SELECT name INTO v_seller_name FROM public.users WHERE id = NEW.seller_id;

  PERFORM pg_notify(
    'manager_routine_events',
    json_build_object(
      'event_type', 'CORRECTION_REQUEST',
      'request_id', NEW.id,
      'store_id', NEW.store_id,
      'seller_id', NEW.seller_id,
      'seller_name', v_seller_name,
      'status', NEW.status,
      'timestamp', now()
    )::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_manager_on_correction ON public.checkin_correction_requests;

CREATE TRIGGER trigger_notify_manager_on_correction
AFTER INSERT OR UPDATE OF status ON public.checkin_correction_requests
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION notify_manager_on_correction_request();
