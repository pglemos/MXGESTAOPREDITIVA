CREATE TABLE IF NOT EXISTS public.ai_model_daily_usage (
  usage_date date NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  requests integer NOT NULL DEFAULT 0 CHECK (requests >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usage_date, provider, model)
);

ALTER TABLE public.ai_model_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.claim_ai_model_daily_quota(
  p_provider text,
  p_primary_model text,
  p_primary_daily_limit integer,
  p_fallback_model text,
  p_fallback_daily_limit integer,
  p_force_fallback boolean DEFAULT false
)
RETURNS TABLE (
  selected_model text,
  used_requests integer,
  daily_limit integer,
  quota_date date,
  fallback_used boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quota_date date := (now() AT TIME ZONE 'America/Los_Angeles')::date;
  v_used integer;
BEGIN
  IF p_provider IS NULL OR btrim(p_provider) = '' THEN
    RAISE EXCEPTION 'provider_required';
  END IF;

  IF p_primary_model IS NULL OR btrim(p_primary_model) = '' THEN
    RAISE EXCEPTION 'primary_model_required';
  END IF;

  IF p_fallback_model IS NULL OR btrim(p_fallback_model) = '' THEN
    RAISE EXCEPTION 'fallback_model_required';
  END IF;

  IF p_primary_daily_limit < 1 OR p_fallback_daily_limit < 1 THEN
    RAISE EXCEPTION 'invalid_daily_limit';
  END IF;

  IF NOT p_force_fallback THEN
    INSERT INTO public.ai_model_daily_usage (usage_date, provider, model, requests)
    VALUES (v_quota_date, p_provider, p_primary_model, 0)
    ON CONFLICT (usage_date, provider, model) DO NOTHING;

    UPDATE public.ai_model_daily_usage
    SET requests = requests + 1,
        updated_at = now()
    WHERE usage_date = v_quota_date
      AND provider = p_provider
      AND model = p_primary_model
      AND requests < p_primary_daily_limit
    RETURNING requests INTO v_used;

    IF v_used IS NOT NULL THEN
      RETURN QUERY SELECT p_primary_model, v_used, p_primary_daily_limit, v_quota_date, false;
      RETURN;
    END IF;
  END IF;

  INSERT INTO public.ai_model_daily_usage (usage_date, provider, model, requests)
  VALUES (v_quota_date, p_provider, p_fallback_model, 0)
  ON CONFLICT (usage_date, provider, model) DO NOTHING;

  UPDATE public.ai_model_daily_usage
  SET requests = requests + 1,
      updated_at = now()
  WHERE usage_date = v_quota_date
    AND provider = p_provider
    AND model = p_fallback_model
    AND requests < p_fallback_daily_limit
  RETURNING requests INTO v_used;

  IF v_used IS NOT NULL THEN
    RETURN QUERY SELECT p_fallback_model, v_used, p_fallback_daily_limit, v_quota_date, true;
    RETURN;
  END IF;

  RETURN;
END;
$$;

REVOKE ALL ON public.ai_model_daily_usage FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_ai_model_daily_quota(text, text, integer, text, integer, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ai_model_daily_quota(text, text, integer, text, integer, boolean) TO service_role;
