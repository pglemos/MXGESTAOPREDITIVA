-- ============================================================================
-- MX Vendedor - Campos de maturidade no perfil
-- ============================================================================
-- PRD EV-8.2 / EV-5.3: tempo de mercado, experiencia declarada e cargo atual
-- alimentam a atribuicao de trilha N1-N4.

BEGIN;

DO $$
BEGIN
  CREATE TYPE public.vendedor_experiencia_declarada AS ENUM (
    'sem_experiencia',
    'iniciante',
    'intermediario',
    'experiente',
    'especialista'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.vendedor_perfil
  ADD COLUMN IF NOT EXISTS tempo_mercado_anos numeric(4,1),
  ADD COLUMN IF NOT EXISTS experiencia_declarada public.vendedor_experiencia_declarada,
  ADD COLUMN IF NOT EXISTS cargo_atual text;

ALTER TABLE public.vendedor_perfil
  DROP CONSTRAINT IF EXISTS vendedor_perfil_tempo_mercado_anos_nonnegative;

ALTER TABLE public.vendedor_perfil
  ADD CONSTRAINT vendedor_perfil_tempo_mercado_anos_nonnegative
  CHECK (tempo_mercado_anos IS NULL OR tempo_mercado_anos >= 0);

COMMENT ON COLUMN public.vendedor_perfil.tempo_mercado_anos IS
  'Tempo de mercado declarado pelo vendedor, em anos, usado para maturidade N1-N4.';
COMMENT ON COLUMN public.vendedor_perfil.experiencia_declarada IS
  'Autoenquadramento de experiencia comercial usado pela trilha automatica.';
COMMENT ON COLUMN public.vendedor_perfil.cargo_atual IS
  'Cargo atual declarado pelo vendedor para curriculo, trilha e estrategia.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- DOWN (manual):
-- ALTER TABLE public.vendedor_perfil
--   DROP COLUMN IF EXISTS tempo_mercado_anos,
--   DROP COLUMN IF EXISTS experiencia_declarada,
--   DROP COLUMN IF EXISTS cargo_atual;
-- DROP TYPE IF EXISTS public.vendedor_experiencia_declarada;
