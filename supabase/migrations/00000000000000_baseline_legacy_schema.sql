-- ============================================================
-- BASELINE MIGRATION: Complete Public Schema
-- Generated: 2026-04-15
-- Purpose: Single source of truth for supabase db reset
-- Tables: 58 base tables, 4 views, 36 functions, 2 enums
-- ============================================================

-- ============================================================
-- Section 1: ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.checkin_scope AS ENUM ('daily', 'adjustment', 'historical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.correction_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- Section 2: TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agencies (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name text NOT NULL,
  plan text DEFAULT 'free'::text,
  logo_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  details_json jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_configs (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  agency_id uuid,
  report_type text NOT NULL,
  is_enabled boolean DEFAULT true,
  schedule_cron text DEFAULT '0 8 * * *'::text NOT NULL,
  recipients jsonb DEFAULT '[]'::jsonb,
  ai_context text,
  time_to_trigger time DEFAULT '18:00:00'::time without time zone,
  target_roles text[] DEFAULT '{Manager,Owner}'::text[],
  custom_message text,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.benchmarks (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  store_id uuid NOT NULL,
  lead_to_appt numeric(5,2) DEFAULT 20.0,
  appt_to_visit numeric(5,2) DEFAULT 60.0,
  visit_to_sale numeric(5,2) DEFAULT 33.0
);

CREATE TABLE IF NOT EXISTS public.checkin_audit_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  checkin_id uuid NOT NULL,
  correction_request_id uuid,
  changed_by uuid NOT NULL,
  old_values jsonb NOT NULL,
  new_values jsonb NOT NULL,
  change_type text DEFAULT 'manual_correction'::text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.checkin_correction_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  checkin_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  store_id uuid NOT NULL,
  requested_values jsonb NOT NULL,
  reason text NOT NULL,
  status correction_status DEFAULT 'pending'::correction_status NOT NULL,
  auditor_id uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.communication_instances (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  agency_id uuid,
  name text NOT NULL,
  provider text DEFAULT 'evolution_api'::text,
  status text DEFAULT 'disconnected'::text,
  api_url text,
  api_key text,
  instance_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consulting_assignments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  client_id uuid NOT NULL,
  user_id uuid NOT NULL,
  assignment_role text DEFAULT 'responsavel'::text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.consulting_calendar_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  client_id uuid,
  user_id uuid NOT NULL,
  google_calendar_id text DEFAULT 'primary'::text NOT NULL,
  sync_active boolean DEFAULT true NOT NULL,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.consulting_client_contacts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  client_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  role text,
  is_primary boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.consulting_client_units (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  client_id uuid NOT NULL,
  name text NOT NULL,
  city text,
  state text,
  is_primary boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.consulting_clients (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  legal_name text,
  cnpj text,
  product_name text,
  status text DEFAULT 'ativo'::text NOT NULL,
  notes text,
  primary_store_id uuid,
  created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  current_visit_step integer DEFAULT 0,
  modality text DEFAULT 'Presencial'::text
);

CREATE TABLE IF NOT EXISTS public.consulting_financials (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  client_id uuid NOT NULL,
  reference_date date NOT NULL,
  revenue numeric DEFAULT 0,
  fixed_expenses numeric DEFAULT 0,
  marketing_expenses numeric DEFAULT 0,
  investments numeric DEFAULT 0,
  financing numeric DEFAULT 0,
  net_profit numeric DEFAULT 0,
  roi numeric DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.consulting_google_oauth_states (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  client_id uuid,
  state text NOT NULL,
  redirect_uri text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.consulting_methodology_steps (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  visit_number integer NOT NULL,
  objective text NOT NULL,
  target text,
  duration text,
  evidence_required text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.consulting_oauth_tokens (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  provider text DEFAULT 'google'::text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  scopes text[],
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.consulting_visits (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  client_id uuid NOT NULL,
  visit_number integer NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_hours numeric DEFAULT 3,
  modality text DEFAULT 'Presencial'::text NOT NULL,
  status text DEFAULT 'agendada'::text NOT NULL,
  consultant_id uuid,
  auxiliary_consultant_id uuid,
  objective text,
  checklist_data jsonb DEFAULT '[]'::jsonb,
  feedback_client text,
  executive_summary text,
  google_event_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid NOT NULL,
  store_id uuid NOT NULL,
  date date DEFAULT CURRENT_DATE NOT NULL,
  leads integer DEFAULT 0 NOT NULL,
  agd_cart integer DEFAULT 0 NOT NULL,
  agd_net integer DEFAULT 0 NOT NULL,
  vnd_porta integer DEFAULT 0 NOT NULL,
  vnd_cart integer DEFAULT 0 NOT NULL,
  vnd_net integer DEFAULT 0 NOT NULL,
  visitas integer DEFAULT 0 NOT NULL,
  note text,
  zero_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  seller_user_id uuid NOT NULL,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  reference_date date DEFAULT CURRENT_DATE NOT NULL,
  metric_scope checkin_scope DEFAULT 'daily'::checkin_scope NOT NULL,
  leads_prev_day integer DEFAULT 0 NOT NULL,
  agd_cart_prev_day integer DEFAULT 0 NOT NULL,
  agd_net_prev_day integer DEFAULT 0 NOT NULL,
  agd_cart_today integer DEFAULT 0 NOT NULL,
  agd_net_today integer DEFAULT 0 NOT NULL,
  vnd_porta_prev_day integer DEFAULT 0 NOT NULL,
  vnd_cart_prev_day integer DEFAULT 0 NOT NULL,
  vnd_net_prev_day integer DEFAULT 0 NOT NULL,
  visit_prev_day integer DEFAULT 0 NOT NULL,
  created_by uuid,
  submitted_late boolean DEFAULT false NOT NULL,
  submission_status text DEFAULT 'on_time'::text NOT NULL,
  edit_locked_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.daily_lead_volumes (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  seller_id uuid,
  date date DEFAULT CURRENT_DATE NOT NULL,
  volume integer DEFAULT 0,
  agency_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.digital_products (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name text NOT NULL,
  description text,
  link text NOT NULL,
  target_store_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feedbacks (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  store_id uuid NOT NULL,
  manager_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  positives text NOT NULL,
  attention_points text NOT NULL,
  action text NOT NULL,
  notes text,
  acknowledged boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  week_reference date NOT NULL,
  leads_week integer DEFAULT 0 NOT NULL,
  agd_week integer DEFAULT 0 NOT NULL,
  visit_week integer DEFAULT 0 NOT NULL,
  vnd_week integer DEFAULT 0 NOT NULL,
  tx_lead_agd numeric DEFAULT 0 NOT NULL,
  tx_agd_visita numeric DEFAULT 0 NOT NULL,
  tx_visita_vnd numeric DEFAULT 0 NOT NULL,
  meta_compromisso integer DEFAULT 0 NOT NULL,
  team_avg_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  diagnostic_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  commitment_suggested integer DEFAULT 0 NOT NULL,
  acknowledged_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.goal_logs (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  goal_id uuid NOT NULL,
  changed_by uuid NOT NULL,
  prev_value integer,
  new_value integer NOT NULL,
  changed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goals (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  store_id uuid NOT NULL,
  user_id uuid,
  month integer NOT NULL,
  year integer NOT NULL,
  target integer NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  model text NOT NULL,
  year integer DEFAULT 2024 NOT NULL,
  price numeric(12,2) DEFAULT 0,
  agency_id uuid,
  aging_days integer DEFAULT 0,
  plate text,
  status text DEFAULT 'Disponível'::text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.manager_routine_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  manager_id uuid NOT NULL,
  routine_date date NOT NULL,
  reference_date date NOT NULL,
  checkins_pending_count integer DEFAULT 0 NOT NULL,
  sem_registro_count integer DEFAULT 0 NOT NULL,
  agd_cart_today integer DEFAULT 0 NOT NULL,
  agd_net_today integer DEFAULT 0 NOT NULL,
  previous_day_leads integer DEFAULT 0 NOT NULL,
  previous_day_sales integer DEFAULT 0 NOT NULL,
  ranking_snapshot jsonb DEFAULT '[]'::jsonb NOT NULL,
  notes text,
  status text DEFAULT 'completed'::text NOT NULL,
  executed_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid NOT NULL,
  store_id uuid NOT NULL,
  role text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_reads (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  notification_id uuid NOT NULL,
  user_id uuid NOT NULL,
  read_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  sender_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  target_type text NOT NULL,
  target_store_id uuid,
  target_role text,
  sent_at timestamptz DEFAULT now(),
  recipient_id uuid,
  store_id uuid,
  type text DEFAULT 'system'::text NOT NULL,
  priority text DEFAULT 'medium'::text NOT NULL,
  link text,
  read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  broadcast_id uuid
);

CREATE TABLE IF NOT EXISTS public.pdi_acoes_sugeridas (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  competencia_id uuid NOT NULL,
  descricao_acao text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pdi_avaliacoes_competencia (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  sessao_id uuid NOT NULL,
  competencia_id uuid NOT NULL,
  nota_atribuida integer NOT NULL,
  alvo integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pdi_competencias (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nome character varying(255) NOT NULL,
  tipo character varying(50) NOT NULL,
  descricao_completa text NOT NULL,
  indicador character varying(255) NOT NULL,
  ordem integer NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pdi_descritores_escala (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nivel_cargo_id uuid NOT NULL,
  nota integer NOT NULL,
  descritor character varying(255) NOT NULL,
  ordem integer NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pdi_frases_inspiracionais (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  texto text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pdi_metas (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  sessao_id uuid NOT NULL,
  prazo character varying(50) NOT NULL,
  tipo character varying(50) NOT NULL,
  descricao text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pdi_niveis_cargo (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nivel integer NOT NULL,
  nome character varying(255) NOT NULL,
  nota_min integer NOT NULL,
  nota_max integer NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pdi_objetivos_pessoais (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  sessao_id uuid NOT NULL,
  caracteristica character varying(255) NOT NULL,
  itens_desenvolver text NOT NULL,
  acao text NOT NULL,
  data_conclusao date NOT NULL,
  status character varying(50) DEFAULT 'pendente'::character varying NOT NULL,
  evidencia_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pdi_plano_acao (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  sessao_id uuid NOT NULL,
  competencia_id uuid NOT NULL,
  descricao_acao text NOT NULL,
  data_conclusao date NOT NULL,
  impacto character varying(50) NOT NULL,
  custo character varying(50) NOT NULL,
  status character varying(50) DEFAULT 'pendente'::character varying NOT NULL,
  evidencia_url text,
  aprovado_por uuid,
  data_aprovacao timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pdi_reviews (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  pdi_id uuid NOT NULL,
  evolution text NOT NULL,
  difficulties text,
  adjustments text,
  next_review_date date,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pdi_sessoes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  colaborador_id uuid NOT NULL,
  gerente_id uuid NOT NULL,
  loja_id uuid,
  data_realizacao timestamptz DEFAULT now(),
  proxima_revisao_data timestamptz,
  status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pdis (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  store_id uuid NOT NULL,
  manager_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  objective text,
  action text,
  due_date date,
  status text DEFAULT 'aberto'::text NOT NULL,
  acknowledged boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  meta_6m text,
  meta_12m text,
  meta_24m text,
  comp_prospeccao integer DEFAULT 6,
  comp_abordagem integer DEFAULT 6,
  comp_demonstracao integer DEFAULT 6,
  comp_fechamento integer DEFAULT 6,
  comp_crm integer DEFAULT 6,
  comp_digital integer DEFAULT 6,
  comp_disciplina integer DEFAULT 6,
  comp_organizacao integer DEFAULT 6,
  comp_negociacao integer DEFAULT 6,
  comp_produto integer DEFAULT 6,
  action_1 text,
  action_2 text,
  action_3 text,
  action_4 text,
  action_5 text
);

CREATE TABLE IF NOT EXISTS public.raw_imports (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  log_id uuid NOT NULL,
  raw_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.report_history (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  config_id uuid,
  report_type text NOT NULL,
  data_snapshot jsonb,
  ai_insight text,
  delivery_status jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reprocess_logs (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  store_id uuid,
  source_type text NOT NULL,
  triggered_by uuid,
  status text DEFAULT 'pending'::text NOT NULL,
  rows_processed integer DEFAULT 0 NOT NULL,
  records_processed integer DEFAULT 0 NOT NULL,
  records_failed integer DEFAULT 0 NOT NULL,
  warnings jsonb DEFAULT '[]'::jsonb NOT NULL,
  errors jsonb DEFAULT '[]'::jsonb NOT NULL,
  error_log jsonb DEFAULT '[]'::jsonb NOT NULL,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  file_hash text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_assignments_audit (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  role_name text NOT NULL,
  assigned_by uuid,
  assigned_at timestamptz DEFAULT now(),
  action text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_benchmarks (
  store_id uuid NOT NULL,
  lead_to_agend numeric(5,2) DEFAULT 20.00 NOT NULL,
  agend_to_visit numeric(5,2) DEFAULT 60.00 NOT NULL,
  visit_to_sale numeric(5,2) DEFAULT 33.00 NOT NULL,
  updated_by uuid,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_delivery_rules (
  store_id uuid NOT NULL,
  matinal_recipients text[] DEFAULT '{}'::text[] NOT NULL,
  weekly_recipients text[] DEFAULT '{}'::text[] NOT NULL,
  monthly_recipients text[] DEFAULT '{}'::text[] NOT NULL,
  whatsapp_group_ref text,
  timezone text DEFAULT 'America/Sao_Paulo'::text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  updated_by uuid,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_meta_rules (
  store_id uuid NOT NULL,
  monthly_goal numeric(12,2) DEFAULT 0 NOT NULL,
  individual_goal_mode text DEFAULT 'even'::text NOT NULL,
  include_venda_loja_in_store_total boolean DEFAULT true NOT NULL,
  include_venda_loja_in_individual_goal boolean DEFAULT false NOT NULL,
  bench_lead_agd integer DEFAULT 20 NOT NULL,
  bench_agd_visita integer DEFAULT 60 NOT NULL,
  bench_visita_vnd integer DEFAULT 33 NOT NULL,
  updated_by uuid,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_meta_rules_history (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  store_id uuid,
  changed_by uuid,
  old_values jsonb,
  new_values jsonb,
  changed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_sellers (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  store_id uuid NOT NULL,
  seller_user_id uuid NOT NULL,
  started_at date DEFAULT CURRENT_DATE NOT NULL,
  ended_at date,
  is_active boolean DEFAULT true NOT NULL,
  closing_month_grace boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stores (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name text NOT NULL,
  manager_email text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  source_mode text DEFAULT 'native_app'::text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_progress (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid NOT NULL,
  training_id uuid NOT NULL,
  watched_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trainings (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL,
  video_url text NOT NULL,
  target_audience text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  assigned_by uuid,
  assigned_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  role text DEFAULT 'vendedor'::text NOT NULL,
  avatar_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  is_venda_loja boolean DEFAULT false,
  phone text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.weekly_feedback_reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  team_avg_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  ranking_json jsonb DEFAULT '[]'::jsonb NOT NULL,
  benchmark_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  weekly_goal integer DEFAULT 0 NOT NULL,
  report_url text,
  email_status text DEFAULT 'not_sent'::text NOT NULL,
  recipients text[] DEFAULT '{}'::text[] NOT NULL,
  warnings text[] DEFAULT '{}'::text[] NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.whatsapp_share_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reference_date date NOT NULL,
  source text DEFAULT 'morning_report'::text NOT NULL,
  message_text text NOT NULL,
  shared_via text DEFAULT 'whatsapp'::text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);


-- ============================================================
-- Section 3: PRIMARY KEYS
-- ============================================================

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.agencies ADD CONSTRAINT agencies_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.audit_logs ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.automation_configs ADD CONSTRAINT automation_configs_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.benchmarks ADD CONSTRAINT benchmarks_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.checkin_audit_logs ADD CONSTRAINT checkin_audit_logs_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.checkin_correction_requests ADD CONSTRAINT checkin_correction_requests_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.communication_instances ADD CONSTRAINT communication_instances_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_assignments ADD CONSTRAINT consulting_assignments_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_calendar_settings ADD CONSTRAINT consulting_calendar_settings_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_client_contacts ADD CONSTRAINT consulting_client_contacts_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_client_units ADD CONSTRAINT consulting_client_units_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_clients ADD CONSTRAINT consulting_clients_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_financials ADD CONSTRAINT consulting_financials_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_google_oauth_states ADD CONSTRAINT consulting_google_oauth_states_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_methodology_steps ADD CONSTRAINT consulting_methodology_steps_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_oauth_tokens ADD CONSTRAINT consulting_oauth_tokens_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_visits ADD CONSTRAINT consulting_visits_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.daily_checkins ADD CONSTRAINT daily_checkins_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.daily_lead_volumes ADD CONSTRAINT daily_lead_volumes_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.digital_products ADD CONSTRAINT digital_products_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.feedbacks ADD CONSTRAINT feedbacks_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.goal_logs ADD CONSTRAINT goal_logs_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.goals ADD CONSTRAINT goals_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.inventory ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.manager_routine_logs ADD CONSTRAINT manager_routine_logs_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.memberships ADD CONSTRAINT memberships_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.notification_reads ADD CONSTRAINT notification_reads_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_acoes_sugeridas ADD CONSTRAINT pdi_acoes_sugeridas_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_avaliacoes_competencia ADD CONSTRAINT pdi_avaliacoes_competencia_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_competencias ADD CONSTRAINT pdi_competencias_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_descritores_escala ADD CONSTRAINT pdi_descritores_escala_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_frases_inspiracionais ADD CONSTRAINT pdi_frases_inspiracionais_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_metas ADD CONSTRAINT pdi_metas_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_niveis_cargo ADD CONSTRAINT pdi_niveis_cargo_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_objetivos_pessoais ADD CONSTRAINT pdi_objetivos_pessoais_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_plano_acao ADD CONSTRAINT pdi_plano_acao_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_reviews ADD CONSTRAINT pdi_reviews_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_sessoes ADD CONSTRAINT pdi_sessoes_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdis ADD CONSTRAINT pdis_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.raw_imports ADD CONSTRAINT raw_imports_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.report_history ADD CONSTRAINT report_history_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.reprocess_logs ADD CONSTRAINT reprocess_logs_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.role_assignments_audit ADD CONSTRAINT role_assignments_audit_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.store_benchmarks ADD CONSTRAINT store_benchmarks_pkey PRIMARY KEY (store_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.store_delivery_rules ADD CONSTRAINT store_delivery_rules_pkey PRIMARY KEY (store_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.store_meta_rules ADD CONSTRAINT store_meta_rules_pkey PRIMARY KEY (store_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.store_meta_rules_history ADD CONSTRAINT store_meta_rules_history_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.store_sellers ADD CONSTRAINT store_sellers_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.stores ADD CONSTRAINT stores_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.training_progress ADD CONSTRAINT training_progress_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.trainings ADD CONSTRAINT trainings_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.weekly_feedback_reports ADD CONSTRAINT weekly_feedback_reports_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.whatsapp_share_logs ADD CONSTRAINT whatsapp_share_logs_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- Section 4: UNIQUE CONSTRAINTS
-- ============================================================

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.benchmarks ADD CONSTRAINT benchmarks_store_id_key UNIQUE (store_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_financials ADD CONSTRAINT consulting_financials_client_id_reference_date_key UNIQUE (client_id, reference_date);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_google_oauth_states ADD CONSTRAINT consulting_google_oauth_states_state_key UNIQUE (state);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_oauth_tokens ADD CONSTRAINT consulting_oauth_tokens_user_provider_unique UNIQUE (user_id, provider);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.daily_checkins ADD CONSTRAINT daily_checkins_user_id_store_id_date_key UNIQUE (user_id, store_id, date);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.manager_routine_logs ADD CONSTRAINT manager_routine_logs_unique_day UNIQUE (store_id, manager_id, routine_date);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.memberships ADD CONSTRAINT memberships_user_id_store_id_key UNIQUE (user_id, store_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.notification_reads ADD CONSTRAINT notification_reads_notification_id_user_id_key UNIQUE (notification_id, user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.roles ADD CONSTRAINT roles_name_key UNIQUE (name);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.training_progress ADD CONSTRAINT training_progress_user_id_training_id_key UNIQUE (user_id, training_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.user_roles ADD CONSTRAINT user_roles_user_id_role_id UNIQUE (user_id, role_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.users ADD CONSTRAINT users_email_key UNIQUE (email);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.weekly_feedback_reports ADD CONSTRAINT weekly_feedback_reports_unique UNIQUE (store_id, week_start, week_end);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- Section 5: FOREIGN KEYS
-- ============================================================

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.users ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.benchmarks ADD CONSTRAINT benchmarks_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.checkin_audit_logs ADD CONSTRAINT checkin_audit_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.checkin_audit_logs ADD CONSTRAINT checkin_audit_logs_correction_request_id_fkey FOREIGN KEY (correction_request_id) REFERENCES checkin_correction_requests(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.checkin_audit_logs ADD CONSTRAINT checkin_audit_logs_checkin_id_fkey FOREIGN KEY (checkin_id) REFERENCES daily_checkins(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.checkin_correction_requests ADD CONSTRAINT checkin_correction_requests_auditor_id_fkey FOREIGN KEY (auditor_id) REFERENCES users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.checkin_correction_requests ADD CONSTRAINT checkin_correction_requests_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.checkin_correction_requests ADD CONSTRAINT checkin_correction_requests_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.checkin_correction_requests ADD CONSTRAINT checkin_correction_requests_checkin_id_fkey FOREIGN KEY (checkin_id) REFERENCES daily_checkins(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_assignments ADD CONSTRAINT consulting_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_assignments ADD CONSTRAINT consulting_assignments_client_id_fkey FOREIGN KEY (client_id) REFERENCES consulting_clients(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_calendar_settings ADD CONSTRAINT consulting_calendar_settings_client_id_fkey FOREIGN KEY (client_id) REFERENCES consulting_clients(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_calendar_settings ADD CONSTRAINT consulting_calendar_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_client_contacts ADD CONSTRAINT consulting_client_contacts_client_id_fkey FOREIGN KEY (client_id) REFERENCES consulting_clients(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_client_units ADD CONSTRAINT consulting_client_units_client_id_fkey FOREIGN KEY (client_id) REFERENCES consulting_clients(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_clients ADD CONSTRAINT consulting_clients_primary_store_id_fkey FOREIGN KEY (primary_store_id) REFERENCES stores(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_clients ADD CONSTRAINT consulting_clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_financials ADD CONSTRAINT consulting_financials_client_id_fkey FOREIGN KEY (client_id) REFERENCES consulting_clients(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_google_oauth_states ADD CONSTRAINT consulting_google_oauth_states_client_id_fkey FOREIGN KEY (client_id) REFERENCES consulting_clients(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_google_oauth_states ADD CONSTRAINT consulting_google_oauth_states_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_oauth_tokens ADD CONSTRAINT consulting_oauth_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_visits ADD CONSTRAINT consulting_visits_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_visits ADD CONSTRAINT consulting_visits_client_id_fkey FOREIGN KEY (client_id) REFERENCES consulting_clients(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_visits ADD CONSTRAINT consulting_visits_auxiliary_consultant_id_fkey FOREIGN KEY (auxiliary_consultant_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.daily_checkins ADD CONSTRAINT daily_checkins_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.daily_checkins ADD CONSTRAINT daily_checkins_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.daily_checkins ADD CONSTRAINT daily_checkins_seller_user_id_fkey FOREIGN KEY (seller_user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.daily_checkins ADD CONSTRAINT daily_checkins_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.daily_lead_volumes ADD CONSTRAINT daily_lead_volumes_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.digital_products ADD CONSTRAINT digital_products_target_store_id_fkey FOREIGN KEY (target_store_id) REFERENCES stores(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.feedbacks ADD CONSTRAINT feedbacks_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.feedbacks ADD CONSTRAINT feedbacks_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.feedbacks ADD CONSTRAINT feedbacks_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.goal_logs ADD CONSTRAINT goal_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.goal_logs ADD CONSTRAINT goal_logs_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.goals ADD CONSTRAINT goals_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.goals ADD CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.goals ADD CONSTRAINT goals_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.inventory ADD CONSTRAINT inventory_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.manager_routine_logs ADD CONSTRAINT manager_routine_logs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.manager_routine_logs ADD CONSTRAINT manager_routine_logs_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.memberships ADD CONSTRAINT memberships_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.memberships ADD CONSTRAINT memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.notification_reads ADD CONSTRAINT notification_reads_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.notification_reads ADD CONSTRAINT notification_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.notifications ADD CONSTRAINT notifications_target_store_id_fkey FOREIGN KEY (target_store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.notifications ADD CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.notifications ADD CONSTRAINT notifications_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.notifications ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_acoes_sugeridas ADD CONSTRAINT pdi_acoes_sugeridas_competencia_id_fkey FOREIGN KEY (competencia_id) REFERENCES pdi_competencias(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_avaliacoes_competencia ADD CONSTRAINT pdi_avaliacoes_competencia_sessao_id_fkey FOREIGN KEY (sessao_id) REFERENCES pdi_sessoes(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_avaliacoes_competencia ADD CONSTRAINT pdi_avaliacoes_competencia_competencia_id_fkey FOREIGN KEY (competencia_id) REFERENCES pdi_competencias(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_descritores_escala ADD CONSTRAINT pdi_descritores_escala_nivel_cargo_id_fkey FOREIGN KEY (nivel_cargo_id) REFERENCES pdi_niveis_cargo(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_metas ADD CONSTRAINT pdi_metas_sessao_id_fkey FOREIGN KEY (sessao_id) REFERENCES pdi_sessoes(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_objetivos_pessoais ADD CONSTRAINT pdi_objetivos_pessoais_sessao_id_fkey FOREIGN KEY (sessao_id) REFERENCES pdi_sessoes(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_plano_acao ADD CONSTRAINT pdi_plano_acao_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_plano_acao ADD CONSTRAINT pdi_plano_acao_sessao_id_fkey FOREIGN KEY (sessao_id) REFERENCES pdi_sessoes(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_plano_acao ADD CONSTRAINT pdi_plano_acao_competencia_id_fkey FOREIGN KEY (competencia_id) REFERENCES pdi_competencias(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_reviews ADD CONSTRAINT pdi_reviews_pdi_id_fkey FOREIGN KEY (pdi_id) REFERENCES pdis(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_sessoes ADD CONSTRAINT pdi_sessoes_gerente_id_fkey FOREIGN KEY (gerente_id) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_sessoes ADD CONSTRAINT pdi_sessoes_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdis ADD CONSTRAINT pdis_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdis ADD CONSTRAINT pdis_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdis ADD CONSTRAINT pdis_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.raw_imports ADD CONSTRAINT raw_imports_log_id_fkey FOREIGN KEY (log_id) REFERENCES reprocess_logs(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.report_history ADD CONSTRAINT report_history_config_id_fkey FOREIGN KEY (config_id) REFERENCES automation_configs(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.reprocess_logs ADD CONSTRAINT reprocess_logs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.reprocess_logs ADD CONSTRAINT reprocess_logs_triggered_by_fkey FOREIGN KEY (triggered_by) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.store_benchmarks ADD CONSTRAINT store_benchmarks_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.store_benchmarks ADD CONSTRAINT store_benchmarks_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.store_delivery_rules ADD CONSTRAINT store_delivery_rules_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.store_delivery_rules ADD CONSTRAINT store_delivery_rules_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.store_meta_rules ADD CONSTRAINT store_meta_rules_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.store_meta_rules ADD CONSTRAINT store_meta_rules_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.store_meta_rules_history ADD CONSTRAINT store_meta_rules_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.store_meta_rules_history ADD CONSTRAINT store_meta_rules_history_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.store_sellers ADD CONSTRAINT store_sellers_seller_user_id_fkey FOREIGN KEY (seller_user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.store_sellers ADD CONSTRAINT store_sellers_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.training_progress ADD CONSTRAINT training_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.training_progress ADD CONSTRAINT training_progress_training_id_fkey FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.user_roles ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.weekly_feedback_reports ADD CONSTRAINT weekly_feedback_reports_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.whatsapp_share_logs ADD CONSTRAINT whatsapp_share_logs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.whatsapp_share_logs ADD CONSTRAINT whatsapp_share_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- Section 6: CHECK CONSTRAINTS
-- ============================================================

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.consulting_assignments ADD CONSTRAINT consulting_assignments_role_check CHECK ((assignment_role = ANY (ARRAY['responsavel'::text, 'auxiliar'::text, 'viewer'::text])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.daily_checkins ADD CONSTRAINT daily_checkins_visitas_check CHECK ((visitas >= 0));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.daily_checkins ADD CONSTRAINT daily_checkins_submission_status_check CHECK ((submission_status = ANY (ARRAY['on_time'::text, 'late'::text])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.daily_checkins ADD CONSTRAINT daily_checkins_leads_check CHECK ((leads >= 0));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.daily_checkins ADD CONSTRAINT daily_checkins_agd_cart_check CHECK ((agd_cart >= 0));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.daily_checkins ADD CONSTRAINT daily_checkins_agd_net_check CHECK ((agd_net >= 0));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.daily_checkins ADD CONSTRAINT daily_checkins_vnd_porta_check CHECK ((vnd_porta >= 0));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.daily_checkins ADD CONSTRAINT daily_checkins_vnd_cart_check CHECK ((vnd_cart >= 0));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.daily_checkins ADD CONSTRAINT daily_checkins_vnd_net_check CHECK ((vnd_net >= 0));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.feedbacks ADD CONSTRAINT feedbacks_week_metrics_nonnegative CHECK (((leads_week >= 0) AND (agd_week >= 0) AND (visit_week >= 0) AND (vnd_week >= 0) AND (tx_lead_agd >= (0)::numeric) AND (tx_agd_visita >= (0)::numeric) AND (tx_visita_vnd >= (0)::numeric) AND (meta_compromisso >= 0) AND (commitment_suggested >= 0)));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.goals ADD CONSTRAINT goals_month_check CHECK (((month >= 1) AND (month <= 12)));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.goals ADD CONSTRAINT goals_year_check CHECK ((year >= 2020));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.goals ADD CONSTRAINT goals_target_check CHECK ((target >= 0));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.manager_routine_logs ADD CONSTRAINT manager_routine_logs_status_check CHECK ((status = 'completed'::text));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.manager_routine_logs ADD CONSTRAINT manager_routine_logs_non_negative_check CHECK (((checkins_pending_count >= 0) AND (sem_registro_count >= 0) AND (agd_cart_today >= 0) AND (agd_net_today >= 0) AND (previous_day_leads >= 0) AND (previous_day_sales >= 0)));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.memberships ADD CONSTRAINT memberships_role_check CHECK ((role = ANY (ARRAY['dono'::text, 'gerente'::text, 'vendedor'::text])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.notifications ADD CONSTRAINT notifications_target_type_check CHECK ((target_type = ANY (ARRAY['all'::text, 'store'::text])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.notifications ADD CONSTRAINT notifications_target_role_check CHECK ((target_role = ANY (ARRAY['gerente'::text, 'vendedor'::text, 'todos'::text])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_competencias ADD CONSTRAINT pdi_competencias_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['tecnica'::character varying, 'comportamental'::character varying])::text[])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_metas ADD CONSTRAINT pdi_metas_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['pessoal'::character varying, 'profissional'::character varying])::text[])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_metas ADD CONSTRAINT pdi_metas_prazo_check CHECK (((prazo)::text = ANY ((ARRAY['6_meses'::character varying, '12_meses'::character varying, '24_meses'::character varying])::text[])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_objetivos_pessoais ADD CONSTRAINT pdi_objetivos_pessoais_status_check CHECK (((status)::text = ANY ((ARRAY['pendente'::character varying, 'em_andamento'::character varying, 'concluido'::character varying])::text[])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_plano_acao ADD CONSTRAINT pdi_plano_acao_custo_check CHECK (((custo)::text = ANY ((ARRAY['baixo'::character varying, 'medio'::character varying, 'alto'::character varying])::text[])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_plano_acao ADD CONSTRAINT pdi_plano_acao_impacto_check CHECK (((impacto)::text = ANY ((ARRAY['baixo'::character varying, 'medio'::character varying, 'alto'::character varying])::text[])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_plano_acao ADD CONSTRAINT pdi_plano_acao_status_check CHECK (((status)::text = ANY ((ARRAY['pendente'::character varying, 'em_andamento'::character varying, 'concluido'::character varying])::text[])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdi_sessoes ADD CONSTRAINT pdi_sessoes_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'concluido'::character varying])::text[])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.pdis ADD CONSTRAINT pdis_status_check CHECK ((status = ANY (ARRAY['aberto'::text, 'em_andamento'::text, 'concluido'::text])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.reprocess_logs ADD CONSTRAINT reprocess_logs_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.store_meta_rules ADD CONSTRAINT store_meta_rules_individual_goal_mode_check CHECK ((individual_goal_mode = ANY (ARRAY['even'::text, 'custom'::text, 'proportional'::text])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.stores ADD CONSTRAINT stores_source_mode_check CHECK ((source_mode = ANY (ARRAY['legacy_forms'::text, 'native_app'::text, 'hybrid'::text])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.trainings ADD CONSTRAINT trainings_type_check CHECK ((type = ANY (ARRAY['prospeccao'::text, 'fechamento'::text, 'atendimento'::text, 'gestao'::text, 'pre-vendas'::text])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.trainings ADD CONSTRAINT trainings_target_audience_check CHECK ((target_audience = ANY (ARRAY['vendedor'::text, 'gerente'::text, 'todos'::text])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.users ADD CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'dono'::text, 'gerente'::text, 'vendedor'::text])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.weekly_feedback_reports ADD CONSTRAINT weekly_feedback_reports_week_check CHECK ((week_end >= week_start));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.weekly_feedback_reports ADD CONSTRAINT weekly_feedback_reports_email_status_check CHECK ((email_status = ANY (ARRAY['dry_run'::text, 'sent'::text, 'failed'::text, 'not_sent'::text])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.whatsapp_share_logs ADD CONSTRAINT whatsapp_share_logs_source_check CHECK ((source = 'morning_report'::text));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE IF EXISTS public.whatsapp_share_logs ADD CONSTRAINT whatsapp_share_logs_shared_via_check CHECK ((shared_via = ANY (ARRAY['whatsapp'::text, 'native_share'::text])));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- Section 7: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS checkin_audit_logs_changed_by_created_idx ON public.checkin_audit_logs USING btree (changed_by, created_at DESC);

CREATE INDEX IF NOT EXISTS checkin_audit_logs_checkin_idx ON public.checkin_audit_logs USING btree (checkin_id);

CREATE INDEX IF NOT EXISTS checkin_audit_logs_created_at_idx ON public.checkin_audit_logs USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS checkin_audit_logs_type_created_idx ON public.checkin_audit_logs USING btree (change_type, created_at DESC);

CREATE INDEX IF NOT EXISTS consulting_assignments_user_active_idx ON public.consulting_assignments USING btree (user_id, active);

CREATE UNIQUE INDEX IF NOT EXISTS consulting_assignments_client_user_unique ON public.consulting_assignments USING btree (client_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS consulting_calendar_settings_user_unique_idx ON public.consulting_calendar_settings USING btree (user_id);

CREATE INDEX IF NOT EXISTS consulting_contacts_client_idx ON public.consulting_client_contacts USING btree (client_id);

CREATE INDEX IF NOT EXISTS consulting_units_client_idx ON public.consulting_client_units USING btree (client_id);

CREATE INDEX IF NOT EXISTS consulting_clients_name_idx ON public.consulting_clients USING btree (name);

CREATE INDEX IF NOT EXISTS consulting_clients_status_idx ON public.consulting_clients USING btree (status);

CREATE INDEX IF NOT EXISTS consulting_financials_client_date_idx ON public.consulting_financials USING btree (client_id, reference_date);

CREATE INDEX IF NOT EXISTS consulting_visits_client_idx ON public.consulting_visits USING btree (client_id);

CREATE INDEX IF NOT EXISTS consulting_visits_scheduled_at_idx ON public.consulting_visits USING btree (scheduled_at);

CREATE INDEX IF NOT EXISTS daily_checkins_seller_reference_idx ON public.daily_checkins USING btree (seller_user_id, reference_date);

CREATE UNIQUE INDEX IF NOT EXISTS daily_checkins_seller_store_reference_key ON public.daily_checkins USING btree (seller_user_id, store_id, reference_date);

CREATE INDEX IF NOT EXISTS daily_checkins_store_reference_idx ON public.daily_checkins USING btree (store_id, reference_date);

CREATE INDEX IF NOT EXISTS feedbacks_seller_week_idx ON public.feedbacks USING btree (seller_id, week_reference DESC);

CREATE UNIQUE INDEX IF NOT EXISTS feedbacks_seller_week_unique ON public.feedbacks USING btree (seller_id, week_reference);

CREATE INDEX IF NOT EXISTS feedbacks_store_week_idx ON public.feedbacks USING btree (store_id, week_reference DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_store_user_period ON public.goals USING btree (store_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), month, year);

CREATE INDEX IF NOT EXISTS manager_routine_logs_manager_date_idx ON public.manager_routine_logs USING btree (manager_id, routine_date DESC);

CREATE INDEX IF NOT EXISTS manager_routine_logs_store_date_idx ON public.manager_routine_logs USING btree (store_id, routine_date DESC);

CREATE INDEX IF NOT EXISTS idx_memberships_store_role ON public.memberships USING btree (store_id, role);

CREATE INDEX IF NOT EXISTS idx_memberships_user_store_role ON public.memberships USING btree (user_id, store_id, role);

CREATE UNIQUE INDEX IF NOT EXISTS notification_reads_notification_user_unique ON public.notification_reads USING btree (notification_id, user_id);

CREATE INDEX IF NOT EXISTS notifications_broadcast_id_idx ON public.notifications USING btree (broadcast_id);

CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx ON public.notifications USING btree (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_sender_id_idx ON public.notifications USING btree (sender_id);

CREATE INDEX IF NOT EXISTS notifications_store_created_idx ON public.notifications USING btree (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS pdi_reviews_pdi_created_idx ON public.pdi_reviews USING btree (pdi_id, created_at DESC);

CREATE INDEX IF NOT EXISTS raw_imports_log_id_idx ON public.raw_imports USING btree (log_id);

CREATE INDEX IF NOT EXISTS reprocess_logs_active_status_idx ON public.reprocess_logs USING btree (status, created_at DESC) WHERE (status = ANY (ARRAY['pending'::text, 'processing'::text, 'failed'::text]));

CREATE INDEX IF NOT EXISTS reprocess_logs_file_hash_idx ON public.reprocess_logs USING btree (file_hash) WHERE (file_hash IS NOT NULL);

CREATE INDEX IF NOT EXISTS reprocess_logs_source_type_idx ON public.reprocess_logs USING btree (source_type);

CREATE INDEX IF NOT EXISTS reprocess_logs_store_created_idx ON public.reprocess_logs USING btree (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS reprocess_logs_store_started_idx ON public.reprocess_logs USING btree (store_id, started_at DESC);

CREATE INDEX IF NOT EXISTS reprocess_logs_triggered_by_idx ON public.reprocess_logs USING btree (triggered_by, created_at DESC) WHERE (triggered_by IS NOT NULL);

CREATE INDEX IF NOT EXISTS store_sellers_seller_idx ON public.store_sellers USING btree (seller_user_id);

CREATE INDEX IF NOT EXISTS store_sellers_store_active_idx ON public.store_sellers USING btree (store_id, is_active, started_at, ended_at);

CREATE UNIQUE INDEX IF NOT EXISTS store_sellers_store_seller_started_idx ON public.store_sellers USING btree (store_id, seller_user_id, started_at);

CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles USING btree (role_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles USING btree (user_id);

CREATE INDEX IF NOT EXISTS weekly_feedback_reports_store_week_idx ON public.weekly_feedback_reports USING btree (store_id, week_start DESC);

CREATE INDEX IF NOT EXISTS whatsapp_share_logs_store_created_idx ON public.whatsapp_share_logs USING btree (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS whatsapp_share_logs_user_created_idx ON public.whatsapp_share_logs USING btree (user_id, created_at DESC);


-- ============================================================
-- Section 8: FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.approve_pdi_action_evidence(p_action_id uuid, p_approval_payload jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.pdi_plano_acao
    SET status = 'concluido',
        aprovado_por = auth.uid(),
        data_aprovacao = NOW(),
        updated_at = NOW()
    WHERE id = p_action_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_access_consulting_client(p_client_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.consulting_assignments ca
            WHERE ca.client_id = p_client_id
              AND ca.user_id = auth.uid()
              AND ca.active = true
        )
$function$;

CREATE OR REPLACE FUNCTION public.check_orphan_users_after_membership_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_target_user_id uuid;
BEGIN
    IF TG_TABLE_NAME = 'store_sellers' THEN
        v_target_user_id := OLD.seller_user_id;
    ELSIF TG_TABLE_NAME = 'memberships' THEN
        v_target_user_id := OLD.user_id;
    ELSE
        RETURN OLD;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.users
        WHERE id = v_target_user_id AND role = 'admin'
    ) THEN
        RETURN OLD;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM public.store_sellers 
        WHERE seller_user_id = v_target_user_id 
          AND is_active = true
    ) AND NOT EXISTS (
        SELECT 1 
        FROM public.memberships 
        WHERE user_id = v_target_user_id
    ) THEN
        UPDATE public.users
        SET active = false,
            updated_at = now()
        WHERE id = v_target_user_id
          AND active = true;
    END IF;

    RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_user_role_in_store(p_store_id uuid, p_roles text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.memberships
        WHERE store_id = p_store_id
          AND user_id = auth.uid()
          AND role = ANY(p_roles)
    )
$function$;

CREATE OR REPLACE FUNCTION public.configure_monthly_report_cron(p_function_url text, p_bearer_token text, p_schedule text DEFAULT '30 13 1 * *'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'cron', 'net'
AS $function$
DECLARE
    v_sql TEXT;
BEGIN
    PERFORM cron.unschedule(jobid)
      FROM cron.job
     WHERE jobname = 'mx-monthly-report';

    v_sql := format(
        $cron$
        SELECT net.http_post(
            url := %L,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', %L
            ),
            body := jsonb_build_object('source', 'cron')
        );
        $cron$,
        p_function_url,
        'Bearer ' || p_bearer_token
    );

    PERFORM cron.schedule(
        'mx-monthly-report',
        p_schedule,
        v_sql
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.configure_morning_report_cron(p_function_url text, p_bearer_token text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'cron', 'net'
AS $function$
DECLARE
    v_sql text;
BEGIN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'mx-morning-report-1030';

    v_sql := format(
        $cron$
        SELECT net.http_post(
            url := %L,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', %L
            ),
            body := jsonb_build_object('source', 'cron')
        );
        $cron$,
        p_function_url,
        'Bearer ' || p_bearer_token
    );

    PERFORM cron.schedule(
        'mx-morning-report-1030',
        '30 13 * * *',
        v_sql
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.configure_weekly_feedback_cron(p_function_url text, p_bearer_token text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'cron', 'net'
AS $function$
DECLARE
    v_sql text;
BEGIN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'mx-weekly-feedback-1230';

    v_sql := format(
        $cron$
        SELECT net.http_post(
            url := %L,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', %L
            ),
            body := jsonb_build_object('source', 'cron')
        );
        $cron$,
        p_function_url,
        'Bearer ' || p_bearer_token
    );

    PERFORM cron.schedule(
        'mx-weekly-feedback-1230',
        '30 15 * * 1',
        v_sql
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_pdi_session_bundle(p_payload jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_sessao_id UUID;
    v_meta JSONB;
    v_avaliacao JSONB;
    v_acao JSONB;
BEGIN
    INSERT INTO public.pdi_sessoes (colaborador_id, gerente_id, loja_id, proxima_revisao_data, status)
    VALUES (
        (p_payload->>'colaborador_id')::UUID,
        auth.uid(),
        (p_payload->>'loja_id')::UUID,
        (p_payload->>'proxima_revisao_data')::TIMESTAMP WITH TIME ZONE,
        'concluido'
    ) RETURNING id INTO v_sessao_id;

    FOR v_meta IN SELECT * FROM jsonb_array_elements(p_payload->'metas')
    LOOP
        INSERT INTO public.pdi_metas (sessao_id, prazo, tipo, descricao)
        VALUES (
            v_sessao_id,
            v_meta->>'prazo',
            v_meta->>'tipo',
            v_meta->>'descricao'
        );
    END LOOP;

    FOR v_avaliacao IN SELECT * FROM jsonb_array_elements(p_payload->'avaliacoes')
    LOOP
        INSERT INTO public.pdi_avaliacoes_competencia (sessao_id, competencia_id, nota_atribuida, alvo)
        VALUES (
            v_sessao_id,
            (v_avaliacao->>'competencia_id')::UUID,
            (v_avaliacao->>'nota_atribuida')::INTEGER,
            (v_avaliacao->>'alvo')::INTEGER
        );
    END LOOP;

    FOR v_acao IN SELECT * FROM jsonb_array_elements(p_payload->'plano_acao')
    LOOP
        INSERT INTO public.pdi_plano_acao (sessao_id, competencia_id, descricao_acao, data_conclusao, impacto, custo, status)
        VALUES (
            v_sessao_id,
            (v_acao->>'competencia_id')::UUID,
            v_acao->>'descricao_acao',
            (v_acao->>'data_conclusao')::DATE,
            v_acao->>'impacto',
            v_acao->>'custo',
            'pendente'
        );
    END LOOP;

    RETURN v_sessao_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_feedback_seller_ack_only()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF auth.uid() = OLD.seller_id
        AND NOT public.is_admin()
        AND NOT public.is_manager_of(OLD.store_id)
    THEN
        IF NEW.store_id IS DISTINCT FROM OLD.store_id
            OR NEW.manager_id IS DISTINCT FROM OLD.manager_id
            OR NEW.seller_id IS DISTINCT FROM OLD.seller_id
            OR NEW.week_reference IS DISTINCT FROM OLD.week_reference
            OR NEW.leads_week IS DISTINCT FROM OLD.leads_week
            OR NEW.agd_week IS DISTINCT FROM OLD.agd_week
            OR NEW.visit_week IS DISTINCT FROM OLD.visit_week
            OR NEW.vnd_week IS DISTINCT FROM OLD.vnd_week
            OR NEW.tx_lead_agd IS DISTINCT FROM OLD.tx_lead_agd
            OR NEW.tx_agd_visita IS DISTINCT FROM OLD.tx_agd_visita
            OR NEW.tx_visita_vnd IS DISTINCT FROM OLD.tx_visita_vnd
            OR NEW.meta_compromisso IS DISTINCT FROM OLD.meta_compromisso
            OR NEW.positives IS DISTINCT FROM OLD.positives
            OR NEW.attention_points IS DISTINCT FROM OLD.attention_points
            OR NEW.action IS DISTINCT FROM OLD.action
            OR NEW.notes IS DISTINCT FROM OLD.notes
            OR NEW.team_avg_json IS DISTINCT FROM OLD.team_avg_json
            OR NEW.diagnostic_json IS DISTINCT FROM OLD.diagnostic_json
            OR NEW.commitment_suggested IS DISTINCT FROM OLD.commitment_suggested
            OR NEW.created_at IS DISTINCT FROM OLD.created_at
        THEN
            RAISE EXCEPTION 'Vendedor pode apenas confirmar ciencia do feedback.';
        END IF;

        IF NEW.acknowledged IS DISTINCT FROM true THEN
            RAISE EXCEPTION 'Confirmacao de ciencia deve marcar acknowledged=true.';
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_pdi_form_template(p_cargo_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_escala JSONB;
    v_competencias JSONB;
    v_frases JSONB;
    v_cargo_max INTEGER;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'nota', nota,
            'descritor', descritor,
            'ordem', ordem
        ) ORDER BY ordem
    ), MAX(nota) INTO v_escala, v_cargo_max
    FROM public.pdi_descritores_escala
    WHERE nivel_cargo_id = p_cargo_id;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'nome', nome,
            'tipo', tipo,
            'descricao_completa', descricao_completa,
            'indicador', indicador,
            'ordem', ordem,
            'alvo', v_cargo_max
        ) ORDER BY tipo DESC, ordem ASC
    ) INTO v_competencias
    FROM public.pdi_competencias;

    SELECT jsonb_agg(texto) INTO v_frases
    FROM public.pdi_frases_inspiracionais;

    RETURN jsonb_build_object(
        'escala', COALESCE(v_escala, '[]'::jsonb),
        'competencias', COALESCE(v_competencias, '[]'::jsonb),
        'frases', COALESCE(v_frases, '[]'::jsonb)
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_pdi_print_bundle(p_sessao_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_sessao RECORD;
    v_metas JSONB;
    v_avaliacoes JSONB;
    v_plano_acao JSONB;
    v_top_gaps JSONB;
BEGIN
    SELECT * INTO v_sessao FROM public.pdi_sessoes WHERE id = p_sessao_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sessão não encontrada ou sem acesso.';
    END IF;

    SELECT jsonb_agg(row_to_json(m)) INTO v_metas FROM public.pdi_metas m WHERE sessao_id = p_sessao_id;
    
    SELECT jsonb_agg(
        jsonb_build_object(
            'competencia', c.nome,
            'tipo', c.tipo,
            'nota', a.nota_atribuida,
            'alvo', a.alvo,
            'gap', a.alvo - a.nota_atribuida
        )
    ) INTO v_avaliacoes 
    FROM public.pdi_avaliacoes_competencia a
    JOIN public.pdi_competencias c ON a.competencia_id = c.id
    WHERE sessao_id = p_sessao_id;

    SELECT jsonb_agg(gap_info) INTO v_top_gaps FROM (
        SELECT jsonb_build_object(
            'competencia', c.nome,
            'gap', a.alvo - a.nota_atribuida
        ) as gap_info
        FROM public.pdi_avaliacoes_competencia a
        JOIN public.pdi_competencias c ON a.competencia_id = c.id
        WHERE sessao_id = p_sessao_id
        ORDER BY (a.alvo - a.nota_atribuida) DESC
        LIMIT 5
    ) AS sub;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', pa.id,
            'competencia', c.nome,
            'descricao_acao', pa.descricao_acao,
            'data_conclusao', pa.data_conclusao,
            'impacto', pa.impacto,
            'custo', pa.custo,
            'status', pa.status,
            'evidencia_url', pa.evidencia_url
        )
    ) INTO v_plano_acao
    FROM public.pdi_plano_acao pa
    JOIN public.pdi_competencias c ON pa.competencia_id = c.id
    WHERE sessao_id = p_sessao_id;

    RETURN jsonb_build_object(
        'sessao', row_to_json(v_sessao),
        'metas', COALESCE(v_metas, '[]'::jsonb),
        'avaliacoes', COALESCE(v_avaliacoes, '[]'::jsonb),
        'top_5_gaps', COALESCE(v_top_gaps, '[]'::jsonb),
        'plano_acao', COALESCE(v_plano_acao, '[]'::jsonb)
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_suggested_actions(p_competencia_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_actions JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'descricao_acao', descricao_acao
        )
    ) INTO v_actions
    FROM public.pdi_acoes_sugeridas
    WHERE competencia_id = p_competencia_id;

    RETURN COALESCE(v_actions, '[]'::jsonb);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_agency_id()
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
    SELECT agency_id FROM daily_lead_volumes WHERE seller_id = auth.uid() AND agency_id IS NOT NULL LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'vendedor')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), public.users.name);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_store_role(p_store_id uuid, p_roles text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.memberships m
        WHERE m.user_id = (SELECT auth.uid())
          AND m.store_id = p_store_id
          AND public.normalize_mx_role(m.role) = ANY (p_roles)
    )
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = uid AND r.name = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT role = 'admin' AND active = TRUE 
    FROM public.users 
    WHERE id = auth.uid() 
    LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.is_consultor()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'consultor');
$function$;

CREATE OR REPLACE FUNCTION public.is_gerente_of(p_store_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND store_id = p_store_id AND role = 'gerente')
    OR is_consultor();
$function$;

CREATE OR REPLACE FUNCTION public.is_manager_of(p_store_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
    SELECT public.is_admin() OR public.check_user_role_in_store(p_store_id, ARRAY['gerente'])
$function$;

CREATE OR REPLACE FUNCTION public.is_member_of(p_store_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
    SELECT public.is_admin() OR public.check_user_role_in_store(p_store_id, ARRAY['dono', 'gerente', 'vendedor'])
$function$;

CREATE OR REPLACE FUNCTION public.is_owner_of(p_store_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
    SELECT public.is_admin() OR public.check_user_role_in_store(p_store_id, ARRAY['dono'])
$function$;

CREATE OR REPLACE FUNCTION public.log_store_meta_rules_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.store_meta_rules_history (store_id, changed_by, old_values, new_values)
    VALUES (NEW.store_id, NEW.updated_by, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.normalize_mx_role(p_role text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
    SELECT CASE
        WHEN p_role = 'consultor' THEN 'admin'
        WHEN p_role = 'owner' THEN 'dono'
        WHEN p_role = 'manager' THEN 'gerente'
        WHEN p_role = 'seller' THEN 'vendedor'
        ELSE p_role
    END
$function$;

CREATE OR REPLACE FUNCTION public.process_import_data(p_log_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_raw RECORD;
    v_store_id UUID;
    v_seller_id UUID;
    v_ref_date DATE;
    v_current_status TEXT;
    v_file_hash TEXT;
BEGIN
    SELECT status, file_hash
      INTO v_current_status, v_file_hash
      FROM public.reprocess_logs
     WHERE id = p_log_id
     FOR UPDATE;

    IF v_current_status = 'completed' OR v_current_status = 'processing' THEN
        RAISE EXCEPTION 'Este lote ja foi processado ou esta em execucao (status: %).', v_current_status;
    END IF;

    IF v_file_hash IS NOT NULL AND EXISTS (
        SELECT 1
        FROM public.reprocess_logs rl
        WHERE rl.id <> p_log_id
          AND rl.file_hash = v_file_hash
          AND rl.status = 'completed'
    ) THEN
        RAISE EXCEPTION 'Arquivo ja processado anteriormente para este hash.';
    END IF;

    UPDATE public.reprocess_logs
       SET status = 'processing',
           started_at = now()
     WHERE id = p_log_id;

    FOR v_raw IN
        SELECT id, raw_data
        FROM public.raw_imports
        WHERE log_id = p_log_id
    LOOP
        BEGIN
            IF (v_raw.raw_data->>'store_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                v_store_id := (v_raw.raw_data->>'store_id')::uuid;
            ELSE
                SELECT id
                  INTO v_store_id
                  FROM public.stores
                 WHERE name ILIKE COALESCE(v_raw.raw_data->>'LOJA', '')
                 LIMIT 1;
            END IF;

            IF (v_raw.raw_data->>'seller_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                v_seller_id := (v_raw.raw_data->>'seller_id')::uuid;
            ELSE
                SELECT id
                  INTO v_seller_id
                  FROM public.users
                 WHERE email ILIKE COALESCE(v_raw.raw_data->>'EMAIL', '')
                    OR name ILIKE COALESCE(v_raw.raw_data->>'VENDEDOR', '')
                 LIMIT 1;
            END IF;

            v_ref_date := (v_raw.raw_data->>'DATA')::date;

            IF v_ref_date > (timezone('America/Sao_Paulo', now()))::date THEN
                RAISE EXCEPTION 'Data de referencia (%) superior ao limite operacional.', v_ref_date;
            END IF;

            IF v_store_id IS NOT NULL AND v_seller_id IS NOT NULL AND v_ref_date IS NOT NULL THEN
                INSERT INTO public.daily_checkins (
                    seller_user_id,
                    store_id,
                    reference_date,
                    submitted_at,
                    metric_scope,
                    leads_prev_day,
                    agd_cart_today,
                    agd_net_today,
                    vnd_porta_prev_day,
                    vnd_cart_prev_day,
                    vnd_net_prev_day,
                    visit_prev_day,
                    zero_reason,
                    created_by,
                    updated_at
                ) VALUES (
                    v_seller_id,
                    v_store_id,
                    v_ref_date,
                    now(),
                    'daily',
                    COALESCE(NULLIF(v_raw.raw_data->>'LEADS', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'AGD_CART', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'AGD_NET', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'VND_PORTA', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'VND_CART', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'VND_NET', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'VISITA', '')::integer, 0),
                    NULLIF(v_raw.raw_data->>'MOTIVO_ZERO', ''),
                    COALESCE((SELECT triggered_by FROM public.reprocess_logs WHERE id = p_log_id), v_seller_id),
                    now()
                )
                ON CONFLICT (seller_user_id, store_id, reference_date)
                DO UPDATE SET
                    submitted_at = EXCLUDED.submitted_at,
                    leads_prev_day = EXCLUDED.leads_prev_day,
                    agd_cart_today = EXCLUDED.agd_cart_today,
                    agd_net_today = EXCLUDED.agd_net_today,
                    vnd_porta_prev_day = EXCLUDED.vnd_porta_prev_day,
                    vnd_cart_prev_day = EXCLUDED.vnd_cart_prev_day,
                    vnd_net_prev_day = EXCLUDED.vnd_net_prev_day,
                    visit_prev_day = EXCLUDED.visit_prev_day,
                    zero_reason = EXCLUDED.zero_reason,
                    updated_at = now();

                UPDATE public.reprocess_logs
                   SET records_processed = COALESCE(records_processed, 0) + 1,
                       rows_processed = COALESCE(rows_processed, 0) + 1
                 WHERE id = p_log_id;
            ELSE
                UPDATE public.reprocess_logs
                   SET records_failed = COALESCE(records_failed, 0) + 1,
                       error_log = COALESCE(error_log, '[]'::jsonb) || jsonb_build_object(
                           'error', 'Entidade nao localizada (Loja ou Vendedor)',
                           'store_found', v_store_id IS NOT NULL,
                           'seller_found', v_seller_id IS NOT NULL,
                           'data', v_raw.raw_data
                       )
                 WHERE id = p_log_id;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            UPDATE public.reprocess_logs
               SET records_failed = COALESCE(records_failed, 0) + 1,
                   error_log = COALESCE(error_log, '[]'::jsonb) || jsonb_build_object('error', SQLERRM, 'data', v_raw.raw_data)
             WHERE id = p_log_id;
        END;
    END LOOP;

    UPDATE public.reprocess_logs
       SET status = 'completed',
           finished_at = now(),
           processed_at = now()
     WHERE id = p_log_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.send_broadcast_notification(p_title text, p_message text, p_type text DEFAULT 'system'::text, p_priority text DEFAULT 'medium'::text, p_store_id uuid DEFAULT NULL::uuid, p_target_role text DEFAULT 'todos'::text, p_link text DEFAULT NULL::text, p_sender_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_record RECORD;
    v_broadcast_id UUID := gen_random_uuid();
BEGIN
    FOR v_user_record IN
        SELECT DISTINCT
            u.id AS user_id,
            CASE WHEN p_store_id IS NULL THEN NULL ELSE p_store_id END AS resolved_store_id
        FROM public.users u
        LEFT JOIN public.memberships m
            ON m.user_id = u.id
        WHERE u.active = TRUE
          AND (p_store_id IS NULL OR m.store_id = p_store_id)
          AND (
              p_target_role = 'todos'
              OR u.role = p_target_role
              OR m.role = p_target_role
          )
    LOOP
        INSERT INTO public.notifications (
            recipient_id,
            store_id,
            sender_id,
            broadcast_id,
            title,
            message,
            type,
            priority,
            link,
            read,
            created_at,
            target_type,
            target_store_id,
            target_role,
            sent_at
        ) VALUES (
            v_user_record.user_id,
            v_user_record.resolved_store_id,
            p_sender_id,
            v_broadcast_id,
            p_title,
            p_message,
            p_type,
            p_priority,
            p_link,
            FALSE,
            now(),
            CASE WHEN p_store_id IS NULL THEN 'all' ELSE 'store' END,
            p_store_id,
            CASE WHEN p_target_role = 'todos' THEN NULL ELSE p_target_role END,
            now()
        );
    END LOOP;

    RETURN v_broadcast_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_manager_routine_logs_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_daily_checkins_canonical()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_submitted_local timestamp;
BEGIN
    IF NEW.seller_user_id IS NULL THEN
        NEW.seller_user_id := NEW.user_id;
    END IF;
    IF NEW.user_id IS NULL THEN
        NEW.user_id := NEW.seller_user_id;
    END IF;

    IF NEW.reference_date IS NULL THEN
        NEW.reference_date := NEW.date;
    ELSE
        NEW.date := NEW.reference_date;
    END IF;

    IF NEW.submitted_at IS NULL THEN
        NEW.submitted_at := COALESCE(NEW.created_at, now());
    END IF;
    IF NEW.created_at IS NULL THEN
        NEW.created_at := NEW.submitted_at;
    END IF;
    IF NEW.updated_at IS NULL THEN
        NEW.updated_at := now();
    END IF;

    NEW.metric_scope := COALESCE(NEW.metric_scope, 'daily'::public.checkin_scope);

    IF NEW.leads_prev_day IS NULL THEN NEW.leads_prev_day := COALESCE(NEW.leads, 0); END IF;
    IF NEW.agd_cart_today IS NULL THEN NEW.agd_cart_today := COALESCE(NEW.agd_cart, 0); END IF;
    IF NEW.agd_net_today IS NULL THEN NEW.agd_net_today := COALESCE(NEW.agd_net, 0); END IF;
    IF NEW.vnd_porta_prev_day IS NULL THEN NEW.vnd_porta_prev_day := COALESCE(NEW.vnd_porta, 0); END IF;
    IF NEW.vnd_cart_prev_day IS NULL THEN NEW.vnd_cart_prev_day := COALESCE(NEW.vnd_cart, 0); END IF;
    IF NEW.vnd_net_prev_day IS NULL THEN NEW.vnd_net_prev_day := COALESCE(NEW.vnd_net, 0); END IF;
    IF NEW.visit_prev_day IS NULL THEN NEW.visit_prev_day := COALESCE(NEW.visitas, 0); END IF;

    NEW.agd_cart_prev_day := COALESCE(NEW.agd_cart_prev_day, 0);
    NEW.agd_net_prev_day := COALESCE(NEW.agd_net_prev_day, 0);

    NEW.leads := COALESCE(NEW.leads_prev_day, 0);
    NEW.agd_cart := COALESCE(NEW.agd_cart_today, 0);
    NEW.agd_net := COALESCE(NEW.agd_net_today, 0);
    NEW.vnd_porta := COALESCE(NEW.vnd_porta_prev_day, 0);
    NEW.vnd_cart := COALESCE(NEW.vnd_cart_prev_day, 0);
    NEW.vnd_net := COALESCE(NEW.vnd_net_prev_day, 0);
    NEW.visitas := COALESCE(NEW.visit_prev_day, 0);

    v_submitted_local := NEW.submitted_at AT TIME ZONE 'America/Sao_Paulo';
    NEW.submitted_late := v_submitted_local::time > TIME '09:30';
    NEW.submission_status := CASE WHEN NEW.submitted_late THEN 'late' ELSE 'on_time' END;
    NEW.edit_locked_at := COALESCE(
        NEW.edit_locked_at,
        date_trunc('day', v_submitted_local) AT TIME ZONE 'America/Sao_Paulo' + INTERVAL '9 hours 45 minutes'
    );

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_notification_reads()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.read IS TRUE AND NEW.recipient_id IS NOT NULL THEN
        INSERT INTO public.notification_reads (notification_id, user_id, read_at)
        VALUES (NEW.id, NEW.recipient_id, COALESCE(NEW.created_at, now()))
        ON CONFLICT (notification_id, user_id)
        DO UPDATE SET read_at = EXCLUDED.read_at;
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_pdi_legacy_shadow_columns()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.meta_6m := COALESCE(NULLIF(NEW.meta_6m, ''), NULLIF(NEW.objective, ''), 'Definir horizonte de 6 meses');
    NEW.meta_12m := COALESCE(NULLIF(NEW.meta_12m, ''), NULLIF(NEW.objective, ''), NEW.meta_6m, 'Definir horizonte de 12 meses');
    NEW.meta_24m := COALESCE(NULLIF(NEW.meta_24m, ''), NULLIF(NEW.objective, ''), NEW.meta_12m, 'Definir horizonte de 24 meses');

    NEW.action_1 := COALESCE(NULLIF(NEW.action_1, ''), NULLIF(NEW.action, ''), 'Definir ação prioritária');
    NEW.action_2 := NULLIF(NEW.action_2, '');
    NEW.action_3 := NULLIF(NEW.action_3, '');
    NEW.action_4 := NULLIF(NEW.action_4, '');
    NEW.action_5 := NULLIF(NEW.action_5, '');

    NEW.objective := COALESCE(NULLIF(NEW.objective, ''), NULLIF(NEW.meta_6m, ''), NULLIF(NEW.meta_12m, ''), NULLIF(NEW.meta_24m, ''), 'Definir horizonte principal');
    NEW.action := COALESCE(NULLIF(NEW.action, ''), NULLIF(NEW.action_1, ''), NULLIF(NEW.action_2, ''), NULLIF(NEW.action_3, ''), NULLIF(NEW.action_4, ''), NULLIF(NEW.action_5, ''), 'Definir ação prioritária');

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column_canonical()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- ============================================================
-- Section 9: VIEWS
-- ============================================================

CREATE OR REPLACE VIEW public.view_daily_team_status AS
 WITH reference_clock AS (
         SELECT ((timezone('America/Sao_Paulo'::text, now()))::date - 1) AS reference_date
        )
 SELECT ss.store_id,
    s.name AS store_name,
    ss.seller_user_id AS seller_id,
    u.name AS seller_name,
    rc.reference_date,
    dc.id AS checkin_id,
    (dc.id IS NULL) AS sem_registro,
    dc.submission_status,
    dc.submitted_at,
    dc.submitted_late,
    ss.started_at,
    ss.ended_at,
    ss.closing_month_grace
   FROM ((((store_sellers ss
     JOIN users u ON ((u.id = ss.seller_user_id)))
     JOIN stores s ON ((s.id = ss.store_id)))
     CROSS JOIN reference_clock rc)
     LEFT JOIN daily_checkins dc ON (((dc.seller_user_id = ss.seller_user_id) AND (dc.store_id = ss.store_id) AND (dc.reference_date = rc.reference_date) AND (dc.metric_scope = 'daily'::checkin_scope))))
  WHERE ((ss.is_active = true) AND (ss.started_at <= rc.reference_date) AND ((ss.ended_at IS NULL) OR (ss.ended_at >= rc.reference_date)));

CREATE OR REPLACE VIEW public.view_seller_tenure_status AS
 SELECT ss.id AS tenure_id,
    ss.store_id,
    s.name AS store_name,
    ss.seller_user_id,
    u.name AS seller_name,
    ss.started_at,
    ss.ended_at,
    ss.is_active,
    ss.closing_month_grace,
        CASE
            WHEN (ss.is_active AND ((ss.ended_at IS NULL) OR (ss.ended_at >= (timezone('America/Sao_Paulo'::text, now()))::date))) THEN 'ativo'::text
            ELSE 'encerrado'::text
        END AS tenure_status,
    (timezone('America/Sao_Paulo'::text, now()))::date AS operational_date
   FROM ((store_sellers ss
     JOIN users u ON ((u.id = ss.seller_user_id)))
     JOIN stores s ON ((s.id = ss.store_id)));

CREATE OR REPLACE VIEW public.view_sem_registro AS
 SELECT ss.store_id,
    ss.seller_user_id,
    CURRENT_DATE AS reference_date,
    ss.started_at,
    ss.closing_month_grace
   FROM (store_sellers ss
     LEFT JOIN daily_checkins dc ON (((dc.seller_user_id = ss.seller_user_id) AND (dc.store_id = ss.store_id) AND (dc.reference_date = CURRENT_DATE))))
  WHERE ((ss.is_active = true) AND (ss.started_at <= CURRENT_DATE) AND ((ss.ended_at IS NULL) OR (ss.ended_at >= CURRENT_DATE)) AND (dc.id IS NULL));

CREATE OR REPLACE VIEW public.view_store_daily_production AS
 SELECT dc.store_id,
    dc.reference_date,
    sum(dc.leads_prev_day) AS total_leads,
    sum(dc.visit_prev_day) AS total_visits,
    sum((dc.agd_cart_today + dc.agd_net_today)) AS total_agendamentos,
    sum(
        CASE
            WHEN COALESCE(u.is_venda_loja, false) THEN
            CASE
                WHEN COALESCE(smr.include_venda_loja_in_store_total, true) THEN ((dc.vnd_porta_prev_day + dc.vnd_cart_prev_day) + dc.vnd_net_prev_day)
                ELSE 0
            END
            ELSE ((dc.vnd_porta_prev_day + dc.vnd_cart_prev_day) + dc.vnd_net_prev_day)
        END) AS total_vendas
   FROM ((daily_checkins dc
     JOIN users u ON ((u.id = dc.seller_user_id)))
     LEFT JOIN store_meta_rules smr ON ((smr.store_id = dc.store_id)))
  GROUP BY dc.store_id, dc.reference_date;

-- ============================================================
-- Section 10: ENABLE RLS
-- ============================================================

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_client_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_google_oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_methodology_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_lead_volumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_routine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_acoes_sugeridas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_avaliacoes_competencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_competencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_descritores_escala ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_frases_inspiracionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_niveis_cargo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_objetivos_pessoais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_plano_acao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reprocess_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_delivery_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_meta_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_feedback_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_share_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Section 11: RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow read access for all" ON public.agencies;
CREATE POLICY "Allow read access for all" ON public.agencies AS PERMISSIVE FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can view their own agency" ON public.agencies;
CREATE POLICY "Users can view their own agency" ON public.agencies AS PERMISSIVE FOR SELECT TO public USING ((id = get_user_agency_id()));

DROP POLICY IF EXISTS "audit_insert" ON public.audit_logs;
CREATE POLICY "audit_insert" ON public.audit_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "audit_select" ON public.audit_logs;
CREATE POLICY "audit_select" ON public.audit_logs AS PERMISSIVE FOR SELECT TO authenticated USING (is_consultor());

DROP POLICY IF EXISTS "Automation access for authenticated" ON public.automation_configs;
CREATE POLICY "Automation access for authenticated" ON public.automation_configs AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Automation access for authenticated anon" ON public.automation_configs;
CREATE POLICY "Automation access for authenticated anon" ON public.automation_configs AS PERMISSIVE FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "role_matrix_benchmarks_select" ON public.benchmarks;
CREATE POLICY "role_matrix_benchmarks_select" ON public.benchmarks AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT is_admin() AS is_admin) OR ( SELECT is_owner_of(benchmarks.store_id) AS is_owner_of) OR ( SELECT is_manager_of(benchmarks.store_id) AS is_manager_of)));

DROP POLICY IF EXISTS "role_matrix_benchmarks_write" ON public.benchmarks;
CREATE POLICY "role_matrix_benchmarks_write" ON public.benchmarks AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));

DROP POLICY IF EXISTS "admin_manager_view_logs" ON public.checkin_audit_logs;
CREATE POLICY "admin_manager_view_logs" ON public.checkin_audit_logs AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'dono'::text, 'gerente'::text]))))));

DROP POLICY IF EXISTS "manager_view_store_requests" ON public.checkin_correction_requests;
CREATE POLICY "manager_view_store_requests" ON public.checkin_correction_requests AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1 FROM memberships WHERE ((memberships.user_id = auth.uid()) AND (memberships.store_id = checkin_correction_requests.store_id) AND (memberships.role = ANY (ARRAY['gerente'::text, 'dono'::text]))))));

DROP POLICY IF EXISTS "seller_manage_own_requests" ON public.checkin_correction_requests;
CREATE POLICY "seller_manage_own_requests" ON public.checkin_correction_requests AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = seller_id));

DROP POLICY IF EXISTS "Comms access for authenticated" ON public.communication_instances;
CREATE POLICY "Comms access for authenticated" ON public.communication_instances AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Comms access for authenticated anon" ON public.communication_instances;
CREATE POLICY "Comms access for authenticated anon" ON public.communication_instances AS PERMISSIVE FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "consulting_assignments_select" ON public.consulting_assignments;
CREATE POLICY "consulting_assignments_select" ON public.consulting_assignments AS PERMISSIVE FOR SELECT TO authenticated USING ((is_admin() OR can_access_consulting_client(client_id)));

DROP POLICY IF EXISTS "consulting_assignments_write" ON public.consulting_assignments;
CREATE POLICY "consulting_assignments_write" ON public.consulting_assignments AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "calendar_settings_owner_all" ON public.consulting_calendar_settings;
CREATE POLICY "calendar_settings_owner_all" ON public.consulting_calendar_settings AS PERMISSIVE FOR ALL TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "consulting_client_contacts_select" ON public.consulting_client_contacts;
CREATE POLICY "consulting_client_contacts_select" ON public.consulting_client_contacts AS PERMISSIVE FOR SELECT TO authenticated USING (can_access_consulting_client(client_id));

DROP POLICY IF EXISTS "consulting_client_contacts_write" ON public.consulting_client_contacts;
CREATE POLICY "consulting_client_contacts_write" ON public.consulting_client_contacts AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "consulting_client_units_select" ON public.consulting_client_units;
CREATE POLICY "consulting_client_units_select" ON public.consulting_client_units AS PERMISSIVE FOR SELECT TO authenticated USING (can_access_consulting_client(client_id));

DROP POLICY IF EXISTS "consulting_client_units_write" ON public.consulting_client_units;
CREATE POLICY "consulting_client_units_write" ON public.consulting_client_units AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "consulting_clients_delete" ON public.consulting_clients;
CREATE POLICY "consulting_clients_delete" ON public.consulting_clients AS PERMISSIVE FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "consulting_clients_insert" ON public.consulting_clients;
CREATE POLICY "consulting_clients_insert" ON public.consulting_clients AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "consulting_clients_select" ON public.consulting_clients;
CREATE POLICY "consulting_clients_select" ON public.consulting_clients AS PERMISSIVE FOR SELECT TO authenticated USING (can_access_consulting_client(id));

DROP POLICY IF EXISTS "consulting_clients_update" ON public.consulting_clients;
CREATE POLICY "consulting_clients_update" ON public.consulting_clients AS PERMISSIVE FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "consulting_financials_select" ON public.consulting_financials;
CREATE POLICY "consulting_financials_select" ON public.consulting_financials AS PERMISSIVE FOR SELECT TO authenticated USING (can_access_consulting_client(client_id));

DROP POLICY IF EXISTS "consulting_financials_write" ON public.consulting_financials;
CREATE POLICY "consulting_financials_write" ON public.consulting_financials AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "oauth_states_owner_all" ON public.consulting_google_oauth_states;
CREATE POLICY "oauth_states_owner_all" ON public.consulting_google_oauth_states AS PERMISSIVE FOR ALL TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "consulting_methodology_select" ON public.consulting_methodology_steps;
CREATE POLICY "consulting_methodology_select" ON public.consulting_methodology_steps AS PERMISSIVE FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "oauth_tokens_owner_only" ON public.consulting_oauth_tokens;
CREATE POLICY "oauth_tokens_owner_only" ON public.consulting_oauth_tokens AS PERMISSIVE FOR ALL TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "consulting_visits_select" ON public.consulting_visits;
CREATE POLICY "consulting_visits_select" ON public.consulting_visits AS PERMISSIVE FOR SELECT TO authenticated USING (can_access_consulting_client(client_id));

DROP POLICY IF EXISTS "consulting_visits_write" ON public.consulting_visits;
CREATE POLICY "consulting_visits_write" ON public.consulting_visits AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "daily_checkins_select" ON public.daily_checkins;
CREATE POLICY "daily_checkins_select" ON public.daily_checkins AS PERMISSIVE FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "role_matrix_daily_checkins_insert" ON public.daily_checkins;
CREATE POLICY "role_matrix_daily_checkins_insert" ON public.daily_checkins AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((seller_user_id = ( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "role_matrix_daily_checkins_select" ON public.daily_checkins;
CREATE POLICY "role_matrix_daily_checkins_select" ON public.daily_checkins AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT is_admin() AS is_admin) OR is_owner_of(store_id) OR is_manager_of(store_id) OR (seller_user_id = auth.uid())));

DROP POLICY IF EXISTS "role_matrix_daily_checkins_update" ON public.daily_checkins;
CREATE POLICY "role_matrix_daily_checkins_update" ON public.daily_checkins AS PERMISSIVE FOR UPDATE TO authenticated USING ((seller_user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((seller_user_id = ( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "Allow read access for all" ON public.daily_lead_volumes;
CREATE POLICY "Allow read access for all" ON public.daily_lead_volumes AS PERMISSIVE FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "DLV access for authenticated" ON public.daily_lead_volumes;
CREATE POLICY "DLV access for authenticated" ON public.daily_lead_volumes AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "DLV access for authenticated anon" ON public.daily_lead_volumes;
CREATE POLICY "DLV access for authenticated anon" ON public.daily_lead_volumes AS PERMISSIVE FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "role_matrix_digital_products_select" ON public.digital_products;
CREATE POLICY "role_matrix_digital_products_select" ON public.digital_products AS PERMISSIVE FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "role_matrix_digital_products_write" ON public.digital_products;
CREATE POLICY "role_matrix_digital_products_write" ON public.digital_products AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));

DROP POLICY IF EXISTS "role_matrix_feedbacks_insert" ON public.feedbacks;
CREATE POLICY "role_matrix_feedbacks_insert" ON public.feedbacks AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT is_admin() AS is_admin) OR ( SELECT is_manager_of(feedbacks.store_id) AS is_manager_of)));

DROP POLICY IF EXISTS "role_matrix_feedbacks_select" ON public.feedbacks;
CREATE POLICY "role_matrix_feedbacks_select" ON public.feedbacks AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT is_admin() AS is_admin) OR ( SELECT is_owner_of(feedbacks.store_id) AS is_owner_of) OR ( SELECT is_manager_of(feedbacks.store_id) AS is_manager_of) OR (seller_id = ( SELECT auth.uid() AS uid))));

DROP POLICY IF EXISTS "role_matrix_feedbacks_update" ON public.feedbacks;
CREATE POLICY "role_matrix_feedbacks_update" ON public.feedbacks AS PERMISSIVE FOR UPDATE TO authenticated USING ((( SELECT is_admin() AS is_admin) OR ( SELECT is_manager_of(feedbacks.store_id) AS is_manager_of) OR (seller_id = ( SELECT auth.uid() AS uid)))) WITH CHECK ((( SELECT is_admin() AS is_admin) OR ( SELECT is_manager_of(feedbacks.store_id) AS is_manager_of) OR (seller_id = ( SELECT auth.uid() AS uid))));

DROP POLICY IF EXISTS "goal_logs_insert" ON public.goal_logs;
CREATE POLICY "goal_logs_insert" ON public.goal_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "goal_logs_select" ON public.goal_logs;
CREATE POLICY "goal_logs_select" ON public.goal_logs AS PERMISSIVE FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "role_matrix_goals_insert" ON public.goals;
CREATE POLICY "role_matrix_goals_insert" ON public.goals AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT is_admin() AS is_admin) OR ( SELECT is_manager_of(goals.store_id) AS is_manager_of)));

DROP POLICY IF EXISTS "role_matrix_goals_select" ON public.goals;
CREATE POLICY "role_matrix_goals_select" ON public.goals AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT is_admin() AS is_admin) OR ( SELECT is_owner_of(goals.store_id) AS is_owner_of) OR ( SELECT is_manager_of(goals.store_id) AS is_manager_of) OR (user_id = ( SELECT auth.uid() AS uid))));

DROP POLICY IF EXISTS "role_matrix_goals_update" ON public.goals;
CREATE POLICY "role_matrix_goals_update" ON public.goals AS PERMISSIVE FOR UPDATE TO authenticated USING ((( SELECT is_admin() AS is_admin) OR ( SELECT is_manager_of(goals.store_id) AS is_manager_of))) WITH CHECK ((( SELECT is_admin() AS is_admin) OR ( SELECT is_manager_of(goals.store_id) AS is_manager_of)));

DROP POLICY IF EXISTS "Inventory access for authenticated" ON public.inventory;
CREATE POLICY "Inventory access for authenticated" ON public.inventory AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Inventory access for authenticated anon" ON public.inventory;
CREATE POLICY "Inventory access for authenticated anon" ON public.inventory AS PERMISSIVE FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "role_matrix_manager_routine_logs_delete" ON public.manager_routine_logs;
CREATE POLICY "role_matrix_manager_routine_logs_delete" ON public.manager_routine_logs AS PERMISSIVE FOR DELETE TO authenticated USING (( SELECT is_admin() AS is_admin));

DROP POLICY IF EXISTS "role_matrix_manager_routine_logs_insert" ON public.manager_routine_logs;
CREATE POLICY "role_matrix_manager_routine_logs_insert" ON public.manager_routine_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT is_admin() AS is_admin) OR (( SELECT is_manager_of(manager_routine_logs.store_id) AS is_manager_of) AND (manager_id = ( SELECT auth.uid() AS uid)))));

DROP POLICY IF EXISTS "role_matrix_manager_routine_logs_select" ON public.manager_routine_logs;
CREATE POLICY "role_matrix_manager_routine_logs_select" ON public.manager_routine_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT is_admin() AS is_admin) OR ( SELECT is_owner_of(manager_routine_logs.store_id) AS is_owner_of) OR ( SELECT is_manager_of(manager_routine_logs.store_id) AS is_manager_of)));

DROP POLICY IF EXISTS "role_matrix_manager_routine_logs_update" ON public.manager_routine_logs;
CREATE POLICY "role_matrix_manager_routine_logs_update" ON public.manager_routine_logs AS PERMISSIVE FOR UPDATE TO authenticated USING ((( SELECT is_admin() AS is_admin) OR (( SELECT is_manager_of(manager_routine_logs.store_id) AS is_manager_of) AND (manager_id = ( SELECT auth.uid() AS uid))))) WITH CHECK ((( SELECT is_admin() AS is_admin) OR (( SELECT is_manager_of(manager_routine_logs.store_id) AS is_manager_of) AND (manager_id = ( SELECT auth.uid() AS uid)))));

DROP POLICY IF EXISTS "Managers can view store memberships" ON public.memberships;
CREATE POLICY "Managers can view store memberships" ON public.memberships AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT is_manager_of(memberships.store_id) AS is_manager_of) OR ( SELECT is_owner_of(memberships.store_id) AS is_owner_of)));

DROP POLICY IF EXISTS "Users can view their own memberships" ON public.memberships;
CREATE POLICY "Users can view their own memberships" ON public.memberships AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));

DROP POLICY IF EXISTS "role_matrix_memberships_select" ON public.memberships;
CREATE POLICY "role_matrix_memberships_select" ON public.memberships AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT is_admin() AS is_admin) OR (user_id = auth.uid()) OR is_owner_of(store_id) OR is_manager_of(store_id)));

DROP POLICY IF EXISTS "role_matrix_memberships_write" ON public.memberships;
CREATE POLICY "role_matrix_memberships_write" ON public.memberships AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));

DROP POLICY IF EXISTS "reconciled_notification_reads_insert" ON public.notification_reads;
CREATE POLICY "reconciled_notification_reads_insert" ON public.notification_reads AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_admin() OR (user_id = auth.uid())));

DROP POLICY IF EXISTS "reconciled_notification_reads_select" ON public.notification_reads;
CREATE POLICY "reconciled_notification_reads_select" ON public.notification_reads AS PERMISSIVE FOR SELECT TO authenticated USING ((is_admin() OR (user_id = auth.uid())));

DROP POLICY IF EXISTS "reconciled_notifications_delete" ON public.notifications;
CREATE POLICY "reconciled_notifications_delete" ON public.notifications AS PERMISSIVE FOR DELETE TO authenticated USING ((is_admin() OR (recipient_id = auth.uid())));

DROP POLICY IF EXISTS "reconciled_notifications_insert" ON public.notifications;
CREATE POLICY "reconciled_notifications_insert" ON public.notifications AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_admin() OR ((store_id IS NOT NULL) AND is_manager_of(store_id)) OR (recipient_id = auth.uid())));

DROP POLICY IF EXISTS "reconciled_notifications_select" ON public.notifications;
CREATE POLICY "reconciled_notifications_select" ON public.notifications AS PERMISSIVE FOR SELECT TO authenticated USING ((is_admin() OR (recipient_id = auth.uid())));

DROP POLICY IF EXISTS "reconciled_notifications_update" ON public.notifications;
CREATE POLICY "reconciled_notifications_update" ON public.notifications AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_admin() OR (recipient_id = auth.uid()))) WITH CHECK ((is_admin() OR (recipient_id = auth.uid())));

DROP POLICY IF EXISTS "Leitura de catálogos para usuários autenticados" ON public.pdi_acoes_sugeridas;
CREATE POLICY "Leitura de catálogos para usuários autenticados" ON public.pdi_acoes_sugeridas AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));

DROP POLICY IF EXISTS "Acesso as avaliacoes via sessao" ON public.pdi_avaliacoes_competencia;
CREATE POLICY "Acesso as avaliacoes via sessao" ON public.pdi_avaliacoes_competencia AS PERMISSIVE FOR ALL TO public USING ((sessao_id IN ( SELECT pdi_sessoes.id FROM pdi_sessoes WHERE ((pdi_sessoes.colaborador_id = auth.uid()) OR (pdi_sessoes.gerente_id = auth.uid())))));

DROP POLICY IF EXISTS "Leitura de catálogos para usuários autenticados" ON public.pdi_competencias;
CREATE POLICY "Leitura de catálogos para usuários autenticados" ON public.pdi_competencias AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));

DROP POLICY IF EXISTS "Leitura de catálogos para usuários autenticados" ON public.pdi_descritores_escala;
CREATE POLICY "Leitura de catálogos para usuários autenticados" ON public.pdi_descritores_escala AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));

DROP POLICY IF EXISTS "Leitura de catálogos para usuários autenticados" ON public.pdi_frases_inspiracionais;
CREATE POLICY "Leitura de catálogos para usuários autenticados" ON public.pdi_frases_inspiracionais AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));

DROP POLICY IF EXISTS "Acesso as metas via sessao" ON public.pdi_metas;
CREATE POLICY "Acesso as metas via sessao" ON public.pdi_metas AS PERMISSIVE FOR ALL TO public USING ((sessao_id IN ( SELECT pdi_sessoes.id FROM pdi_sessoes WHERE ((pdi_sessoes.colaborador_id = auth.uid()) OR (pdi_sessoes.gerente_id = auth.uid())))));

DROP POLICY IF EXISTS "Leitura de catálogos para usuários autenticados" ON public.pdi_niveis_cargo;
CREATE POLICY "Leitura de catálogos para usuários autenticados" ON public.pdi_niveis_cargo AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));

DROP POLICY IF EXISTS "Acesso aos obj pessoais via sessao" ON public.pdi_objetivos_pessoais;
CREATE POLICY "Acesso aos obj pessoais via sessao" ON public.pdi_objetivos_pessoais AS PERMISSIVE FOR ALL TO public USING ((sessao_id IN ( SELECT pdi_sessoes.id FROM pdi_sessoes WHERE ((pdi_sessoes.colaborador_id = auth.uid()) OR (pdi_sessoes.gerente_id = auth.uid())))));

DROP POLICY IF EXISTS "Acesso ao plano via sessao" ON public.pdi_plano_acao;
CREATE POLICY "Acesso ao plano via sessao" ON public.pdi_plano_acao AS PERMISSIVE FOR ALL TO public USING ((sessao_id IN ( SELECT pdi_sessoes.id FROM pdi_sessoes WHERE ((pdi_sessoes.colaborador_id = auth.uid()) OR (pdi_sessoes.gerente_id = auth.uid())))));

DROP POLICY IF EXISTS "reconciled_pdi_reviews_insert" ON public.pdi_reviews;
CREATE POLICY "reconciled_pdi_reviews_insert" ON public.pdi_reviews AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_admin() OR (EXISTS ( SELECT 1 FROM pdis p WHERE ((p.id = pdi_reviews.pdi_id) AND is_manager_of(p.store_id))))));

DROP POLICY IF EXISTS "reconciled_pdi_reviews_select" ON public.pdi_reviews;
CREATE POLICY "reconciled_pdi_reviews_select" ON public.pdi_reviews AS PERMISSIVE FOR SELECT TO authenticated USING ((is_admin() OR (EXISTS ( SELECT 1 FROM pdis p WHERE ((p.id = pdi_reviews.pdi_id) AND (is_owner_of(p.store_id) OR is_manager_of(p.store_id) OR (p.seller_id = auth.uid())))))));

DROP POLICY IF EXISTS "Gerente ve sessoes que criou" ON public.pdi_sessoes;
CREATE POLICY "Gerente ve sessoes que criou" ON public.pdi_sessoes AS PERMISSIVE FOR ALL TO public USING ((gerente_id = auth.uid()));

DROP POLICY IF EXISTS "Vendedor ve suas sessoes" ON public.pdi_sessoes;
CREATE POLICY "Vendedor ve suas sessoes" ON public.pdi_sessoes AS PERMISSIVE FOR SELECT TO public USING ((colaborador_id = auth.uid()));

DROP POLICY IF EXISTS "role_matrix_pdis_insert" ON public.pdis;
CREATE POLICY "role_matrix_pdis_insert" ON public.pdis AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT is_admin() AS is_admin) OR ( SELECT is_manager_of(pdis.store_id) AS is_manager_of)));

DROP POLICY IF EXISTS "role_matrix_pdis_select" ON public.pdis;
CREATE POLICY "role_matrix_pdis_select" ON public.pdis AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT is_admin() AS is_admin) OR ( SELECT is_owner_of(pdis.store_id) AS is_owner_of) OR ( SELECT is_manager_of(pdis.store_id) AS is_manager_of) OR (seller_id = ( SELECT auth.uid() AS uid))));

DROP POLICY IF EXISTS "role_matrix_pdis_update" ON public.pdis;
CREATE POLICY "role_matrix_pdis_update" ON public.pdis AS PERMISSIVE FOR UPDATE TO authenticated USING ((( SELECT is_admin() AS is_admin) OR ( SELECT is_manager_of(pdis.store_id) AS is_manager_of) OR (seller_id = ( SELECT auth.uid() AS uid)))) WITH CHECK ((( SELECT is_admin() AS is_admin) OR ( SELECT is_manager_of(pdis.store_id) AS is_manager_of) OR (seller_id = ( SELECT auth.uid() AS uid))));

DROP POLICY IF EXISTS "role_matrix_raw_imports_admin" ON public.raw_imports;
CREATE POLICY "role_matrix_raw_imports_admin" ON public.raw_imports AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));

DROP POLICY IF EXISTS "Report history access for authenticated" ON public.report_history;
CREATE POLICY "Report history access for authenticated" ON public.report_history AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Report history access for authenticated anon" ON public.report_history;
CREATE POLICY "Report history access for authenticated anon" ON public.report_history AS PERMISSIVE FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "role_matrix_reprocess_logs_select" ON public.reprocess_logs;
CREATE POLICY "role_matrix_reprocess_logs_select" ON public.reprocess_logs AS PERMISSIVE FOR SELECT TO authenticated USING (( SELECT is_admin() AS is_admin));

DROP POLICY IF EXISTS "role_matrix_reprocess_logs_write" ON public.reprocess_logs;
CREATE POLICY "role_matrix_reprocess_logs_write" ON public.reprocess_logs AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));

DROP POLICY IF EXISTS "role_matrix_store_benchmarks_select" ON public.store_benchmarks;
CREATE POLICY "role_matrix_store_benchmarks_select" ON public.store_benchmarks AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT is_admin() AS is_admin) OR ( SELECT is_owner_of(store_benchmarks.store_id) AS is_owner_of) OR ( SELECT is_manager_of(store_benchmarks.store_id) AS is_manager_of)));

DROP POLICY IF EXISTS "role_matrix_store_benchmarks_write" ON public.store_benchmarks;
CREATE POLICY "role_matrix_store_benchmarks_write" ON public.store_benchmarks AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));

DROP POLICY IF EXISTS "role_matrix_store_delivery_rules_select" ON public.store_delivery_rules;
CREATE POLICY "role_matrix_store_delivery_rules_select" ON public.store_delivery_rules AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT is_admin() AS is_admin) OR ( SELECT is_owner_of(store_delivery_rules.store_id) AS is_owner_of) OR ( SELECT is_manager_of(store_delivery_rules.store_id) AS is_manager_of)));

DROP POLICY IF EXISTS "role_matrix_store_delivery_rules_write" ON public.store_delivery_rules;
CREATE POLICY "role_matrix_store_delivery_rules_write" ON public.store_delivery_rules AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));

DROP POLICY IF EXISTS "role_matrix_store_meta_rules_select" ON public.store_meta_rules;
CREATE POLICY "role_matrix_store_meta_rules_select" ON public.store_meta_rules AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT is_admin() AS is_admin) OR (EXISTS ( SELECT 1 FROM memberships WHERE ((memberships.user_id = auth.uid()) AND (memberships.store_id = store_meta_rules.store_id))))));

DROP POLICY IF EXISTS "role_matrix_store_meta_rules_write" ON public.store_meta_rules;
CREATE POLICY "role_matrix_store_meta_rules_write" ON public.store_meta_rules AS PERMISSIVE FOR ALL TO authenticated USING ((( SELECT is_admin() AS is_admin) OR ( SELECT is_manager_of(store_meta_rules.store_id) AS is_manager_of))) WITH CHECK ((( SELECT is_admin() AS is_admin) OR ( SELECT is_manager_of(store_meta_rules.store_id) AS is_manager_of)));

DROP POLICY IF EXISTS "role_matrix_store_sellers_select" ON public.store_sellers;
CREATE POLICY "role_matrix_store_sellers_select" ON public.store_sellers AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT is_admin() AS is_admin) OR ( SELECT is_owner_of(store_sellers.store_id) AS is_owner_of) OR ( SELECT is_manager_of(store_sellers.store_id) AS is_manager_of) OR (seller_user_id = ( SELECT auth.uid() AS uid))));

DROP POLICY IF EXISTS "role_matrix_store_sellers_write" ON public.store_sellers;
CREATE POLICY "role_matrix_store_sellers_write" ON public.store_sellers AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));

DROP POLICY IF EXISTS "store_sellers_select" ON public.store_sellers;
CREATE POLICY "store_sellers_select" ON public.store_sellers AS PERMISSIVE FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "role_matrix_stores_delete" ON public.stores;
CREATE POLICY "role_matrix_stores_delete" ON public.stores AS PERMISSIVE FOR DELETE TO authenticated USING (( SELECT is_admin() AS is_admin));

DROP POLICY IF EXISTS "role_matrix_stores_insert" ON public.stores;
CREATE POLICY "role_matrix_stores_insert" ON public.stores AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (( SELECT is_admin() AS is_admin));

DROP POLICY IF EXISTS "role_matrix_stores_select" ON public.stores;
CREATE POLICY "role_matrix_stores_select" ON public.stores AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT is_admin() AS is_admin) OR is_member_of(id)));

DROP POLICY IF EXISTS "role_matrix_stores_update" ON public.stores;
CREATE POLICY "role_matrix_stores_update" ON public.stores AS PERMISSIVE FOR UPDATE TO authenticated USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));

DROP POLICY IF EXISTS "reconciled_training_progress_delete" ON public.training_progress;
CREATE POLICY "reconciled_training_progress_delete" ON public.training_progress AS PERMISSIVE FOR DELETE TO authenticated USING ((is_admin() OR (user_id = auth.uid())));

DROP POLICY IF EXISTS "reconciled_training_progress_insert" ON public.training_progress;
CREATE POLICY "reconciled_training_progress_insert" ON public.training_progress AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_admin() OR (user_id = auth.uid())));

DROP POLICY IF EXISTS "reconciled_training_progress_select" ON public.training_progress;
CREATE POLICY "reconciled_training_progress_select" ON public.training_progress AS PERMISSIVE FOR SELECT TO authenticated USING ((is_admin() OR (user_id = auth.uid()) OR (EXISTS ( SELECT 1 FROM memberships m WHERE ((m.user_id = training_progress.user_id) AND (is_manager_of(m.store_id) OR is_owner_of(m.store_id)))))));

DROP POLICY IF EXISTS "reconciled_training_progress_update" ON public.training_progress;
CREATE POLICY "reconciled_training_progress_update" ON public.training_progress AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_admin() OR (user_id = auth.uid()))) WITH CHECK ((is_admin() OR (user_id = auth.uid())));

DROP POLICY IF EXISTS "role_matrix_trainings_select" ON public.trainings;
CREATE POLICY "role_matrix_trainings_select" ON public.trainings AS PERMISSIVE FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "role_matrix_trainings_write" ON public.trainings;
CREATE POLICY "role_matrix_trainings_write" ON public.trainings AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
CREATE POLICY "Admins can view all profiles" ON public.users AS PERMISSIVE FOR SELECT TO authenticated USING (( SELECT is_admin() AS is_admin));

DROP POLICY IF EXISTS "Public profiles for authenticated" ON public.users;
CREATE POLICY "Public profiles for authenticated" ON public.users AS PERMISSIVE FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users AS PERMISSIVE FOR SELECT TO authenticated USING ((id = auth.uid()));

DROP POLICY IF EXISTS "users_insert" ON public.users;
CREATE POLICY "users_insert" ON public.users AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users AS PERMISSIVE FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users AS PERMISSIVE FOR UPDATE TO authenticated USING ((id = auth.uid()));

DROP POLICY IF EXISTS "role_matrix_weekly_feedback_reports_delete" ON public.weekly_feedback_reports;
CREATE POLICY "role_matrix_weekly_feedback_reports_delete" ON public.weekly_feedback_reports AS PERMISSIVE FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "role_matrix_weekly_feedback_reports_insert" ON public.weekly_feedback_reports;
CREATE POLICY "role_matrix_weekly_feedback_reports_insert" ON public.weekly_feedback_reports AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_admin() OR is_manager_of(store_id)));

DROP POLICY IF EXISTS "role_matrix_weekly_feedback_reports_select" ON public.weekly_feedback_reports;
CREATE POLICY "role_matrix_weekly_feedback_reports_select" ON public.weekly_feedback_reports AS PERMISSIVE FOR SELECT TO authenticated USING ((is_admin() OR is_owner_of(store_id) OR is_manager_of(store_id)));

DROP POLICY IF EXISTS "role_matrix_weekly_feedback_reports_update" ON public.weekly_feedback_reports;
CREATE POLICY "role_matrix_weekly_feedback_reports_update" ON public.weekly_feedback_reports AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_admin() OR is_manager_of(store_id))) WITH CHECK ((is_admin() OR is_manager_of(store_id)));

DROP POLICY IF EXISTS "role_matrix_whatsapp_share_logs_delete" ON public.whatsapp_share_logs;
CREATE POLICY "role_matrix_whatsapp_share_logs_delete" ON public.whatsapp_share_logs AS PERMISSIVE FOR DELETE TO authenticated USING (( SELECT is_admin() AS is_admin));

DROP POLICY IF EXISTS "role_matrix_whatsapp_share_logs_insert" ON public.whatsapp_share_logs;
CREATE POLICY "role_matrix_whatsapp_share_logs_insert" ON public.whatsapp_share_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT is_admin() AS is_admin) OR (( SELECT is_manager_of(whatsapp_share_logs.store_id) AS is_manager_of) AND (user_id = ( SELECT auth.uid() AS uid)))));

