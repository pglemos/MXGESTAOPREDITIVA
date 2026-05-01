ALTER TABLE public.produtos_digitais
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Operacional',
  ADD COLUMN IF NOT EXISTS target_roles text[] NOT NULL DEFAULT ARRAY['vendedor', 'gerente', 'dono']::text[],
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'produtos_digitais_status_check'
  ) THEN
    ALTER TABLE public.produtos_digitais
      ADD CONSTRAINT produtos_digitais_status_check
      CHECK (status = ANY (ARRAY['ativo', 'rascunho', 'arquivado']))
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'produtos_digitais_target_roles_check'
  ) THEN
    ALTER TABLE public.produtos_digitais
      ADD CONSTRAINT produtos_digitais_target_roles_check
      CHECK (
        target_roles <@ ARRAY['vendedor', 'gerente', 'dono']::text[]
        AND array_length(target_roles, 1) IS NOT NULL
      )
      NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS produtos_digitais_status_idx
  ON public.produtos_digitais (status);

CREATE INDEX IF NOT EXISTS produtos_digitais_target_roles_gin_idx
  ON public.produtos_digitais USING gin (target_roles);

DROP TRIGGER IF EXISTS update_produtos_digitais_updated_at ON public.produtos_digitais;
CREATE TRIGGER update_produtos_digitais_updated_at
BEFORE UPDATE ON public.produtos_digitais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column_canonical();

NOTIFY pgrst, 'reload schema';
