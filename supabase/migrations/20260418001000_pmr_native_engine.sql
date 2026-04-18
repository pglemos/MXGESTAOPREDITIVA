-- ============================================================
-- PMR Nativo - Modulos, Diagnosticos, Parametros, Metricas,
-- Planejamento Estrategico, Plano de Acao e Artefatos.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.consulting_clients
  ADD COLUMN IF NOT EXISTS program_template_key text NOT NULL DEFAULT 'pmr_7';

CREATE TABLE IF NOT EXISTS public.consulting_visit_programs (
  program_key text PRIMARY KEY,
  name text NOT NULL,
  total_visits integer NOT NULL DEFAULT 7,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consulting_visit_template_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_key text NOT NULL REFERENCES public.consulting_visit_programs(program_key) ON DELETE CASCADE,
  visit_number integer NOT NULL,
  objective text NOT NULL,
  target text,
  duration text,
  evidence_required text,
  checklist_template jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(program_key, visit_number)
);

CREATE TABLE IF NOT EXISTS public.consulting_client_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  premium boolean NOT NULL DEFAULT false,
  notes text,
  configured_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  configured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, module_key),
  CONSTRAINT consulting_client_modules_key_check CHECK (module_key = ANY (ARRAY[
    'diagnostics', 'strategic_plan', 'action_plan', 'dre', 'monthly_close', 'daily_tracking'
  ]))
);

CREATE TABLE IF NOT EXISTS public.consulting_pmr_form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_key text NOT NULL UNIQUE,
  title text NOT NULL,
  target_role text NOT NULL,
  visit_number integer NOT NULL DEFAULT 1,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consulting_pmr_form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES public.consulting_visits(id) ON DELETE SET NULL,
  template_id uuid NOT NULL REFERENCES public.consulting_pmr_form_templates(id) ON DELETE RESTRICT,
  respondent_name text,
  respondent_role text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary text,
  submitted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consulting_metric_catalog (
  metric_key text PRIMARY KEY,
  label text NOT NULL,
  direction text NOT NULL DEFAULT 'increase',
  value_type text NOT NULL DEFAULT 'number',
  area text NOT NULL,
  source_scope text NOT NULL DEFAULT 'manual',
  formula_key text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consulting_metric_direction_check CHECK (direction = ANY (ARRAY['increase', 'decrease'])),
  CONSTRAINT consulting_metric_type_check CHECK (value_type = ANY (ARRAY['number', 'percent', 'currency']))
);

CREATE TABLE IF NOT EXISTS public.consulting_parameter_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version text NOT NULL,
  active boolean NOT NULL DEFAULT false,
  source_reference text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS consulting_parameter_sets_active_unique
  ON public.consulting_parameter_sets (active)
  WHERE active = true;

CREATE TABLE IF NOT EXISTS public.consulting_parameter_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter_set_id uuid NOT NULL REFERENCES public.consulting_parameter_sets(id) ON DELETE CASCADE,
  metric_key text NOT NULL REFERENCES public.consulting_metric_catalog(metric_key) ON DELETE CASCADE,
  market_average numeric,
  best_practice numeric,
  target_default numeric,
  red_threshold numeric,
  yellow_threshold numeric,
  green_threshold numeric,
  formula jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parameter_set_id, metric_key)
);

CREATE TABLE IF NOT EXISTS public.consulting_client_metric_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
  metric_key text NOT NULL REFERENCES public.consulting_metric_catalog(metric_key) ON DELETE RESTRICT,
  reference_month date NOT NULL,
  target_value numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, metric_key, reference_month)
);

CREATE TABLE IF NOT EXISTS public.consulting_client_metric_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
  metric_key text NOT NULL REFERENCES public.consulting_metric_catalog(metric_key) ON DELETE RESTRICT,
  reference_date date NOT NULL,
  result_value numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual',
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, metric_key, reference_date, source)
);

CREATE TABLE IF NOT EXISTS public.consulting_client_metric_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
  reference_month date NOT NULL,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consulting_marketing_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
  reference_month date NOT NULL,
  media text NOT NULL,
  leads_volume numeric NOT NULL DEFAULT 0,
  sales_volume numeric NOT NULL DEFAULT 0,
  investment numeric NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, reference_month, media)
);

CREATE TABLE IF NOT EXISTS public.consulting_sales_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
  sale_date date NOT NULL,
  vehicle text,
  vehicle_year text,
  model text,
  purchase_value numeric DEFAULT 0,
  sale_value numeric DEFAULT 0,
  preparation_expenses numeric DEFAULT 0,
  margin numeric GENERATED ALWAYS AS (COALESCE(sale_value,0) - (COALESCE(purchase_value,0) + COALESCE(preparation_expenses,0))) STORED,
  channel text,
  media text,
  seller_name text,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consulting_inventory_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
  reference_month date NOT NULL,
  active_stock numeric DEFAULT 0,
  total_stock numeric DEFAULT 0,
  avg_price numeric DEFAULT 0,
  avg_km numeric DEFAULT 0,
  percent_over_90_days numeric DEFAULT 0,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, reference_month)
);

