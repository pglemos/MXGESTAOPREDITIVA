-- PMR autonomous strategic metrics derived from planning decks and native workflow.

INSERT INTO public.catalogo_metricas_consultoria (metric_key, label, direction, value_type, area, source_scope, formula_key, sort_order)
VALUES
  ('internet_sales_share', '% Vendas Internet', 'increase', 'percent', 'Marketing', 'computed', 'sales_internet/sales_total', 185),
  ('avg_stock_price', 'Preço médio do estoque', 'increase', 'currency', 'Estoque', 'inventory', 'avg(inventory.sale_price)', 252),
  ('avg_stock_km', 'Km médio do estoque', 'decrease', 'number', 'Estoque', 'inventory', 'avg(inventory.km)', 254),
  ('avg_fipe_delta', 'Relação FIPE média', 'decrease', 'currency', 'Estoque', 'inventory', 'avg(inventory.sale_price-fipe_price)', 256),
  ('inventory_investment', 'Investimento total em estoque', 'increase', 'currency', 'Estoque', 'inventory', 'sum(inventory.sale_price)', 258)
ON CONFLICT (metric_key) DO UPDATE SET
  label = EXCLUDED.label,
  direction = EXCLUDED.direction,
  value_type = EXCLUDED.value_type,
  area = EXCLUDED.area,
  source_scope = EXCLUDED.source_scope,
  formula_key = EXCLUDED.formula_key,
  sort_order = EXCLUDED.sort_order,
  active = true;

UPDATE public.catalogo_metricas_consultoria
SET direction = 'increase',
    label = 'Investimento Internet'
WHERE metric_key = 'internet_investment';

WITH set_row AS (
  SELECT id
  FROM public.conjuntos_parametros_consultoria
  WHERE active = true
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO public.valores_parametros_consultoria (
  parameter_set_id,
  metric_key,
  market_average,
  best_practice,
  target_default,
  red_threshold,
  yellow_threshold,
  green_threshold,
  formula,
  notes
)
SELECT set_row.id, v.metric_key, v.market_average, v.best_practice, v.target_default, v.red_threshold, v.yellow_threshold, v.green_threshold, v.formula, v.notes
FROM set_row
CROSS JOIN (VALUES
  ('sales_total', 28.00::numeric, 48.00::numeric, 48.00::numeric, 20.00::numeric, 28.00::numeric, 48.00::numeric, '{"from":"sales_total"}'::jsonb, 'Deck PMR 2026 usa venda total comparada ao perfil de estoque.'),
  ('internet_investment', 9400.00::numeric, 15000.00::numeric, 15000.00::numeric, 5000.00::numeric, 9400.00::numeric, 15000.00::numeric, '{"from":"marketing.investment"}'::jsonb, 'Benchmark visual dos decks PMR para investimento médio em internet.'),
  ('internet_sales_share', 0.52::numeric, 0.65::numeric, 0.65::numeric, 0.33::numeric, 0.52::numeric, 0.65::numeric, '{"from":"sales_internet/sales_total"}'::jsonb, 'Decks PMR comparam participação de vendas digitais contra mercado e boa prática.'),
  ('avg_leads_per_seller', 90.00::numeric, 180.00::numeric, 180.00::numeric, 60.00::numeric, 90.00::numeric, 180.00::numeric, '{"from":"leads_received/seller_count"}'::jsonb, 'Benchmark recorrente em comparativo PMR.'),
  ('avg_stock_km', 56000.00::numeric, 52000.00::numeric, 52000.00::numeric, 113000.00::numeric, 56000.00::numeric, 52000.00::numeric, '{"from":"inventory.avg_km"}'::jsonb, 'Km médio do estoque usado nas apresentações PMR.'),
  ('avg_fipe_delta', 2700.00::numeric, 2400.00::numeric, 2400.00::numeric, 4426.00::numeric, 2700.00::numeric, 2400.00::numeric, '{"from":"inventory.sale_price-fipe_price"}'::jsonb, 'Relação média com FIPE para leitura de posicionamento de preço.')
) AS v(metric_key, market_average, best_practice, target_default, red_threshold, yellow_threshold, green_threshold, formula, notes)
ON CONFLICT (parameter_set_id, metric_key) DO UPDATE SET
  market_average = EXCLUDED.market_average,
  best_practice = EXCLUDED.best_practice,
  target_default = EXCLUDED.target_default,
  red_threshold = EXCLUDED.red_threshold,
  yellow_threshold = EXCLUDED.yellow_threshold,
  green_threshold = EXCLUDED.green_threshold,
  formula = EXCLUDED.formula,
  notes = EXCLUDED.notes,
  updated_at = now();
