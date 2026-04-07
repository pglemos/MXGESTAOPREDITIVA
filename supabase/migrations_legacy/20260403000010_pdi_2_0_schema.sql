-- Adicionando colunas de competências para o Radar PDI 2.0
ALTER TABLE public.pdis 
ADD COLUMN IF NOT EXISTS comp_prospeccao NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS comp_abordagem NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS comp_demonstracao NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS comp_fechamento NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS comp_crm NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS comp_digital NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS comp_disciplina NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS comp_organizacao NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS comp_negociacao NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS comp_produto NUMERIC DEFAULT 5;

-- Garantindo que meta_6m, meta_12m e meta_24m existam
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pdis' AND table_schema='public' AND column_name='meta_6m') THEN
        ALTER TABLE public.pdis ADD COLUMN meta_6m TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pdis' AND table_schema='public' AND column_name='meta_12m') THEN
        ALTER TABLE public.pdis ADD COLUMN meta_12m TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pdis' AND table_schema='public' AND column_name='meta_24m') THEN
        ALTER TABLE public.pdis ADD COLUMN meta_24m TEXT;
    END IF;
END $$;

-- Criando a tabela de reviews se não existir
CREATE TABLE IF NOT EXISTS public.pdi_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pdi_id UUID REFERENCES public.pdis(id) ON DELETE CASCADE,
    evolution TEXT NOT NULL,
    difficulties TEXT,
    adjustments TEXT,
    next_review_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitando RLS para a nova tabela
ALTER TABLE public.pdi_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para pdi_reviews (seguindo o padrão do PDI)
CREATE POLICY "Gerente can manage pdi_reviews"
    ON public.pdi_reviews FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.pdis p
            WHERE p.id = pdi_id
            AND EXISTS (
                SELECT 1 FROM public.memberships m
                WHERE m.user_id = auth.uid()
                AND m.store_id = p.store_id
                AND m.role = 'gerente'
            )
        )
    );

CREATE POLICY "Seller can view own pdi_reviews"
    ON public.pdi_reviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pdis p
            WHERE p.id = pdi_id
            AND p.seller_id = auth.uid()
        )
    );
