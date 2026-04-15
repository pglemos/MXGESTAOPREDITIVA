-- STORY-06: Log de uso do CTA oficial de WhatsApp

CREATE TABLE IF NOT EXISTS public.whatsapp_share_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    reference_date date NOT NULL,
    source text NOT NULL DEFAULT 'morning_report',
    message_text text NOT NULL,
    shared_via text NOT NULL DEFAULT 'whatsapp',
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT whatsapp_share_logs_source_check CHECK (source IN ('morning_report')),
    CONSTRAINT whatsapp_share_logs_shared_via_check CHECK (shared_via IN ('whatsapp', 'native_share'))
);

CREATE INDEX IF NOT EXISTS whatsapp_share_logs_store_created_idx
    ON public.whatsapp_share_logs (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS whatsapp_share_logs_user_created_idx
    ON public.whatsapp_share_logs (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_share_logs TO authenticated;
GRANT ALL ON public.whatsapp_share_logs TO service_role;

ALTER TABLE public.whatsapp_share_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS role_matrix_whatsapp_share_logs_select ON public.whatsapp_share_logs;
DROP POLICY IF EXISTS role_matrix_whatsapp_share_logs_insert ON public.whatsapp_share_logs;
DROP POLICY IF EXISTS role_matrix_whatsapp_share_logs_update ON public.whatsapp_share_logs;
DROP POLICY IF EXISTS role_matrix_whatsapp_share_logs_delete ON public.whatsapp_share_logs;

CREATE POLICY role_matrix_whatsapp_share_logs_select ON public.whatsapp_share_logs
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_admin())
        OR (SELECT public.is_owner_of(store_id))
        OR (SELECT public.is_manager_of(store_id))
    );

CREATE POLICY role_matrix_whatsapp_share_logs_insert ON public.whatsapp_share_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT public.is_admin())
        OR ((SELECT public.is_manager_of(store_id)) AND user_id = (SELECT auth.uid()))
    );

CREATE POLICY role_matrix_whatsapp_share_logs_update ON public.whatsapp_share_logs
    FOR UPDATE TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY role_matrix_whatsapp_share_logs_delete ON public.whatsapp_share_logs
    FOR DELETE TO authenticated
    USING ((SELECT public.is_admin()));
