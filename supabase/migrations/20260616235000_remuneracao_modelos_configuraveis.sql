ALTER TYPE public.remuneracao_regra_tipo ADD VALUE IF NOT EXISTS 'percentual_faturamento';
ALTER TYPE public.remuneracao_regra_tipo ADD VALUE IF NOT EXISTS 'comissao_categoria';
ALTER TYPE public.remuneracao_regra_tipo ADD VALUE IF NOT EXISTS 'comissao_equipe';

ALTER TABLE public.remuneracao_regras
  ADD COLUMN IF NOT EXISTS tipo_veiculo text;

ALTER TABLE public.remuneracao_regras
  DROP CONSTRAINT IF EXISTS remuneracao_regras_tipo_veiculo_check;

ALTER TABLE public.remuneracao_regras
  ADD CONSTRAINT remuneracao_regras_tipo_veiculo_check
  CHECK (tipo_veiculo IS NULL OR tipo_veiculo IN ('carro', 'moto', 'caminhao'));

COMMENT ON COLUMN public.remuneracao_regras.tipo_veiculo IS
  'Categoria de veiculo usada quando tipo=comissao_categoria. Valores: carro, moto, caminhao.';

DROP INDEX IF EXISTS ux_remuneracao_regras_unique;

CREATE UNIQUE INDEX IF NOT EXISTS ux_remuneracao_regras_unique
  ON public.remuneracao_regras (
    loja_id,
    lower(cargo),
    tipo,
    vigencia_inicio,
    COALESCE(percentual_meta_min, -1),
    COALESCE(tipo_veiculo, '')
  );
