ALTER TABLE public.consulting_google_oauth_states
  ADD COLUMN IF NOT EXISTS purpose text DEFAULT 'personal' NOT NULL;

ALTER TABLE public.consulting_google_oauth_states
  DROP CONSTRAINT IF EXISTS consulting_google_oauth_states_purpose_check;

ALTER TABLE public.consulting_google_oauth_states
  ADD CONSTRAINT consulting_google_oauth_states_purpose_check
  CHECK (purpose IN ('personal', 'central'));

CREATE INDEX IF NOT EXISTS consulting_oauth_tokens_provider_idx
  ON public.consulting_oauth_tokens (provider);

COMMENT ON COLUMN public.consulting_google_oauth_states.purpose
  IS 'OAuth flow purpose: personal user calendar or central MX calendar.';
