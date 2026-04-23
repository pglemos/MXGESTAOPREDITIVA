-- Migration: Fix Approve Correction RPC to use Canonical Columns
-- Date: 2026-04-23
-- Author: Orion (AIOX Master)

CREATE OR REPLACE FUNCTION approve_correction_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
BEGIN
  -- Get the request
  SELECT * INTO v_request 
  FROM checkin_correction_requests 
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed.';
  END IF;

  -- Check permissions (must be admin or manager of the store)
  IF NOT (is_admin() OR is_manager_of(v_request.store_id)) THEN
    RAISE EXCEPTION 'Permission denied.';
  END IF;

  -- Update the daily_checkins record
  -- We support both legacy and canonical keys for backward compatibility during transition
  UPDATE daily_checkins
  SET 
    leads_prev_day = COALESCE(
      (v_request.requested_values->>'leads_prev_day')::integer, 
      (v_request.requested_values->>'leads')::integer, 
      leads_prev_day
    ),
    agd_cart_today = COALESCE(
      (v_request.requested_values->>'agd_cart_today')::integer, 
      (v_request.requested_values->>'agd_cart')::integer, 
      agd_cart_today
    ),
    agd_net_today = COALESCE(
      (v_request.requested_values->>'agd_net_today')::integer, 
      (v_request.requested_values->>'agd_net')::integer, 
      agd_net_today
    ),
    vnd_porta_prev_day = COALESCE(
      (v_request.requested_values->>'vnd_porta_prev_day')::integer, 
      (v_request.requested_values->>'vnd_porta')::integer, 
      vnd_porta_prev_day
    ),
    vnd_cart_prev_day = COALESCE(
      (v_request.requested_values->>'vnd_cart_prev_day')::integer, 
      (v_request.requested_values->>'vnd_cart')::integer, 
      vnd_cart_prev_day
    ),
    vnd_net_prev_day = COALESCE(
      (v_request.requested_values->>'vnd_net_prev_day')::integer, 
      (v_request.requested_values->>'vnd_net')::integer, 
      vnd_net_prev_day
    ),
    visit_prev_day = COALESCE(
      (v_request.requested_values->>'visit_prev_day')::integer, 
      (v_request.requested_values->>'visitas')::integer, 
      visit_prev_day
    ),
    updated_at = now()
  WHERE id = v_request.checkin_id;

  -- Mark request as approved
  UPDATE checkin_correction_requests
  SET 
    status = 'approved',
    auditor_id = auth.uid(),
    reviewed_at = now()
  WHERE id = request_id;

END;
$$;
