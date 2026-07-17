-- Migration registrada no Supabase de produção como seller_routine_snapshot_cron.

BEGIN;

CREATE OR REPLACE FUNCTION public.run_seller_routine_snapshot_refresh_clock()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  store_row record;
  local_date date:=timezone('America/Sao_Paulo',now())::date;
BEGIN
  FOR store_row IN SELECT id FROM public.lojas LOOP
    PERFORM public.consolidate_seller_routine_snapshots(store_row.id,local_date);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.run_seller_routine_snapshot_refresh_clock() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.run_seller_routine_snapshot_refresh_clock() TO service_role;

DO $$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname='mx-refresh-seller-routine-snapshots';

  PERFORM cron.schedule(
    'mx-refresh-seller-routine-snapshots',
    '15 * * * *',
    'SELECT public.run_seller_routine_snapshot_refresh_clock();'
  );
END $$;

COMMIT;
