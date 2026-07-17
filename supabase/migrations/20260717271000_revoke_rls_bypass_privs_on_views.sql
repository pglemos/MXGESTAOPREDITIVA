BEGIN;

-- Complemento da 20260717270000: aquela migration usou pg_tables (apenas
-- relkind='r'), deixando de fora views/matviews/partições/foreign tables.
-- `public.clientes_oportunidades` (VIEW) ainda mantinha
-- TRUNCATE/TRIGGER/REFERENCES para authenticated — inerte em view (não há
-- vetor de perda de dados), removido aqui para que o guard de grants assevere
-- zero privilégios que burlam RLS em qualquer relação relacional de public.

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace
      AND c.relkind IN ('r','v','m','p','f')  -- table, view, matview, partitioned, foreign
  LOOP
    EXECUTE format(
      'REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.%I FROM authenticated',
      r.relname
    );
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON public.%I FROM anon',
      r.relname
    );
  END LOOP;
END $$;

COMMIT;

-- DOWN: reversão não recomendada (reintroduz template default do Supabase).
