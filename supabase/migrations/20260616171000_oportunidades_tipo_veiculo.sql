-- ============================================================================
-- MX CRM - Tipo de veiculo em oportunidades
-- ============================================================================
-- PRD EV-1.2: registrar categoria do veiculo (carro/moto/caminhao) para
-- habilitar comissionamento por categoria.

BEGIN;

DO $$
BEGIN
  CREATE TYPE public.crm_tipo_veiculo AS ENUM ('carro', 'moto', 'caminhao');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.oportunidades
  ADD COLUMN IF NOT EXISTS tipo_veiculo public.crm_tipo_veiculo;

COMMENT ON COLUMN public.oportunidades.tipo_veiculo IS
  'Categoria do veiculo negociado para regras de comissionamento por categoria.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- DOWN (manual):
-- ALTER TABLE public.oportunidades DROP COLUMN IF EXISTS tipo_veiculo;
-- DROP TYPE IF EXISTS public.crm_tipo_veiculo;