CREATE TABLE IF NOT EXISTS public.consulting_inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.consulting_inventory_snapshots(id) ON DELETE CASCADE,
  purchase_date date,
  vehicle text,
  vehicle_year text,
  model text,
  purchase_value numeric DEFAULT 0,
  preparation_expenses numeric DEFAULT 0,
  sale_price numeric DEFAULT 0,
  fipe_price numeric DEFAULT 0,
  km numeric DEFAULT 0,
  stock_days numeric DEFAULT 0,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consulting_strategic_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  period_start date,
  period_end date,
  status text NOT NULL DEFAULT 'draft',
  diagnosis_summary text,
  market_comparison jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consulting_action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
  strategic_plan_id uuid REFERENCES public.consulting_strategic_plans(id) ON DELETE SET NULL,
  metric_key text REFERENCES public.consulting_metric_catalog(metric_key) ON DELETE SET NULL,
  action text NOT NULL,
  how text,
  owner_name text,
  due_date date,
  completed_at date,
  status text NOT NULL DEFAULT 'nao_iniciado',
  efficacy text,
  priority integer NOT NULL DEFAULT 2,
  visit_number integer,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consulting_action_status_check CHECK (status = ANY (ARRAY['nao_iniciado', 'em_andamento', 'atrasado', 'realizado', 'cancelado'])),
  CONSTRAINT consulting_action_priority_check CHECK (priority BETWEEN 1 AND 3)
);

CREATE TABLE IF NOT EXISTS public.consulting_generated_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
  strategic_plan_id uuid REFERENCES public.consulting_strategic_plans(id) ON DELETE SET NULL,
  artifact_type text NOT NULL,
  title text NOT NULL,
  content_md text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  storage_path text,
  generated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consulting_client_modules_client_idx ON public.consulting_client_modules(client_id);
CREATE INDEX IF NOT EXISTS consulting_pmr_responses_client_idx ON public.consulting_pmr_form_responses(client_id);
CREATE INDEX IF NOT EXISTS consulting_metric_targets_client_month_idx ON public.consulting_client_metric_targets(client_id, reference_month);
CREATE INDEX IF NOT EXISTS consulting_metric_results_client_date_idx ON public.consulting_client_metric_results(client_id, reference_date);
CREATE INDEX IF NOT EXISTS consulting_marketing_client_month_idx ON public.consulting_marketing_monthly(client_id, reference_month);
CREATE INDEX IF NOT EXISTS consulting_sales_client_date_idx ON public.consulting_sales_entries(client_id, sale_date);
CREATE INDEX IF NOT EXISTS consulting_inventory_client_month_idx ON public.consulting_inventory_snapshots(client_id, reference_month);
CREATE INDEX IF NOT EXISTS consulting_strategic_client_idx ON public.consulting_strategic_plans(client_id);
CREATE INDEX IF NOT EXISTS consulting_action_client_status_idx ON public.consulting_action_items(client_id, status);
CREATE INDEX IF NOT EXISTS consulting_artifacts_client_idx ON public.consulting_generated_artifacts(client_id);

