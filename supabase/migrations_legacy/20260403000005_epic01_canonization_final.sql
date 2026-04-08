-- Migration: Canonização Final de Dados MX (Item 6)
-- story-purge-05-data-canonization

-- 6.2 Separar data de referência de registro e adicionar escopo
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checkin_scope') THEN
        CREATE TYPE public.checkin_scope AS ENUM ('daily', 'adjustment', 'historical');
    END IF;
END $$;

ALTER TABLE public.daily_checkins 
ADD COLUMN IF NOT EXISTS metric_scope public.checkin_scope DEFAULT 'daily';

-- 6.3 Tratar "VENDA LOJA" como entidade especial
-- Adiciona flag na tabela users para identificar o usuário placeholder de venda loja
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_venda_loja BOOLEAN DEFAULT FALSE;

-- 6.4 Formalizar benchmark da loja (20/60/33)
ALTER TABLE public.store_meta_rules
ADD COLUMN IF NOT EXISTS bench_lead_agd INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS bench_agd_visita INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS bench_visita_vnd INTEGER DEFAULT 33;

-- Tabela de Log de Alterações de Configuração (Auditável)
CREATE TABLE IF NOT EXISTS public.store_meta_rules_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES auth.users(id),
    old_values JSONB,
    new_values JSONB,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para logar alterações automaticamente
CREATE OR REPLACE FUNCTION public.log_store_meta_rules_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.store_meta_rules_history (store_id, changed_by, old_values, new_values)
    VALUES (
        NEW.store_id, 
        NEW.updated_by, 
        to_jsonb(OLD), 
        to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_log_store_meta_rules_changes ON public.store_meta_rules;
CREATE TRIGGER tr_log_store_meta_rules_changes
AFTER UPDATE ON public.store_meta_rules
FOR EACH ROW EXECUTE FUNCTION public.log_store_meta_rules_changes();
