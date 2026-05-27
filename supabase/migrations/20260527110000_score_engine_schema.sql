-- ============================================================================
-- Migration: 20260527110000_score_engine_schema.sql
-- Story:     MX-7.1 (docs/stories/story-MX-07-20260527-schema-score.md)
-- Epic:      EPIC-MX-07 (Motor MX Score)
-- PRD:       docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md §4.7
-- Depende de: 20260527100000_canonical_roles_schema.sql (tabela roles)
--
-- PRINCÍPIO INVIOLÁVEL (FR-SCORE-5, .docx §259–§264):
--   Score é AUTOMÁTICO. Consultor NÃO altera nota. Apenas comenta/contextualiza/recomenda.
--   Materialização técnica:
--     1. score_observations é a única porta de entrada do consultor
--     2. score_calculations.value nunca é UPDATEd (apenas re-INSERT via RPC determinística)
--     3. score_history é imutável após criação
--
-- ESTRATÉGIA RLS:
--   Policy permissiva temporária com TODO — substituir por policy baseada em
--   roles.code quando MX-2.2 (RLS final) entregar.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. ENUM types
-- ----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.score_scope_type AS ENUM ('store', 'department', 'individual', 'process');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.score_dimension AS ENUM ('resultado', 'processo', 'disciplina');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.score_band AS ENUM ('elite', 'excellent', 'good', 'attention', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 1. score_inputs — dados brutos coletados
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.score_inputs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type    public.score_scope_type NOT NULL,
  scope_id      uuid NOT NULL,
  metric_code   text NOT NULL,
  metric_value  numeric NOT NULL,
  dimension     public.score_dimension NOT NULL,
  period        date NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid REFERENCES public.usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_score_inputs_scope_period
  ON public.score_inputs(scope_type, scope_id, period);

CREATE INDEX IF NOT EXISTS idx_score_inputs_metric
  ON public.score_inputs(metric_code, period);

COMMENT ON TABLE  public.score_inputs IS
  'Dados brutos por scope×metric×dimension×period. Entrada do motor de cálculo. Múltiplas linhas por scope/period permitidas (histórico de coletas).';
COMMENT ON COLUMN public.score_inputs.dimension IS
  'Resultado | Processo | Disciplina — PRD §4.7 FR-SCORE-4 / .docx §254–§258.';

-- ----------------------------------------------------------------------------
-- 2. score_calculations — resultado computado (AUTOMÁTICO, imutável após INSERT)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.score_calculations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type           public.score_scope_type NOT NULL,
  scope_id             uuid NOT NULL,
  period               date NOT NULL,
  value                numeric NOT NULL CHECK (value >= 0 AND value <= 100),
  band                 public.score_band NOT NULL,
  dim_resultado        numeric CHECK (dim_resultado IS NULL OR (dim_resultado >= 0 AND dim_resultado <= 100)),
  dim_processo         numeric CHECK (dim_processo  IS NULL OR (dim_processo  >= 0 AND dim_processo  <= 100)),
  dim_disciplina       numeric CHECK (dim_disciplina IS NULL OR (dim_disciplina >= 0 AND dim_disciplina <= 100)),
  calculation_version  text NOT NULL,
  computed_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope_type, scope_id, period, calculation_version)
);

CREATE INDEX IF NOT EXISTS idx_score_calc_scope_period
  ON public.score_calculations(scope_type, scope_id, period DESC);

COMMENT ON TABLE  public.score_calculations IS
  'Resultado computado do MX Score (0–100). IMUTÁVEL: value/band nunca devem ser UPDATEd — apenas re-INSERT via RPC determinística.';
COMMENT ON COLUMN public.score_calculations.calculation_version IS
  'Versão do conjunto de regras (engine). Permite reprocessamento histórico se regras evoluírem.';

-- ----------------------------------------------------------------------------
-- 3. Helper SQL: classify_score
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.classify_score(v numeric)
RETURNS public.score_band
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN v IS NULL    THEN 'critical'::public.score_band
    WHEN v >= 90      THEN 'elite'::public.score_band
    WHEN v >= 80      THEN 'excellent'::public.score_band
    WHEN v >= 70      THEN 'good'::public.score_band
    WHEN v >= 60      THEN 'attention'::public.score_band
    ELSE                   'critical'::public.score_band
  END;
