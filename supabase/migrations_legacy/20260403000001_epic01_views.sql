-- EPIC-01: Views Operacionais e Regras de Negócio
-- Metodologia MX

-- 1. View: Sem Registro
-- Identifica vendedores ativos na loja (vigência) que não lançaram check-in na data de referência atual.
CREATE OR REPLACE VIEW public.view_sem_registro AS
SELECT 
    ss.store_id,
    ss.seller_user_id,
    CURRENT_DATE AS reference_date,
    ss.started_at,
    ss.closing_month_grace
FROM public.store_sellers ss
LEFT JOIN public.daily_checkins dc 
    ON ss.seller_user_id = dc.seller_user_id 
    AND ss.store_id = dc.store_id
    AND dc.reference_date = CURRENT_DATE
WHERE 
    ss.is_active = TRUE 
    AND ss.started_at <= CURRENT_DATE 
    AND (ss.ended_at IS NULL OR ss.ended_at >= CURRENT_DATE)
    AND dc.id IS NULL;

-- 2. View: Produção Consolidada da Loja (Tratamento VENDA LOJA)
-- Agrega a produção diária por loja, incluindo ou excluindo Venda Loja conforme store_meta_rules
CREATE OR REPLACE VIEW public.view_store_daily_production AS
SELECT 
    dc.store_id,
    dc.reference_date,
    SUM(dc.leads_prev_day) as total_leads,
    SUM(dc.visit_prev_day) as total_visits,
    SUM(dc.agd_cart_today + dc.agd_net_today) as total_agendamentos,
    SUM(
        CASE 
            -- Se for o usuário 'Venda Loja' (representado aqui por um flag ou user específico), 
            -- verifica a regra 'include_venda_loja_in_store_total'
            WHEN u.raw_user_meta_data->>'is_venda_loja' = 'true' THEN 
                CASE WHEN smr.include_venda_loja_in_store_total THEN (dc.vnd_porta_prev_day + dc.vnd_cart_prev_day + dc.vnd_net_prev_day) ELSE 0 END
            ELSE 
                (dc.vnd_porta_prev_day + dc.vnd_cart_prev_day + dc.vnd_net_prev_day)
        END
    ) as total_vendas
FROM public.daily_checkins dc
JOIN auth.users u ON u.id = dc.seller_user_id
LEFT JOIN public.store_meta_rules smr ON smr.store_id = dc.store_id
GROUP BY dc.store_id, dc.reference_date, smr.include_venda_loja_in_store_total;
