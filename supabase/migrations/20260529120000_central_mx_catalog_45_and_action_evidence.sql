-- ============================================================================
-- Migration: 20260529120000_central_mx_catalog_45_and_action_evidence.sql
-- Scope: Central MX catalog completeness and action-plan evidence trail.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Expand strategic planning catalog metadata
-- ----------------------------------------------------------------------------

ALTER TABLE public.catalogo_indicadores_planejamento
  ADD COLUMN IF NOT EXISTS department_code text,
  ADD COLUMN IF NOT EXISTS dimension text,
  ADD COLUMN IF NOT EXISTS target_direction text;

ALTER TABLE public.catalogo_indicadores_planejamento
  DROP CONSTRAINT IF EXISTS catalogo_indicadores_department_code_check,
  DROP CONSTRAINT IF EXISTS catalogo_indicadores_dimension_check,
  DROP CONSTRAINT IF EXISTS catalogo_indicadores_target_direction_check;

ALTER TABLE public.catalogo_indicadores_planejamento
  ADD CONSTRAINT catalogo_indicadores_department_code_check
    CHECK (department_code IS NULL OR department_code = ANY (ARRAY['comercial', 'marketing', 'produto', 'financeiro', 'rh', 'operacional'])),
  ADD CONSTRAINT catalogo_indicadores_dimension_check
    CHECK (dimension IS NULL OR dimension = ANY (ARRAY['resultado', 'processo', 'disciplina'])),
  ADD CONSTRAINT catalogo_indicadores_target_direction_check
    CHECK (target_direction IS NULL OR target_direction = ANY (ARRAY['higher', 'lower']));

