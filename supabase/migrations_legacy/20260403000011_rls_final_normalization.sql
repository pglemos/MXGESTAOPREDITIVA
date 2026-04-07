-- EPIC-13.1: Normalização e Proteção Final de Dados (RLS)
-- Metodologia MX - Segurança Multi-tenancy

-- 1. Ativar RLS em tabelas que faltavam ou foram criadas recentemente
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para FEEDBACKS (Mentoria Semanal)
DROP POLICY IF EXISTS "Feedbacks isolation" ON public.feedbacks;
CREATE POLICY "Seller can view own feedbacks" ON public.feedbacks 
    FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Manager can manage store feedbacks" ON public.feedbacks 
    FOR ALL USING (store_id IN (
        SELECT store_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('gerente', 'consultor')
    ));

CREATE POLICY "Admin can view all feedbacks" ON public.feedbacks 
    FOR SELECT USING (auth.jwt()->>'role' = 'admin');

-- 3. Políticas para TRAINING_PROGRESS
DROP POLICY IF EXISTS "Training progress isolation" ON public.training_progress;
CREATE POLICY "User can manage own progress" ON public.training_progress 
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Manager can view store team progress" ON public.training_progress 
    FOR SELECT USING (user_id IN (
        SELECT user_id FROM public.memberships WHERE store_id IN (
            SELECT store_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('gerente', 'consultor')
        )
    ));

-- 4. Políticas para NOTIFICATIONS
DROP POLICY IF EXISTS "Notifications isolation" ON public.notifications;
CREATE POLICY "User can manage own notifications" ON public.notifications 
    FOR ALL USING (recipient_id = auth.uid());

-- 5. Políticas para GOALS (Metas)
DROP POLICY IF EXISTS "Goals isolation" ON public.goals;
CREATE POLICY "Store members can view store goals" ON public.goals 
    FOR SELECT USING (store_id IN (
        SELECT store_id FROM public.memberships WHERE user_id = auth.uid()
    ));

CREATE POLICY "Admin/Consultor can manage goals" ON public.goals 
    FOR ALL USING (auth.jwt()->>'role' IN ('admin') OR (
        store_id IN (SELECT store_id FROM public.memberships WHERE user_id = auth.uid() AND role = 'consultor')
    ));

-- 6. Políticas para STORE_META_RULES e BENCHMARKS (Regras de Negócio)
DROP POLICY IF EXISTS "Rules view isolation" ON public.store_meta_rules;
CREATE POLICY "Store members can view rules" ON public.store_meta_rules FOR SELECT USING (store_id IN (SELECT store_id FROM public.memberships WHERE user_id = auth.uid()));
CREATE POLICY "Admin/Consultor can manage rules" ON public.store_meta_rules FOR ALL USING (auth.jwt()->>'role' = 'admin' OR store_id IN (SELECT store_id FROM public.memberships WHERE user_id = auth.uid() AND role = 'consultor'));

DROP POLICY IF EXISTS "Benchmarks view isolation" ON public.store_benchmarks;
CREATE POLICY "Store members can view benchmarks" ON public.store_benchmarks FOR SELECT USING (store_id IN (SELECT store_id FROM public.memberships WHERE user_id = auth.uid()));
CREATE POLICY "Admin/Consultor can manage benchmarks" ON public.store_benchmarks FOR ALL USING (auth.jwt()->>'role' = 'admin' OR store_id IN (SELECT store_id FROM public.memberships WHERE user_id = auth.uid() AND role = 'consultor'));

-- 7. Proteção de LOGS e AUDITORIA
CREATE POLICY "Admins can manage logs" ON public.reprocess_logs FOR ALL USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY "Consultors can view assigned store logs" ON public.reprocess_logs FOR SELECT USING (store_id IN (SELECT store_id FROM public.memberships WHERE user_id = auth.uid() AND role = 'consultor'));

-- Finalizado Hardening de Segurança MX
