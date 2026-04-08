-- MX Role Matrix: admin, dono, gerente, vendedor.
-- This migration is intentionally versioned only; apply to live Supabase in a controlled deploy window.

-- 1) Normalize legacy role values before tightening constraints.
UPDATE public.users
SET role = CASE
    WHEN role = 'consultor' THEN 'admin'
    WHEN role = 'owner' THEN 'dono'
    WHEN role = 'manager' THEN 'gerente'
    WHEN role = 'seller' THEN 'vendedor'
    ELSE role
END
WHERE role IN ('consultor', 'owner', 'manager', 'seller');

UPDATE public.memberships
SET role = CASE
    WHEN role IN ('owner', 'consultor') THEN 'dono'
    WHEN role = 'manager' THEN 'gerente'
    WHEN role = 'seller' THEN 'vendedor'
    ELSE role
END
WHERE role IN ('owner', 'consultor', 'manager', 'seller');

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role = ANY (ARRAY['admin'::text, 'dono'::text, 'gerente'::text, 'vendedor'::text]));

ALTER TABLE public.memberships DROP CONSTRAINT IF EXISTS memberships_role_check;
ALTER TABLE public.memberships
ADD CONSTRAINT memberships_role_check
CHECK (role = ANY (ARRAY['dono'::text, 'gerente'::text, 'vendedor'::text]));

DO $$
BEGIN
    IF to_regclass('public.roles') IS NOT NULL
       AND EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'name'
       ) THEN
        INSERT INTO public.roles(name)
        VALUES ('admin'), ('dono'), ('gerente'), ('vendedor')
        ON CONFLICT (name) DO NOTHING;
    END IF;
END $$;

-- 2) Helper functions. SECURITY DEFINER avoids recursive RLS checks.
CREATE OR REPLACE FUNCTION public.normalize_mx_role(p_role text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN p_role = 'consultor' THEN 'admin'
        WHEN p_role = 'owner' THEN 'dono'
        WHEN p_role = 'manager' THEN 'gerente'
        WHEN p_role = 'seller' THEN 'vendedor'
        ELSE p_role
    END
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id = (SELECT auth.uid())
          AND public.normalize_mx_role(u.role) = 'admin'
          AND COALESCE(u.active, true) = true
    )
$$;

CREATE OR REPLACE FUNCTION public.has_store_role(p_store_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.memberships m
        WHERE m.user_id = (SELECT auth.uid())
          AND m.store_id = p_store_id
          AND public.normalize_mx_role(m.role) = ANY (p_roles)
    )
$$;

