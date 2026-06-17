-- ============================================================================
-- MX Vendedor - Mix manual de canais para estrategia do funil
-- ============================================================================
-- PRD EV-4.2 / EV-4.3: permite ao vendedor declarar percentuais de foco por
-- canal quando a loja/vendedor ainda nao tem historico suficiente de vendas.

BEGIN;

ALTER TABLE public.vendedor_perfil
  ADD COLUMN IF NOT EXISTS mix_canal_internet_pct numeric(5,2),
  ADD COLUMN IF NOT EXISTS mix_canal_carteira_pct numeric(5,2),
  ADD COLUMN IF NOT EXISTS mix_canal_porta_pct numeric(5,2);

ALTER TABLE public.vendedor_perfil
  DROP CONSTRAINT IF EXISTS vendedor_perfil_mix_canal_internet_pct_range,
  DROP CONSTRAINT IF EXISTS vendedor_perfil_mix_canal_carteira_pct_range,
  DROP CONSTRAINT IF EXISTS vendedor_perfil_mix_canal_porta_pct_range;

ALTER TABLE public.vendedor_perfil
  ADD CONSTRAINT vendedor_perfil_mix_canal_internet_pct_range
    CHECK (mix_canal_internet_pct IS NULL OR (mix_canal_internet_pct >= 0 AND mix_canal_internet_pct <= 100)),
  ADD CONSTRAINT vendedor_perfil_mix_canal_carteira_pct_range
    CHECK (mix_canal_carteira_pct IS NULL OR (mix_canal_carteira_pct >= 0 AND mix_canal_carteira_pct <= 100)),
  ADD CONSTRAINT vendedor_perfil_mix_canal_porta_pct_range
    CHECK (mix_canal_porta_pct IS NULL OR (mix_canal_porta_pct >= 0 AND mix_canal_porta_pct <= 100));

COMMENT ON COLUMN public.vendedor_perfil.mix_canal_internet_pct IS
  'Percentual manual de foco do vendedor para estrategia do funil no canal Internet.';
COMMENT ON COLUMN public.vendedor_perfil.mix_canal_carteira_pct IS
  'Percentual manual de foco do vendedor para estrategia do funil no canal Carteira.';
COMMENT ON COLUMN public.vendedor_perfil.mix_canal_porta_pct IS
  'Percentual manual de foco do vendedor para estrategia do funil nos canais Porta/Showroom.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- DOWN (manual):
-- ALTER TABLE public.vendedor_perfil
--   DROP COLUMN IF EXISTS mix_canal_internet_pct,
--   DROP COLUMN IF EXISTS mix_canal_carteira_pct,
--   DROP COLUMN IF EXISTS mix_canal_porta_pct;
