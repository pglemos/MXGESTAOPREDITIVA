-- EPIC-11: Hardening do Motor de Reprocessamento e Auditoria

-- 1. Adicionar hash do arquivo para evitar duplicidade de upload
ALTER TABLE public.reprocess_logs ADD COLUMN IF NOT EXISTS file_hash TEXT;
ALTER TABLE public.reprocess_logs ADD COLUMN IF NOT EXISTS processed_at timestamptz;

-- 2. Refinar a funcao de processamento com trava de status (Idempotencia de Lote)
CREATE OR REPLACE FUNCTION public.process_import_data(p_log_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_raw record;
    v_store_id uuid;
    v_seller_id uuid;
    v_ref_date date;
    v_current_status text;
BEGIN
    -- Trava de Idempotencia de Lote: Nao processa se ja estiver completo ou em processamento
    SELECT status INTO v_current_status FROM public.reprocess_logs WHERE id = p_log_id FOR UPDATE;
    
    IF v_current_status = 'completed' OR v_current_status = 'processing' THEN
        RAISE EXCEPTION 'Este lote ja foi processado ou esta em execucao (Status: %).', v_current_status;
    END IF;

    UPDATE public.reprocess_logs
    SET status = 'processing', started_at = now()
    WHERE id = p_log_id;

    FOR v_raw IN SELECT id, raw_data FROM public.raw_imports WHERE log_id = p_log_id LOOP
        BEGIN
            -- Resolucao de Loja (UUID ou Nome)
            IF (v_raw.raw_data->>'store_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                v_store_id := (v_raw.raw_data->>'store_id')::uuid;
            ELSE
                SELECT id INTO v_store_id
                FROM public.stores
                WHERE name ILIKE (v_raw.raw_data->>'LOJA')
                LIMIT 1;
            END IF;

            -- Resolucao de Vendedor (UUID, Email ou Nome)
            IF (v_raw.raw_data->>'seller_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                v_seller_id := (v_raw.raw_data->>'seller_id')::uuid;
            ELSE
                SELECT id INTO v_seller_id
                FROM public.users
                WHERE email ILIKE (v_raw.raw_data->>'EMAIL')
                   OR name ILIKE (v_raw.raw_data->>'VENDEDOR')
                LIMIT 1;
            END IF;

            v_ref_date := (v_raw.raw_data->>'DATA')::date;

            -- Valida vigencia operacional (Nao permite dados futuros)
            IF v_ref_date > CURRENT_DATE THEN
                RAISE EXCEPTION 'Data de referencia (%) superior ao limite operacional.', v_ref_date;
            END IF;

            IF v_store_id IS NOT NULL AND v_seller_id IS NOT NULL AND v_ref_date IS NOT NULL THEN
                -- UPSERT Canonico (Idempotencia de Registro)
                INSERT INTO public.daily_checkins (
                    seller_user_id, store_id, reference_date, submitted_at,
                    leads_prev_day, agd_cart_today, agd_net_today,
                    vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day,
                    visit_prev_day, zero_reason, created_by, updated_at,
                    metric_scope -- Garantir o escopo
                ) VALUES (
                    v_seller_id, v_store_id, v_ref_date, now(),
                    COALESCE(NULLIF(v_raw.raw_data->>'LEADS', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'AGD_CART', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'AGD_NET', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'VND_PORTA', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'VND_CART', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'VND_NET', '')::integer, 0),
                    COALESCE(NULLIF(v_raw.raw_data->>'VISITA', '')::integer, 0),
                    v_raw.raw_data->>'MOTIVO_ZERO',
                    v_seller_id,
                    now(),
                    'daily'
                )
                ON CONFLICT (seller_user_id, store_id, reference_date)
                DO UPDATE SET
                    submitted_at = EXCLUDED.submitted_at,
                    leads_prev_day = EXCLUDED.leads_prev_day,
                    agd_cart_today = EXCLUDED.agd_cart_today,
                    agd_net_today = EXCLUDED.agd_net_today,
                    vnd_porta_prev_day = EXCLUDED.vnd_porta_prev_day,
                    vnd_cart_prev_day = EXCLUDED.vnd_cart_prev_day,
                    vnd_net_prev_day = EXCLUDED.vnd_net_prev_day,
                    visit_prev_day = EXCLUDED.visit_prev_day,
                    zero_reason = EXCLUDED.zero_reason,
                    updated_at = now();

                UPDATE public.reprocess_logs
                SET records_processed = records_processed + 1,
                    rows_processed = rows_processed + 1
                WHERE id = p_log_id;
            ELSE
                UPDATE public.reprocess_logs
                SET records_failed = records_failed + 1,
                    error_log = COALESCE(error_log, '[]'::jsonb) || jsonb_build_object(
                        'error', 'Entidade nao localizada (Loja ou Vendedor)',
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

    UPDATE public.reprocess_logs
    SET status = 'completed', finished_at = now(), processed_at = now()
    WHERE id = p_log_id;
END;
$$;

-- 3. RLS Hardening para Auditoria e Reprocessamento (Apenas ADMIN)
ALTER TABLE public.reprocess_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apenas admin pode ver logs de reprocessamento" ON public.reprocess_logs;
CREATE POLICY "Apenas admin pode ver logs de reprocessamento" ON public.reprocess_logs
    FOR ALL TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Apenas admin pode ver importacoes brutas" ON public.raw_imports;
CREATE POLICY "Apenas admin pode ver importacoes brutas" ON public.raw_imports
    FOR ALL TO authenticated
    USING (public.is_admin());

COMMENT ON FUNCTION public.process_import_data IS 'Motor canonico de reprocessamento com idempotencia de registro e trava de lote.';
