-- Permite rascunho real no fechamento diario.
-- Antes, submitted_at era NOT NULL DEFAULT now() e o trigger convertia
-- qualquer registro com timestamp em on_time/late, travando autosaves.

ALTER TABLE IF EXISTS public.lancamentos_diarios
  DROP CONSTRAINT IF EXISTS daily_checkins_submission_status_check;

ALTER TABLE IF EXISTS public.lancamentos_diarios
  ADD CONSTRAINT daily_checkins_submission_status_check
  CHECK (submission_status IN ('draft', 'on_time', 'late'));

ALTER TABLE IF EXISTS public.lancamentos_diarios
  ALTER COLUMN submission_status SET DEFAULT 'draft',
  ALTER COLUMN submitted_at DROP DEFAULT,
  ALTER COLUMN submitted_at DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_daily_checkins_canonical()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
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

  IF NEW.created_at IS NULL THEN
    NEW.created_at := COALESCE(NEW.submitted_at, now());
  END IF;

  IF NEW.updated_at IS NULL THEN
    NEW.updated_at := now();
  END IF;

  NEW.metric_scope := COALESCE(NEW.metric_scope, 'daily'::public.checkin_scope);

  IF NEW.leads_prev_day IS NULL THEN
    NEW.leads_prev_day := COALESCE(NEW.leads, 0);
  END IF;
  IF NEW.leads_net_prev_day IS NULL THEN
    NEW.leads_net_prev_day := COALESCE(NEW.leads_net, 0);
  END IF;
  IF NEW.agd_cart_today IS NULL THEN
    NEW.agd_cart_today := COALESCE(NEW.agd_cart, 0);
  END IF;
  IF NEW.agd_net_today IS NULL THEN
    NEW.agd_net_today := COALESCE(NEW.agd_net, 0);
  END IF;
  IF NEW.vnd_porta_prev_day IS NULL THEN
    NEW.vnd_porta_prev_day := COALESCE(NEW.vnd_porta, 0);
  END IF;
  IF NEW.vnd_cart_prev_day IS NULL THEN
    NEW.vnd_cart_prev_day := COALESCE(NEW.vnd_cart, 0);
  END IF;
  IF NEW.vnd_net_prev_day IS NULL THEN
    NEW.vnd_net_prev_day := COALESCE(NEW.vnd_net, 0);
  END IF;
  IF NEW.visit_prev_day IS NULL THEN
    NEW.visit_prev_day := COALESCE(NEW.visitas, 0);
  END IF;

  NEW.agd_cart_prev_day := COALESCE(NEW.agd_cart_prev_day, 0);
  NEW.agd_net_prev_day := COALESCE(NEW.agd_net_prev_day, 0);

  NEW.leads := COALESCE(NEW.leads_prev_day, 0);
  NEW.leads_net := COALESCE(NEW.leads_net_prev_day, 0);
  NEW.agd_cart := COALESCE(NEW.agd_cart_today, 0);
  NEW.agd_net := COALESCE(NEW.agd_net_today, 0);
  NEW.vnd_porta := COALESCE(NEW.vnd_porta_prev_day, 0);
  NEW.vnd_cart := COALESCE(NEW.vnd_cart_prev_day, 0);
  NEW.vnd_net := COALESCE(NEW.vnd_net_prev_day, 0);
  NEW.visitas := COALESCE(NEW.visit_prev_day, 0);

  IF COALESCE(NEW.submission_status, 'draft') = 'draft' THEN
    NEW.submission_status := 'draft';
    NEW.submitted_at := NULL;
    NEW.submitted_late := false;
    NEW.edit_locked_at := NULL;
    RETURN NEW;
  END IF;

  IF NEW.submitted_at IS NULL THEN
    NEW.submitted_at := now();
  END IF;

  v_submitted_local := NEW.submitted_at AT TIME ZONE 'America/Sao_Paulo';
  NEW.submitted_late := v_submitted_local::time > TIME '09:30';
  NEW.submission_status := CASE WHEN NEW.submitted_late THEN 'late' ELSE 'on_time' END;
  NEW.edit_locked_at := COALESCE(
    NEW.edit_locked_at,
    date_trunc('day', v_submitted_local) AT TIME ZONE 'America/Sao_Paulo' + INTERVAL '9 hours 45 minutes'
  );

  RETURN NEW;
END;
$function$;