INSERT INTO public.catalogo_indicadores_planejamento (
  code,
  label,
  category,
  department_code,
  unit,
  dimension,
  target_direction,
  sort_order,
  active,
  metadata
)
VALUES
  ('sales_volume', 'Volume de Vendas', 'comercial', 'comercial', 'number', 'resultado', 'higher', 10, true, '{"central_mx":true}'::jsonb),
  ('sales_goal_attainment', 'Atingimento da Meta', 'comercial', 'comercial', 'percent', 'resultado', 'higher', 20, true, '{"central_mx":true}'::jsonb),
  ('daily_sales_rhythm', 'Ritmo Diario de Vendas', 'comercial', 'comercial', 'number', 'processo', 'higher', 30, true, '{"central_mx":true}'::jsonb),
  ('lead_to_schedule_rate', 'Conversao Lead > Agendamento', 'comercial', 'comercial', 'percent', 'processo', 'higher', 40, true, '{"central_mx":true}'::jsonb),
  ('schedule_to_visit_rate', 'Conversao Agendamento > Visita', 'comercial', 'comercial', 'percent', 'processo', 'higher', 50, true, '{"central_mx":true}'::jsonb),
  ('visit_to_sale_rate', 'Conversao Visita > Venda', 'comercial', 'comercial', 'percent', 'resultado', 'higher', 60, true, '{"central_mx":true}'::jsonb),
  ('commercial_pipeline_health', 'Saude do Funil Comercial', 'comercial', 'comercial', 'score', 'processo', 'higher', 70, true, '{"central_mx":true}'::jsonb),
  ('seller_ranking_spread', 'Dispersao do Ranking', 'comercial', 'comercial', 'score', 'resultado', 'lower', 80, true, '{"central_mx":true}'::jsonb),

  ('leads_total', 'Leads Recebidos', 'marketing', 'marketing', 'number', 'resultado', 'higher', 110, true, '{"central_mx":true}'::jsonb),
  ('digital_leads_share', 'Participacao de Leads Digitais', 'marketing', 'marketing', 'percent', 'resultado', 'higher', 120, true, '{"central_mx":true}'::jsonb),
  ('lead_quality_score', 'Qualidade dos Leads', 'marketing', 'marketing', 'score', 'processo', 'higher', 130, true, '{"central_mx":true}'::jsonb),
  ('campaign_cadence_score', 'Cadencia de Campanhas', 'marketing', 'marketing', 'score', 'disciplina', 'higher', 140, true, '{"central_mx":true}'::jsonb),
  ('channel_mix_score', 'Mix de Canais', 'marketing', 'marketing', 'score', 'processo', 'higher', 150, true, '{"central_mx":true}'::jsonb),
  ('marketing_positioning_score', 'Posicionamento de Marketing', 'marketing', 'marketing', 'score', 'processo', 'higher', 160, true, '{"central_mx":true}'::jsonb),
  ('cost_per_lead', 'Custo por Lead', 'marketing', 'marketing', 'currency', 'resultado', 'lower', 170, true, '{"central_mx":true}'::jsonb),

  ('inventory_total', 'Estoque Total', 'produto', 'produto', 'number', 'resultado', 'lower', 210, true, '{"central_mx":true}'::jsonb),
  ('inventory_over_90_days', 'Estoque Acima de 90 Dias', 'produto', 'produto', 'number', 'resultado', 'lower', 220, true, '{"central_mx":true}'::jsonb),
  ('stock_turnover_rate', 'Giro de Estoque', 'produto', 'produto', 'number', 'resultado', 'higher', 230, true, '{"central_mx":true}'::jsonb),
  ('average_vehicle_margin', 'Margem Media por Veiculo', 'produto', 'produto', 'percent', 'resultado', 'higher', 240, true, '{"central_mx":true}'::jsonb),
  ('pricing_accuracy_score', 'Aderencia de Precificacao', 'produto', 'produto', 'score', 'processo', 'higher', 250, true, '{"central_mx":true}'::jsonb),
  ('preparation_cycle_days', 'Ciclo de Preparacao', 'produto', 'produto', 'days', 'processo', 'lower', 260, true, '{"central_mx":true}'::jsonb),
  ('vehicle_mix_score', 'Mix de Veiculos', 'produto', 'produto', 'score', 'processo', 'higher', 270, true, '{"central_mx":true}'::jsonb),

  ('gross_profit', 'Lucro Bruto', 'financeiro', 'financeiro', 'currency', 'resultado', 'higher', 310, true, '{"central_mx":true}'::jsonb),
  ('gross_margin_pct', '% Margem', 'financeiro', 'financeiro', 'percent', 'resultado', 'higher', 320, true, '{"central_mx":true}'::jsonb),
  ('net_profit', 'Lucro Liquido', 'financeiro', 'financeiro', 'currency', 'resultado', 'higher', 330, true, '{"central_mx":true}'::jsonb),
  ('cost_per_sale', 'Custo por Venda', 'financeiro', 'financeiro', 'currency', 'resultado', 'lower', 340, true, '{"central_mx":true}'::jsonb),
  ('fixed_cost_ratio', 'Peso do Custo Fixo', 'financeiro', 'financeiro', 'percent', 'processo', 'lower', 350, true, '{"central_mx":true}'::jsonb),
  ('cash_flow_balance', 'Saldo de Fluxo de Caixa', 'financeiro', 'financeiro', 'currency', 'resultado', 'higher', 360, true, '{"central_mx":true}'::jsonb),
  ('dre_completion_rate', 'Completude do DRE', 'financeiro', 'financeiro', 'percent', 'disciplina', 'higher', 370, true, '{"central_mx":true}'::jsonb),
  ('financial_risk_score', 'Risco Financeiro', 'financeiro', 'financeiro', 'score', 'processo', 'higher', 380, true, '{"central_mx":true}'::jsonb),

  ('employees_total', 'Funcionarios Ativos', 'rh', 'rh', 'number', 'resultado', 'higher', 410, true, '{"central_mx":true}'::jsonb),
  ('training_completion_rate', 'Conclusao de Treinamentos', 'rh', 'rh', 'percent', 'disciplina', 'higher', 420, true, '{"central_mx":true}'::jsonb),
  ('feedback_cadence_rate', 'Cadencia de Feedbacks', 'rh', 'rh', 'percent', 'disciplina', 'higher', 430, true, '{"central_mx":true}'::jsonb),
  ('pdi_completion_rate', 'Evolucao de PDI', 'rh', 'rh', 'percent', 'processo', 'higher', 440, true, '{"central_mx":true}'::jsonb),
  ('turnover_rate', 'Turnover', 'rh', 'rh', 'percent', 'resultado', 'lower', 450, true, '{"central_mx":true}'::jsonb),
  ('happiness_index', 'Indice de Felicidade', 'rh', 'rh', 'score', 'resultado', 'higher', 460, true, '{"central_mx":true}'::jsonb),
  ('role_clarity_score', 'Clareza de Papeis', 'rh', 'rh', 'score', 'processo', 'higher', 470, true, '{"central_mx":true}'::jsonb),
  ('behavioral_fit_score', 'Aderencia Comportamental', 'rh', 'rh', 'score', 'processo', 'higher', 480, true, '{"central_mx":true}'::jsonb),

  ('routine_discipline_rate', 'Disciplina de Rotina', 'operacional', 'operacional', 'percent', 'disciplina', 'higher', 510, true, '{"central_mx":true}'::jsonb),
  ('agenda_fulfillment_rate', 'Agenda Cumprida', 'operacional', 'operacional', 'percent', 'disciplina', 'higher', 520, true, '{"central_mx":true}'::jsonb),
  ('daily_checkin_coverage', 'Cobertura de Lancamento Diario', 'operacional', 'operacional', 'percent', 'disciplina', 'higher', 530, true, '{"central_mx":true}'::jsonb),
  ('action_plan_on_time_rate', 'Plano de Acao no Prazo', 'operacional', 'operacional', 'percent', 'processo', 'higher', 540, true, '{"central_mx":true}'::jsonb),
  ('evidence_completion_rate', 'Evidencias Registradas', 'operacional', 'operacional', 'percent', 'disciplina', 'higher', 550, true, '{"central_mx":true}'::jsonb),
  ('executive_agenda_adherence', 'Aderencia a Agenda Executiva', 'operacional', 'operacional', 'percent', 'disciplina', 'higher', 560, true, '{"central_mx":true}'::jsonb),
  ('process_quality_score', 'Qualidade dos Processos', 'operacional', 'operacional', 'score', 'processo', 'higher', 570, true, '{"central_mx":true}'::jsonb)
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label,
    category = EXCLUDED.category,
    department_code = EXCLUDED.department_code,
    unit = EXCLUDED.unit,
    dimension = EXCLUDED.dimension,
    target_direction = EXCLUDED.target_direction,
    sort_order = EXCLUDED.sort_order,
    active = EXCLUDED.active,
    metadata = public.catalogo_indicadores_planejamento.metadata || EXCLUDED.metadata,
    updated_at = now();

