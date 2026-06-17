-- ============================================================================
-- MX Vendedor - Caso/motivo obrigatorio em devolutivas do gerente
-- ============================================================================
-- PRD EV-6.2: feedback do gerente precisa registrar o caso concreto que
-- motivou a devolutiva, mantendo documentacao rastreavel.

BEGIN;

ALTER TABLE public.devolutivas
  ADD COLUMN IF NOT EXISTS caso_motivo text;

ALTER TABLE public.devolutivas
  DROP CONSTRAINT IF EXISTS devolutivas_caso_motivo_not_blank;

ALTER TABLE public.devolutivas
  ADD CONSTRAINT devolutivas_caso_motivo_not_blank
  CHECK (caso_motivo IS NULL OR length(btrim(caso_motivo)) >= 8);

COMMENT ON COLUMN public.devolutivas.caso_motivo IS
  'Caso ou motivo concreto que originou a devolutiva do gerente; usado como documentacao historica.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- DOWN (manual):
-- ALTER TABLE public.devolutivas DROP CONSTRAINT IF EXISTS devolutivas_caso_motivo_not_blank;
-- ALTER TABLE public.devolutivas DROP COLUMN IF EXISTS caso_motivo;