DROP TRIGGER IF EXISTS update_consulting_visit_programs_updated_at ON public.consulting_visit_programs;
CREATE TRIGGER update_consulting_visit_programs_updated_at BEFORE UPDATE ON public.consulting_visit_programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();
DROP TRIGGER IF EXISTS update_consulting_visit_template_steps_updated_at ON public.consulting_visit_template_steps;
CREATE TRIGGER update_consulting_visit_template_steps_updated_at BEFORE UPDATE ON public.consulting_visit_template_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();
DROP TRIGGER IF EXISTS update_consulting_client_modules_updated_at ON public.consulting_client_modules;
CREATE TRIGGER update_consulting_client_modules_updated_at BEFORE UPDATE ON public.consulting_client_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();
DROP TRIGGER IF EXISTS update_consulting_pmr_form_templates_updated_at ON public.consulting_pmr_form_templates;
CREATE TRIGGER update_consulting_pmr_form_templates_updated_at BEFORE UPDATE ON public.consulting_pmr_form_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();
DROP TRIGGER IF EXISTS update_consulting_pmr_form_responses_updated_at ON public.consulting_pmr_form_responses;
CREATE TRIGGER update_consulting_pmr_form_responses_updated_at BEFORE UPDATE ON public.consulting_pmr_form_responses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();
DROP TRIGGER IF EXISTS update_consulting_metric_catalog_updated_at ON public.consulting_metric_catalog;
CREATE TRIGGER update_consulting_metric_catalog_updated_at BEFORE UPDATE ON public.consulting_metric_catalog FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();
DROP TRIGGER IF EXISTS update_consulting_parameter_sets_updated_at ON public.consulting_parameter_sets;
CREATE TRIGGER update_consulting_parameter_sets_updated_at BEFORE UPDATE ON public.consulting_parameter_sets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();
DROP TRIGGER IF EXISTS update_consulting_parameter_values_updated_at ON public.consulting_parameter_values;
CREATE TRIGGER update_consulting_parameter_values_updated_at BEFORE UPDATE ON public.consulting_parameter_values FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();
DROP TRIGGER IF EXISTS update_consulting_metric_targets_updated_at ON public.consulting_client_metric_targets;
CREATE TRIGGER update_consulting_metric_targets_updated_at BEFORE UPDATE ON public.consulting_client_metric_targets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();
DROP TRIGGER IF EXISTS update_consulting_metric_results_updated_at ON public.consulting_client_metric_results;
CREATE TRIGGER update_consulting_metric_results_updated_at BEFORE UPDATE ON public.consulting_client_metric_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();
DROP TRIGGER IF EXISTS update_consulting_marketing_monthly_updated_at ON public.consulting_marketing_monthly;
CREATE TRIGGER update_consulting_marketing_monthly_updated_at BEFORE UPDATE ON public.consulting_marketing_monthly FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();
DROP TRIGGER IF EXISTS update_consulting_sales_entries_updated_at ON public.consulting_sales_entries;
CREATE TRIGGER update_consulting_sales_entries_updated_at BEFORE UPDATE ON public.consulting_sales_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();
DROP TRIGGER IF EXISTS update_consulting_inventory_snapshots_updated_at ON public.consulting_inventory_snapshots;
CREATE TRIGGER update_consulting_inventory_snapshots_updated_at BEFORE UPDATE ON public.consulting_inventory_snapshots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();
DROP TRIGGER IF EXISTS update_consulting_strategic_plans_updated_at ON public.consulting_strategic_plans;
CREATE TRIGGER update_consulting_strategic_plans_updated_at BEFORE UPDATE ON public.consulting_strategic_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();
DROP TRIGGER IF EXISTS update_consulting_action_items_updated_at ON public.consulting_action_items;
CREATE TRIGGER update_consulting_action_items_updated_at BEFORE UPDATE ON public.consulting_action_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

CREATE OR REPLACE FUNCTION public.consulting_client_module_enabled(p_client_id uuid, p_module_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.consulting_client_modules ccm
    WHERE ccm.client_id = p_client_id
      AND ccm.module_key = p_module_key
      AND ccm.enabled = true
  )
$$;

ALTER TABLE public.consulting_visit_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_visit_template_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_client_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_pmr_form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_pmr_form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_metric_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_parameter_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_parameter_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_client_metric_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_client_metric_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_client_metric_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_marketing_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_sales_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_inventory_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_strategic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_generated_artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consulting_visit_programs_select ON public.consulting_visit_programs;
CREATE POLICY consulting_visit_programs_select ON public.consulting_visit_programs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS consulting_visit_programs_write ON public.consulting_visit_programs;
CREATE POLICY consulting_visit_programs_write ON public.consulting_visit_programs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS consulting_visit_template_steps_select ON public.consulting_visit_template_steps;
CREATE POLICY consulting_visit_template_steps_select ON public.consulting_visit_template_steps FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS consulting_visit_template_steps_write ON public.consulting_visit_template_steps;
CREATE POLICY consulting_visit_template_steps_write ON public.consulting_visit_template_steps FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS consulting_client_modules_select ON public.consulting_client_modules;
CREATE POLICY consulting_client_modules_select ON public.consulting_client_modules FOR SELECT TO authenticated USING (public.can_access_consulting_client(client_id));
DROP POLICY IF EXISTS consulting_client_modules_write ON public.consulting_client_modules;
CREATE POLICY consulting_client_modules_write ON public.consulting_client_modules FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS consulting_pmr_form_templates_select ON public.consulting_pmr_form_templates;
CREATE POLICY consulting_pmr_form_templates_select ON public.consulting_pmr_form_templates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS consulting_pmr_form_templates_write ON public.consulting_pmr_form_templates;
CREATE POLICY consulting_pmr_form_templates_write ON public.consulting_pmr_form_templates FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS consulting_pmr_form_responses_select ON public.consulting_pmr_form_responses;
CREATE POLICY consulting_pmr_form_responses_select ON public.consulting_pmr_form_responses FOR SELECT TO authenticated USING (public.can_access_consulting_client(client_id));
DROP POLICY IF EXISTS consulting_pmr_form_responses_write ON public.consulting_pmr_form_responses;
CREATE POLICY consulting_pmr_form_responses_write ON public.consulting_pmr_form_responses FOR ALL TO authenticated USING (public.can_access_consulting_client(client_id)) WITH CHECK (public.can_access_consulting_client(client_id));