CREATE OR REPLACE FUNCTION public.is_owner_of(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.is_admin() OR public.has_store_role(p_store_id, ARRAY['dono'])
$$;

CREATE OR REPLACE FUNCTION public.is_manager_of(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.is_admin() OR public.has_store_role(p_store_id, ARRAY['gerente'])
$$;

CREATE OR REPLACE FUNCTION public.is_member_of(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.is_admin() OR public.has_store_role(p_store_id, ARRAY['dono', 'gerente', 'vendedor'])
$$;

CREATE INDEX IF NOT EXISTS idx_memberships_user_store_role ON public.memberships(user_id, store_id, role);
CREATE INDEX IF NOT EXISTS idx_memberships_store_role ON public.memberships(store_id, role);

-- 3) Replace policies on target tables. This intentionally removes older consultor policies.
DO $$
DECLARE
    pol record;
    checkin_user_col text;
    notification_has_recipient boolean;
    notification_has_target boolean;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'stores', 'memberships', 'daily_checkins', 'goals', 'benchmarks',
              'store_benchmarks', 'store_meta_rules', 'trainings', 'training_progress',
              'digital_products', 'notifications', 'feedbacks', 'pdis', 'pdi_reviews',
              'reprocess_logs', 'raw_imports', 'store_sellers'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;

    IF to_regclass('public.stores') IS NOT NULL THEN
        ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
        CREATE POLICY role_matrix_stores_select ON public.stores
            FOR SELECT TO authenticated
            USING ((SELECT public.is_admin()) OR (SELECT public.is_member_of(id)));
        CREATE POLICY role_matrix_stores_insert ON public.stores
            FOR INSERT TO authenticated
            WITH CHECK ((SELECT public.is_admin()));
        CREATE POLICY role_matrix_stores_update ON public.stores
            FOR UPDATE TO authenticated
            USING ((SELECT public.is_admin()))
            WITH CHECK ((SELECT public.is_admin()));
        CREATE POLICY role_matrix_stores_delete ON public.stores
            FOR DELETE TO authenticated
            USING ((SELECT public.is_admin()));
    END IF;

    IF to_regclass('public.memberships') IS NOT NULL THEN
        ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
        CREATE POLICY role_matrix_memberships_select ON public.memberships
            FOR SELECT TO authenticated
            USING (
                (SELECT public.is_admin())
                OR user_id = (SELECT auth.uid())
                OR (SELECT public.is_owner_of(store_id))
                OR (SELECT public.is_manager_of(store_id))
            );
        CREATE POLICY role_matrix_memberships_write ON public.memberships
            FOR ALL TO authenticated
            USING ((SELECT public.is_admin()))
            WITH CHECK ((SELECT public.is_admin()));
    END IF;

    IF to_regclass('public.daily_checkins') IS NOT NULL THEN
        ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
        SELECT CASE
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'daily_checkins' AND column_name = 'seller_user_id'
            ) THEN 'seller_user_id'
            ELSE 'user_id'
        END INTO checkin_user_col;

        EXECUTE format(
            'CREATE POLICY role_matrix_daily_checkins_select ON public.daily_checkins
             FOR SELECT TO authenticated
             USING ((SELECT public.is_admin()) OR (SELECT public.is_owner_of(store_id)) OR (SELECT public.is_manager_of(store_id)) OR %I = (SELECT auth.uid()))',
            checkin_user_col
        );
        EXECUTE format(
            'CREATE POLICY role_matrix_daily_checkins_insert ON public.daily_checkins
             FOR INSERT TO authenticated
             WITH CHECK (%I = (SELECT auth.uid()))',
            checkin_user_col
        );
        EXECUTE format(
            'CREATE POLICY role_matrix_daily_checkins_update ON public.daily_checkins
             FOR UPDATE TO authenticated
             USING (%I = (SELECT auth.uid()))
             WITH CHECK (%I = (SELECT auth.uid()))',
            checkin_user_col,
            checkin_user_col
        );
    END IF;

    IF to_regclass('public.goals') IS NOT NULL THEN
        ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
        CREATE POLICY role_matrix_goals_select ON public.goals
            FOR SELECT TO authenticated
            USING (
                (SELECT public.is_admin())
                OR (SELECT public.is_owner_of(store_id))
                OR (SELECT public.is_manager_of(store_id))
                OR user_id = (SELECT auth.uid())
            );
        CREATE POLICY role_matrix_goals_insert ON public.goals
            FOR INSERT TO authenticated
            WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_manager_of(store_id)));
        CREATE POLICY role_matrix_goals_update ON public.goals
            FOR UPDATE TO authenticated
            USING ((SELECT public.is_admin()) OR (SELECT public.is_manager_of(store_id)))
            WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_manager_of(store_id)));
    END IF;

    IF to_regclass('public.benchmarks') IS NOT NULL THEN
        ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;
        CREATE POLICY role_matrix_benchmarks_select ON public.benchmarks
            FOR SELECT TO authenticated
            USING ((SELECT public.is_admin()) OR (SELECT public.is_owner_of(store_id)) OR (SELECT public.is_manager_of(store_id)));
        CREATE POLICY role_matrix_benchmarks_write ON public.benchmarks
            FOR ALL TO authenticated
            USING ((SELECT public.is_admin()))
            WITH CHECK ((SELECT public.is_admin()));
    END IF;

    IF to_regclass('public.store_benchmarks') IS NOT NULL THEN
        ALTER TABLE public.store_benchmarks ENABLE ROW LEVEL SECURITY;
        CREATE POLICY role_matrix_store_benchmarks_select ON public.store_benchmarks
            FOR SELECT TO authenticated
            USING ((SELECT public.is_admin()) OR (SELECT public.is_owner_of(store_id)) OR (SELECT public.is_manager_of(store_id)));
        CREATE POLICY role_matrix_store_benchmarks_write ON public.store_benchmarks
            FOR ALL TO authenticated
            USING ((SELECT public.is_admin()))
            WITH CHECK ((SELECT public.is_admin()));
    END IF;

    IF to_regclass('public.store_meta_rules') IS NOT NULL THEN
        ALTER TABLE public.store_meta_rules ENABLE ROW LEVEL SECURITY;
        CREATE POLICY role_matrix_store_meta_rules_select ON public.store_meta_rules
            FOR SELECT TO authenticated
            USING ((SELECT public.is_admin()) OR (SELECT public.is_owner_of(store_id)) OR (SELECT public.is_manager_of(store_id)));
        CREATE POLICY role_matrix_store_meta_rules_update ON public.store_meta_rules
            FOR ALL TO authenticated
            USING ((SELECT public.is_admin()) OR (SELECT public.is_manager_of(store_id)))
            WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_manager_of(store_id)));
    END IF;

    IF to_regclass('public.feedbacks') IS NOT NULL THEN
        ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
        CREATE POLICY role_matrix_feedbacks_select ON public.feedbacks
            FOR SELECT TO authenticated
            USING (
                (SELECT public.is_admin())
                OR (SELECT public.is_owner_of(store_id))
                OR (SELECT public.is_manager_of(store_id))
                OR seller_id = (SELECT auth.uid())
            );
        CREATE POLICY role_matrix_feedbacks_insert ON public.feedbacks
            FOR INSERT TO authenticated
            WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_manager_of(store_id)));
        CREATE POLICY role_matrix_feedbacks_update ON public.feedbacks
            FOR UPDATE TO authenticated
            USING ((SELECT public.is_admin()) OR (SELECT public.is_manager_of(store_id)) OR seller_id = (SELECT auth.uid()))
            WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_manager_of(store_id)) OR seller_id = (SELECT auth.uid()));
    END IF;

    IF to_regclass('public.pdis') IS NOT NULL THEN
        ALTER TABLE public.pdis ENABLE ROW LEVEL SECURITY;
        CREATE POLICY role_matrix_pdis_select ON public.pdis
            FOR SELECT TO authenticated
            USING (
                (SELECT public.is_admin())
                OR (SELECT public.is_owner_of(store_id))
                OR (SELECT public.is_manager_of(store_id))
                OR seller_id = (SELECT auth.uid())
            );
        CREATE POLICY role_matrix_pdis_insert ON public.pdis
            FOR INSERT TO authenticated
            WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_manager_of(store_id)));
        CREATE POLICY role_matrix_pdis_update ON public.pdis
            FOR UPDATE TO authenticated
            USING ((SELECT public.is_admin()) OR (SELECT public.is_manager_of(store_id)) OR seller_id = (SELECT auth.uid()))
            WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_manager_of(store_id)) OR seller_id = (SELECT auth.uid()));
    END IF;

    IF to_regclass('public.pdi_reviews') IS NOT NULL THEN
        ALTER TABLE public.pdi_reviews ENABLE ROW LEVEL SECURITY;
        CREATE POLICY role_matrix_pdi_reviews_select ON public.pdi_reviews
            FOR SELECT TO authenticated
            USING (
                (SELECT public.is_admin())
                OR EXISTS (
                    SELECT 1 FROM public.pdis p
                    WHERE p.id = pdi_id
                      AND (
                          (SELECT public.is_owner_of(p.store_id))
                          OR (SELECT public.is_manager_of(p.store_id))
                          OR p.seller_id = (SELECT auth.uid())
                      )
                )
            );
        CREATE POLICY role_matrix_pdi_reviews_insert ON public.pdi_reviews
            FOR INSERT TO authenticated
            WITH CHECK (
                (SELECT public.is_admin())
                OR EXISTS (
                    SELECT 1 FROM public.pdis p
                    WHERE p.id = pdi_id
                      AND (SELECT public.is_manager_of(p.store_id))
                )
            );
    END IF;

    IF to_regclass('public.trainings') IS NOT NULL THEN
        ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
        CREATE POLICY role_matrix_trainings_select ON public.trainings
            FOR SELECT TO authenticated
            USING (true);
        CREATE POLICY role_matrix_trainings_write ON public.trainings
            FOR ALL TO authenticated
            USING ((SELECT public.is_admin()))
            WITH CHECK ((SELECT public.is_admin()));
    END IF;

    IF to_regclass('public.digital_products') IS NOT NULL THEN
        ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
        CREATE POLICY role_matrix_digital_products_select ON public.digital_products
            FOR SELECT TO authenticated
            USING (true);
        CREATE POLICY role_matrix_digital_products_write ON public.digital_products
            FOR ALL TO authenticated
            USING ((SELECT public.is_admin()))
            WITH CHECK ((SELECT public.is_admin()));
    END IF;

    IF to_regclass('public.notifications') IS NOT NULL THEN
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'recipient_id'
        ) INTO notification_has_recipient;
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'target_type'
        ) INTO notification_has_target;

        IF notification_has_recipient THEN
            CREATE POLICY role_matrix_notifications_select ON public.notifications
                FOR SELECT TO authenticated
                USING (
                    (SELECT public.is_admin())
                    OR recipient_id = (SELECT auth.uid())
                    OR (store_id IS NOT NULL AND (SELECT public.is_member_of(store_id)))
                );
            CREATE POLICY role_matrix_notifications_update ON public.notifications
                FOR UPDATE TO authenticated
                USING ((SELECT public.is_admin()) OR recipient_id = (SELECT auth.uid()))
                WITH CHECK ((SELECT public.is_admin()) OR recipient_id = (SELECT auth.uid()));
        ELSIF notification_has_target THEN
            CREATE POLICY role_matrix_notifications_select ON public.notifications
                FOR SELECT TO authenticated
                USING (
                    (SELECT public.is_admin())
                    OR sender_id = (SELECT auth.uid())
                    OR target_type = 'all'
                    OR (target_store_id IS NOT NULL AND (SELECT public.is_member_of(target_store_id)))
                );
        END IF;

        CREATE POLICY role_matrix_notifications_insert ON public.notifications
            FOR INSERT TO authenticated
            WITH CHECK ((SELECT public.is_admin()));
    END IF;

    IF to_regclass('public.reprocess_logs') IS NOT NULL THEN
        ALTER TABLE public.reprocess_logs ENABLE ROW LEVEL SECURITY;
        CREATE POLICY role_matrix_reprocess_logs_select ON public.reprocess_logs
            FOR SELECT TO authenticated
            USING ((SELECT public.is_admin()) OR (store_id IS NOT NULL AND (SELECT public.is_owner_of(store_id))));
        CREATE POLICY role_matrix_reprocess_logs_write ON public.reprocess_logs
            FOR ALL TO authenticated
            USING ((SELECT public.is_admin()))
            WITH CHECK ((SELECT public.is_admin()));
    END IF;

    IF to_regclass('public.raw_imports') IS NOT NULL THEN
        ALTER TABLE public.raw_imports ENABLE ROW LEVEL SECURITY;
        CREATE POLICY role_matrix_raw_imports_admin ON public.raw_imports
            FOR ALL TO authenticated
            USING ((SELECT public.is_admin()))
            WITH CHECK ((SELECT public.is_admin()));
    END IF;

    IF to_regclass('public.store_sellers') IS NOT NULL THEN
        ALTER TABLE public.store_sellers ENABLE ROW LEVEL SECURITY;
        CREATE POLICY role_matrix_store_sellers_select ON public.store_sellers
            FOR SELECT TO authenticated
            USING ((SELECT public.is_admin()) OR (SELECT public.is_owner_of(store_id)) OR (SELECT public.is_manager_of(store_id)) OR seller_user_id = (SELECT auth.uid()));
        CREATE POLICY role_matrix_store_sellers_write ON public.store_sellers
            FOR ALL TO authenticated
            USING ((SELECT public.is_admin()) OR (SELECT public.is_manager_of(store_id)))
            WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_manager_of(store_id)));
    END IF;
END $$;
