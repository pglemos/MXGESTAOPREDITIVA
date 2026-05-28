-- ============================================================================
-- Migration: 20260527180000_departments_planning_consultive_rules_schema.sql
-- Stories:   MX-13, MX-14, MX-15
-- Scope:     Departments, strategic-planning indicators and rules-based
--            consultive catalog.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Shared updated_at trigger
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.touch_mx_executive_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 1. Departments per store
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.departamentos_mx (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  code text NOT NULL CHECK (
    code = ANY (ARRAY['comercial', 'marketing', 'produto', 'financeiro', 'rh', 'operacional'])
  ),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  responsible_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  authorized_role_codes text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'ativo' CHECK (status = ANY (ARRAY['ativo', 'pendente', 'inativo'])),
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (loja_id, code)
);

CREATE INDEX IF NOT EXISTS idx_departamentos_mx_loja
  ON public.departamentos_mx(loja_id, code);

CREATE INDEX IF NOT EXISTS idx_departamentos_mx_responsible
  ON public.departamentos_mx(responsible_id)
  WHERE responsible_id IS NOT NULL;

COMMENT ON TABLE public.departamentos_mx IS
  'Departamentos MX por loja: Comercial, Marketing, Produto, Financeiro, RH e Operacional. Base para score, alertas e planos de ação.';

DROP TRIGGER IF EXISTS trg_departamentos_mx_touch ON public.departamentos_mx;
CREATE TRIGGER trg_departamentos_mx_touch
  BEFORE UPDATE ON public.departamentos_mx
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_mx_executive_updated_at();

INSERT INTO public.departamentos_mx (loja_id, code, name, authorized_role_codes, status)
SELECT l.id, d.code, d.name, d.role_codes, 'pendente'
FROM public.lojas l
CROSS JOIN (
  VALUES
    ('comercial', 'Comercial', ARRAY['master', 'director', 'sales_manager', 'consultant', 'admin_mx']::text[]),
    ('marketing', 'Marketing', ARRAY['master', 'director', 'marketing', 'consultant', 'admin_mx']::text[]),
    ('produto', 'Produto', ARRAY['master', 'director', 'product', 'consultant', 'admin_mx']::text[]),
    ('financeiro', 'Financeiro', ARRAY['master', 'director', 'finance', 'consultant', 'admin_mx']::text[]),
    ('rh', 'RH', ARRAY['master', 'director', 'hr', 'consultant', 'admin_mx']::text[]),
    ('operacional', 'Operacional', ARRAY['master', 'director', 'operations', 'sales_manager', 'consultant', 'admin_mx']::text[])
) AS d(code, name, role_codes)
ON CONFLICT (loja_id, code) DO NOTHING;

ALTER TABLE public.departamentos_mx ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS departamentos_mx_read ON public.departamentos_mx;
CREATE POLICY departamentos_mx_read
  ON public.departamentos_mx
  FOR SELECT
  TO authenticated
  USING (
    public.can_access_mx_scope('store'::public.score_scope_type, loja_id)
    OR responsible_id = auth.uid()
  );

DROP POLICY IF EXISTS departamentos_mx_write ON public.departamentos_mx;
CREATE POLICY departamentos_mx_write
  ON public.departamentos_mx
  FOR ALL
  TO authenticated
  USING (
    public.can_access_mx_scope('store'::public.score_scope_type, loja_id)
    AND public.user_has_role(ARRAY['master', 'director', 'sales_manager', 'consultant', 'admin_mx'])
  )
  WITH CHECK (
    public.can_access_mx_scope('store'::public.score_scope_type, loja_id)
    AND public.user_has_role(ARRAY['master', 'director', 'sales_manager', 'consultant', 'admin_mx'])
  );

