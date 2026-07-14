-- MX-22.5.2: official sales are written to eventos_comerciais, not only to
-- daily closings. Publish those immutable facts so manager and owner dashboards
-- can refetch the official monthly read model without a manual reload.
DO $$
BEGIN
  IF to_regclass('public.eventos_comerciais') IS NULL THEN
    RAISE EXCEPTION 'public.eventos_comerciais is required for official sales realtime';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_publication
     WHERE pubname = 'supabase_realtime'
  ) THEN
    RAISE EXCEPTION 'supabase_realtime publication is required for official sales realtime';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'eventos_comerciais'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.eventos_comerciais';
  END IF;
END
$$;