DROP POLICY IF EXISTS consulting_metric_catalog_select ON public.consulting_metric_catalog;
CREATE POLICY consulting_metric_catalog_select ON public.consulting_metric_catalog FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS consulting_metric_catalog_write ON public.consulting_metric_catalog;
CREATE POLICY consulting_metric_catalog_write ON public.consulting_metric_catalog FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS consulting_parameter_sets_select ON public.consulting_parameter_sets;
CREATE POLICY consulting_parameter_sets_select ON public.consulting_parameter_sets FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS consulting_parameter_sets_write ON public.consulting_parameter_sets;
CREATE POLICY consulting_parameter_sets_write ON public.consulting_parameter_sets FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS consulting_parameter_values_select ON public.consulting_parameter_values;
CREATE POLICY consulting_parameter_values_select ON public.consulting_parameter_values FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS consulting_parameter_values_write ON public.consulting_parameter_values;
CREATE POLICY consulting_parameter_values_write ON public.consulting_parameter_values FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS consulting_metric_targets_select ON public.consulting_client_metric_targets;
CREATE POLICY consulting_metric_targets_select ON public.consulting_client_metric_targets FOR SELECT TO authenticated USING (public.can_access_consulting_client(client_id));
DROP POLICY IF EXISTS consulting_metric_targets_write ON public.consulting_client_metric_targets;
CREATE POLICY consulting_metric_targets_write ON public.consulting_client_metric_targets FOR ALL TO authenticated USING (public.can_access_consulting_client(client_id)) WITH CHECK (public.can_access_consulting_client(client_id));

DROP POLICY IF EXISTS consulting_metric_results_select ON public.consulting_client_metric_results;
CREATE POLICY consulting_metric_results_select ON public.consulting_client_metric_results FOR SELECT TO authenticated USING (public.can_access_consulting_client(client_id));
DROP POLICY IF EXISTS consulting_metric_results_write ON public.consulting_client_metric_results;
CREATE POLICY consulting_metric_results_write ON public.consulting_client_metric_results FOR ALL TO authenticated USING (public.can_access_consulting_client(client_id)) WITH CHECK (public.can_access_consulting_client(client_id));

DROP POLICY IF EXISTS consulting_metric_snapshots_select ON public.consulting_client_metric_snapshots;
CREATE POLICY consulting_metric_snapshots_select ON public.consulting_client_metric_snapshots FOR SELECT TO authenticated USING (public.can_access_consulting_client(client_id));
DROP POLICY IF EXISTS consulting_metric_snapshots_write ON public.consulting_client_metric_snapshots;
CREATE POLICY consulting_metric_snapshots_write ON public.consulting_client_metric_snapshots FOR ALL TO authenticated USING (public.can_access_consulting_client(client_id)) WITH CHECK (public.can_access_consulting_client(client_id));

DROP POLICY IF EXISTS consulting_marketing_monthly_select ON public.consulting_marketing_monthly;
CREATE POLICY consulting_marketing_monthly_select ON public.consulting_marketing_monthly FOR SELECT TO authenticated USING (public.can_access_consulting_client(client_id));
DROP POLICY IF EXISTS consulting_marketing_monthly_write ON public.consulting_marketing_monthly;
CREATE POLICY consulting_marketing_monthly_write ON public.consulting_marketing_monthly FOR ALL TO authenticated USING (public.can_access_consulting_client(client_id)) WITH CHECK (public.can_access_consulting_client(client_id));

DROP POLICY IF EXISTS consulting_sales_entries_select ON public.consulting_sales_entries;
CREATE POLICY consulting_sales_entries_select ON public.consulting_sales_entries FOR SELECT TO authenticated USING (public.can_access_consulting_client(client_id));
DROP POLICY IF EXISTS consulting_sales_entries_write ON public.consulting_sales_entries;
CREATE POLICY consulting_sales_entries_write ON public.consulting_sales_entries FOR ALL TO authenticated USING (public.can_access_consulting_client(client_id)) WITH CHECK (public.can_access_consulting_client(client_id));

DROP POLICY IF EXISTS consulting_inventory_snapshots_select ON public.consulting_inventory_snapshots;
CREATE POLICY consulting_inventory_snapshots_select ON public.consulting_inventory_snapshots FOR SELECT TO authenticated USING (public.can_access_consulting_client(client_id));
DROP POLICY IF EXISTS consulting_inventory_snapshots_write ON public.consulting_inventory_snapshots;
CREATE POLICY consulting_inventory_snapshots_write ON public.consulting_inventory_snapshots FOR ALL TO authenticated USING (public.can_access_consulting_client(client_id)) WITH CHECK (public.can_access_consulting_client(client_id));

DROP POLICY IF EXISTS consulting_inventory_items_select ON public.consulting_inventory_items;
CREATE POLICY consulting_inventory_items_select ON public.consulting_inventory_items FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.consulting_inventory_snapshots s
    WHERE s.id = snapshot_id AND public.can_access_consulting_client(s.client_id)
  )
);
DROP POLICY IF EXISTS consulting_inventory_items_write ON public.consulting_inventory_items;
CREATE POLICY consulting_inventory_items_write ON public.consulting_inventory_items FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.consulting_inventory_snapshots s
    WHERE s.id = snapshot_id AND public.can_access_consulting_client(s.client_id)
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.consulting_inventory_snapshots s
    WHERE s.id = snapshot_id AND public.can_access_consulting_client(s.client_id)
  )
);

