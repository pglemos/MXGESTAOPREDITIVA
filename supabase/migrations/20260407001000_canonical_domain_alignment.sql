-- STORY-01.1: Alinhamento do schema canonico MX
-- Migration incremental para o Supabase live atual.
-- Mantem compatibilidade com colunas antigas de daily_checkins.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'checkin_scope') THEN
        CREATE TYPE public.checkin_scope AS ENUM ('daily', 'adjustment', 'historical');
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column_canonical()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

ALTER TABLE public.stores
    ADD COLUMN IF NOT EXISTS source_mode text DEFAULT 'native_app',
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_source_mode_check;
ALTER TABLE public.stores
    ADD CONSTRAINT stores_source_mode_check CHECK (source_mode IN ('legacy_forms', 'native_app', 'hybrid'));

UPDATE public.stores
SET source_mode = COALESCE(source_mode, 'native_app'),
    updated_at = COALESCE(updated_at, created_at, now());

DROP TRIGGER IF EXISTS update_stores_updated_at ON public.stores;
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS is_venda_loja boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS phone text,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.users
SET is_venda_loja = COALESCE(is_venda_loja, false),
    updated_at = COALESCE(updated_at, created_at, now());

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

CREATE TABLE IF NOT EXISTS public.store_sellers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    seller_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    started_at date NOT NULL DEFAULT CURRENT_DATE,
    ended_at date,
    is_active boolean NOT NULL DEFAULT true,
    closing_month_grace boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS store_sellers_store_seller_started_idx
    ON public.store_sellers (store_id, seller_user_id, started_at);
CREATE INDEX IF NOT EXISTS store_sellers_store_active_idx
    ON public.store_sellers (store_id, is_active, started_at, ended_at);
CREATE INDEX IF NOT EXISTS store_sellers_seller_idx
    ON public.store_sellers (seller_user_id);

DROP TRIGGER IF EXISTS update_store_sellers_updated_at ON public.store_sellers;
CREATE TRIGGER update_store_sellers_updated_at
BEFORE UPDATE ON public.store_sellers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

INSERT INTO public.store_sellers (store_id, seller_user_id, started_at, is_active)
SELECT m.store_id, m.user_id, COALESCE(m.created_at::date, CURRENT_DATE), true
FROM public.memberships m
WHERE m.role = 'vendedor'
ON CONFLICT (store_id, seller_user_id, started_at) DO NOTHING;

ALTER TABLE public.daily_checkins
    ADD COLUMN IF NOT EXISTS seller_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS submitted_at timestamptz DEFAULT now(),
    ADD COLUMN IF NOT EXISTS reference_date date DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS metric_scope public.checkin_scope DEFAULT 'daily',
    ADD COLUMN IF NOT EXISTS leads_prev_day integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS agd_cart_prev_day integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS agd_net_prev_day integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS agd_cart_today integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS agd_net_today integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vnd_porta_prev_day integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vnd_cart_prev_day integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vnd_net_prev_day integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS visit_prev_day integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

UPDATE public.daily_checkins
SET seller_user_id = COALESCE(seller_user_id, user_id),
    submitted_at = COALESCE(submitted_at, created_at, now()),
    reference_date = COALESCE(reference_date, date),
    metric_scope = COALESCE(metric_scope, 'daily'::public.checkin_scope),
    leads_prev_day = COALESCE(leads_prev_day, leads, 0),
    agd_cart_today = COALESCE(agd_cart_today, agd_cart, 0),
    agd_net_today = COALESCE(agd_net_today, agd_net, 0),
    vnd_porta_prev_day = COALESCE(vnd_porta_prev_day, vnd_porta, 0),
    vnd_cart_prev_day = COALESCE(vnd_cart_prev_day, vnd_cart, 0),
    vnd_net_prev_day = COALESCE(vnd_net_prev_day, vnd_net, 0),
    visit_prev_day = COALESCE(visit_prev_day, visitas, 0),
    created_by = COALESCE(created_by, user_id),
    updated_at = COALESCE(updated_at, now());

