-- EPIC-01 & EPIC-02: Limpeza de resquicios hibridos e View de Equipe Canonica

-- 1. Backfill de manager_email para store_delivery_rules caso ainda nao exista
INSERT INTO public.store_delivery_rules (store_id, matinal_recipients)
SELECT id, ARRAY[manager_email]
FROM public.stores
WHERE manager_email IS NOT NULL
ON CONFLICT (store_id) DO UPDATE 
SET matinal_recipients = CASE 
    WHEN EXCLUDED.matinal_recipients IS NULL THEN ARRAY[public.stores.manager_email]
    WHEN NOT (public.stores.manager_email = ANY(public.store_delivery_rules.matinal_recipients)) THEN array_append(public.store_delivery_rules.matinal_recipients, public.stores.manager_email)
    ELSE public.store_delivery_rules.matinal_recipients
END;

-- 2. Remover coluna manager_email de stores
ALTER TABLE public.stores DROP COLUMN IF EXISTS manager_email;

-- 3. View de Status de Check-in (Sem Registro Sistemicos)
CREATE OR REPLACE VIEW public.view_daily_team_status AS
SELECT 
    s.id as store_id,
    u.id as seller_id,
    u.name as seller_name,
    u.is_venda_loja,
    dc.id as checkin_id,
    dc.reference_date,
    CASE 
        WHEN dc.id IS NULL THEN true 
        ELSE false 
    END as sem_registro,
    dc.submission_status,
    dc.submitted_at,
    dc.submitted_late
FROM public.store_sellers ss
JOIN public.users u ON u.id = ss.seller_user_id
JOIN public.stores s ON s.id = ss.store_id
LEFT JOIN public.daily_checkins dc ON dc.seller_user_id = u.id 
    AND dc.store_id = s.id 
    AND dc.metric_scope = 'daily'
    AND dc.reference_date = CURRENT_DATE - 1
WHERE ss.is_active = true;

COMMENT ON VIEW public.view_daily_team_status IS 'View canonica para identificar vendedores sem registro na data de referencia (D-1)';
