-- STORY-07/08: Feedback semanal oficial e feedback estruturado completo

ALTER TABLE public.feedbacks
    ADD COLUMN IF NOT EXISTS week_reference date,
    ADD COLUMN IF NOT EXISTS leads_week integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS agd_week integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS visit_week integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vnd_week integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tx_lead_agd numeric NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tx_agd_visita numeric NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tx_visita_vnd numeric NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS meta_compromisso integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS team_avg_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS diagnostic_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS commitment_suggested integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;

UPDATE public.feedbacks
SET week_reference = COALESCE(
    week_reference,
    date_trunc('week', created_at AT TIME ZONE 'America/Sao_Paulo')::date
)
WHERE week_reference IS NULL;

ALTER TABLE public.feedbacks
    ALTER COLUMN week_reference SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'feedbacks_week_metrics_nonnegative'
    ) THEN
        ALTER TABLE public.feedbacks
            ADD CONSTRAINT feedbacks_week_metrics_nonnegative
            CHECK (
                leads_week >= 0
                AND agd_week >= 0
                AND visit_week >= 0
                AND vnd_week >= 0
                AND tx_lead_agd >= 0
                AND tx_agd_visita >= 0
                AND tx_visita_vnd >= 0
                AND meta_compromisso >= 0
                AND commitment_suggested >= 0
            );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS feedbacks_store_week_idx
    ON public.feedbacks (store_id, week_reference DESC);

CREATE INDEX IF NOT EXISTS feedbacks_seller_week_idx
    ON public.feedbacks (seller_id, week_reference DESC);

CREATE TABLE IF NOT EXISTS public.weekly_feedback_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    week_start date NOT NULL,
    week_end date NOT NULL,
    team_avg_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    ranking_json jsonb NOT NULL DEFAULT '[]'::jsonb,
    benchmark_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    weekly_goal integer NOT NULL DEFAULT 0,
    report_url text,
    email_status text NOT NULL DEFAULT 'not_sent',
    recipients text[] NOT NULL DEFAULT '{}',
    warnings text[] NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT weekly_feedback_reports_email_status_check
        CHECK (email_status IN ('dry_run', 'sent', 'failed', 'not_sent')),
    CONSTRAINT weekly_feedback_reports_week_check CHECK (week_end >= week_start),
    CONSTRAINT weekly_feedback_reports_unique UNIQUE (store_id, week_start, week_end)
);

CREATE INDEX IF NOT EXISTS weekly_feedback_reports_store_week_idx
    ON public.weekly_feedback_reports (store_id, week_start DESC);

DROP TRIGGER IF EXISTS weekly_feedback_reports_set_updated_at ON public.weekly_feedback_reports;
CREATE TRIGGER weekly_feedback_reports_set_updated_at
BEFORE UPDATE ON public.weekly_feedback_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

ALTER TABLE public.weekly_feedback_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS role_matrix_weekly_feedback_reports_select ON public.weekly_feedback_reports;
CREATE POLICY role_matrix_weekly_feedback_reports_select ON public.weekly_feedback_reports
FOR SELECT TO authenticated
USING (
    public.is_admin()
    OR public.is_owner_of(store_id)
    OR public.is_manager_of(store_id)
);

DROP POLICY IF EXISTS role_matrix_weekly_feedback_reports_insert ON public.weekly_feedback_reports;
CREATE POLICY role_matrix_weekly_feedback_reports_insert ON public.weekly_feedback_reports
FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin()
    OR public.is_manager_of(store_id)
);

DROP POLICY IF EXISTS role_matrix_weekly_feedback_reports_update ON public.weekly_feedback_reports;
CREATE POLICY role_matrix_weekly_feedback_reports_update ON public.weekly_feedback_reports
FOR UPDATE TO authenticated
USING (
    public.is_admin()
    OR public.is_manager_of(store_id)
)
WITH CHECK (
    public.is_admin()
    OR public.is_manager_of(store_id)
);

DROP POLICY IF EXISTS role_matrix_weekly_feedback_reports_delete ON public.weekly_feedback_reports;
CREATE POLICY role_matrix_weekly_feedback_reports_delete ON public.weekly_feedback_reports
FOR DELETE TO authenticated
USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_feedback_reports TO authenticated;
GRANT ALL ON public.weekly_feedback_reports TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.configure_weekly_feedback_cron(
    p_function_url text,
    p_bearer_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, net
AS $$
DECLARE
    v_sql text;
BEGIN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'mx-weekly-feedback-1230';

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
        'mx-weekly-feedback-1230',
        '30 15 * * 1',
        v_sql
    );
END;
$$;

REVOKE ALL ON FUNCTION public.configure_weekly_feedback_cron(text, text) FROM PUBLIC;
