-- ============================================================================
-- Migration: 20260707140000_remuneracao_regras_faixa_unidade.sql
-- Scope: plano salarial Brothers Car (loja de testes MX CONSULTORIA) — faixas
--        absolutas de carros da loja (cumulativas, com trava de mínimo
--        individual) e bônus de carreira. Aditivo, sem impacto em regras
--        existentes de outras lojas.
-- ============================================================================

ALTER TYPE public.remuneracao_regra_tipo ADD VALUE IF NOT EXISTS 'bonus_carreira';

ALTER TABLE public.remuneracao_regras
  ADD COLUMN IF NOT EXISTS unidade_meta_min integer;

ALTER TABLE public.remuneracao_regras
  ADD COLUMN IF NOT EXISTS cumulativo boolean NOT NULL DEFAULT false;

ALTER TABLE public.remuneracao_regras
  ADD COLUMN IF NOT EXISTS valor_por_unidade boolean NOT NULL DEFAULT false;

ALTER TABLE public.remuneracao_regras
  ADD COLUMN IF NOT EXISTS requer_bonus_individual boolean NOT NULL DEFAULT false;

ALTER TABLE public.remuneracao_regras
  ADD COLUMN IF NOT EXISTS nivel_carreira text;

ALTER TABLE public.remuneracao_regras
  DROP CONSTRAINT IF EXISTS remuneracao_regras_unidade_meta_min_check;

ALTER TABLE public.remuneracao_regras
  ADD CONSTRAINT remuneracao_regras_unidade_meta_min_check
  CHECK (unidade_meta_min IS NULL OR unidade_meta_min >= 0);

ALTER TABLE public.remuneracao_regras
  DROP CONSTRAINT IF EXISTS remuneracao_regras_nivel_carreira_check;

ALTER TABLE public.remuneracao_regras
  ADD CONSTRAINT remuneracao_regras_nivel_carreira_check
  CHECK (nivel_carreira IS NULL OR nivel_carreira IN ('junior', 'pleno', 'lider'));

COMMENT ON COLUMN public.remuneracao_regras.unidade_meta_min IS
  'Limiar absoluto (ex.: carros vendidos) usado no lugar de percentual_meta_min quando preenchido. Aplica-se a bonus_meta (vendas do proprio vendedor) e comissao_equipe (vendas totais da loja).';
COMMENT ON COLUMN public.remuneracao_regras.cumulativo IS
  'Quando true, comissao_equipe soma todos os patamares atingidos em vez de aplicar so o maior.';
COMMENT ON COLUMN public.remuneracao_regras.valor_por_unidade IS
  'Quando true, valor e multiplicado pelas vendas do proprio vendedor (comissao_equipe) em vez de ser um valor fixo.';
COMMENT ON COLUMN public.remuneracao_regras.requer_bonus_individual IS
  'Quando true (comissao_equipe), a regra so se aplica se o vendedor ja atingiu o proprio bonus_meta no periodo.';
COMMENT ON COLUMN public.remuneracao_regras.nivel_carreira IS
  'Nivel de carreira (junior/pleno/lider) usado quando tipo=bonus_carreira.';

DROP INDEX IF EXISTS ux_remuneracao_regras_unique;

CREATE UNIQUE INDEX IF NOT EXISTS ux_remuneracao_regras_unique
  ON public.remuneracao_regras (
    loja_id,
    lower(cargo),
    tipo,
    vigencia_inicio,
    COALESCE(percentual_meta_min, -1),
    COALESCE(tipo_veiculo, ''),
    COALESCE(unidade_meta_min, -1),
    COALESCE(nivel_carreira, '')
  );

NOTIFY pgrst, 'reload schema';
