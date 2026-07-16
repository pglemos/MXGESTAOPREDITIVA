-- Reconstruida a partir de supabase_migrations.schema_migrations (producao).
-- Nao havia arquivo local para esta migration ja aplicada em prod; texto abaixo e fiel ao que rodou.

BEGIN;

REVOKE ALL ON TABLE public.execution_actions FROM PUBLIC;
REVOKE ALL ON TABLE public.execution_actions FROM anon;

REVOKE DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON TABLE public.execution_actions
  FROM authenticated;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.execution_actions
  TO authenticated;

ALTER FUNCTION public.central_result_allowed(text, text)
  SET search_path = pg_catalog;

COMMIT;
