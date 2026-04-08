-- EPIC-01: Domínio e Dados Canônicos
-- Fonte de verdade operacional da Metodologia MX

-- 1. stores
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    source_mode TEXT DEFAULT 'native_app' CHECK (source_mode IN ('legacy_forms', 'native_app', 'hybrid')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. store_sellers (Vigência da Equipe)
CREATE TABLE IF NOT EXISTS public.store_sellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    seller_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    closing_month_grace BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. daily_checkins
CREATE TABLE IF NOT EXISTS public.daily_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    seller_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reference_date DATE NOT NULL DEFAULT CURRENT_DATE,
    leads_prev_day INTEGER DEFAULT 0,
    vnd_porta_prev_day INTEGER DEFAULT 0,
    agd_cart_today INTEGER DEFAULT 0,
    vnd_cart_prev_day INTEGER DEFAULT 0,
    agd_net_today INTEGER DEFAULT 0,
    vnd_net_prev_day INTEGER DEFAULT 0,
    visit_prev_day INTEGER DEFAULT 0,
    zero_reason TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. store_benchmarks
CREATE TABLE IF NOT EXISTS public.store_benchmarks (
    store_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
    lead_to_agend NUMERIC(5,2) DEFAULT 20.00,
    agend_to_visit NUMERIC(5,2) DEFAULT 60.00,
    visit_to_sale NUMERIC(5,2) DEFAULT 33.00,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. store_delivery_rules
CREATE TABLE IF NOT EXISTS public.store_delivery_rules (
    store_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
    matinal_recipients TEXT[] DEFAULT '{}',
    weekly_recipients TEXT[] DEFAULT '{}',
    whatsapp_group_ref TEXT,
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    active BOOLEAN DEFAULT TRUE,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. store_meta_rules
CREATE TABLE IF NOT EXISTS public.store_meta_rules (
    store_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
    monthly_goal NUMERIC(12,2) DEFAULT 0,
    individual_goal_mode TEXT DEFAULT 'even' CHECK (individual_goal_mode IN ('even', 'custom', 'proportional')),
    include_venda_loja_in_store_total BOOLEAN DEFAULT TRUE,
    include_venda_loja_in_individual_goal BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. reprocess_logs
CREATE TABLE IF NOT EXISTS public.reprocess_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    rows_processed INTEGER DEFAULT 0,
    warnings JSONB DEFAULT '[]'::jsonb,
    errors JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

-- 8. Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column_canonical()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column_canonical();
CREATE TRIGGER update_store_sellers_updated_at BEFORE UPDATE ON public.store_sellers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column_canonical();
CREATE TRIGGER update_daily_checkins_updated_at BEFORE UPDATE ON public.daily_checkins FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column_canonical();
CREATE TRIGGER update_store_benchmarks_updated_at BEFORE UPDATE ON public.store_benchmarks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column_canonical();
CREATE TRIGGER update_store_delivery_rules_updated_at BEFORE UPDATE ON public.store_delivery_rules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column_canonical();
CREATE TRIGGER update_store_meta_rules_updated_at BEFORE UPDATE ON public.store_meta_rules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column_canonical();
