-- Fix Reprocess Engine: UUID Priority & Safety Guards
-- Migration: 20260403000012_fix_reprocess_ids.sql

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
    FOR v_raw IN (SELECT id, raw_data FROM public.raw_imports WHERE log_id = p_log_id) LOOP
        BEGIN
            -- 1. Tentar localizar a Loja (Prioridade UUID -> fallback Nome)
            IF (v_raw.raw_data->>'store_id') IS NOT NULL AND (v_raw.raw_data->>'store_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                v_store_id := (v_raw.raw_data->>'store_id')::UUID;
            ELSE
                SELECT id INTO v_store_id FROM public.stores WHERE name ILIKE (v_raw.raw_data->>'LOJA') LIMIT 1;
            END IF;
            
            -- 2. Tentar localizar o Vendedor (Prioridade UUID -> fallback Email/Nome)
            IF (v_raw.raw_data->>'seller_id') IS NOT NULL AND (v_raw.raw_data->>'seller_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                v_seller_id := (v_raw.raw_data->>'seller_id')::UUID;
            ELSE
                SELECT id INTO v_seller_id FROM public.users 
                WHERE email ILIKE (v_raw.raw_data->>'EMAIL') 
                   OR name ILIKE (v_raw.raw_data->>'VENDEDOR') 
                LIMIT 1;
            END IF;

            -- 3. Parse da Data & Trava de Futuro
            v_ref_date := (v_raw.raw_data->>'DATA')::DATE;
            
            IF v_ref_date > CURRENT_DATE THEN
                RAISE EXCEPTION 'Data de referência (%) superior ao limite operacional.', v_ref_date;
            END IF;

            IF v_store_id IS NOT NULL AND v_seller_id IS NOT NULL AND v_ref_date IS NOT NULL THEN
                -- 4. Upsert na base canônica
                INSERT INTO public.daily_checkins (
                    seller_user_id, store_id, reference_date, submitted_at,
                    leads_prev_day, agd_cart_today, agd_net_today, 
                    vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day, 
                    visit_prev_day, zero_reason, updated_at
                ) VALUES (
                    v_seller_id, v_store_id, v_ref_date, NOW(),
                    COALESCE((v_raw.raw_data->>'LEADS')::INTEGER, 0), 
                    COALESCE((v_raw.raw_data->>'AGD_CART')::INTEGER, 0), 
                    COALESCE((v_raw.raw_data->>'AGD_NET')::INTEGER, 0),
                    COALESCE((v_raw.raw_data->>'VND_PORTA')::INTEGER, 0), 
                    COALESCE((v_raw.raw_data->>'VND_CART')::INTEGER, 0), 
                    COALESCE((v_raw.raw_data->>'VND_NET')::INTEGER, 0),
                    COALESCE((v_raw.raw_data->>'VISITA')::INTEGER, 0), 
                    v_raw.raw_data->>'MOTIVO_ZERO',
                    NOW()
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
                UPDATE public.reprocess_logs 
                SET records_failed = records_failed + 1,
                    error_log = COALESCE(error_log, '[]'::jsonb) || jsonb_build_object(
                        'error', 'Entidade não localizada', 
                        'store_found', v_store_id IS NOT NULL,
                        'seller_found', v_seller_id IS NOT NULL,
                        'data', v_raw.raw_data
                    )
                WHERE id = p_log_id;
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
