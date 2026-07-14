-- MX-22.5.1: the canonical seller closing table is `lancamentos_diarios`.
-- Keep the publication change idempotent so linked environments can replay it safely.
DO $$
BEGIN
  IF to_regclass('public.lancamentos_diarios') IS NULL THEN
    RAISE EXCEPTION 'public.lancamentos_diarios is required for manager sales realtime';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'lancamentos_diarios'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.lancamentos_diarios';
  END IF;
END
$$;
