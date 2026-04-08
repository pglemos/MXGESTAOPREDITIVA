-- EPIC-01 & EPIC-05: RLS Hardening e Agendamento Oficial 10:30

-- 1. HARDENING DE SEGURANCA (EPIC-01)
ALTER TABLE public.store_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_meta_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_delivery_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_benchmarks ENABLE ROW LEVEL SECURITY;

-- Politicas para store_sellers
DROP POLICY IF EXISTS "Sellers viewable by store management" ON public.store_sellers;
CREATE POLICY "Sellers viewable by store management" ON public.store_sellers
    FOR SELECT TO authenticated
    USING (public.is_admin() OR public.is_owner_of(store_id) OR public.is_manager_of(store_id) OR seller_user_id = auth.uid());

-- Politicas para regras de governanca (Apenas gestao ve, apenas admin altera)
CREATE POLICY "Rules viewable by management" ON public.store_meta_rules FOR SELECT TO authenticated USING (public.is_admin() OR public.is_owner_of(store_id) OR public.is_manager_of(store_id));
CREATE POLICY "Rules viewable by management" ON public.store_delivery_rules FOR SELECT TO authenticated USING (public.is_admin() OR public.is_owner_of(store_id) OR public.is_manager_of(store_id));
CREATE POLICY "Rules viewable by management" ON public.store_benchmarks FOR SELECT TO authenticated USING (public.is_admin() OR public.is_owner_of(store_id) OR public.is_manager_of(store_id));

-- 2. AGENDAMENTO OFICIAL 10:30 (EPIC-05)
-- Garante que o cron rodara as 10:30 BRT (13:30 UTC)
SELECT cron.schedule(
    'mx-morning-report-official',
    '30 13 * * *',
    $$ SELECT net.http_post(
        url := 'https://' || current_setting('project.ref') || '.supabase.co/functions/v1/relatorio-matinal',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || current_setting('project.service_key')),
        body := jsonb_build_object('source', 'cron_official')
    ) $$
);

-- 3. REFINAMENTO DA VIEW DE VIGENCIA (EPIC-01)
CREATE OR REPLACE VIEW public.view_daily_team_status AS
SELECT 
    s.id as store_id,
    u.id as seller_id,
    u.name as seller_name,
    u.is_venda_loja,
    ss.started_at,
    ss.ended_at,
    dc.id as checkin_id,
    dc.reference_date,
    CASE 
        WHEN dc.id IS NULL THEN true 
        ELSE false 
    END as sem_registro
FROM public.store_sellers ss
JOIN public.users u ON u.id = ss.seller_user_id
JOIN public.stores s ON s.id = ss.store_id
LEFT JOIN public.daily_checkins dc ON dc.seller_user_id = u.id 
    AND dc.store_id = s.id 
    AND dc.metric_scope = 'daily'
    AND dc.reference_date = CURRENT_DATE - 1
WHERE ss.is_active = true
  AND ss.started_at <= CURRENT_DATE - 1
  AND (ss.ended_at IS NULL OR ss.ended_at >= CURRENT_DATE - 1);

COMMENT ON VIEW public.view_daily_team_status IS 'View canonica com filtragem por vigencia real (started_at/ended_at).';