COMMENT ON COLUMN public.catalogo_indicadores_planejamento.department_code IS
  'Departamento canonico da Central MX para agrupar a matriz dos 45 indicadores.';
COMMENT ON COLUMN public.catalogo_indicadores_planejamento.dimension IS
  'Dimensao usada pelo MX Score automatico: resultado, processo ou disciplina.';
COMMENT ON COLUMN public.catalogo_indicadores_planejamento.target_direction IS
  'Direcao de desempenho do indicador: higher e melhor, lower e melhor.';

-- ----------------------------------------------------------------------------
-- 2. Action-plan evidences
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.evidencias_planos_acao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id uuid NOT NULL REFERENCES public.planos_acao(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'documento' CHECK (tipo = ANY (ARRAY['foto', 'print', 'documento', 'link', 'observacao'])),
  nome_arquivo text,
  storage_path text,
  evidence_url text,
  nota text,
  uploaded_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    NULLIF(BTRIM(COALESCE(storage_path, '')), '') IS NOT NULL
    OR NULLIF(BTRIM(COALESCE(evidence_url, '')), '') IS NOT NULL
    OR NULLIF(BTRIM(COALESCE(nota, '')), '') IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_evidencias_planos_acao_plano
  ON public.evidencias_planos_acao(plano_id, created_at DESC);

COMMENT ON TABLE public.evidencias_planos_acao IS
  'Evidencias do Plano de Acao executivo: anexos, links e notas que comprovam execucao antes da validacao de eficacia.';

ALTER TABLE public.evidencias_planos_acao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS evidencias_planos_read ON public.evidencias_planos_acao;
CREATE POLICY evidencias_planos_read
  ON public.evidencias_planos_acao
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.planos_acao p
      WHERE p.id = evidencias_planos_acao.plano_id
        AND (
          public.can_access_mx_scope(p.scope_type, p.scope_id)
          OR p.responsavel_id = auth.uid()
          OR evidencias_planos_acao.uploaded_by = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS evidencias_planos_insert ON public.evidencias_planos_acao;
CREATE POLICY evidencias_planos_insert
  ON public.evidencias_planos_acao
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.planos_acao p
      WHERE p.id = plano_id
        AND (
          public.can_access_mx_scope(p.scope_type, p.scope_id)
          OR p.responsavel_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS evidencias_planos_delete ON public.evidencias_planos_acao;
CREATE POLICY evidencias_planos_delete
  ON public.evidencias_planos_acao
  FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR public.user_has_role(ARRAY['master', 'consultant', 'admin_mx'])
  );

COMMIT;