DROP POLICY IF EXISTS "role_matrix_whatsapp_share_logs_select" ON public.whatsapp_share_logs;
CREATE POLICY "role_matrix_whatsapp_share_logs_select" ON public.whatsapp_share_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT is_admin() AS is_admin) OR ( SELECT is_owner_of(whatsapp_share_logs.store_id) AS is_owner_of) OR ( SELECT is_manager_of(whatsapp_share_logs.store_id) AS is_manager_of)));

DROP POLICY IF EXISTS "role_matrix_whatsapp_share_logs_update" ON public.whatsapp_share_logs;
CREATE POLICY "role_matrix_whatsapp_share_logs_update" ON public.whatsapp_share_logs AS PERMISSIVE FOR UPDATE TO authenticated USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));

-- ============================================================
-- Section 12: TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS update_consulting_assignments_updated_at ON public.consulting_assignments;
CREATE TRIGGER update_consulting_assignments_updated_at BEFORE UPDATE ON public.consulting_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_consulting_calendar_settings_updated_at ON public.consulting_calendar_settings;
CREATE TRIGGER update_consulting_calendar_settings_updated_at BEFORE UPDATE ON public.consulting_calendar_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_consulting_client_contacts_updated_at ON public.consulting_client_contacts;
CREATE TRIGGER update_consulting_client_contacts_updated_at BEFORE UPDATE ON public.consulting_client_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_consulting_client_units_updated_at ON public.consulting_client_units;
CREATE TRIGGER update_consulting_client_units_updated_at BEFORE UPDATE ON public.consulting_client_units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_consulting_clients_updated_at ON public.consulting_clients;
CREATE TRIGGER update_consulting_clients_updated_at BEFORE UPDATE ON public.consulting_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_consulting_financials_updated_at ON public.consulting_financials;
CREATE TRIGGER update_consulting_financials_updated_at BEFORE UPDATE ON public.consulting_financials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_consulting_google_oauth_states_updated_at ON public.consulting_google_oauth_states;
CREATE TRIGGER update_consulting_google_oauth_states_updated_at BEFORE UPDATE ON public.consulting_google_oauth_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_consulting_oauth_tokens_updated_at ON public.consulting_oauth_tokens;
CREATE TRIGGER update_consulting_oauth_tokens_updated_at BEFORE UPDATE ON public.consulting_oauth_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_consulting_visits_updated_at ON public.consulting_visits;
CREATE TRIGGER update_consulting_visits_updated_at BEFORE UPDATE ON public.consulting_visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS sync_daily_checkins_canonical ON public.daily_checkins;
CREATE TRIGGER sync_daily_checkins_canonical BEFORE INSERT OR UPDATE ON public.daily_checkins FOR EACH ROW EXECUTE FUNCTION sync_daily_checkins_canonical();