DROP POLICY IF EXISTS consulting_strategic_plans_select ON public.consulting_strategic_plans;
CREATE POLICY consulting_strategic_plans_select ON public.consulting_strategic_plans FOR SELECT TO authenticated USING (public.can_access_consulting_client(client_id));
DROP POLICY IF EXISTS consulting_strategic_plans_write ON public.consulting_strategic_plans;
CREATE POLICY consulting_strategic_plans_write ON public.consulting_strategic_plans FOR ALL TO authenticated USING (public.can_access_consulting_client(client_id)) WITH CHECK (public.can_access_consulting_client(client_id));

DROP POLICY IF EXISTS consulting_action_items_select ON public.consulting_action_items;
CREATE POLICY consulting_action_items_select ON public.consulting_action_items FOR SELECT TO authenticated USING (public.can_access_consulting_client(client_id));
DROP POLICY IF EXISTS consulting_action_items_write ON public.consulting_action_items;
CREATE POLICY consulting_action_items_write ON public.consulting_action_items FOR ALL TO authenticated USING (public.can_access_consulting_client(client_id)) WITH CHECK (public.can_access_consulting_client(client_id));

DROP POLICY IF EXISTS consulting_generated_artifacts_select ON public.consulting_generated_artifacts;
CREATE POLICY consulting_generated_artifacts_select ON public.consulting_generated_artifacts FOR SELECT TO authenticated USING (public.can_access_consulting_client(client_id));
DROP POLICY IF EXISTS consulting_generated_artifacts_write ON public.consulting_generated_artifacts;
CREATE POLICY consulting_generated_artifacts_write ON public.consulting_generated_artifacts FOR ALL TO authenticated USING (public.can_access_consulting_client(client_id)) WITH CHECK (public.can_access_consulting_client(client_id));

DROP POLICY IF EXISTS consulting_financials_select ON public.consulting_financials;
CREATE POLICY consulting_financials_select ON public.consulting_financials FOR SELECT TO authenticated USING (
  public.can_access_consulting_client(client_id)
  AND public.consulting_client_module_enabled(client_id, 'dre')
);

DROP POLICY IF EXISTS consulting_financials_write ON public.consulting_financials;
CREATE POLICY consulting_financials_write ON public.consulting_financials FOR ALL TO authenticated USING (
  public.is_admin() AND public.consulting_client_module_enabled(client_id, 'dre')
) WITH CHECK (
  public.is_admin() AND public.consulting_client_module_enabled(client_id, 'dre')
);

INSERT INTO public.consulting_visit_programs (program_key, name, total_visits)
VALUES
  ('pmr_7', 'PMR - 7 Visitas', 7),
  ('pmr_9', 'PMR - 9 Visitas + Acompanhamento', 9)
ON CONFLICT (program_key) DO UPDATE SET
  name = EXCLUDED.name,
  total_visits = EXCLUDED.total_visits,
  active = true;

