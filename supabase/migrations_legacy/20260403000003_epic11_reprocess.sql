-- EPIC-11: Motor de Reprocessamento e Reparo Administrativo
-- Metodologia MX

-- 1. Tabela para armazenamento temporário de dados brutos
CREATE TABLE IF NOT EXISTS public.raw_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID NOT NULL REFERENCES public.reprocess_logs(id) ON DELETE CASCADE,
    raw_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Atualização da tabela de logs para auditoria detalhada
ALTER TABLE public.reprocess_logs 
ADD COLUMN IF NOT EXISTS error_log JSONB,
ADD COLUMN IF NOT EXISTS records_processed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS records_failed INTEGER DEFAULT 0;

-- 3. Função Principal de Reprocessamento e Reparo
CREATE OR REPLACE FUNCTION public.process_import_data(p_log_id UUID)
RETURNS VOID AS $$
DECLARE
    v_raw RECORD;
    v_store_id UUID;
    v_seller_id UUID;
    v_ref_date DATE;
BEGIN
    -- Marca o log como em processamento
    UPDATE public.reprocess_logs SET status = 'processing', started_at = NOW() WHERE id = p_log_id;

    -- Loop pelos dados brutos importados
    FOR v_raw IN (SELECT raw_data FROM public.raw_imports WHERE log_id = p_log_id) LOOP
        BEGIN
            -- 1. Tentar localizar a Loja pelo nome ou ID
            SELECT id INTO v_store_id FROM public.stores WHERE name ILIKE (v_raw.raw_data->>'LOJA') OR id::text = (v_raw.raw_data->>'store_id');
            
            -- 2. Tentar localizar o Vendedor
            SELECT id INTO v_seller_id FROM public.users WHERE name ILIKE (v_raw.raw_data->>'VENDEDOR') OR id::text = (v_raw.raw_data->>'seller_id');

            -- 3. Parse da Data
            v_ref_date := (v_raw.raw_data->>'DATA')::DATE;

            IF v_store_id IS NOT NULL AND v_seller_id IS NOT NULL AND v_ref_date IS NOT NULL THEN
                -- 4. Upsert na base canônica (Elimina duplicidade e repara o dado)
                INSERT INTO public.daily_checkins (
                    seller_user_id, store_id, reference_date, submitted_at,
                    leads_prev_day, agd_cart_today, agd_net_today, 
                    vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day, 
                    visit_prev_day, zero_reason
                ) VALUES (
                    v_seller_id, v_store_id, v_ref_date, NOW(),
                    (v_raw.raw_data->>'LEADS')::INTEGER, (v_raw.raw_data->>'AGD_CART')::INTEGER, (v_raw.raw_data->>'AGD_NET')::INTEGER,
                    (v_raw.raw_data->>'VND_PORTA')::INTEGER, (v_raw.raw_data->>'VND_CART')::INTEGER, (v_raw.raw_data->>'VND_NET')::INTEGER,
                    (v_raw.raw_data->>'VISITA')::INTEGER, v_raw.raw_data->>'MOTIVO_ZERO'
                )
                ON CONFLICT (seller_user_id, reference_date) 
                DO UPDATE SET
                    leads_prev_day = EXCLUDED.leads_prev_day,
                    agd_cart_today = EXCLUDED.agd_cart_today,
                    agd_net_today = EXCLUDED.agd_net_today,
                    vnd_porta_prev_day = EXCLUDED.vnd_porta_prev_day,
                    vnd_cart_prev_day = EXCLUDED.vnd_cart_prev_day,
                    vnd_net_prev_day = EXCLUDED.vnd_net_prev_day,
                    visit_prev_day = EXCLUDED.visit_prev_day,
                    zero_reason = EXCLUDED.zero_reason,
                    updated_at = NOW();

                UPDATE public.reprocess_logs SET records_processed = records_processed + 1 WHERE id = p_log_id;
            ELSE
                UPDATE public.reprocess_logs SET records_failed = records_failed + 1 WHERE id = p_log_id;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            UPDATE public.reprocess_logs 
            SET records_failed = records_failed + 1,
                error_log = COALESCE(error_log, '[]'::jsonb) || jsonb_build_object('error', SQLERRM, 'data', v_raw.raw_data)
            WHERE id = p_log_id;
        END;
    END LOOP;

    -- Finaliza o log
    UPDATE public.reprocess_logs SET status = 'completed', finished_at = NOW() WHERE id = p_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