-- ----------------------------------------------------------------------------
-- 2. Strategic planning indicator catalog and values
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.catalogo_indicadores_planejamento (
  code text PRIMARY KEY,
  label text NOT NULL CHECK (length(trim(label)) > 0),
  category text NOT NULL CHECK (length(trim(category)) > 0),
  unit text NOT NULL DEFAULT 'number',
  sort_order integer NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.catalogo_indicadores_planejamento IS
  'Catálogo de indicadores do Planejamento Estratégico MX: 5 cards e tabela anual Meta/Realizado/Ano Anterior.';

DROP TRIGGER IF EXISTS trg_catalogo_indicadores_planejamento_touch ON public.catalogo_indicadores_planejamento;
CREATE TRIGGER trg_catalogo_indicadores_planejamento_touch
  BEFORE UPDATE ON public.catalogo_indicadores_planejamento
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_mx_executive_updated_at();

INSERT INTO public.catalogo_indicadores_planejamento (code, label, category, unit, sort_order)
VALUES
  ('net_profit', 'Lucro Líquido', 'financeiro', 'currency', 10),
  ('sales_volume', 'Volume de Vendas', 'vendas', 'number', 20),
  ('cost_per_sale', 'Custo por Venda', 'financeiro', 'currency', 30),
  ('inventory_total', 'Estoque Total', 'produto', 'number', 40),
  ('employees_total', 'Funcionários', 'pessoas', 'number', 50),
  ('lead_to_schedule_rate', 'Conversão Lead > Agendamento', 'vendas', 'percent', 60),
  ('routine_discipline_rate', 'Disciplina de Rotina', 'operacional', 'percent', 70)
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label,
    category = EXCLUDED.category,
    unit = EXCLUDED.unit,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

CREATE TABLE IF NOT EXISTS public.valores_indicadores_planejamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  indicator_code text NOT NULL REFERENCES public.catalogo_indicadores_planejamento(code) ON DELETE RESTRICT,
  year integer NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  month integer CHECK (month IS NULL OR month BETWEEN 1 AND 12),
  meta numeric,
  realizado numeric,
  ano_anterior numeric,
  source text NOT NULL DEFAULT 'manual' CHECK (source = ANY (ARRAY['manual', 'importacao', 'dre', 'funil', 'score', 'sistema'])),
  source_ref jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_valores_planejamento_loja_periodo
  ON public.valores_indicadores_planejamento(loja_id, year DESC, month);

CREATE INDEX IF NOT EXISTS idx_valores_planejamento_indicator
  ON public.valores_indicadores_planejamento(indicator_code, year DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_valores_planejamento_unique_period
  ON public.valores_indicadores_planejamento(loja_id, indicator_code, year, COALESCE(month, 0));

COMMENT ON TABLE public.valores_indicadores_planejamento IS
  'Valores por loja/período para Planejamento Estratégico: Meta, Realizado e Ano Anterior.';

DROP TRIGGER IF EXISTS trg_valores_indicadores_planejamento_touch ON public.valores_indicadores_planejamento;
CREATE TRIGGER trg_valores_indicadores_planejamento_touch
  BEFORE UPDATE ON public.valores_indicadores_planejamento
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_mx_executive_updated_at();

ALTER TABLE public.catalogo_indicadores_planejamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valores_indicadores_planejamento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catalogo_indicadores_planejamento_read ON public.catalogo_indicadores_planejamento;
CREATE POLICY catalogo_indicadores_planejamento_read
  ON public.catalogo_indicadores_planejamento
  FOR SELECT
  TO authenticated
  USING (active = true OR public.eh_area_interna_mx(auth.uid()));

DROP POLICY IF EXISTS catalogo_indicadores_planejamento_write ON public.catalogo_indicadores_planejamento;
CREATE POLICY catalogo_indicadores_planejamento_write
  ON public.catalogo_indicadores_planejamento
  FOR ALL
  TO authenticated
  USING (public.eh_administrador_mx(auth.uid()))
  WITH CHECK (public.eh_administrador_mx(auth.uid()));

DROP POLICY IF EXISTS valores_indicadores_planejamento_read ON public.valores_indicadores_planejamento;
CREATE POLICY valores_indicadores_planejamento_read
  ON public.valores_indicadores_planejamento
  FOR SELECT
  TO authenticated
  USING (public.can_access_mx_scope('store'::public.score_scope_type, loja_id));

DROP POLICY IF EXISTS valores_indicadores_planejamento_write ON public.valores_indicadores_planejamento;
CREATE POLICY valores_indicadores_planejamento_write
  ON public.valores_indicadores_planejamento
  FOR ALL
  TO authenticated
  USING (
    public.can_access_mx_scope('store'::public.score_scope_type, loja_id)
    AND public.user_has_role(ARRAY['master', 'director', 'finance', 'sales_manager', 'consultant', 'admin_mx'])
  )
  WITH CHECK (
    public.can_access_mx_scope('store'::public.score_scope_type, loja_id)
    AND public.user_has_role(ARRAY['master', 'director', 'finance', 'sales_manager', 'consultant', 'admin_mx'])
  );

-- ----------------------------------------------------------------------------
-- 3. Rules-based Consultor IA catalog
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.catalogo_regras_consultivas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code text NOT NULL UNIQUE CHECK (length(trim(rule_code)) > 0),
  active boolean NOT NULL DEFAULT true,
  source_indicator text NOT NULL CHECK (length(trim(source_indicator)) > 0),
  condition_json jsonb NOT NULL,
  severity text NOT NULL CHECK (severity = ANY (ARRAY['info', 'positivo', 'atencao', 'critico'])),
  message text NOT NULL CHECK (length(trim(message)) > 0),
  recommendation text NOT NULL CHECK (length(trim(recommendation)) > 0),
  suggested_action text NOT NULL CHECK (length(trim(suggested_action)) > 0),
  department_code text CHECK (
    department_code IS NULL OR department_code = ANY (ARRAY['comercial', 'marketing', 'produto', 'financeiro', 'rh', 'operacional'])
  ),
  target_role_codes text[] NOT NULL DEFAULT ARRAY['master', 'director', 'sales_manager', 'consultant', 'admin_mx']::text[],
  creates_action_suggestion boolean NOT NULL DEFAULT true,
  affects_score boolean NOT NULL DEFAULT false CHECK (affects_score = false),
  explanation_template text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalogo_regras_consultivas_active
  ON public.catalogo_regras_consultivas(active, severity);

CREATE INDEX IF NOT EXISTS idx_catalogo_regras_consultivas_indicator
  ON public.catalogo_regras_consultivas(source_indicator);

COMMENT ON TABLE public.catalogo_regras_consultivas IS
  'Catálogo determinístico do Consultor IA rules-based 2026. Regras recomendam ações e nunca alteram MX Score.';

DROP TRIGGER IF EXISTS trg_catalogo_regras_consultivas_touch ON public.catalogo_regras_consultivas;
CREATE TRIGGER trg_catalogo_regras_consultivas_touch
  BEFORE UPDATE ON public.catalogo_regras_consultivas
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_mx_executive_updated_at();

INSERT INTO public.catalogo_regras_consultivas (
  rule_code,
  source_indicator,
  condition_json,
  severity,
  message,
  recommendation,
  suggested_action,
  department_code,
  explanation_template
)
VALUES
  (
    'stock_over_90_days',
    'inventory_aging_days',
    '{"operator":"gt","value":90}'::jsonb,
    'critico',
    'Estoque acima de 90 dias exige decisão executiva.',
    'Revisar preço, margem, campanha e plano de giro por veículo.',
    'Criar plano de ação para reduzir estoque parado acima de 90 dias.',
    'produto',
    'Regra aplicada porque aging_days ultrapassou 90 dias; recomendação não altera o MX Score.'
  ),
  (
    'lead_to_schedule_below_benchmark',
    'lead_to_schedule_rate',
    '{"operator":"lt_benchmark"}'::jsonb,
    'critico',
    'Conversão de lead para agendamento abaixo do benchmark.',
    'Auditar tempo de resposta, origem dos leads e abordagem inicial.',
    'Criar devolutiva comercial e revisar rotina de primeiro contato.',
    'marketing',
    'Regra aplicada comparando conversão real com benchmark da loja.'
  ),
  (
    'routine_discipline_incomplete',
    'routine_discipline_rate',
    '{"operator":"lt","value":100}'::jsonb,
    'atencao',
    'Rotina diária incompleta prejudica leitura de performance.',
    'Cobrar fechamento diário antes de interpretar resultado.',
    'Acionar gerente responsável pela cadência de lançamentos.',
    'operacional',
    'Regra aplicada quando há vendedor sem lançamento no período.'
  ),
  (
    'mx_score_attention_band',
    'mx_score',
    '{"operator":"in","values":["attention","critical"]}'::jsonb,
    'atencao',
    'MX Score em faixa de atenção ou crítica.',
    'Identificar dimensão causadora e priorizar plano de ação.',
    'Abrir análise do score e registrar ação vinculada.',
    'comercial',
    'Regra aplicada sobre faixa do MX Score; consultor apenas recomenda, não altera nota.'
  )
ON CONFLICT (rule_code) DO UPDATE
SET source_indicator = EXCLUDED.source_indicator,
    condition_json = EXCLUDED.condition_json,
    severity = EXCLUDED.severity,
    message = EXCLUDED.message,
    recommendation = EXCLUDED.recommendation,
    suggested_action = EXCLUDED.suggested_action,
    department_code = EXCLUDED.department_code,
    explanation_template = EXCLUDED.explanation_template,
    affects_score = false,
    updated_at = now();

ALTER TABLE public.catalogo_regras_consultivas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catalogo_regras_consultivas_read ON public.catalogo_regras_consultivas;
CREATE POLICY catalogo_regras_consultivas_read
  ON public.catalogo_regras_consultivas
  FOR SELECT
  TO authenticated
  USING (
    active = true
    AND (
      public.eh_area_interna_mx(auth.uid())
      OR public.current_user_role_code() = ANY (target_role_codes)
    )
  );

DROP POLICY IF EXISTS catalogo_regras_consultivas_write ON public.catalogo_regras_consultivas;
CREATE POLICY catalogo_regras_consultivas_write
  ON public.catalogo_regras_consultivas
  FOR ALL
  TO authenticated
  USING (public.eh_administrador_mx(auth.uid()))
  WITH CHECK (public.eh_administrador_mx(auth.uid()) AND affects_score = false);

COMMIT;
