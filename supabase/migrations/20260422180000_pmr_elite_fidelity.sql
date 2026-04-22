-- ============================================================
-- PMR Visita - Extensão de Colunas de Elite
-- ============================================================

-- 1. Campos extras para Visitas
ALTER TABLE public.consulting_visits
ADD COLUMN IF NOT EXISTS next_cycle_goal text;

-- 2. Assinatura do Vendedor no PDI
ALTER TABLE public.consulting_pmr_form_responses
ADD COLUMN IF NOT EXISTS seller_acknowledged_at timestamptz;

-- 3. Métricas extras no Financeiro (caso não existam)
-- Já temos net_profit e volume_vendas. Vamos garantir idade de estoque se possível.
-- (Assumindo que idade de estoque vem de snapshots ou financials)
