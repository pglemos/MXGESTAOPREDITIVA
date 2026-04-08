-- STORY-04: Rotina diaria do gerente com trilha auditavel

CREATE TABLE IF NOT EXISTS public.manager_routine_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    manager_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    routine_date date NOT NULL,
    reference_date date NOT NULL,
    checkins_pending_count integer NOT NULL DEFAULT 0,
    sem_registro_count integer NOT NULL DEFAULT 0,
    agd_cart_today integer NOT NULL DEFAULT 0,
    agd_net_today integer NOT NULL DEFAULT 0,
    previous_day_leads integer NOT NULL DEFAULT 0,
    previous_day_sales integer NOT NULL DEFAULT 0,
    ranking_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
    notes text,
    status text NOT NULL DEFAULT 'completed',
    executed_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT manager_routine_logs_non_negative_check CHECK (
        checkins_pending_count >= 0
        AND sem_registro_count >= 0
        AND agd_cart_today >= 0
        AND agd_net_today >= 0
        AND previous_day_leads >= 0
        AND previous_day_sales >= 0
    ),
    CONSTRAINT manager_routine_logs_status_check CHECK (status IN ('completed')),
    CONSTRAINT manager_routine_logs_unique_day UNIQUE (store_id, manager_id, routine_date)
);

CREATE INDEX IF NOT EXISTS manager_routine_logs_store_date_idx
    ON public.manager_routine_logs (store_id, routine_date DESC);

CREATE INDEX IF NOT EXISTS manager_routine_logs_manager_date_idx
    ON public.manager_routine_logs (manager_id, routine_date DESC);

CREATE OR REPLACE FUNCTION public.set_manager_routine_logs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS manager_routine_logs_set_updated_at ON public.manager_routine_logs;
CREATE TRIGGER manager_routine_logs_set_updated_at
    BEFORE UPDATE ON public.manager_routine_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_manager_routine_logs_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_routine_logs TO authenticated;
GRANT ALL ON public.manager_routine_logs TO service_role;

ALTER TABLE public.manager_routine_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS role_matrix_manager_routine_logs_select ON public.manager_routine_logs;
DROP POLICY IF EXISTS role_matrix_manager_routine_logs_insert ON public.manager_routine_logs;
DROP POLICY IF EXISTS role_matrix_manager_routine_logs_update ON public.manager_routine_logs;
DROP POLICY IF EXISTS role_matrix_manager_routine_logs_delete ON public.manager_routine_logs;

CREATE POLICY role_matrix_manager_routine_logs_select ON public.manager_routine_logs
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_admin())
        OR (SELECT public.is_owner_of(store_id))
        OR (SELECT public.is_manager_of(store_id))
    );

CREATE POLICY role_matrix_manager_routine_logs_insert ON public.manager_routine_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT public.is_admin())
        OR ((SELECT public.is_manager_of(store_id)) AND manager_id = (SELECT auth.uid()))
    );

CREATE POLICY role_matrix_manager_routine_logs_update ON public.manager_routine_logs
    FOR UPDATE TO authenticated
    USING (
        (SELECT public.is_admin())
        OR ((SELECT public.is_manager_of(store_id)) AND manager_id = (SELECT auth.uid()))
    )
    WITH CHECK (
        (SELECT public.is_admin())
        OR ((SELECT public.is_manager_of(store_id)) AND manager_id = (SELECT auth.uid()))
    );

CREATE POLICY role_matrix_manager_routine_logs_delete ON public.manager_routine_logs
    FOR DELETE TO authenticated
    USING ((SELECT public.is_admin()));
