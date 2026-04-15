BEGIN;

ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reconciled_training_progress_select ON public.training_progress;
DROP POLICY IF EXISTS reconciled_training_progress_insert ON public.training_progress;
DROP POLICY IF EXISTS reconciled_training_progress_update ON public.training_progress;
DROP POLICY IF EXISTS reconciled_training_progress_delete ON public.training_progress;

CREATE POLICY reconciled_training_progress_select
    ON public.training_progress
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.memberships m
            WHERE m.user_id = training_progress.user_id
              AND (
                  public.is_manager_of(m.store_id)
                  OR public.is_owner_of(m.store_id)
              )
        )
    );

CREATE POLICY reconciled_training_progress_insert
    ON public.training_progress
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR user_id = auth.uid()
    );

CREATE POLICY reconciled_training_progress_update
    ON public.training_progress
    FOR UPDATE
    TO authenticated
    USING (
        public.is_admin()
        OR user_id = auth.uid()
    )
    WITH CHECK (
        public.is_admin()
        OR user_id = auth.uid()
    );

CREATE POLICY reconciled_training_progress_delete
    ON public.training_progress
    FOR DELETE
    TO authenticated
    USING (
        public.is_admin()
        OR user_id = auth.uid()
    );

COMMIT;
