-- MX Gestão Preditiva CRM & Management System Schema (Canonical Domain)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'vendedor' CHECK (role IN ('admin', 'dono', 'gerente', 'vendedor')),
    avatar_url TEXT,
    is_venda_loja BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    phone TEXT
);

-- 2. stores
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    manager_email TEXT,
    active BOOLEAN DEFAULT TRUE,
    source_mode TEXT DEFAULT 'native_app' CHECK (source_mode IN ('legacy_forms', 'native_app', 'hybrid')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. memberships
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'vendedor' CHECK (role IN ('dono', 'gerente', 'vendedor')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. store_sellers (Vigência da Equipe)
CREATE TABLE IF NOT EXISTS public.store_sellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    seller_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    closing_month_grace BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. daily_checkins
CREATE TABLE IF NOT EXISTS public.daily_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    seller_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reference_date DATE NOT NULL DEFAULT CURRENT_DATE,
    submitted_late BOOLEAN DEFAULT FALSE,
    submission_status TEXT DEFAULT 'on_time',
    edit_locked_at TIMESTAMPTZ,
    metric_scope TEXT DEFAULT 'daily',
    leads_prev_day INTEGER DEFAULT 0,
    agd_cart_prev_day INTEGER DEFAULT 0,
    agd_net_prev_day INTEGER DEFAULT 0,
    agd_cart_today INTEGER DEFAULT 0,
    agd_net_today INTEGER DEFAULT 0,
    vnd_porta_prev_day INTEGER DEFAULT 0,
    vnd_cart_prev_day INTEGER DEFAULT 0,
    vnd_net_prev_day INTEGER DEFAULT 0,
    visit_prev_day INTEGER DEFAULT 0,
    zero_reason TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. store_benchmarks
CREATE TABLE IF NOT EXISTS public.store_benchmarks (
    store_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
    lead_to_agend NUMERIC(5,2) DEFAULT 20.00,
    agend_to_visit NUMERIC(5,2) DEFAULT 60.00,
    visit_to_sale NUMERIC(5,2) DEFAULT 33.00,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. store_delivery_rules
CREATE TABLE IF NOT EXISTS public.store_delivery_rules (
    store_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
    matinal_recipients TEXT[] DEFAULT '{}',
    weekly_recipients TEXT[] DEFAULT '{}',
    monthly_recipients TEXT[] DEFAULT '{}',
    whatsapp_group_ref TEXT,
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    active BOOLEAN DEFAULT TRUE,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. store_meta_rules
CREATE TABLE IF NOT EXISTS public.store_meta_rules (
    store_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
    monthly_goal NUMERIC(12,2) DEFAULT 0,
    individual_goal_mode TEXT DEFAULT 'even' CHECK (individual_goal_mode IN ('even', 'custom', 'proportional')),
    include_venda_loja_in_store_total BOOLEAN DEFAULT TRUE,
    include_venda_loja_in_individual_goal BOOLEAN DEFAULT FALSE,
    bench_lead_agd NUMERIC(5,2) DEFAULT 20.00,
    bench_agd_visita NUMERIC(5,2) DEFAULT 60.00,
    bench_visita_vnd NUMERIC(5,2) DEFAULT 33.00,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. reprocess_logs
CREATE TABLE IF NOT EXISTS public.reprocess_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    triggered_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    rows_processed INTEGER DEFAULT 0,
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    warnings JSONB DEFAULT '[]'::jsonb,
    errors JSONB DEFAULT '[]'::jsonb,
    error_log JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

-- 10. trainings
CREATE TABLE IF NOT EXISTS public.trainings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT,
    video_url TEXT NOT NULL,
    target_audience TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. training_progress
CREATE TABLE IF NOT EXISTS public.training_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    training_id UUID REFERENCES public.trainings(id) ON DELETE CASCADE,
    watched_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. feedbacks
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    week_reference TEXT,
    leads_week INTEGER DEFAULT 0,
    agd_week INTEGER DEFAULT 0,
    visit_week INTEGER DEFAULT 0,
    vnd_week INTEGER DEFAULT 0,
    tx_lead_agd NUMERIC(5,2) DEFAULT 0,
    tx_agd_visita NUMERIC(5,2) DEFAULT 0,
    tx_visita_vnd NUMERIC(5,2) DEFAULT 0,
    meta_compromisso NUMERIC(12,2) DEFAULT 0,
    positives TEXT,
    attention_points TEXT,
    action TEXT,
    notes TEXT,
    team_avg_json JSONB DEFAULT '{}'::jsonb,
    diagnostic_json JSONB DEFAULT '{}'::jsonb,
    commitment_suggested NUMERIC(12,2) DEFAULT 0,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. pdis
CREATE TABLE IF NOT EXISTS public.pdis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    comp_prospeccao INTEGER DEFAULT 5,
    comp_abordagem INTEGER DEFAULT 5,
    comp_demonstracao INTEGER DEFAULT 5,
    comp_fechamento INTEGER DEFAULT 5,
    comp_crm INTEGER DEFAULT 5,
    comp_digital INTEGER DEFAULT 5,
    comp_disciplina INTEGER DEFAULT 5,
    comp_organizacao INTEGER DEFAULT 5,
    comp_negociacao INTEGER DEFAULT 5,
    comp_produto INTEGER DEFAULT 5,
    meta_6m TEXT,
    meta_12m TEXT,
    meta_24m TEXT,
    action_1 TEXT,
    action_2 TEXT,
    action_3 TEXT,
    action_4 TEXT,
    action_5 TEXT,
    due_date DATE,
    status TEXT DEFAULT 'aberto',
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. pdi_reviews
CREATE TABLE IF NOT EXISTS public.pdi_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pdi_id UUID REFERENCES public.pdis(id) ON DELETE CASCADE,
    evolution TEXT,
    difficulties TEXT,
    adjustments TEXT,
    next_review_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    priority TEXT,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT,
    entity_id UUID,
    details_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. manager_routine_logs
CREATE TABLE IF NOT EXISTS public.manager_routine_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    routine_date DATE,
    reference_date DATE,
    checkins_pending_count INTEGER DEFAULT 0,
    sem_registro_count INTEGER DEFAULT 0,
    agd_cart_today INTEGER DEFAULT 0,
    agd_net_today INTEGER DEFAULT 0,
    previous_day_leads INTEGER DEFAULT 0,
    previous_day_sales INTEGER DEFAULT 0,
    ranking_snapshot JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    status TEXT DEFAULT 'completed',
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. whatsapp_share_logs
CREATE TABLE IF NOT EXISTS public.whatsapp_share_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reference_date DATE,
    source TEXT,
    message_text TEXT,
    shared_via TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_store_sellers_updated_at BEFORE UPDATE ON store_sellers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_daily_checkins_updated_at BEFORE UPDATE ON daily_checkins FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_store_benchmarks_updated_at BEFORE UPDATE ON store_benchmarks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_store_delivery_rules_updated_at BEFORE UPDATE ON store_delivery_rules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_store_meta_rules_updated_at BEFORE UPDATE ON store_meta_rules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_pdis_updated_at BEFORE UPDATE ON pdis FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_manager_routine_logs_updated_at BEFORE UPDATE ON manager_routine_logs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