ALTER TABLE public.daily_checkins
    ALTER COLUMN seller_user_id SET NOT NULL,
    ALTER COLUMN reference_date SET NOT NULL,
    ALTER COLUMN submitted_at SET NOT NULL,
    ALTER COLUMN metric_scope SET NOT NULL,
    ALTER COLUMN leads_prev_day SET NOT NULL,
    ALTER COLUMN agd_cart_prev_day SET NOT NULL,
    ALTER COLUMN agd_net_prev_day SET NOT NULL,
    ALTER COLUMN agd_cart_today SET NOT NULL,
    ALTER COLUMN agd_net_today SET NOT NULL,
    ALTER COLUMN vnd_porta_prev_day SET NOT NULL,
    ALTER COLUMN vnd_cart_prev_day SET NOT NULL,
    ALTER COLUMN vnd_net_prev_day SET NOT NULL,
    ALTER COLUMN visit_prev_day SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS daily_checkins_seller_store_reference_key
    ON public.daily_checkins (seller_user_id, store_id, reference_date);
CREATE INDEX IF NOT EXISTS daily_checkins_store_reference_idx
    ON public.daily_checkins (store_id, reference_date);
CREATE INDEX IF NOT EXISTS daily_checkins_seller_reference_idx
    ON public.daily_checkins (seller_user_id, reference_date);

CREATE OR REPLACE FUNCTION public.sync_daily_checkins_canonical()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.seller_user_id IS NULL THEN
        NEW.seller_user_id := NEW.user_id;
    END IF;
    IF NEW.user_id IS NULL THEN
        NEW.user_id := NEW.seller_user_id;
    END IF;

    IF NEW.reference_date IS NULL THEN
        NEW.reference_date := NEW.date;
    ELSE
        NEW.date := NEW.reference_date;
    END IF;

    IF NEW.submitted_at IS NULL THEN
        NEW.submitted_at := COALESCE(NEW.created_at, now());
    END IF;
    IF NEW.created_at IS NULL THEN
        NEW.created_at := NEW.submitted_at;
    END IF;
    IF NEW.updated_at IS NULL THEN
        NEW.updated_at := now();
    END IF;

    NEW.metric_scope := COALESCE(NEW.metric_scope, 'daily'::public.checkin_scope);

    IF NEW.leads_prev_day IS NULL THEN NEW.leads_prev_day := COALESCE(NEW.leads, 0); END IF;
    IF NEW.agd_cart_today IS NULL THEN NEW.agd_cart_today := COALESCE(NEW.agd_cart, 0); END IF;
    IF NEW.agd_net_today IS NULL THEN NEW.agd_net_today := COALESCE(NEW.agd_net, 0); END IF;
    IF NEW.vnd_porta_prev_day IS NULL THEN NEW.vnd_porta_prev_day := COALESCE(NEW.vnd_porta, 0); END IF;
    IF NEW.vnd_cart_prev_day IS NULL THEN NEW.vnd_cart_prev_day := COALESCE(NEW.vnd_cart, 0); END IF;
    IF NEW.vnd_net_prev_day IS NULL THEN NEW.vnd_net_prev_day := COALESCE(NEW.vnd_net, 0); END IF;
    IF NEW.visit_prev_day IS NULL THEN NEW.visit_prev_day := COALESCE(NEW.visitas, 0); END IF;

    NEW.agd_cart_prev_day := COALESCE(NEW.agd_cart_prev_day, 0);
    NEW.agd_net_prev_day := COALESCE(NEW.agd_net_prev_day, 0);

    NEW.leads := COALESCE(NEW.leads_prev_day, 0);
    NEW.agd_cart := COALESCE(NEW.agd_cart_today, 0);
    NEW.agd_net := COALESCE(NEW.agd_net_today, 0);
    NEW.vnd_porta := COALESCE(NEW.vnd_porta_prev_day, 0);
    NEW.vnd_cart := COALESCE(NEW.vnd_cart_prev_day, 0);
    NEW.vnd_net := COALESCE(NEW.vnd_net_prev_day, 0);
    NEW.visitas := COALESCE(NEW.visit_prev_day, 0);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_daily_checkins_canonical ON public.daily_checkins;