DROP TRIGGER IF EXISTS trg_checkins_updated ON public.daily_checkins;
CREATE TRIGGER trg_checkins_updated BEFORE UPDATE ON public.daily_checkins FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_daily_checkins_updated_at ON public.daily_checkins;
CREATE TRIGGER update_daily_checkins_updated_at BEFORE UPDATE ON public.daily_checkins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS feedbacks_seller_ack_only ON public.feedbacks;
CREATE TRIGGER feedbacks_seller_ack_only BEFORE UPDATE ON public.feedbacks FOR EACH ROW EXECUTE FUNCTION enforce_feedback_seller_ack_only();

DROP TRIGGER IF EXISTS trg_goals_updated ON public.goals;
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS manager_routine_logs_set_updated_at ON public.manager_routine_logs;
CREATE TRIGGER manager_routine_logs_set_updated_at BEFORE UPDATE ON public.manager_routine_logs FOR EACH ROW EXECUTE FUNCTION set_manager_routine_logs_updated_at();

DROP TRIGGER IF EXISTS tr_cleanup_orphans_on_membership_delete ON public.memberships;
CREATE TRIGGER tr_cleanup_orphans_on_membership_delete AFTER DELETE ON public.memberships FOR EACH ROW EXECUTE FUNCTION check_orphan_users_after_membership_deletion();

