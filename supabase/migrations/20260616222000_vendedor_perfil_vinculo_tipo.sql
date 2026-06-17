-- ============================================================================
-- MX Vendedor - Tipo de vinculo do vendedor
-- ============================================================================
-- PRD EV-12.1: fonte canonica para distinguir vendedor de loja e autonomo.

BEGIN;

DO $$
BEGIN
  CREATE TYPE public.vendedor_vinculo_tipo AS ENUM ('loja', 'autonomo');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.vendedor_perfil
  ADD COLUMN IF NOT EXISTS vinculo_tipo public.vendedor_vinculo_tipo NOT NULL DEFAULT 'loja';

UPDATE public.vendedor_perfil
SET vinculo_tipo = 'loja'
WHERE vinculo_tipo IS NULL;

COMMENT ON COLUMN public.vendedor_perfil.vinculo_tipo IS
  'Fonte canonica do tipo de vinculo do vendedor: loja (pacote principal) ou autonomo (produto avulso). Governa visibilidade de carreira, feedback, PDI, score e comissionamento.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- DOWN (manual):
-- ALTER TABLE public.vendedor_perfil DROP COLUMN IF EXISTS vinculo_tipo;
-- DROP TYPE IF EXISTS public.vendedor_vinculo_tipo;
