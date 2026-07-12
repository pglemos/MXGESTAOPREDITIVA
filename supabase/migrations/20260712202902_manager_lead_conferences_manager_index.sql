CREATE INDEX manager_lead_conferences_manager_idx
  ON public.manager_lead_conferences (manager_user_id, created_at DESC);