CREATE TRIGGER sync_daily_checkins_canonical
BEFORE INSERT OR UPDATE ON public.daily_checkins
FOR EACH ROW EXECUTE FUNCTION public.sync_daily_checkins_canonical();

DROP TRIGGER IF EXISTS update_daily_checkins_updated_at ON public.daily_checkins;
CREATE TRIGGER update_daily_checkins_updated_at
BEFORE UPDATE ON public.daily_checkins
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

CREATE TABLE IF NOT EXISTS public.store_benchmarks (
    store_id uuid PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
    lead_to_agend numeric(5,2) NOT NULL DEFAULT 20.00,
    agend_to_visit numeric(5,2) NOT NULL DEFAULT 60.00,
    visit_to_sale numeric(5,2) NOT NULL DEFAULT 33.00,
    updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at timestamptz DEFAULT now()
);

INSERT INTO public.store_benchmarks (store_id, lead_to_agend, agend_to_visit, visit_to_sale)
SELECT s.id,
       COALESCE(b.lead_to_appt, 20.00),
       COALESCE(b.appt_to_visit, 60.00),
       COALESCE(b.visit_to_sale, 33.00)
FROM public.stores s
LEFT JOIN public.benchmarks b ON b.store_id = s.id
ON CONFLICT (store_id) DO UPDATE SET
    lead_to_agend = EXCLUDED.lead_to_agend,
    agend_to_visit = EXCLUDED.agend_to_visit,
    visit_to_sale = EXCLUDED.visit_to_sale;

DROP TRIGGER IF EXISTS update_store_benchmarks_updated_at ON public.store_benchmarks;
CREATE TRIGGER update_store_benchmarks_updated_at
BEFORE UPDATE ON public.store_benchmarks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

CREATE TABLE IF NOT EXISTS public.store_delivery_rules (
    store_id uuid PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
    matinal_recipients text[] NOT NULL DEFAULT '{}',
    weekly_recipients text[] NOT NULL DEFAULT '{}',
    monthly_recipients text[] NOT NULL DEFAULT '{}',
    whatsapp_group_ref text,
    timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
    active boolean NOT NULL DEFAULT true,
    updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at timestamptz DEFAULT now()
);

INSERT INTO public.store_delivery_rules (store_id, matinal_recipients, weekly_recipients, monthly_recipients)
SELECT s.id,
       CASE WHEN NULLIF(trim(COALESCE(s.manager_email, '')), '') IS NULL THEN '{}'::text[] ELSE ARRAY[s.manager_email] END,
       CASE WHEN NULLIF(trim(COALESCE(s.manager_email, '')), '') IS NULL THEN '{}'::text[] ELSE ARRAY[s.manager_email] END,
       CASE WHEN NULLIF(trim(COALESCE(s.manager_email, '')), '') IS NULL THEN '{}'::text[] ELSE ARRAY[s.manager_email] END
FROM public.stores s
ON CONFLICT (store_id) DO NOTHING;

DROP TRIGGER IF EXISTS update_store_delivery_rules_updated_at ON public.store_delivery_rules;
CREATE TRIGGER update_store_delivery_rules_updated_at
BEFORE UPDATE ON public.store_delivery_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

CREATE TABLE IF NOT EXISTS public.store_meta_rules (
    store_id uuid PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
    monthly_goal numeric(12,2) NOT NULL DEFAULT 0,
    individual_goal_mode text NOT NULL DEFAULT 'even',
    include_venda_loja_in_store_total boolean NOT NULL DEFAULT true,
    include_venda_loja_in_individual_goal boolean NOT NULL DEFAULT false,
    bench_lead_agd integer NOT NULL DEFAULT 20,
    bench_agd_visita integer NOT NULL DEFAULT 60,
    bench_visita_vnd integer NOT NULL DEFAULT 33,
    updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT store_meta_rules_individual_goal_mode_check CHECK (individual_goal_mode IN ('even', 'custom', 'proportional'))
);

