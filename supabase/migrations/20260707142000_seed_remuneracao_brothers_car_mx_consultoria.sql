-- ============================================================================
-- Migration: 20260707142000_seed_remuneracao_brothers_car_mx_consultoria.sql
-- Scope: dados do plano salarial "Brothers Car" so na loja de testes
--        MX CONSULTORIA (467a19d1-af51-4b4f-9b05-d67187a2a759), cargo Vendedor.
--        Insere uma nova versao datada hoje (nao mexe/apaga a linha antiga de
--        remuneracao_planos; o motor sempre escolhe a versao mais recente
--        com vigencia_inicio <= hoje, entao a nova passa a valer sozinha).
-- ============================================================================

INSERT INTO public.remuneracao_planos (loja_id, cargo, salario_fixo, salario_variavel, beneficios, moeda, vigencia_inicio)
VALUES ('467a19d1-af51-4b4f-9b05-d67187a2a759', 'Vendedor', 1500, 0, 0, 'BRL', CURRENT_DATE)
ON CONFLICT (loja_id, cargo, vigencia_inicio) DO UPDATE SET
  salario_fixo = EXCLUDED.salario_fixo,
  salario_variavel = EXCLUDED.salario_variavel,
  beneficios = EXCLUDED.beneficios;

INSERT INTO public.remuneracao_regras (loja_id, cargo, tipo, valor)
SELECT '467a19d1-af51-4b4f-9b05-d67187a2a759', 'Vendedor', 'comissao_por_venda', 500
WHERE NOT EXISTS (
  SELECT 1
  FROM public.remuneracao_regras
  WHERE loja_id = '467a19d1-af51-4b4f-9b05-d67187a2a759'
    AND lower(cargo) = 'vendedor'
    AND tipo = 'comissao_por_venda'
    AND vigencia_inicio = CURRENT_DATE
);

INSERT INTO public.remuneracao_regras (loja_id, cargo, tipo, valor, unidade_meta_min)
SELECT '467a19d1-af51-4b4f-9b05-d67187a2a759', 'Vendedor', 'bonus_meta', 1000, 8
WHERE NOT EXISTS (
  SELECT 1
  FROM public.remuneracao_regras
  WHERE loja_id = '467a19d1-af51-4b4f-9b05-d67187a2a759'
    AND lower(cargo) = 'vendedor'
    AND tipo = 'bonus_meta'
    AND vigencia_inicio = CURRENT_DATE
    AND unidade_meta_min = 8
);

INSERT INTO public.remuneracao_regras (
  loja_id,
  cargo,
  tipo,
  valor,
  unidade_meta_min,
  cumulativo,
  valor_por_unidade,
  requer_bonus_individual
)
SELECT
  v.loja_id,
  v.cargo,
  v.tipo::public.remuneracao_regra_tipo,
  v.valor,
  v.unidade_meta_min,
  v.cumulativo,
  v.valor_por_unidade,
  v.requer_bonus_individual
FROM (VALUES
  ('467a19d1-af51-4b4f-9b05-d67187a2a759'::uuid, 'Vendedor', 'comissao_equipe', 100::numeric, 35, true, true, true),
  ('467a19d1-af51-4b4f-9b05-d67187a2a759'::uuid, 'Vendedor', 'comissao_equipe', 1000::numeric, 40, true, false, true),
  ('467a19d1-af51-4b4f-9b05-d67187a2a759'::uuid, 'Vendedor', 'comissao_equipe', 1000::numeric, 45, true, false, true),
  ('467a19d1-af51-4b4f-9b05-d67187a2a759'::uuid, 'Vendedor', 'comissao_equipe', 1000::numeric, 50, true, false, true)
) AS v(loja_id, cargo, tipo, valor, unidade_meta_min, cumulativo, valor_por_unidade, requer_bonus_individual)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.remuneracao_regras r
  WHERE r.loja_id = v.loja_id
    AND lower(r.cargo) = lower(v.cargo)
    AND r.tipo = v.tipo::public.remuneracao_regra_tipo
    AND r.vigencia_inicio = CURRENT_DATE
    AND r.unidade_meta_min = v.unidade_meta_min
);

INSERT INTO public.remuneracao_regras (loja_id, cargo, tipo, valor, nivel_carreira)
SELECT v.loja_id, v.cargo, v.tipo::public.remuneracao_regra_tipo, v.valor, v.nivel_carreira
FROM (VALUES
  ('467a19d1-af51-4b4f-9b05-d67187a2a759'::uuid, 'Vendedor', 'bonus_carreira', 800::numeric, 'pleno'),
  ('467a19d1-af51-4b4f-9b05-d67187a2a759'::uuid, 'Vendedor', 'bonus_carreira', 800::numeric, 'lider')
) AS v(loja_id, cargo, tipo, valor, nivel_carreira)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.remuneracao_regras r
  WHERE r.loja_id = v.loja_id
    AND lower(r.cargo) = lower(v.cargo)
    AND r.tipo = v.tipo::public.remuneracao_regra_tipo
    AND r.vigencia_inicio = CURRENT_DATE
    AND r.nivel_carreira = v.nivel_carreira
);

INSERT INTO public.vendedor_nivel_carreira (seller_user_id, loja_id, nivel_carreira)
SELECT u.id, '467a19d1-af51-4b4f-9b05-d67187a2a759', v.nivel
FROM (VALUES
  ('vendedor@mxgestaopreditiva.com.br', 'lider'),
  ('mari.vendedor@mxgestaopreditiva.com.br', 'pleno'),
  ('jose.vendedor@mxgestaopreditiva.com.br', 'junior'),
  ('daniel.vendedor@mxgestaopreditiva.com.br', 'junior')
) AS v(email, nivel)
JOIN public.usuarios u ON u.email = v.email
ON CONFLICT (seller_user_id) DO UPDATE SET
  nivel_carreira = EXCLUDED.nivel_carreira,
  loja_id = EXCLUDED.loja_id;

WITH brothers_plan AS (
  SELECT id
  FROM public.remuneracao_planos
  WHERE loja_id = '467a19d1-af51-4b4f-9b05-d67187a2a759'
    AND lower(cargo) = 'vendedor'
    AND vigencia_inicio = CURRENT_DATE
    AND salario_fixo = 1500
    AND salario_variavel = 0
    AND beneficios = 0
  ORDER BY created_at DESC
  LIMIT 1
),
brothers_sellers AS (
  SELECT u.id AS seller_user_id
  FROM (VALUES
    ('vendedor@mxgestaopreditiva.com.br'),
    ('mari.vendedor@mxgestaopreditiva.com.br'),
    ('jose.vendedor@mxgestaopreditiva.com.br'),
    ('daniel.vendedor@mxgestaopreditiva.com.br')
  ) AS v(email)
  JOIN public.usuarios u ON u.email = v.email
)
INSERT INTO public.vendedor_perfil (seller_user_id, loja_id, cargo_atual, remuneracao_plano_id)
SELECT
  s.seller_user_id,
  '467a19d1-af51-4b4f-9b05-d67187a2a759',
  'Vendedor',
  p.id
FROM brothers_sellers s
CROSS JOIN brothers_plan p
ON CONFLICT (seller_user_id) DO UPDATE SET
  loja_id = EXCLUDED.loja_id,
  cargo_atual = COALESCE(public.vendedor_perfil.cargo_atual, EXCLUDED.cargo_atual),
  remuneracao_plano_id = EXCLUDED.remuneracao_plano_id,
  updated_at = now();
