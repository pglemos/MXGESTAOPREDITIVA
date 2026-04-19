-- ============================================================
-- PMR Visita 1 - Dados Quantitativos e Benchmark
-- ============================================================

ALTER TABLE public.consulting_visits
ADD COLUMN IF NOT EXISTS quant_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS benchmark_data jsonb DEFAULT '{}'::jsonb;