INSERT INTO public.consulting_visit_template_steps (program_key, visit_number, objective, target, duration, evidence_required, checklist_template)
VALUES
  ('pmr_7', 1, 'Diagnostico', 'Todos', '1 dia', 'Formularios de dono, gerente, vendedor e processos preenchidos', '["Preencher formularios nativos","Levantar indicadores base","Anexar evidencias"]'::jsonb),
  ('pmr_7', 2, 'Planejamento Estrategico, metodologia multicanal e gestao a vista', 'Todos', '1 dia', 'Planejamento validado no sistema', '["Apresentar planejamento","Validar metas","Implantar acompanhamento diario"]'::jsonb),
  ('pmr_7', 3, 'Rotina do gerente e rotina do vendedor', 'Todos', '3 horas', 'Rotinas registradas e comunicadas', '["Implementar rotina do gerente","Implementar rotina do vendedor","Registrar evidencias"]'::jsonb),
  ('pmr_7', 4, 'Feedback estruturado e cultura de resultado', 'Proprietario e gerente', '3 horas', 'Feedbacks registrados', '["Realizar feedback por dados","Registrar combinados","Atualizar plano de acao"]'::jsonb),
  ('pmr_7', 5, 'Posicionamento de marketing, conteudo e trafego pago', 'Marketing e gestao', '3 horas', 'Plano de marketing registrado', '["Revisar canais","Definir padrao de conteudo","Registrar acoes"]'::jsonb),
  ('pmr_7', 6, 'Plano de Desenvolvimento Individual', 'Vendas e gestao', '3 horas', 'PDIs no sistema', '["Mapear gaps","Criar PDIs","Definir responsaveis"]'::jsonb),
  ('pmr_7', 7, 'Analise de implementacoes e plano trimestral', 'Todos', '3 horas', 'Relatorio final e novo plano aprovado', '["Revisar resultados","Atualizar plano de acao","Gerar resumo executivo"]'::jsonb),
  ('pmr_9', 1, 'Diagnostico', 'Todos', '1 dia', 'Formularios de dono, gerente, vendedor e processos preenchidos', '["Preencher formularios nativos","Levantar indicadores base","Anexar evidencias"]'::jsonb),
  ('pmr_9', 2, 'Planejamento Estrategico, metodologia multicanal e gestao a vista', 'Todos', '1 dia', 'Planejamento validado no sistema', '["Apresentar planejamento","Validar metas","Implantar acompanhamento diario"]'::jsonb),
  ('pmr_9', 3, 'Rotina do gerente e rotina do vendedor', 'Todos', '3 horas', 'Rotinas registradas e comunicadas', '["Implementar rotina do gerente","Implementar rotina do vendedor"]'::jsonb),
  ('pmr_9', 4, 'Feedback estruturado e cultura de resultado', 'Proprietario e gerente', '3 horas', 'Feedbacks registrados', '["Feedback por vendedor","Ranking comunicado"]'::jsonb),
  ('pmr_9', 5, 'Posicionamento de marketing, conteudo e trafego pago', 'Marketing', '3 horas', 'Plano de marketing registrado', '["Revisar trafego","Revisar conteudo","Registrar acoes"]'::jsonb),
  ('pmr_9', 6, 'Revisao dos processos criticos', 'Gestao', '3 horas', 'Processos criticos revisados', '["Revisar preparacao","Revisar pos-venda","Revisar precificacao"]'::jsonb),
  ('pmr_9', 7, 'Plano de Desenvolvimento Individual', 'Vendas e gestao', '3 horas', 'PDIs no sistema', '["Criar PDIs","Registrar acoes"]'::jsonb),
  ('pmr_9', 8, 'Avaliacao individual nos treinamentos', 'Vendas', '3 horas', 'Avaliacoes registradas', '["Avaliar treinamentos","Registrar gaps"]'::jsonb),
  ('pmr_9', 9, 'Analise das implementacoes e plano trimestral', 'Todos', '3 horas', 'Relatorio final e novo plano aprovado', '["Revisar resultados","Gerar resumo executivo","Atualizar plano de acao"]'::jsonb)
ON CONFLICT (program_key, visit_number) DO UPDATE SET
  objective = EXCLUDED.objective,
  target = EXCLUDED.target,
  duration = EXCLUDED.duration,
  evidence_required = EXCLUDED.evidence_required,
  checklist_template = EXCLUDED.checklist_template,
  active = true;

INSERT INTO public.consulting_pmr_form_templates (form_key, title, target_role, fields)
VALUES
  ('owner', 'Diagnostico - Dono/Socio', 'dono', '[
    {"key":"strategic_goal","label":"Meta estrategica da empresa","type":"textarea"},
    {"key":"owner_dependency","label":"Quanto a operacao depende do dono?","type":"scale"},
    {"key":"governance_gaps","label":"Principais gargalos de governanca","type":"textarea"},
    {"key":"investment_blockers","label":"Travamentos de investimento/decisao","type":"textarea"}
  ]'::jsonb),
  ('manager', 'Diagnostico - Gerente', 'gerente', '[
    {"key":"clear_goals","label":"Metas claras para a equipe","type":"scale"},
    {"key":"lead_followup","label":"Acompanhamento de leads","type":"scale"},
    {"key":"routine","label":"Rotina gerencial estruturada","type":"scale"},
    {"key":"autonomy","label":"Autonomia de preco/decisao","type":"scale"}
  ]'::jsonb),
  ('seller', 'Diagnostico - Vendedor', 'vendedor', '[
    {"key":"daily_routine","label":"Rotina comercial diaria","type":"scale"},
    {"key":"crm_usage","label":"Uso correto do CRM","type":"scale"},
    {"key":"followup_cadence","label":"Cadencia de follow-up","type":"scale"},
    {"key":"main_blocker","label":"Principal limitador de vendas","type":"textarea"}
  ]'::jsonb),
  ('process', 'Diagnostico - Processos', 'processo', '[
    {"key":"online_process","label":"Processo de atendimento online","type":"scale"},
    {"key":"in_person_process","label":"Processo de atendimento presencial","type":"scale"},
    {"key":"vehicle_preparation","label":"Preparacao de veiculos","type":"scale"},
    {"key":"post_sale","label":"Pos-venda estruturado","type":"scale"}
  ]'::jsonb)
ON CONFLICT (form_key) DO UPDATE SET
  title = EXCLUDED.title,
  target_role = EXCLUDED.target_role,
  fields = EXCLUDED.fields,
  active = true;

