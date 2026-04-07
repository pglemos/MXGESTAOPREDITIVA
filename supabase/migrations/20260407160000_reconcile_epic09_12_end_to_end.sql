-- MX Gestão Preditiva
-- Reconciliação final EPIC-09 a EPIC-12 sobre o estado live consolidado até 20260407006100.
-- Objetivo: fechar PDI 2.0, notificações inbox, reprocessamento hardening, views finais
-- e helper mensal sem depender do histórico legado quebrado.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- EPIC-08 / EPIC-09 — Feedback estruturado e PDI 2.0
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS feedbacks_seller_week_unique
    ON public.feedbacks (seller_id, week_reference);

ALTER TABLE public.pdis
    ADD COLUMN IF NOT EXISTS meta_6m TEXT,
    ADD COLUMN IF NOT EXISTS meta_12m TEXT,
    ADD COLUMN IF NOT EXISTS meta_24m TEXT,
    ADD COLUMN IF NOT EXISTS comp_prospeccao INTEGER DEFAULT 6,
    ADD COLUMN IF NOT EXISTS comp_abordagem INTEGER DEFAULT 6,
    ADD COLUMN IF NOT EXISTS comp_demonstracao INTEGER DEFAULT 6,
    ADD COLUMN IF NOT EXISTS comp_fechamento INTEGER DEFAULT 6,
    ADD COLUMN IF NOT EXISTS comp_crm INTEGER DEFAULT 6,
    ADD COLUMN IF NOT EXISTS comp_digital INTEGER DEFAULT 6,
    ADD COLUMN IF NOT EXISTS comp_disciplina INTEGER DEFAULT 6,
    ADD COLUMN IF NOT EXISTS comp_organizacao INTEGER DEFAULT 6,
    ADD COLUMN IF NOT EXISTS comp_negociacao INTEGER DEFAULT 6,
    ADD COLUMN IF NOT EXISTS comp_produto INTEGER DEFAULT 6,
    ADD COLUMN IF NOT EXISTS action_1 TEXT,
    ADD COLUMN IF NOT EXISTS action_2 TEXT,
    ADD COLUMN IF NOT EXISTS action_3 TEXT,
    ADD COLUMN IF NOT EXISTS action_4 TEXT,
    ADD COLUMN IF NOT EXISTS action_5 TEXT,
    ADD COLUMN IF NOT EXISTS due_date DATE,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'pdis'
          AND column_name = 'status'
    ) THEN
        ALTER TABLE public.pdis ALTER COLUMN status SET DEFAULT 'aberto';
    ELSE
        ALTER TABLE public.pdis ADD COLUMN status TEXT DEFAULT 'aberto';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'pdis'
          AND column_name = 'acknowledged'
    ) THEN
        ALTER TABLE public.pdis ALTER COLUMN acknowledged SET DEFAULT FALSE;
    ELSE
        ALTER TABLE public.pdis ADD COLUMN acknowledged BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

UPDATE public.pdis
SET
    meta_6m = COALESCE(NULLIF(meta_6m, ''), NULLIF(objective, ''), 'Definir horizonte de 6 meses'),
    meta_12m = COALESCE(NULLIF(meta_12m, ''), NULLIF(objective, ''), 'Definir horizonte de 12 meses'),
    meta_24m = COALESCE(NULLIF(meta_24m, ''), NULLIF(objective, ''), 'Definir horizonte de 24 meses'),
    action_1 = COALESCE(NULLIF(action_1, ''), NULLIF(action, ''), 'Definir ação prioritária'),
    action_2 = COALESCE(action_2, NULL),
    action_3 = COALESCE(action_3, NULL),
    action_4 = COALESCE(action_4, NULL),
    action_5 = COALESCE(action_5, NULL),
    updated_at = COALESCE(updated_at, now())
WHERE
    meta_6m IS NULL
    OR meta_12m IS NULL
    OR meta_24m IS NULL
    OR action_1 IS NULL;

CREATE TABLE IF NOT EXISTS public.pdi_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pdi_id UUID NOT NULL REFERENCES public.pdis(id) ON DELETE CASCADE,
    evolution TEXT NOT NULL,
    difficulties TEXT,
    adjustments TEXT,
    next_review_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pdi_reviews_pdi_created_idx
    ON public.pdi_reviews (pdi_id, created_at DESC);

