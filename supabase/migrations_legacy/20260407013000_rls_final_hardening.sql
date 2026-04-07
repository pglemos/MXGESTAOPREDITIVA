-- EPIC-01: RLS Hardening Final do Nucleo Operacional

-- 1. Habilitar RLS em todas as tabelas remanescentes
ALTER TABLE public.manager_routine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_share_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_feedback_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- 2. Politicas para manager_routine_logs (Apenas gestao da loja ve)
DROP POLICY IF EXISTS "Routine logs viewable by management" ON public.manager_routine_logs;
CREATE POLICY "Routine logs viewable by management" ON public.manager_routine_logs
    FOR ALL TO authenticated
    USING (public.is_admin() OR public.is_owner_of(store_id) OR public.is_manager_of(store_id));

-- 3. Politicas para whatsapp_share_logs (Auditavel por gestao)
DROP POLICY IF EXISTS "Share logs viewable by management" ON public.whatsapp_share_logs;
CREATE POLICY "Share logs viewable by management" ON public.whatsapp_share_logs
    FOR ALL TO authenticated
    USING (public.is_admin() OR public.is_owner_of(store_id) OR public.is_manager_of(store_id));

-- 4. Politicas para weekly_feedback_reports (Relatorios oficiais)
DROP POLICY IF EXISTS "Weekly reports viewable by management" ON public.weekly_feedback_reports;
CREATE POLICY "Weekly reports viewable by management" ON public.weekly_feedback_reports
    FOR SELECT TO authenticated
    USING (public.is_admin() OR public.is_owner_of(store_id) OR public.is_manager_of(store_id));

-- 5. Politicas para feedbacks (Governança Fina: Vendedor ve o dele, Gestao ve da loja)
DROP POLICY IF EXISTS "Feedbacks viewable by owner and staff" ON public.feedbacks;
CREATE POLICY "Feedbacks viewable by owner and staff" ON public.feedbacks
    FOR SELECT TO authenticated
    USING (
        public.is_admin() OR 
        public.is_owner_of((SELECT store_id FROM public.store_sellers WHERE seller_user_id = seller_id LIMIT 1)) OR 
        public.is_manager_of((SELECT store_id FROM public.store_sellers WHERE seller_user_id = seller_id LIMIT 1)) OR 
        seller_id = auth.uid()
    );

DROP POLICY IF EXISTS "Feedbacks creatable by management" ON public.feedbacks;
CREATE POLICY "Feedbacks creatable by management" ON public.feedbacks
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin() OR public.is_manager_of((SELECT store_id FROM public.store_sellers WHERE seller_user_id = seller_id LIMIT 1)));

-- 6. Garantia de Admin Global (Superuser Policy)
-- Ja garantido pelas funcoes is_admin() usadas nas policies acima.

COMMENT ON TABLE public.feedbacks IS 'Tabela de feedbacks estruturados com RLS de governança fina por papel.';
