-- CONS-03 hardening
-- Reconciliacao segura para ambientes que ja executaram a base inicial do Google Calendar.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE IF EXISTS public.consulting_calendar_settings
    ALTER COLUMN client_id DROP NOT NULL;

ALTER TABLE IF EXISTS public.consulting_calendar_settings
    DROP CONSTRAINT IF EXISTS consulting_calendar_settings_client_user_unique;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'consulting_calendar_settings_user_unique_idx'
    ) THEN
        CREATE UNIQUE INDEX consulting_calendar_settings_user_unique_idx
            ON public.consulting_calendar_settings (user_id);
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.consulting_google_oauth_states (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.consulting_clients(id) ON DELETE SET NULL,
    state text NOT NULL UNIQUE,
    redirect_uri text NOT NULL,
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_consulting_google_oauth_states_updated_at ON public.consulting_google_oauth_states;
CREATE TRIGGER update_consulting_google_oauth_states_updated_at
BEFORE UPDATE ON public.consulting_google_oauth_states
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

ALTER TABLE public.consulting_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_google_oauth_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS oauth_tokens_owner_only ON public.consulting_oauth_tokens;
CREATE POLICY oauth_tokens_owner_only ON public.consulting_oauth_tokens
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS calendar_settings_select ON public.consulting_calendar_settings;
DROP POLICY IF EXISTS calendar_settings_owner_all ON public.consulting_calendar_settings;
CREATE POLICY calendar_settings_owner_all ON public.consulting_calendar_settings
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS oauth_states_owner_all ON public.consulting_google_oauth_states;
CREATE POLICY oauth_states_owner_all ON public.consulting_google_oauth_states
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.consulting_google_oauth_states IS 'Estados temporarios e de uso unico para o callback OAuth do Google.';