ALTER TABLE public.pdi_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS role_matrix_pdi_reviews_select ON public.pdi_reviews;
DROP POLICY IF EXISTS role_matrix_pdi_reviews_insert ON public.pdi_reviews;
DROP POLICY IF EXISTS "Gerente can manage pdi_reviews" ON public.pdi_reviews;
DROP POLICY IF EXISTS "Seller can view own pdi_reviews" ON public.pdi_reviews;
DROP POLICY IF EXISTS reconciled_pdi_reviews_select ON public.pdi_reviews;
DROP POLICY IF EXISTS reconciled_pdi_reviews_insert ON public.pdi_reviews;

CREATE POLICY reconciled_pdi_reviews_select
    ON public.pdi_reviews
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.pdis p
            WHERE p.id = pdi_reviews.pdi_id
              AND (
                  public.is_owner_of(p.store_id)
                  OR public.is_manager_of(p.store_id)
                  OR p.seller_id = auth.uid()
              )
        )
    );

CREATE POLICY reconciled_pdi_reviews_insert
    ON public.pdi_reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.pdis p
            WHERE p.id = pdi_reviews.pdi_id
              AND public.is_manager_of(p.store_id)
        )
    );

-- ============================================================================
-- EPIC-11 / EPIC-12 — Notificações inbox por usuário + tracking
-- ============================================================================

ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS type TEXT,
    ADD COLUMN IF NOT EXISTS priority TEXT,
    ADD COLUMN IF NOT EXISTS link TEXT,
    ADD COLUMN IF NOT EXISTS read BOOLEAN,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS broadcast_id UUID;

UPDATE public.notifications
SET
    store_id = COALESCE(store_id, target_store_id),
    type = COALESCE(type, 'system'),
    priority = COALESCE(priority, 'medium'),
    read = COALESCE(read, FALSE),
    created_at = COALESCE(created_at, sent_at, now());

