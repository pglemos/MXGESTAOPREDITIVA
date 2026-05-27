-- ============================================================================
-- Migration: 20260527160000_benchmarking_schema.sql
-- Story:     EPIC-MX-10 (Benchmarking)
-- PRD:       docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md §4.9
-- Fonte:     .docx §291–§303
--
-- ESCOPO: schema para comparar loja com região, porte, segmento, melhores lojas.
--   - Métricas: margem, giro, estoque, conversão, custo, score
--   - Peer groups configuráveis
--   - Snapshots por período para análise temporal
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. ENUMs
-- ----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.benchmark_peer_group AS ENUM ('regiao', 'porte', 'segmento', 'melhores', 'mercado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 1. benchmark_snapshots — comparações por período
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.benchmark_snapshots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  loja_id       uuid NOT NULL,  -- alvo da comparação
  metric_code   text NOT NULL CHECK (length(trim(metric_code)) > 0),  -- margem|giro|estoque|conversao|custo|score
  period        date NOT NULL,

  -- Valor da loja
  loja_value    numeric NOT NULL,

  -- Peer group da comparação
  peer_group    public.benchmark_peer_group NOT NULL,
  peer_filter   jsonb DEFAULT '{}'::jsonb,  -- ex: {"regiao":"SP","porte":"medio"}

  -- Estatísticas do peer group
  peer_count    integer NOT NULL CHECK (peer_count >= 0),
  peer_avg      numeric,
  peer_median   numeric,
  peer_p25      numeric,
  peer_p75      numeric,
  peer_top      numeric,
  peer_bottom   numeric,

  -- Posição relativa
  loja_rank     integer,         -- posição da loja no peer group (1 = melhor)
  loja_percentile numeric,       -- 0–100

  -- Auditoria
  computed_at   timestamptz NOT NULL DEFAULT now(),
  computation_version text NOT NULL,

  UNIQUE (loja_id, metric_code, period, peer_group, computation_version)
);

CREATE INDEX IF NOT EXISTS idx_bench_loja_period
  ON public.benchmark_snapshots(loja_id, period DESC);

CREATE INDEX IF NOT EXISTS idx_bench_metric_period
  ON public.benchmark_snapshots(metric_code, period DESC);

COMMENT ON TABLE public.benchmark_snapshots IS
  'Benchmarking — comparações da loja com peer groups (FR-BENCH, .docx §291–§303). Snapshots imutáveis por (loja, métrica, período, peer, versão).';

-- ----------------------------------------------------------------------------
-- 2. RPC: get_benchmark — leitura conveniente
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_benchmark(
  p_loja_id     uuid,
  p_metric_code text,
  p_peer_group  public.benchmark_peer_group DEFAULT 'mercado',
  p_period      date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  loja_value    numeric,
  peer_avg      numeric,
  peer_median   numeric,
  peer_top      numeric,
  loja_rank     integer,
  loja_percentile numeric,
  peer_count    integer,
  computed_at   timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    bs.loja_value,
    bs.peer_avg,
    bs.peer_median,
    bs.peer_top,
    bs.loja_rank,
    bs.loja_percentile,
    bs.peer_count,
    bs.computed_at
  FROM public.benchmark_snapshots bs
  WHERE bs.loja_id = p_loja_id
    AND bs.metric_code = p_metric_code
    AND bs.peer_group = p_peer_group
    AND bs.period <= p_period
  ORDER BY bs.period DESC, bs.computed_at DESC
  LIMIT 1;
$$;

-- ----------------------------------------------------------------------------
-- 3. Guard de imutabilidade
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_benchmark_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'benchmark_snapshots imutáveis. Use INSERT de nova versão para recalcular.'
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_benchmark_mutation ON public.benchmark_snapshots;
CREATE TRIGGER trg_prevent_benchmark_mutation
  BEFORE UPDATE OR DELETE ON public.benchmark_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.prevent_benchmark_mutation();

-- ----------------------------------------------------------------------------
-- 4. RLS — leitura ampla, write só service
-- ----------------------------------------------------------------------------

ALTER TABLE public.benchmark_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bench_read ON public.benchmark_snapshots;
CREATE POLICY bench_read
  ON public.benchmark_snapshots
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS bench_write_service ON public.benchmark_snapshots;
CREATE POLICY bench_write_service
  ON public.benchmark_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (false);  -- apenas service_role bypassa

COMMIT;
