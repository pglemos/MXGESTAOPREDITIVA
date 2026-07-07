-- ============================================================================
-- Migration: 20260707151000_link_brothers_car_plan_vendedor_perfil.sql
-- Scope: garante que os vendedores de teste usem o plano Brothers Car no
--        dashboard do vendedor, que respeita vendedor_perfil.remuneracao_plano_id
--        quando preenchido.
-- ============================================================================

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