ALTER TABLE public.notifications ALTER COLUMN type SET DEFAULT 'system';
ALTER TABLE public.notifications ALTER COLUMN priority SET DEFAULT 'medium';
ALTER TABLE public.notifications ALTER COLUMN read SET DEFAULT FALSE;
ALTER TABLE public.notifications ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.notifications ALTER COLUMN type SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN priority SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN read SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN created_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
    ON public.notifications (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_store_created_idx
    ON public.notifications (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_sender_id_idx
    ON public.notifications (sender_id);
CREATE INDEX IF NOT EXISTS notifications_broadcast_id_idx
    ON public.notifications (broadcast_id);

CREATE UNIQUE INDEX IF NOT EXISTS notification_reads_notification_user_unique
    ON public.notification_reads (notification_id, user_id);

CREATE OR REPLACE FUNCTION public.sync_notification_reads()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.read IS TRUE AND NEW.recipient_id IS NOT NULL THEN
        INSERT INTO public.notification_reads (notification_id, user_id, read_at)
        VALUES (NEW.id, NEW.recipient_id, COALESCE(NEW.created_at, now()))
        ON CONFLICT (notification_id, user_id)
        DO UPDATE SET read_at = EXCLUDED.read_at;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notifications_sync_notification_reads ON public.notifications;
CREATE TRIGGER notifications_sync_notification_reads
    AFTER INSERT OR UPDATE OF read
    ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_notification_reads();

CREATE OR REPLACE FUNCTION public.send_broadcast_notification(
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'system',
    p_priority TEXT DEFAULT 'medium',
    p_store_id UUID DEFAULT NULL,
    p_target_role TEXT DEFAULT 'todos',
    p_link TEXT DEFAULT NULL,
    p_sender_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_record RECORD;
    v_broadcast_id UUID := gen_random_uuid();
BEGIN
    FOR v_user_record IN
        SELECT DISTINCT
            u.id AS user_id,
            CASE WHEN p_store_id IS NULL THEN NULL ELSE p_store_id END AS resolved_store_id
        FROM public.users u
        LEFT JOIN public.memberships m
            ON m.user_id = u.id
        WHERE u.active = TRUE
          AND (p_store_id IS NULL OR m.store_id = p_store_id)
          AND (
              p_target_role = 'todos'
              OR u.role = p_target_role
              OR m.role = p_target_role
          )
    LOOP
        INSERT INTO public.notifications (
            recipient_id,
            store_id,
            sender_id,
            broadcast_id,
            title,
            message,
            type,
            priority,
            link,
            read,
            created_at,
            target_type,
            target_store_id,
            target_role,
            sent_at
        ) VALUES (
            v_user_record.user_id,
            v_user_record.resolved_store_id,
            p_sender_id,
            v_broadcast_id,
            p_title,
            p_message,
            p_type,
            p_priority,
            p_link,
            FALSE,
            now(),
            CASE WHEN p_store_id IS NULL THEN 'all' ELSE 'store' END,
            p_store_id,
            CASE WHEN p_target_role = 'todos' THEN NULL ELSE p_target_role END,
            now()
        );
    END LOOP;

    RETURN v_broadcast_id;
END;
$$;

REVOKE ALL ON FUNCTION public.send_broadcast_notification(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_broadcast_notification(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, UUID) TO authenticated;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS role_matrix_notifications_select ON public.notifications;
DROP POLICY IF EXISTS role_matrix_notifications_insert ON public.notifications;
DROP POLICY IF EXISTS reconciled_notifications_select ON public.notifications;
DROP POLICY IF EXISTS reconciled_notifications_insert ON public.notifications;
DROP POLICY IF EXISTS reconciled_notifications_update ON public.notifications;
DROP POLICY IF EXISTS reconciled_notifications_delete ON public.notifications;

CREATE POLICY reconciled_notifications_select
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (public.is_admin() OR recipient_id = auth.uid());

CREATE POLICY reconciled_notifications_insert
    ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR (store_id IS NOT NULL AND public.is_manager_of(store_id))
        OR recipient_id = auth.uid()
    );

CREATE POLICY reconciled_notifications_update
    ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (public.is_admin() OR recipient_id = auth.uid())
    WITH CHECK (public.is_admin() OR recipient_id = auth.uid());

CREATE POLICY reconciled_notifications_delete
    ON public.notifications
    FOR DELETE
    TO authenticated
    USING (public.is_admin() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS nr_select ON public.notification_reads;
DROP POLICY IF EXISTS nr_insert ON public.notification_reads;
DROP POLICY IF EXISTS reconciled_notification_reads_select ON public.notification_reads;
DROP POLICY IF EXISTS reconciled_notification_reads_insert ON public.notification_reads;

CREATE POLICY reconciled_notification_reads_select
    ON public.notification_reads
    FOR SELECT
    TO authenticated
    USING (public.is_admin() OR user_id = auth.uid());

CREATE POLICY reconciled_notification_reads_insert
    ON public.notification_reads
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin() OR user_id = auth.uid());

-- ============================================================================
-- EPIC-11 — Reprocessamento hardening
-- ============================================================================

ALTER TABLE public.reprocess_logs
    ADD COLUMN IF NOT EXISTS file_hash TEXT,
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS reprocess_logs_file_hash_idx
    ON public.reprocess_logs (file_hash)
    WHERE file_hash IS NOT NULL;

CREATE OR REPLACE FUNCTION public.process_import_data(p_log_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_raw RECORD;
    v_store_id UUID;
    v_seller_id UUID;
    v_ref_date DATE;
    v_current_status TEXT;
    v_file_hash TEXT;
BEGIN
    SELECT status, file_hash
      INTO v_current_status, v_file_hash
      FROM public.reprocess_logs
     WHERE id = p_log_id
     FOR UPDATE;

    IF v_current_status = 'completed' OR v_current_status = 'processing' THEN
        RAISE EXCEPTION 'Este lote ja foi processado ou esta em execucao (status: %).', v_current_status;
    END IF;

    IF v_file_hash IS NOT NULL AND EXISTS (
        SELECT 1
        FROM public.reprocess_logs rl
        WHERE rl.id <> p_log_id
          AND rl.file_hash = v_file_hash
          AND rl.status = 'completed'
    ) THEN
        RAISE EXCEPTION 'Arquivo ja processado anteriormente para este hash.';
    END IF;

    UPDATE public.reprocess_logs
       SET status = 'processing',
           started_at = now()
     WHERE id = p_log_id;

    FOR v_raw IN
        SELECT id, raw_data
        FROM public.raw_imports
        WHERE log_id = p_log_id
    LOOP
        BEGIN
            IF (v_raw.raw_data->>'store_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                v_store_id := (v_raw.raw_data->>'store_id')::uuid;
            ELSE
                SELECT id
                  INTO v_store_id
                  FROM public.stores
                 WHERE name ILIKE COALESCE(v_raw.raw_data->>'LOJA', '')
                 LIMIT 1;
            END IF;

            IF (v_raw.raw_data->>'seller_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                v_seller_id := (v_raw.raw_data->>'seller_id')::uuid;
            ELSE
                SELECT id
                  INTO v_seller_id
                  FROM public.users
                 WHERE email ILIKE COALESCE(v_raw.raw_data->>'EMAIL', '')
                    OR name ILIKE COALESCE(v_raw.raw_data->>'VENDEDOR', '')
                 LIMIT 1;
            END IF;

            v_ref_date := (v_raw.raw_data->>'DATA')::date;

            IF v_ref_date > (timezone('America/Sao_Paulo', now()))::date THEN
                RAISE EXCEPTION 'Data de referencia (%) superior ao limite operacional.', v_ref_date;
            END IF;

            IF v_store_id IS NOT NULL AND v_seller_id IS NOT NULL AND v_ref_date IS NOT NULL THEN
                INSERT INTO public.daily_checkins (
                    seller_user_id,
                    store_id,
                    reference_date,
                    submitted_at,
                    metric_scope,
                    leads_prev_day,
                    agd_cart_today,
                    agd_net_today,
                    vnd_porta_prev_day,
                    vnd_cart_prev_day,
                    vnd_net_prev_day,
                    visit_prev_day,
                    zero_reason,
                    created_by,
                    updated_at
                ) VALUES (
                    v_seller_id,
                    v_store_id,
                    v_ref_date,
                    now(),
                    'daily',
                    COALESCE(NULLIF(v_raw.raw_data->>'LEADS', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'AGD_CART', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'AGD_NET', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'VND_PORTA', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'VND_CART', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'VND_NET', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'VISITA', '')::integer, 0),
                    NULLIF(v_raw.raw_data->>'MOTIVO_ZERO', ''),
                    COALESCE((SELECT triggered_by FROM public.reprocess_logs WHERE id = p_log_id), v_seller_id),
                    now()
                )
                ON CONFLICT (seller_user_id, store_id, reference_date)
                DO UPDATE SET
                    submitted_at = EXCLUDED.submitted_at,
                    leads_prev_day = EXCLUDED.leads_prev_day,
                    agd_cart_today = EXCLUDED.agd_cart_today,
                    agd_net_today = EXCLUDED.agd_net_today,
                    vnd_porta_prev_day = EXCLUDED.vnd_porta_prev_day,
                    vnd_cart_prev_day = EXCLUDED.vnd_cart_prev_day,
                    vnd_net_prev_day = EXCLUDED.vnd_net_prev_day,
                    visit_prev_day = EXCLUDED.visit_prev_day,
                    zero_reason = EXCLUDED.zero_reason,
                    updated_at = now();

                UPDATE public.reprocess_logs
                   SET records_processed = COALESCE(records_processed, 0) + 1,
                       rows_processed = COALESCE(rows_processed, 0) + 1
                 WHERE id = p_log_id;
            ELSE
                UPDATE public.reprocess_logs
                   SET records_failed = COALESCE(records_failed, 0) + 1,
                       error_log = COALESCE(error_log, '[]'::jsonb) || jsonb_build_object(
                           'error', 'Entidade nao localizada (Loja ou Vendedor)',
                           'store_found', v_store_id IS NOT NULL,
                           'seller_found', v_seller_id IS NOT NULL,
                           'data', v_raw.raw_data
                       )
                 WHERE id = p_log_id;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            UPDATE public.reprocess_logs
               SET records_failed = COALESCE(records_failed, 0) + 1,
                   error_log = COALESCE(error_log, '[]'::jsonb) || jsonb_build_object('error', SQLERRM, 'data', v_raw.raw_data)
             WHERE id = p_log_id;
        END;
    END LOOP;

    UPDATE public.reprocess_logs
       SET status = 'completed',
           finished_at = now(),
           processed_at = now()
     WHERE id = p_log_id;
END;
$$;

-- ============================================================================
-- EPIC-01 / EPIC-10 / EPIC-11 — Views e helper mensal
-- ============================================================================

CREATE OR REPLACE VIEW public.view_seller_tenure_status AS
SELECT
    ss.id AS tenure_id,
    ss.store_id,
    s.name AS store_name,
    ss.seller_user_id,
    u.name AS seller_name,
    ss.started_at,
    ss.ended_at,
    ss.is_active,
    ss.closing_month_grace,
    CASE
        WHEN ss.is_active AND (ss.ended_at IS NULL OR ss.ended_at >= (timezone('America/Sao_Paulo', now()))::date) THEN 'ativo'
        ELSE 'encerrado'
    END AS tenure_status,
    (timezone('America/Sao_Paulo', now()))::date AS operational_date
FROM public.store_sellers ss
JOIN public.users u ON u.id = ss.seller_user_id
JOIN public.stores s ON s.id = ss.store_id;

CREATE OR REPLACE VIEW public.view_daily_team_status AS
WITH reference_clock AS (
    SELECT ((timezone('America/Sao_Paulo', now()))::date - 1) AS reference_date
)
SELECT
    ss.store_id,
    s.name AS store_name,
    ss.seller_user_id AS seller_id,
    u.name AS seller_name,
    rc.reference_date,
    dc.id AS checkin_id,
    (dc.id IS NULL) AS sem_registro,
    dc.submission_status,
    dc.submitted_at,
    dc.submitted_late,
    ss.started_at,
    ss.ended_at,
    ss.closing_month_grace
FROM public.store_sellers ss
JOIN public.users u ON u.id = ss.seller_user_id
JOIN public.stores s ON s.id = ss.store_id
CROSS JOIN reference_clock rc
LEFT JOIN public.daily_checkins dc
       ON dc.seller_user_id = ss.seller_user_id
      AND dc.store_id = ss.store_id
      AND dc.reference_date = rc.reference_date
      AND dc.metric_scope = 'daily'
WHERE ss.is_active = TRUE
  AND ss.started_at <= rc.reference_date
  AND (ss.ended_at IS NULL OR ss.ended_at >= rc.reference_date);

CREATE OR REPLACE FUNCTION public.configure_monthly_report_cron(
    p_function_url TEXT,
    p_bearer_token TEXT,
    p_schedule TEXT DEFAULT '30 13 1 * *'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, net
AS $$
DECLARE
    v_sql TEXT;
BEGIN
    PERFORM cron.unschedule(jobid)
      FROM cron.job
     WHERE jobname = 'mx-monthly-report';

    v_sql := format(
        $cron$
        SELECT net.http_post(
            url := %L,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', %L
            ),
            body := jsonb_build_object('source', 'cron')
        );
        $cron$,
        p_function_url,
        'Bearer ' || p_bearer_token
    );

    PERFORM cron.schedule(
        'mx-monthly-report',
        p_schedule,
        v_sql
    );
END;
$$;

COMMENT ON VIEW public.view_seller_tenure_status IS 'Visao operacional de vigencia real do vendedor por loja.';
COMMENT ON VIEW public.view_daily_team_status IS 'Visao canonica de Sem Registro em D-1 respeitando vigencia.';
COMMENT ON FUNCTION public.configure_monthly_report_cron(TEXT, TEXT, TEXT) IS 'Agenda o relatorio mensal oficial. Assumido 10:30 BRT no dia 1 por default.';
COMMENT ON FUNCTION public.send_broadcast_notification(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, UUID) IS 'Explode uma notificação corporativa para inbox individual com tracking por broadcast.';

COMMIT;
