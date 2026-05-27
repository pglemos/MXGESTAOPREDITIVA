-- ============================================================================
-- Migration: 20260527150000_planos_acao_schema.sql
-- Story:     EPIC-MX-09 (Plano de Ação — FR-PLAN-1 a FR-PLAN-3)
-- PRD:       docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md §4.8
-- Fonte:     .docx §265–§290
--
-- ESCOPO: schema canônico de Plano de Ação.
--   - Estrutura: Departamento, Indicador, Problema, Ação, Como, Responsável,
--                Prazo, Status, Eficácia, Origem, Prioridade (FR-PLAN-1)
--   - Origens: alertas | score | consultor | manual (FR-PLAN-2)
--   - Status: pendente | em_andamento | atrasado | concluido | validando_eficacia (FR-PLAN-3)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. ENUMs
-- ----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.action_status AS ENUM ('pendente', 'em_andamento', 'atrasado', 'concluido', 'validando_eficacia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.action_origin AS ENUM ('alertas', 'score', 'consultor', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.action_priority AS ENUM ('baixa', 'media', 'alta', 'critica');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 1. planos_acao
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.planos_acao (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Escopo
  scope_type      public.score_scope_type NOT NULL,
  scope_id        uuid NOT NULL,

  -- Estrutura FR-PLAN-1 (.docx §265–§277)
  departamento    text NOT NULL CHECK (length(trim(departamento)) > 0),
  indicador       text NOT NULL CHECK (length(trim(indicador)) > 0),
  problema        text NOT NULL CHECK (length(trim(problema)) > 0),
  acao            text NOT NULL CHECK (length(trim(acao)) > 0),
  como            text,
  responsavel_id  uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  prazo           date,

  -- Estado
  status          public.action_status NOT NULL DEFAULT 'pendente',
  prioridade      public.action_priority NOT NULL DEFAULT 'media',

  -- Origem & rastreabilidade
  origem          public.action_origin NOT NULL,
  origem_ref_id   uuid,  -- alert_id | score_calc_id | observation_id | NULL (se manual)
  origem_ref_table text,  -- 'alerts' | 'score_calculations' | 'score_observations' | NULL

  -- Eficácia (medida após conclusão)
  eficacia_score  smallint CHECK (eficacia_score IS NULL OR (eficacia_score >= 0 AND eficacia_score <= 100)),
  eficacia_nota   text,

  -- Auditoria
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  concluido_at    timestamptz,

  CHECK (
    (status = 'concluido' AND concluido_at IS NOT NULL) OR
    (status <> 'concluido')
  )
);

CREATE INDEX IF NOT EXISTS idx_planos_scope_status
  ON public.planos_acao(scope_type, scope_id, status);

CREATE INDEX IF NOT EXISTS idx_planos_prazo
  ON public.planos_acao(prazo) WHERE status IN ('pendente', 'em_andamento');

CREATE INDEX IF NOT EXISTS idx_planos_responsavel
  ON public.planos_acao(responsavel_id, status);

COMMENT ON TABLE public.planos_acao IS
  'Plano de Ação canônico — transforma problemas em execução prática (FR-PLAN, .docx §265–§290).';

-- ----------------------------------------------------------------------------
-- 2. Trigger auto-detecta "atrasado" + auto-update_at
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.planos_acao_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  -- Auto-marca como atrasado se prazo passou e ainda não concluído
  IF NEW.prazo IS NOT NULL
     AND NEW.prazo < CURRENT_DATE
     AND NEW.status IN ('pendente', 'em_andamento') THEN
    NEW.status = 'atrasado';
  END IF;
  -- Auto-stamp concluido_at
  IF NEW.status = 'concluido' AND NEW.concluido_at IS NULL THEN
    NEW.concluido_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_planos_acao_touch ON public.planos_acao;
CREATE TRIGGER trg_planos_acao_touch
  BEFORE INSERT OR UPDATE ON public.planos_acao
  FOR EACH ROW EXECUTE FUNCTION public.planos_acao_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 3. RLS — usando helpers MX-2.2
-- ----------------------------------------------------------------------------

ALTER TABLE public.planos_acao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS planos_read ON public.planos_acao;
CREATE POLICY planos_read
  ON public.planos_acao
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS planos_write ON public.planos_acao;
CREATE POLICY planos_write
  ON public.planos_acao
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_role(ARRAY['master','director','sales_manager','consultant','admin_mx'])
  );

DROP POLICY IF EXISTS planos_update ON public.planos_acao;
CREATE POLICY planos_update
  ON public.planos_acao
  FOR UPDATE
  TO authenticated
  USING (
    public.user_has_role(ARRAY['master','director','sales_manager','consultant','admin_mx'])
    OR auth.uid() = responsavel_id  -- responsável pode atualizar seu próprio
  )
  WITH CHECK (
    public.user_has_role(ARRAY['master','director','sales_manager','consultant','admin_mx'])
    OR auth.uid() = responsavel_id
  );

-- DELETE só para Master/admin
DROP POLICY IF EXISTS planos_delete ON public.planos_acao;
CREATE POLICY planos_delete
  ON public.planos_acao
  FOR DELETE
  TO authenticated
  USING (
    public.user_has_role(ARRAY['master','admin_mx'])
  );

COMMIT;