INSERT INTO public.consulting_metric_catalog (metric_key, label, direction, value_type, area, source_scope, formula_key, sort_order)
VALUES
  ('sales_total', 'Vendas Total', 'increase', 'number', 'Vendas', 'sales', 'sum_sales_channels', 10),
  ('sales_door_flow', 'Vendas - Fluxo de Porta', 'increase', 'number', 'Vendas', 'sales', null, 20),
  ('sales_referral', 'Vendas - Indicacao', 'increase', 'number', 'Vendas', 'sales', null, 30),
  ('sales_company_wallet', 'Vendas - Carteira Empresa', 'increase', 'number', 'Vendas', 'sales', null, 40),
  ('sales_seller_wallet', 'Vendas - Carteira Vendedor', 'increase', 'number', 'Vendas', 'sales', null, 50),
  ('sales_internet', 'Vendas - Internet', 'increase', 'number', 'Vendas', 'sales', null, 60),
  ('sales_other', 'Vendas - Outros', 'increase', 'number', 'Vendas', 'sales', null, 70),
  ('seller_count', 'Volume de Vendedores', 'increase', 'number', 'Vendas', 'manual', null, 80),
  ('avg_sales_per_seller', 'Media de vendas por vendedor', 'increase', 'number', 'Vendas', 'computed', 'sales_total/seller_count', 90),
  ('leads_received', 'Volume de leads recebidos', 'increase', 'number', 'Marketing', 'marketing', null, 100),
  ('avg_leads_per_seller', 'Media de leads por vendedor', 'increase', 'number', 'Vendas', 'computed', 'leads_received/seller_count', 110),
  ('appointments', 'Volume de agendamentos', 'increase', 'number', 'Vendas', 'daily_tracking', null, 120),
  ('visits', 'Volume de visitas', 'increase', 'number', 'Vendas', 'daily_tracking', null, 130),
  ('appointments_per_sale', 'Volume de agendamentos por venda', 'decrease', 'number', 'Vendas', 'computed', 'appointments/sales_internet', 140),
  ('lead_to_appointment_rate', 'Conversao de leads em agendamentos', 'increase', 'percent', 'Vendas', 'computed', 'appointments/leads_received', 150),
  ('appointment_to_visit_rate', 'Conversao de agendamentos em visitas', 'increase', 'percent', 'Vendas', 'computed', 'visits/appointments', 160),
  ('visit_to_sale_rate', 'Conversao de visitas em vendas', 'increase', 'percent', 'Vendas', 'computed', 'sales_internet/visits', 170),
  ('internet_investment', 'Investimento Internet', 'decrease', 'currency', 'Marketing', 'marketing', null, 180),
  ('internet_cost_per_sale', 'Custo por venda na internet', 'decrease', 'currency', 'Marketing', 'computed', 'internet_investment/sales_internet', 190),
  ('instagram_followers', 'Volume de seguidores Instagram', 'increase', 'number', 'Marketing', 'manual', null, 200),
  ('google_rating', 'Avaliacao Google Meu Negocio', 'increase', 'number', 'Marketing', 'manual', null, 210),
  ('content_quality', 'Qualidade do conteudo', 'increase', 'number', 'Marketing', 'diagnostic', null, 220),
  ('stock_turnover', 'Giro de Estoque', 'increase', 'number', 'Estoque', 'computed', 'sales_total/stock_total', 230),
  ('active_stock', 'Estoque Ativo', 'increase', 'number', 'Estoque', 'inventory', null, 240),
  ('stock_total', 'Estoque Total', 'increase', 'number', 'Estoque', 'inventory', null, 250),
  ('stock_over_90_rate', 'Tempo de Estoque +90', 'decrease', 'percent', 'Estoque', 'inventory', null, 260),
  ('net_profit', 'Lucro Liquido', 'increase', 'currency', 'Gestao', 'dre', null, 270),
  ('avg_margin', 'Margem Media', 'increase', 'currency', 'Gestao', 'dre', null, 280),
  ('preparation_cost', 'Custo preparacao', 'decrease', 'currency', 'Gestao', 'dre', null, 290),
  ('post_sale_cost', 'Custo Pos-Venda', 'decrease', 'currency', 'Gestao', 'dre', null, 300)
ON CONFLICT (metric_key) DO UPDATE SET
  label = EXCLUDED.label,
  direction = EXCLUDED.direction,
  value_type = EXCLUDED.value_type,
  area = EXCLUDED.area,
  source_scope = EXCLUDED.source_scope,
  formula_key = EXCLUDED.formula_key,
  sort_order = EXCLUDED.sort_order,
  active = true;

UPDATE public.consulting_parameter_sets
SET active = false, updated_at = now()
WHERE active = true
  AND (name, version) <> ('PMR Base MX', '2026.04');

