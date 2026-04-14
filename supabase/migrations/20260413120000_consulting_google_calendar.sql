-- CONS-03: Integracao com Google Calendar
-- Base readonly com OAuth2, tokens cifrados na aplicacao e settings por usuario.

-- Habilitar pgcrypto para gen_random_uuid se nao existir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela para armazenar tokens OAuth2 de consultores.
-- Os valores sao persistidos cifrados pelas Edge Functions.
CREATE TABLE IF NOT EXISTS public.consulting_oauth_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider text NOT NULL DEFAULT 'google',
    access_token text NOT NULL,
    refresh_token text,
    expires_at timestamptz,
    scopes text[],
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT consulting_oauth_tokens_user_provider_unique UNIQUE (user_id, provider)
);

-- Settings por usuario autenticado, com vinculacao opcional de contexto do cliente.
CREATE TABLE IF NOT EXISTS public.consulting_calendar_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.consulting_clients(id) ON DELETE SET NULL,
    google_calendar_id text NOT NULL DEFAULT 'primary',
    sync_active boolean NOT NULL DEFAULT true,
    last_sync_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT consulting_calendar_settings_user_unique UNIQUE (user_id)
);

-- Estado temporario para o callback OAuth. O estado e gerado no backend e validado no retorno.
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

-- Triggers de Updated At
DROP TRIGGER IF EXISTS update_consulting_oauth_tokens_updated_at ON public.consulting_oauth_tokens;
CREATE TRIGGER update_consulting_oauth_tokens_updated_at
BEFORE UPDATE ON public.consulting_oauth_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_consulting_calendar_settings_updated_at ON public.consulting_calendar_settings;
CREATE TRIGGER update_consulting_calendar_settings_updated_at
BEFORE UPDATE ON public.consulting_calendar_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_consulting_google_oauth_states_updated_at ON public.consulting_google_oauth_states;
CREATE TRIGGER update_consulting_google_oauth_states_updated_at
BEFORE UPDATE ON public.consulting_google_oauth_states
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

-- RLS: Cada usuario so ve seus proprios tokens
ALTER TABLE public.consulting_oauth_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS oauth_tokens_owner_only ON public.consulting_oauth_tokens;
CREATE POLICY oauth_tokens_owner_only ON public.consulting_oauth_tokens
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS: Calendar settings e estado OAuth sao privados ao dono.
ALTER TABLE public.consulting_calendar_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_settings_owner_all ON public.consulting_calendar_settings;
CREATE POLICY calendar_settings_owner_all ON public.consulting_calendar_settings
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.consulting_google_oauth_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS oauth_states_owner_all ON public.consulting_google_oauth_states;
CREATE POLICY oauth_states_owner_all ON public.consulting_google_oauth_states
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Comentarios para documentacao
COMMENT ON TABLE public.consulting_oauth_tokens IS 'Tokens de acesso e refresh para integracoes externas (OAuth2).';
COMMENT ON TABLE public.consulting_calendar_settings IS 'Configuracoes de sincronizacao de agenda por usuario da consultoria, com contexto de cliente opcional.';
COMMENT ON TABLE public.consulting_google_oauth_states IS 'Estados temporarios e de uso unico para o callback OAuth do Google.';
