-- ============================================================
-- PMR Elite - Correção de Schema para PDIs e Visitas
-- ============================================================

-- 1. Visitas: Garantir campos de assinatura
ALTER TABLE public.consulting_visits
ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz,
ADD COLUMN IF NOT EXISTS acknowledged_by uuid REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS next_cycle_goal text;

-- 2. PDIs: Adicionar campos de assinatura do vendedor e gestor
ALTER TABLE public.pdis
ADD COLUMN IF NOT EXISTS seller_acknowledged_at timestamptz,
ADD COLUMN IF NOT EXISTS manager_acknowledged_at timestamptz,
ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.users(id);

-- 3. Respostas de Formulário: Adicionar assinatura
ALTER TABLE public.consulting_pmr_form_responses
ADD COLUMN IF NOT EXISTS seller_acknowledged_at timestamptz;
