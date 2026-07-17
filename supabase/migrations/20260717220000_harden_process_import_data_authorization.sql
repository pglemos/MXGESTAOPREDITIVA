BEGIN;

CREATE OR REPLACE FUNCTION public.process_import_data(p_log_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_raw record;
  v_store_id uuid;
  v_seller_id uuid;
  v_ref_date date;
  v_current_status text;
  v_file_hash text;
BEGIN
  IF NOT public.eh_area_interna_mx() THEN
    RAISE EXCEPTION 'Acesso negado: reprocessamento restrito à equipe interna MX.'
      USING ERRCODE = '42501';
  END IF;

  SELECT status, file_hash
    INTO v_current_status, v_file_hash
    FROM public.logs_reprocessamento
   WHERE id = p_log_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lote de reprocessamento não encontrado.'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_current_status = 'completed' OR v_current_status = 'processing' THEN
    RAISE EXCEPTION 'Este lote ja foi processado ou esta em execucao (status: %).', v_current_status;
  END IF;

  IF v_file_hash IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.logs_reprocessamento lr
    WHERE lr.id <> p_log_id
      AND lr.file_hash = v_file_hash
      AND lr.status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Arquivo ja processado anteriormente para este hash.';
  END IF;

  UPDATE public.logs_reprocessamento
     SET status = 'processing',
         started_at = now()
   WHERE id = p_log_id;

  FOR v_raw IN
    SELECT id, raw_data
    FROM public.importacoes_brutas
    WHERE log_id = p_log_id
  LOOP
    BEGIN
      IF (v_raw.raw_data->>'store_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_store_id := (v_raw.raw_data->>'store_id')::uuid;
      ELSE
        SELECT id INTO v_store_id
        FROM public.lojas
        WHERE name ILIKE COALESCE(v_raw.raw_data->>'LOJA', '')
        LIMIT 1;
      END IF;

      IF (v_raw.raw_data->>'seller_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_seller_id := (v_raw.raw_data->>'seller_id')::uuid;
      ELSE
        SELECT id INTO v_seller_id
        FROM public.usuarios
        WHERE email ILIKE COALESCE(v_raw.raw_data->>'EMAIL', '')
           OR name ILIKE COALESCE(v_raw.raw_data->>'VENDEDOR', '')
        LIMIT 1;
      END IF;

      v_ref_date := (v_raw.raw_data->>'DATA')::date;

      IF v_ref_date > (timezone('America/Sao_Paulo', now()))::date THEN
        RAISE EXCEPTION 'Data de referencia (%) superior ao limite operacional.', v_ref_date;
      END IF;

      IF v_store_id IS NOT NULL AND v_seller_id IS NOT NULL AND v_ref_date IS NOT NULL THEN
        INSERT INTO public.lancamentos_diarios (
          seller_user_id,
          store_id,
          reference_date,
          submitted_at,
          metric_scope,
          leads_prev_day,
          agd_cart_today,
          agd_net_today,
          vnd_porta_prev_day,
          vnd_cart_prev_day,
          vnd_net_prev_day,
          visit_prev_day,
          zero_reason,
          created_by,
          updated_at
        ) VALUES (
          v_seller_id,
          v_store_id,
          v_ref_date,
          now(),
          'daily',
          COALESCE(NULLIF(v_raw.raw_data->>'LEADS', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'AGD_CART', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'AGD_NET', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'VND_PORTA', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'VND_CART', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'VND_NET', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'VISITA', '')::integer, 0),
          NULLIF(v_raw.raw_data->>'MOTIVO_ZERO', ''),
          COALESCE((SELECT triggered_by FROM public.logs_reprocessamento WHERE id = p_log_id), v_seller_id),
          now()
        )
        ON CONFLICT (seller_user_id, store_id, reference_date, metric_scope)
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

        UPDATE public.logs_reprocessamento
           SET records_processed = COALESCE(records_processed, 0) + 1,
               rows_processed = COALESCE(rows_processed, 0) + 1
         WHERE id = p_log_id;
      ELSE
        UPDATE public.logs_reprocessamento
           SET records_failed = COALESCE(records_failed, 0) + 1,
               error_log = COALESCE(error_log, '[]'::jsonb) || jsonb_build_object(
                 'error', 'Entidade nao localizada (Loja ou Vendedor)',
                 'store_found', v_store_id IS NOT NULL,
                 'seller_found', v_seller_id IS NOT NULL,
                 'data', v_raw.raw_data
               )
         WHERE id = p_log_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.logs_reprocessamento
         SET records_failed = COALESCE(records_failed, 0) + 1,
             error_log = COALESCE(error_log, '[]'::jsonb) || jsonb_build_object('error', SQLERRM, 'data', v_raw.raw_data)
       WHERE id = p_log_id;
    END;
  END LOOP;

  UPDATE public.logs_reprocessamento
     SET status = 'completed',
         finished_at = now(),
         processed_at = now()
   WHERE id = p_log_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.process_import_data(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_import_data(uuid) TO authenticated, service_role;

COMMIT;

-- DOWN
-- Manual rollback: restore the immediately previous process_import_data body
-- without the initial eh_area_interna_mx() guard, then reapply the same explicit
-- authenticated/service_role grants. This intentionally reopens a privilege gap
-- and therefore requires an incident-approved maintenance window.