WITH set_row AS (
  INSERT INTO public.consulting_parameter_sets (name, version, active, source_reference)
  VALUES ('PMR Base MX', '2026.04', true, 'Reuniao 2026-04-17 + planilhas PMR')
  ON CONFLICT (name, version) DO UPDATE SET active = true, source_reference = EXCLUDED.source_reference
  RETURNING id
)
INSERT INTO public.consulting_parameter_values (parameter_set_id, metric_key, market_average, best_practice, target_default, red_threshold, yellow_threshold, green_threshold, formula, notes)
SELECT set_row.id, v.metric_key, v.market_average, v.best_practice, v.target_default, v.red_threshold, v.yellow_threshold, v.green_threshold, v.formula, v.notes
FROM set_row
CROSS JOIN (VALUES
  ('lead_to_appointment_rate', 0.20::numeric, 0.30::numeric, 0.20::numeric, 0.10::numeric, 0.20::numeric, 0.30::numeric, '{"from":"appointments/leads_received"}'::jsonb, 'Parametro citado na reuniao: 20% dos leads viram agendamento.'),
  ('appointment_to_visit_rate', 0.60::numeric, 0.70::numeric, 0.60::numeric, 0.40::numeric, 0.60::numeric, 0.70::numeric, '{"from":"visits/appointments"}'::jsonb, 'Parametro citado na reuniao: 60% dos agendamentos comparecem.'),
  ('visit_to_sale_rate', 0.33::numeric, 0.40::numeric, 0.33::numeric, 0.20::numeric, 0.33::numeric, 0.40::numeric, '{"from":"sales_internet/visits"}'::jsonb, 'Parametro citado na reuniao: 33% dos comparecimentos viram venda.'),
  ('internet_cost_per_sale', 940.00::numeric, 650.00::numeric, 650.00::numeric, 1200.00::numeric, 940.00::numeric, 650.00::numeric, '{"from":"internet_investment/sales_internet"}'::jsonb, 'Valor default derivado da planilha de metas.'),
  ('stock_turnover', 0.45::numeric, 0.65::numeric, 0.70::numeric, 0.30::numeric, 0.45::numeric, 0.65::numeric, '{"from":"sales_total/stock_total"}'::jsonb, 'Deck GED usa mercado 0,45 e boa pratica 0,65.'),
  ('stock_over_90_rate', 0.26::numeric, 0.15::numeric, 0.15::numeric, 0.36::numeric, 0.26::numeric, 0.15::numeric, '{"from":"inventory.percent_over_90_days"}'::jsonb, 'Decks PMR usam 26% mercado e 15% boa pratica.'),
  ('avg_sales_per_seller', 6.70::numeric, 8.00::numeric, 7.00::numeric, 4.00::numeric, 6.70::numeric, 8.00::numeric, '{"from":"sales_total/seller_count"}'::jsonb, 'Comparativo de mercado dos decks PMR.'),
  ('leads_received', 480.00::numeric, 820.00::numeric, 720.00::numeric, 300.00::numeric, 480.00::numeric, 820.00::numeric, '{"from":"marketing.leads_volume"}'::jsonb, 'Deck GED usa 480 mercado e 820 boa pratica.'),
  ('avg_margin', 7000.00::numeric, 8500.00::numeric, 8500.00::numeric, 6500.00::numeric, 7000.00::numeric, 8500.00::numeric, '{"from":"dre.margin"}'::jsonb, 'Planilha de cenarios usa margem media 6800-8500.'),
  ('preparation_cost', 2700.00::numeric, 2400.00::numeric, 2400.00::numeric, 3200.00::numeric, 2700.00::numeric, 2400.00::numeric, '{"from":"dre.preparation_cost"}'::jsonb, 'Comparativo de custo/preparacao usado no PMR.')
) AS v(metric_key, market_average, best_practice, target_default, red_threshold, yellow_threshold, green_threshold, formula, notes)
ON CONFLICT (parameter_set_id, metric_key) DO UPDATE SET
  market_average = EXCLUDED.market_average,
  best_practice = EXCLUDED.best_practice,
  target_default = EXCLUDED.target_default,
  red_threshold = EXCLUDED.red_threshold,
  yellow_threshold = EXCLUDED.yellow_threshold,
  green_threshold = EXCLUDED.green_threshold,
  formula = EXCLUDED.formula,
  notes = EXCLUDED.notes;

INSERT INTO public.consulting_client_modules (client_id, module_key, label, enabled, premium)
SELECT c.id, m.module_key, m.label, m.enabled, m.premium
FROM public.consulting_clients c
CROSS JOIN (VALUES
  ('diagnostics', 'Diagnostico PMR', true, false),
  ('strategic_plan', 'Planejamento Estrategico', true, false),
  ('action_plan', 'Plano de Acao', true, false),
  ('monthly_close', 'Fechamento Mensal', true, false),
  ('daily_tracking', 'Acompanhamento Diario', true, false),
  ('dre', 'DRE Financeiro', true, true)
) AS m(module_key, label, enabled, premium)
ON CONFLICT (client_id, module_key) DO NOTHING;
