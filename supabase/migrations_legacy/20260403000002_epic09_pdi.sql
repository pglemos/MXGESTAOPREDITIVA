-- EPIC-09: Estrutura Completa de PDI
-- Metodologia MX

CREATE TABLE IF NOT EXISTS public.pdis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'aberto',
    meta_6m TEXT,
    meta_12m TEXT,
    meta_24m TEXT,
    capacities NUMERIC DEFAULT 5,
    action_1 TEXT,
    action_2 TEXT,
    action_3 TEXT,
    action_4 TEXT,
    action_5 TEXT,
    due_date DATE,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pdi_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pdi_id UUID REFERENCES public.pdis(id) ON DELETE CASCADE,
    evolution TEXT NOT NULL,
    difficulties TEXT,
    adjustments TEXT,
    next_review_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER update_pdis_updated_at BEFORE UPDATE ON public.pdis FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column_canonical();
