-- STORY-02: Status temporal do check-in diario MX

ALTER TABLE public.daily_checkins
    ADD COLUMN IF NOT EXISTS submitted_late boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS submission_status text NOT NULL DEFAULT 'on_time',
    ADD COLUMN IF NOT EXISTS edit_locked_at timestamptz;

ALTER TABLE public.daily_checkins DROP CONSTRAINT IF EXISTS daily_checkins_submission_status_check;
ALTER TABLE public.daily_checkins
    ADD CONSTRAINT daily_checkins_submission_status_check CHECK (submission_status IN ('on_time', 'late'));

UPDATE public.daily_checkins
SET submitted_late = (
        ((COALESCE(submitted_at, created_at, now()) AT TIME ZONE 'America/Sao_Paulo')::time > TIME '09:30')
    ),
    submission_status = CASE
        WHEN ((COALESCE(submitted_at, created_at, now()) AT TIME ZONE 'America/Sao_Paulo')::time > TIME '09:30') THEN 'late'
        ELSE 'on_time'
    END,
    edit_locked_at = COALESCE(
        edit_locked_at,
        date_trunc('day', COALESCE(submitted_at, created_at, now()) AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo' + INTERVAL '9 hours 45 minutes'
    );

CREATE OR REPLACE FUNCTION public.sync_daily_checkins_canonical()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_submitted_local timestamp;
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

    v_submitted_local := NEW.submitted_at AT TIME ZONE 'America/Sao_Paulo';
    NEW.submitted_late := v_submitted_local::time > TIME '09:30';
    NEW.submission_status := CASE WHEN NEW.submitted_late THEN 'late' ELSE 'on_time' END;
    NEW.edit_locked_at := COALESCE(
        NEW.edit_locked_at,
        date_trunc('day', v_submitted_local) AT TIME ZONE 'America/Sao_Paulo' + INTERVAL '9 hours 45 minutes'
    );

    RETURN NEW;
END;
$$;
