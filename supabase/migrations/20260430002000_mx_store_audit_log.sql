-- Epic MX Platform Evolution / Story 3.4
-- Audit immutable store updates made by admin users.

CREATE TABLE IF NOT EXISTS public.store_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS store_audit_log_store_id_idx
  ON public.store_audit_log(store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS store_audit_log_changed_by_idx
  ON public.store_audit_log(changed_by, created_at DESC);

ALTER TABLE public.store_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_audit_log_admin_select ON public.store_audit_log;
CREATE POLICY store_audit_log_admin_select
  ON public.store_audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS mx_evolution_stores_update_admin ON public.stores;
CREATE POLICY mx_evolution_stores_update_admin
  ON public.stores
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.log_store_update_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changes jsonb;
BEGIN
  SELECT COALESCE(
    jsonb_object_agg(key, jsonb_build_object('old', old_value, 'new', new_value)),
    '{}'::jsonb
  )
  INTO v_changes
  FROM (
    SELECT new_values.key, old_values.value AS old_value, new_values.value AS new_value
    FROM jsonb_each(to_jsonb(NEW)) AS new_values(key, value)
    JOIN jsonb_each(to_jsonb(OLD)) AS old_values(key, value) USING (key)
    WHERE new_values.value IS DISTINCT FROM old_values.value
      AND new_values.key NOT IN ('updated_at')
  ) delta;

  IF v_changes <> '{}'::jsonb THEN
    INSERT INTO public.store_audit_log(store_id, changed_by, changes)
    VALUES (NEW.id, auth.uid(), v_changes);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_store_audit_log ON public.stores;
CREATE TRIGGER trg_store_audit_log
  AFTER UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.log_store_update_changes();
