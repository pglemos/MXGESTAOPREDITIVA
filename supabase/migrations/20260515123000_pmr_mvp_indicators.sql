-- ============================================================
-- PMR planning MVP indicators
-- ============================================================
-- Defines the initial owner/planning indicator cut discussed in the
-- Daniel/Jose meeting without attempting to ship all 45 spreadsheet metrics.

INSERT INTO public.catalogo_metricas_consultoria (
  metric_key,
  label,
  direction,
  value_type,
  area,
  source_scope,
  formula_key,
  sort_order,
  active
)
VALUES
  ('sales_goal', 'Meta de vendas', 'increase', 'number', 'Vendas', 'target', 'metas_metricas_cliente.sales_total', 12, true),
  ('goal_achievement_rate', 'Realizacao da meta', 'increase', 'percent', 'Vendas', 'computed', 'sales_total/sales_goal', 14, true),
  ('appointments', 'Agendamentos', 'increase', 'number', 'Funil', 'daily_tracking', null, 40, true),
  ('visits', 'Comparecimentos', 'increase', 'number', 'Funil', 'daily_tracking', null, 50, true),
  ('trade_in_volume', 'Volume de carros de troca', 'increase', 'number', 'Troca', 'backlog', null, 130, true)
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
SET sort_order = 10
WHERE metric_key = 'sales_total';

UPDATE public.catalogo_metricas_consultoria
SET sort_order = 30
WHERE metric_key = 'leads_received';

UPDATE public.catalogo_metricas_consultoria
SET sort_order = 90
WHERE metric_key = 'internet_investment';

UPDATE public.catalogo_metricas_consultoria
SET sort_order = 100
WHERE metric_key = 'internet_cost_per_sale';

UPDATE public.catalogo_metricas_consultoria
SET sort_order = 110
WHERE metric_key = 'stock_total';

UPDATE public.catalogo_metricas_consultoria
SET sort_order = 120
WHERE metric_key = 'stock_turnover';

UPDATE public.catalogo_metricas_consultoria
SET sort_order = 125
WHERE metric_key = 'stock_over_90_rate';

UPDATE public.catalogo_metricas_consultoria
SET sort_order = 140
WHERE metric_key = 'avg_margin';