INSERT INTO public.store_meta_rules (store_id, monthly_goal, updated_by)
SELECT s.id,
       COALESCE(g.target, 0)::numeric(12,2),
       g.updated_by
FROM public.stores s
LEFT JOIN LATERAL (
    SELECT target, updated_by
    FROM public.goals
    WHERE store_id = s.id AND user_id IS NULL
    ORDER BY year DESC, month DESC, updated_at DESC NULLS LAST
    LIMIT 1
) g ON true
ON CONFLICT (store_id) DO UPDATE SET
    monthly_goal = EXCLUDED.monthly_goal,
    updated_by = COALESCE(public.store_meta_rules.updated_by, EXCLUDED.updated_by);

DROP TRIGGER IF EXISTS update_store_meta_rules_updated_at ON public.store_meta_rules;
CREATE TRIGGER update_store_meta_rules_updated_at
BEFORE UPDATE ON public.store_meta_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

CREATE TABLE IF NOT EXISTS public.store_meta_rules_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
    changed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    old_values jsonb,
    new_values jsonb,
    changed_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.log_store_meta_rules_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.store_meta_rules_history (store_id, changed_by, old_values, new_values)
    VALUES (NEW.store_id, NEW.updated_by, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_log_store_meta_rules_changes ON public.store_meta_rules;
CREATE TRIGGER tr_log_store_meta_rules_changes
AFTER UPDATE ON public.store_meta_rules
FOR EACH ROW EXECUTE FUNCTION public.log_store_meta_rules_changes();

CREATE TABLE IF NOT EXISTS public.reprocess_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
    source_type text NOT NULL,
    triggered_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'pending',
    rows_processed integer NOT NULL DEFAULT 0,
    records_processed integer NOT NULL DEFAULT 0,
    records_failed integer NOT NULL DEFAULT 0,
    warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
    errors jsonb NOT NULL DEFAULT '[]'::jsonb,
    error_log jsonb NOT NULL DEFAULT '[]'::jsonb,
    started_at timestamptz DEFAULT now(),
    finished_at timestamptz,
    CONSTRAINT reprocess_logs_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS reprocess_logs_store_started_idx
    ON public.reprocess_logs (store_id, started_at DESC);
CREATE INDEX IF NOT EXISTS reprocess_logs_source_type_idx
    ON public.reprocess_logs (source_type);

CREATE TABLE IF NOT EXISTS public.raw_imports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_id uuid NOT NULL REFERENCES public.reprocess_logs(id) ON DELETE CASCADE,
    raw_data jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS raw_imports_log_id_idx ON public.raw_imports (log_id);

CREATE OR REPLACE FUNCTION public.process_import_data(p_log_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_raw record;
    v_store_id uuid;
    v_seller_id uuid;
    v_ref_date date;
BEGIN
    UPDATE public.reprocess_logs
    SET status = 'processing', started_at = now()
    WHERE id = p_log_id;

    FOR v_raw IN SELECT id, raw_data FROM public.raw_imports WHERE log_id = p_log_id LOOP
        BEGIN
            IF (v_raw.raw_data->>'store_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                v_store_id := (v_raw.raw_data->>'store_id')::uuid;
            ELSE
                SELECT id INTO v_store_id
                FROM public.stores
                WHERE name ILIKE (v_raw.raw_data->>'LOJA')
                LIMIT 1;
            END IF;

            IF (v_raw.raw_data->>'seller_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                v_seller_id := (v_raw.raw_data->>'seller_id')::uuid;
            ELSE
                SELECT id INTO v_seller_id
                FROM public.users
                WHERE email ILIKE (v_raw.raw_data->>'EMAIL')
                   OR name ILIKE (v_raw.raw_data->>'VENDEDOR')
                LIMIT 1;
            END IF;

            v_ref_date := (v_raw.raw_data->>'DATA')::date;

            IF v_ref_date > CURRENT_DATE THEN
                RAISE EXCEPTION 'Data de referencia (%) superior ao limite operacional.', v_ref_date;
            END IF;

            IF v_store_id IS NOT NULL AND v_seller_id IS NOT NULL AND v_ref_date IS NOT NULL THEN
                INSERT INTO public.daily_checkins (
                    seller_user_id, store_id, reference_date, submitted_at,
                    leads_prev_day, agd_cart_today, agd_net_today,
                    vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day,
                    visit_prev_day, zero_reason, created_by, updated_at
                ) VALUES (
                    v_seller_id, v_store_id, v_ref_date, now(),
                    COALESCE(NULLIF(v_raw.raw_data->>'LEADS', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'AGD_CART', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'AGD_NET', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'VND_PORTA', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'VND_CART', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'VND_NET', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'VISITA', '')::integer, 0),
                    v_raw.raw_data->>'MOTIVO_ZERO',
                    v_seller_id,
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
                SET records_processed = records_processed + 1,
                    rows_processed = rows_processed + 1
                WHERE id = p_log_id;
            ELSE
                UPDATE public.reprocess_logs
                SET records_failed = records_failed + 1,
                    error_log = COALESCE(error_log, '[]'::jsonb) || jsonb_build_object(
                        'error', 'Entidade nao localizada',
                        'store_found', v_store_id IS NOT NULL,
                        'seller_found', v_seller_id IS NOT NULL,
                        'data', v_raw.raw_data
                    )
                WHERE id = p_log_id;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            UPDATE public.reprocess_logs
            SET records_failed = records_failed + 1,
                error_log = COALESCE(error_log, '[]'::jsonb) || jsonb_build_object('error', SQLERRM, 'data', v_raw.raw_data)
            WHERE id = p_log_id;
        END;
    END LOOP;

    UPDATE public.reprocess_logs
    SET status = 'completed', finished_at = now()
    WHERE id = p_log_id;
END;
$$;

CREATE OR REPLACE VIEW public.view_sem_registro AS
SELECT
    ss.store_id,
    ss.seller_user_id,
    CURRENT_DATE AS reference_date,
    ss.started_at,
    ss.closing_month_grace
FROM public.store_sellers ss
LEFT JOIN public.daily_checkins dc
    ON dc.seller_user_id = ss.seller_user_id
   AND dc.store_id = ss.store_id
   AND dc.reference_date = CURRENT_DATE
WHERE ss.is_active = true
  AND ss.started_at <= CURRENT_DATE
  AND (ss.ended_at IS NULL OR ss.ended_at >= CURRENT_DATE)
  AND dc.id IS NULL;

CREATE OR REPLACE VIEW public.view_store_daily_production AS
SELECT
    dc.store_id,
    dc.reference_date,
    SUM(dc.leads_prev_day) AS total_leads,
    SUM(dc.visit_prev_day) AS total_visits,
    SUM(dc.agd_cart_today + dc.agd_net_today) AS total_agendamentos,
    SUM(
        CASE
            WHEN COALESCE(u.is_venda_loja, false)
                THEN CASE WHEN COALESCE(smr.include_venda_loja_in_store_total, true)
                    THEN (dc.vnd_porta_prev_day + dc.vnd_cart_prev_day + dc.vnd_net_prev_day)
                    ELSE 0
                END
            ELSE (dc.vnd_porta_prev_day + dc.vnd_cart_prev_day + dc.vnd_net_prev_day)
        END
    ) AS total_vendas
FROM public.daily_checkins dc
JOIN public.users u ON u.id = dc.seller_user_id
LEFT JOIN public.store_meta_rules smr ON smr.store_id = dc.store_id
GROUP BY dc.store_id, dc.reference_date;

DROP POLICY IF EXISTS role_matrix_daily_checkins_select ON public.daily_checkins;
DROP POLICY IF EXISTS role_matrix_daily_checkins_insert ON public.daily_checkins;
DROP POLICY IF EXISTS role_matrix_daily_checkins_update ON public.daily_checkins;

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_matrix_daily_checkins_select ON public.daily_checkins
    FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()) OR (SELECT public.is_owner_of(store_id)) OR (SELECT public.is_manager_of(store_id)) OR seller_user_id = (SELECT auth.uid()));
CREATE POLICY role_matrix_daily_checkins_insert ON public.daily_checkins
    FOR INSERT TO authenticated
    WITH CHECK (seller_user_id = (SELECT auth.uid()));
CREATE POLICY role_matrix_daily_checkins_update ON public.daily_checkins
    FOR UPDATE TO authenticated
    USING (seller_user_id = (SELECT auth.uid()))
    WITH CHECK (seller_user_id = (SELECT auth.uid()));

ALTER TABLE public.store_sellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS role_matrix_store_sellers_select ON public.store_sellers;
DROP POLICY IF EXISTS role_matrix_store_sellers_write ON public.store_sellers;
CREATE POLICY role_matrix_store_sellers_select ON public.store_sellers
    FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()) OR (SELECT public.is_owner_of(store_id)) OR (SELECT public.is_manager_of(store_id)) OR seller_user_id = (SELECT auth.uid()));
CREATE POLICY role_matrix_store_sellers_write ON public.store_sellers
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

ALTER TABLE public.store_benchmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS role_matrix_store_benchmarks_select ON public.store_benchmarks;
DROP POLICY IF EXISTS role_matrix_store_benchmarks_write ON public.store_benchmarks;
CREATE POLICY role_matrix_store_benchmarks_select ON public.store_benchmarks
    FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()) OR (SELECT public.is_owner_of(store_id)) OR (SELECT public.is_manager_of(store_id)));
