-- v1.1: Tabelas para Auditoria e Correção Retroativa de Check-ins
-- Objetivo: Permitir correções justificadas com aprovação gerencial e log imutável.

BEGIN;

-- 1. Criar tipo para status da solicitação
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'correction_status') THEN
        CREATE TYPE public.correction_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END
$$;

-- 2. Tabela de Solicitações de Correção
CREATE TABLE IF NOT EXISTS public.checkin_correction_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    checkin_id uuid NOT NULL REFERENCES public.daily_checkins(id) ON DELETE CASCADE,
    seller_id uuid NOT NULL REFERENCES public.users(id),
    store_id uuid NOT NULL REFERENCES public.stores(id),
    requested_values jsonb NOT NULL, -- Valores que o vendedor deseja alterar
    reason text NOT NULL,
    status public.correction_status NOT NULL DEFAULT 'pending',
    auditor_id uuid REFERENCES public.users(id),
    reviewed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 3. Tabela de Logs de Auditoria (Histórico imutável de mudanças)
CREATE TABLE IF NOT EXISTS public.checkin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    checkin_id uuid NOT NULL REFERENCES public.daily_checkins(id) ON DELETE CASCADE,
    correction_request_id uuid REFERENCES public.checkin_correction_requests(id),
    changed_by uuid NOT NULL REFERENCES public.users(id),
    old_values jsonb NOT NULL,
    new_values jsonb NOT NULL,
    change_type text NOT NULL DEFAULT 'manual_correction', -- 'manual_correction', 'system_reprocess', etc.
    created_at timestamptz DEFAULT now()
);

-- 4. RLS para Solicitações
ALTER TABLE public.checkin_correction_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY seller_manage_own_requests ON public.checkin_correction_requests
    FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY manager_view_store_requests ON public.checkin_correction_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE user_id = auth.uid() 
            AND store_id = public.checkin_correction_requests.store_id
            AND role IN ('gerente', 'dono')
        )
    );

-- 5. RLS para Logs (Somente visualização para Gerentes/Admins)
ALTER TABLE public.checkin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_manager_view_logs ON public.checkin_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'dono', 'gerente')
        )
    );

COMMIT;
