-- ============================================================================
-- Migration: 20260531120000_mx19_remuneracao_schema.sql
-- Story:     MX-19.1 — Schema de Remuneração + Benchmark de Mercado
-- Epic:      EPIC-MX-19 (Sistema de Remuneração Inteligente)
-- Fonte:     docs/roadmap/roadmap-fechamento-gap-mx-2026-05-28.md (delta N7)
--
-- ESCOPO: schema para plano de remuneração por cargo e faixas de benchmark de
--   mercado parametrizadas por região, tamanho de loja e meta.
--   - Dado salarial é SENSÍVEL: RLS restrita a master/director/hr (helpers canônicos).
--   - Cargo modelado como text (não existe tabela `cargos` normalizada no schema atual).
--   - FKs para entidades existentes: public.lojas(id), public.usuarios(id).
--   - Aditivo e reversível (bloco DOWN ao final).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. ENUMs
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.remuneracao_classificacao AS ENUM ('abaixo', 'dentro', 'acima', 'sem_referencia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 1. remuneracao_planos — plano de remuneração atual por cargo (por loja)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.remuneracao_planos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id           uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  cargo             text NOT NULL,                       -- identificador textual do cargo (sem tabela cargos)
  salario_fixo      numeric(12,2) NOT NULL DEFAULT 0 CHECK (salario_fixo >= 0),
  salario_variavel  numeric(12,2) NOT NULL DEFAULT 0 CHECK (salario_variavel >= 0),
  beneficios        numeric(12,2) NOT NULL DEFAULT 0 CHECK (beneficios >= 0),
  moeda             text NOT NULL DEFAULT 'BRL',
  vigencia_inicio   date NOT NULL DEFAULT CURRENT_DATE,
  observacoes       text,
  created_by        uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (loja_id, cargo, vigencia_inicio)
);

COMMENT ON TABLE  public.remuneracao_planos IS 'MX-19.1: plano de remuneração atual por cargo/loja. Dado SENSÍVEL — RLS master/director/hr.';
COMMENT ON COLUMN public.remuneracao_planos.cargo IS 'Identificador textual do cargo (schema atual não possui tabela cargos normalizada).';

CREATE INDEX IF NOT EXISTS idx_remuneracao_planos_loja  ON public.remuneracao_planos (loja_id);
CREATE INDEX IF NOT EXISTS idx_remuneracao_planos_cargo ON public.remuneracao_planos (cargo);

-- ----------------------------------------------------------------------------
-- 2. remuneracao_benchmark — faixas de mercado por cargo/região/tamanho/meta
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.remuneracao_benchmark (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo           text NOT NULL,
  regiao          text NOT NULL,
  faixa_tamanho   text NOT NULL,                         -- ex.: 'pequena' | 'media' | 'grande'
  meta            text,                                  -- parâmetro de meta (faixa/alvo)
  faixa_min       numeric(12,2) NOT NULL CHECK (faixa_min >= 0),
  faixa_mediana   numeric(12,2) NOT NULL CHECK (faixa_mediana >= 0),
  faixa_max       numeric(12,2) NOT NULL CHECK (faixa_max >= 0),
  fonte           text NOT NULL,                         -- origem do benchmark (auditável)
  data_referencia date NOT NULL,                         -- data do dado de mercado (versionamento)
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (faixa_min <= faixa_mediana AND faixa_mediana <= faixa_max),
  UNIQUE (cargo, regiao, faixa_tamanho, meta, data_referencia)
);

COMMENT ON TABLE  public.remuneracao_benchmark IS 'MX-19.1: faixas de mercado parametrizadas. Versionado por (cargo,regiao,tamanho,meta,data_referencia).';
COMMENT ON COLUMN public.remuneracao_benchmark.fonte IS 'Origem do benchmark — obrigatório para auditoria (AC-05).';

CREATE INDEX IF NOT EXISTS idx_remuneracao_benchmark_lookup
  ON public.remuneracao_benchmark (cargo, regiao, faixa_tamanho);

-- ----------------------------------------------------------------------------
-- 3. updated_at trigger (reutiliza função canônica se existir; cria fallback)
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
  RETURNS trigger LANGUAGE plpgsql AS $fn$
  BEGIN NEW.updated_at := now(); RETURN NEW; END;
  $fn$;
EXCEPTION WHEN others THEN NULL; END $$;

DROP TRIGGER IF EXISTS trg_remuneracao_planos_updated ON public.remuneracao_planos;
CREATE TRIGGER trg_remuneracao_planos_updated
  BEFORE UPDATE ON public.remuneracao_planos
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. RLS — dado salarial sensível (master/director/hr); admin_mx incluso
-- ----------------------------------------------------------------------------
ALTER TABLE public.remuneracao_planos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracao_benchmark ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS remuneracao_planos_rw ON public.remuneracao_planos;
CREATE POLICY remuneracao_planos_rw
  ON public.remuneracao_planos
  FOR ALL
  TO authenticated
  USING (public.user_has_role(ARRAY['master','director','hr','admin_mx']))
  WITH CHECK (public.user_has_role(ARRAY['master','director','hr','admin_mx']));

DROP POLICY IF EXISTS remuneracao_benchmark_read ON public.remuneracao_benchmark;
CREATE POLICY remuneracao_benchmark_read
  ON public.remuneracao_benchmark
  FOR SELECT
  TO authenticated
  USING (public.user_has_role(ARRAY['master','director','hr','admin_mx']));

DROP POLICY IF EXISTS remuneracao_benchmark_write ON public.remuneracao_benchmark;
CREATE POLICY remuneracao_benchmark_write
  ON public.remuneracao_benchmark
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_role(ARRAY['admin_mx','master']));

COMMIT;

-- ============================================================================
-- DOWN (rollback manual — Supabase CLI é forward-only):
--   BEGIN;
--   DROP POLICY IF EXISTS remuneracao_benchmark_write ON public.remuneracao_benchmark;
--   DROP POLICY IF EXISTS remuneracao_benchmark_read  ON public.remuneracao_benchmark;
--   DROP POLICY IF EXISTS remuneracao_planos_rw       ON public.remuneracao_planos;
--   DROP TRIGGER IF EXISTS trg_remuneracao_planos_updated ON public.remuneracao_planos;
--   DROP TABLE IF EXISTS public.remuneracao_benchmark;
--   DROP TABLE IF EXISTS public.remuneracao_planos;
--   DROP TYPE  IF EXISTS public.remuneracao_classificacao;
--   COMMIT;
-- ============================================================================