DROP TRIGGER IF EXISTS notifications_sync_notification_reads ON public.notifications;
CREATE TRIGGER notifications_sync_notification_reads AFTER INSERT OR UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION sync_notification_reads();

DROP TRIGGER IF EXISTS pdis_sync_legacy_shadow_columns ON public.pdis;
CREATE TRIGGER pdis_sync_legacy_shadow_columns BEFORE INSERT OR UPDATE ON public.pdis FOR EACH ROW EXECUTE FUNCTION sync_pdi_legacy_shadow_columns();

DROP TRIGGER IF EXISTS trg_pdis_updated ON public.pdis;
CREATE TRIGGER trg_pdis_updated BEFORE UPDATE ON public.pdis FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_store_benchmarks_updated_at ON public.store_benchmarks;
CREATE TRIGGER update_store_benchmarks_updated_at BEFORE UPDATE ON public.store_benchmarks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_store_delivery_rules_updated_at ON public.store_delivery_rules;
CREATE TRIGGER update_store_delivery_rules_updated_at BEFORE UPDATE ON public.store_delivery_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS tr_log_store_meta_rules_changes ON public.store_meta_rules;
CREATE TRIGGER tr_log_store_meta_rules_changes AFTER UPDATE ON public.store_meta_rules FOR EACH ROW EXECUTE FUNCTION log_store_meta_rules_changes();

DROP TRIGGER IF EXISTS update_store_meta_rules_updated_at ON public.store_meta_rules;
CREATE TRIGGER update_store_meta_rules_updated_at BEFORE UPDATE ON public.store_meta_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS tr_cleanup_orphans_on_store_seller_delete ON public.store_sellers;
CREATE TRIGGER tr_cleanup_orphans_on_store_seller_delete AFTER DELETE ON public.store_sellers FOR EACH ROW EXECUTE FUNCTION check_orphan_users_after_membership_deletion();

DROP TRIGGER IF EXISTS update_store_sellers_updated_at ON public.store_sellers;
CREATE TRIGGER update_store_sellers_updated_at BEFORE UPDATE ON public.store_sellers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_stores_updated_at ON public.stores;
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS weekly_feedback_reports_set_updated_at ON public.weekly_feedback_reports;
CREATE TRIGGER weekly_feedback_reports_set_updated_at BEFORE UPDATE ON public.weekly_feedback_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_canonical();

-- ============================================================
-- END OF BASELINE MIGRATION
-- ============================================================