CREATE POLICY role_matrix_store_benchmarks_write ON public.store_benchmarks
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

ALTER TABLE public.store_delivery_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS role_matrix_store_delivery_rules_select ON public.store_delivery_rules;
DROP POLICY IF EXISTS role_matrix_store_delivery_rules_write ON public.store_delivery_rules;
CREATE POLICY role_matrix_store_delivery_rules_select ON public.store_delivery_rules
    FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()) OR (SELECT public.is_owner_of(store_id)) OR (SELECT public.is_manager_of(store_id)));
CREATE POLICY role_matrix_store_delivery_rules_write ON public.store_delivery_rules
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

ALTER TABLE public.store_meta_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS role_matrix_store_meta_rules_select ON public.store_meta_rules;
DROP POLICY IF EXISTS role_matrix_store_meta_rules_update ON public.store_meta_rules;
DROP POLICY IF EXISTS role_matrix_store_meta_rules_write ON public.store_meta_rules;
CREATE POLICY role_matrix_store_meta_rules_select ON public.store_meta_rules
    FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()) OR (SELECT public.is_owner_of(store_id)) OR (SELECT public.is_manager_of(store_id)));
CREATE POLICY role_matrix_store_meta_rules_write ON public.store_meta_rules
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()) OR (SELECT public.is_manager_of(store_id)))
    WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_manager_of(store_id)));

ALTER TABLE public.reprocess_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS role_matrix_reprocess_logs_select ON public.reprocess_logs;
DROP POLICY IF EXISTS role_matrix_reprocess_logs_write ON public.reprocess_logs;
CREATE POLICY role_matrix_reprocess_logs_select ON public.reprocess_logs
    FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()));
CREATE POLICY role_matrix_reprocess_logs_write ON public.reprocess_logs
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

ALTER TABLE public.raw_imports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS role_matrix_raw_imports_admin ON public.raw_imports;
CREATE POLICY role_matrix_raw_imports_admin ON public.raw_imports
    FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));
