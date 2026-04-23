-- Migration: Ecosystem Sync Phase 1 - Storage & Retroactive Edits
-- Date: 2026-04-18
-- Author: Orion (AIOX Master)

-- ============================================================
-- 1. STORAGE: PDI and Feedback Evidences
-- ============================================================

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
(
  'pdi-evidences',
  'pdi-evidences',
  false,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'audio/mpeg', 'audio/mp4']
),
(
  'feedback-evidences',
  'feedback-evidences',
  false,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'audio/mpeg', 'audio/mp4']
) ON CONFLICT (id) DO NOTHING;

-- RLS Policies for pdi-evidences
CREATE POLICY "pdi_evidences_upload_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'pdi-evidences'
    AND (
      -- Seller uploading their own or Manager uploading for their store
      is_admin() OR
      EXISTS (
        SELECT 1 FROM public.memberships m 
        WHERE m.user_id = auth.uid() 
          AND m.store_id::text = SPLIT_PART(name, '/', 1)
      )
    )
  );

CREATE POLICY "pdi_evidences_select_policy" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'pdi-evidences'
    AND (
      is_admin() OR
      EXISTS (
        SELECT 1 FROM public.memberships m 
        WHERE m.user_id = auth.uid() 
          AND m.store_id::text = SPLIT_PART(name, '/', 1)
      )
    )
  );

-- RLS Policies for feedback-evidences
CREATE POLICY "feedback_evidences_upload_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'feedback-evidences'
    AND (
      is_admin() OR
      EXISTS (
        SELECT 1 FROM public.memberships m 
        WHERE m.user_id = auth.uid() 
          AND m.store_id::text = SPLIT_PART(name, '/', 1)
      )
    )
  );

CREATE POLICY "feedback_evidences_select_policy" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'feedback-evidences'
    AND (
      is_admin() OR
      EXISTS (
        SELECT 1 FROM public.memberships m 
        WHERE m.user_id = auth.uid() 
          AND m.store_id::text = SPLIT_PART(name, '/', 1)
      )
    )
  );


-- ============================================================
-- 2. RLS: Checkin Correction Requests (Retroactive Edits)
-- ============================================================

-- Safely drop existing policies if any
DROP POLICY IF EXISTS "Sellers can create correction requests" ON public.checkin_correction_requests;
DROP POLICY IF EXISTS "Sellers can view own correction requests" ON public.checkin_correction_requests;
DROP POLICY IF EXISTS "Managers can view store correction requests" ON public.checkin_correction_requests;
DROP POLICY IF EXISTS "Managers can update store correction requests" ON public.checkin_correction_requests;

CREATE POLICY "Sellers can create correction requests" ON public.checkin_correction_requests
  FOR INSERT TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can view own correction requests" ON public.checkin_correction_requests
  FOR SELECT TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Managers can view store correction requests" ON public.checkin_correction_requests
  FOR SELECT TO authenticated
  USING (
    is_admin() OR 
    is_manager_of(store_id) OR
    is_owner_of(store_id)
  );

CREATE POLICY "Managers can update store correction requests" ON public.checkin_correction_requests
  FOR UPDATE TO authenticated
  USING (
    is_admin() OR 
    is_manager_of(store_id)
  )
  WITH CHECK (
    is_admin() OR 
    is_manager_of(store_id)
  );


-- ============================================================
-- 3. RPC: Approve Correction Request
-- ============================================================

CREATE OR REPLACE FUNCTION approve_correction_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
  v_is_manager boolean;
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
  -- The requested_values jsonb should contain the fields to update
  UPDATE daily_checkins
  SET 
    leads = COALESCE((v_request.requested_values->>'leads')::integer, leads),
    agd_cart = COALESCE((v_request.requested_values->>'agd_cart')::integer, agd_cart),
    agd_net = COALESCE((v_request.requested_values->>'agd_net')::integer, agd_net),
    vnd_porta = COALESCE((v_request.requested_values->>'vnd_porta')::integer, vnd_porta),
    vnd_cart = COALESCE((v_request.requested_values->>'vnd_cart')::integer, vnd_cart),
    vnd_net = COALESCE((v_request.requested_values->>'vnd_net')::integer, vnd_net),
    visitas = COALESCE((v_request.requested_values->>'visitas')::integer, visitas),
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

CREATE OR REPLACE FUNCTION reject_correction_request(request_id uuid)
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

  -- Check permissions
  IF NOT (is_admin() OR is_manager_of(v_request.store_id)) THEN
    RAISE EXCEPTION 'Permission denied.';
  END IF;

  -- Mark request as rejected
  UPDATE checkin_correction_requests
  SET 
    status = 'rejected',
    auditor_id = auth.uid(),
    reviewed_at = now()
  WHERE id = request_id;

END;
$$;
