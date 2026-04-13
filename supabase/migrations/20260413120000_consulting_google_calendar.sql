-- CONS-02: Integracao com Google Calendar
-- Adiciona suporte a tokens OAuth2 e configuracoes de agenda por cliente.

-- Habilitar pgcrypto para encriptacao se nao existir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela para armazenar tokens OAuth2 de consultores
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

-- Tabela para configuracoes de agenda por cliente/consultor
CREATE TABLE IF NOT EXISTS public.consulting_calendar_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    google_calendar_id text NOT NULL DEFAULT 'primary',
    sync_active boolean NOT NULL DEFAULT true,
    last_sync_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT consulting_calendar_settings_client_user_unique UNIQUE (client_id, user_id)
);

-- Triggers de Updated At
CREATE TRIGGER update_consulting_oauth_tokens_updated_at
BEFORE UPDATE ON public.consulting_oauth_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

CREATE TRIGGER update_consulting_calendar_settings_updated_at
BEFORE UPDATE ON public.consulting_calendar_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

-- RLS: Cada usuario so ve seus proprios tokens
ALTER TABLE public.consulting_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY oauth_tokens_owner_only ON public.consulting_oauth_tokens
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS: Calendar settings visiveis para o dono ou admin
ALTER TABLE public.consulting_calendar_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY calendar_settings_select ON public.consulting_calendar_settings
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY calendar_settings_owner_all ON public.consulting_calendar_settings
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Comentarios para documentacao
COMMENT ON TABLE public.consulting_oauth_tokens IS 'Tokens de acesso e refresh para integracoes externas (OAuth2).';
COMMENT ON TABLE public.consulting_calendar_settings IS 'Configuracoes de sincronizacao de agenda por cliente da consultoria.';