$$;

COMMENT ON FUNCTION public.classify_score(numeric) IS
  'Faixas MX Score — PRD §4.7 FR-SCORE-2 / .docx §244–§249.';

-- ----------------------------------------------------------------------------
-- 4. score_history — snapshots imutáveis
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.score_history (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id   uuid NOT NULL REFERENCES public.score_calculations(id) ON DELETE RESTRICT,
  snapshot_payload jsonb NOT NULL,
  archived_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_score_history_calc
  ON public.score_history(calculation_id, archived_at DESC);

COMMENT ON TABLE public.score_history IS
  'Snapshots imutáveis de score_calculations. Triggers bloqueiam UPDATE/DELETE.';

-- ----------------------------------------------------------------------------
-- 5. score_observations — única porta do Consultor MX (não altera score)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.score_observations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id    uuid NOT NULL REFERENCES public.score_calculations(id) ON DELETE CASCADE,
  author_id         uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE SET NULL,
  observation_text  text NOT NULL CHECK (length(trim(observation_text)) > 0),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_score_observations_calc
  ON public.score_observations(calculation_id, created_at DESC);

COMMENT ON TABLE public.score_observations IS
  'Observações qualitativas do Consultor MX / Master. NÃO altera score (FR-SCORE-5 / .docx §259–§264).';

-- ----------------------------------------------------------------------------
-- 6. CHECK em author role (Consultor MX ou Master) — via trigger pois CHECK
--    não pode fazer SELECT cross-table
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_observation_author_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_code text;
  v_legacy_role text;
BEGIN
  -- Tenta primeiro role canônico (role_id)
  SELECT r.code, u.role
    INTO v_role_code, v_legacy_role
  FROM public.usuarios u
  LEFT JOIN public.roles r ON r.id = u.role_id
  WHERE u.id = NEW.author_id;

  IF v_role_code IS NULL THEN
    -- Fallback para role legado durante coexistência
    v_role_code := CASE
      WHEN lower(v_legacy_role) IN ('consultor', 'consultor_mx') THEN 'consultant'
      WHEN lower(v_legacy_role) IN ('dono', 'owner')             THEN 'master'
      ELSE NULL
    END;
  END IF;

  IF v_role_code NOT IN ('consultant', 'master') THEN
    RAISE EXCEPTION 'Apenas Consultor MX ou Master podem inserir observações de score (FR-SCORE-5). Author role: %', COALESCE(v_role_code, v_legacy_role, 'unknown')
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_observation_author_role ON public.score_observations;
CREATE TRIGGER trg_enforce_observation_author_role
  BEFORE INSERT OR UPDATE OF author_id
  ON public.score_observations
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_observation_author_role();

-- ----------------------------------------------------------------------------
-- 7. Trigger: arquivar em score_history após cada INSERT em score_calculations
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.archive_score_calculation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.score_history (calculation_id, snapshot_payload)
  VALUES (NEW.id, to_jsonb(NEW));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_archive_score_calculation ON public.score_calculations;
CREATE TRIGGER trg_archive_score_calculation
  AFTER INSERT ON public.score_calculations
  FOR EACH ROW EXECUTE FUNCTION public.archive_score_calculation();

-- ----------------------------------------------------------------------------
-- 8. GUARD CRÍTICO (FR-SCORE-5): bloquear UPDATE/DELETE em score_calculations e score_history
--    Score só é "alterado" via novo INSERT (re-cálculo). Nunca via UPDATE direto.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_score_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'score_calculations e score_history são imutáveis (FR-SCORE-5). Use INSERT de novo cálculo para refletir mudanças.'
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_score_calc_mutation ON public.score_calculations;
CREATE TRIGGER trg_prevent_score_calc_mutation
  BEFORE UPDATE OR DELETE ON public.score_calculations
  FOR EACH ROW EXECUTE FUNCTION public.prevent_score_mutation();

DROP TRIGGER IF EXISTS trg_prevent_score_history_mutation ON public.score_history;
CREATE TRIGGER trg_prevent_score_history_mutation
  BEFORE UPDATE OR DELETE ON public.score_history
  FOR EACH ROW EXECUTE FUNCTION public.prevent_score_mutation();

-- ----------------------------------------------------------------------------
-- 9. RPC pública: get_score(scope_type, scope_id, period)
--    Retorna o cálculo mais recente. Read-only.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_score(
  p_scope_type public.score_scope_type,
  p_scope_id   uuid,
  p_period     date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  value          numeric,
  band           public.score_band,
  dim_resultado  numeric,
  dim_processo   numeric,
  dim_disciplina numeric,
  computed_at    timestamptz,
  calculation_version text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sc.value,
    sc.band,
    sc.dim_resultado,
    sc.dim_processo,
    sc.dim_disciplina,
    sc.computed_at,
    sc.calculation_version
  FROM public.score_calculations sc
  WHERE sc.scope_type = p_scope_type
    AND sc.scope_id   = p_scope_id
    AND sc.period    <= p_period
  ORDER BY sc.period DESC, sc.computed_at DESC
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_score IS
  'Retorna o MX Score mais recente para um escopo. Read-only — score só é alterado via re-INSERT em score_calculations.';

-- ----------------------------------------------------------------------------
-- 10. RLS — habilitada com policy temporária permissiva (TODO consume MX-2.2)
-- ----------------------------------------------------------------------------

ALTER TABLE public.score_inputs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_history      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_observations ENABLE ROW LEVEL SECURITY;

-- TODO (MX-2.2): substituir policies abaixo por policies baseadas em roles.code
--                vinculadas a usuarios.loja_id / scope_id

DROP POLICY IF EXISTS score_inputs_read ON public.score_inputs;
CREATE POLICY score_inputs_read       ON public.score_inputs       FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS score_inputs_write ON public.score_inputs;
CREATE POLICY score_inputs_write      ON public.score_inputs       FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS score_calc_read ON public.score_calculations;
CREATE POLICY score_calc_read         ON public.score_calculations FOR SELECT TO authenticated USING (true);

-- INSERT em score_calculations APENAS via service_role (RPC determinística no futuro)
DROP POLICY IF EXISTS score_calc_insert_service ON public.score_calculations;
CREATE POLICY score_calc_insert_service ON public.score_calculations FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS score_history_read ON public.score_history;
CREATE POLICY score_history_read      ON public.score_history      FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS score_obs_read ON public.score_observations;
CREATE POLICY score_obs_read          ON public.score_observations FOR SELECT TO authenticated USING (true);

-- INSERT em score_observations: trigger valida role; policy aberta
DROP POLICY IF EXISTS score_obs_write ON public.score_observations;
CREATE POLICY score_obs_write         ON public.score_observations FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

COMMIT;

-- ============================================================================
-- DOWN MIGRATION (manual rollback)
-- ============================================================================
-- BEGIN;
--   DROP FUNCTION IF EXISTS public.get_score(public.score_scope_type, uuid, date);
--   DROP TRIGGER IF EXISTS trg_prevent_score_history_mutation ON public.score_history;
--   DROP TRIGGER IF EXISTS trg_prevent_score_calc_mutation ON public.score_calculations;
--   DROP FUNCTION IF EXISTS public.prevent_score_mutation();
--   DROP TRIGGER IF EXISTS trg_archive_score_calculation ON public.score_calculations;
--   DROP FUNCTION IF EXISTS public.archive_score_calculation();
--   DROP TRIGGER IF EXISTS trg_enforce_observation_author_role ON public.score_observations;
--   DROP FUNCTION IF EXISTS public.enforce_observation_author_role();
--   DROP FUNCTION IF EXISTS public.classify_score(numeric);
--   DROP TABLE IF EXISTS public.score_observations;
--   DROP TABLE IF EXISTS public.score_history;
--   DROP TABLE IF EXISTS public.score_calculations;
--   DROP TABLE IF EXISTS public.score_inputs;
--   DROP TYPE IF EXISTS public.score_band;
--   DROP TYPE IF EXISTS public.score_dimension;
--   DROP TYPE IF EXISTS public.score_scope_type;
-- COMMIT;
-- ============================================================================
