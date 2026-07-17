-- MX Performance — Plano de Sustentação persistido e versionado.
-- Regras: PDF §§ 9, 14.1, 14.2 e Apêndice A.

BEGIN;

ALTER TABLE public.regras_metas_loja
  ADD COLUMN IF NOT EXISTS appointments_per_sale numeric NOT NULL DEFAULT 3
    CHECK (appointments_per_sale > 0);

ALTER TABLE public.store_target_plans
  ADD COLUMN IF NOT EXISTS business_days_total integer,
  ADD COLUMN IF NOT EXISTS proportional_goal numeric(12,4),
  ADD COLUMN IF NOT EXISTS monthly_gap numeric(12,4),
  ADD COLUMN IF NOT EXISTS projected_sales numeric(12,4),
  ADD COLUMN IF NOT EXISTS pace_label text,
  ADD COLUMN IF NOT EXISTS operational_basis text,
  ADD COLUMN IF NOT EXISTS source_hash text;

CREATE INDEX IF NOT EXISTS idx_store_target_plans_source_hash
  ON public.store_target_plans(store_id, reference_date, horizon, source_hash);

CREATE TABLE IF NOT EXISTS public.store_calendar_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  exception_date date NOT NULL,
  is_operational boolean NOT NULL,
  reason text,
  created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, exception_date)
);

CREATE INDEX IF NOT EXISTS idx_store_calendar_exceptions_store_date
  ON public.store_calendar_exceptions(store_id, exception_date);

ALTER TABLE public.store_calendar_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_calendar_exceptions_select ON public.store_calendar_exceptions;
CREATE POLICY store_calendar_exceptions_select ON public.store_calendar_exceptions
FOR SELECT TO authenticated USING (
  public.eh_administrador_mx((SELECT auth.uid()))
  OR public.is_manager_of(store_id)
  OR public.is_owner_of(store_id)
  OR EXISTS (
    SELECT 1
    FROM public.vendedores_loja vl
    WHERE vl.store_id = store_calendar_exceptions.store_id
      AND vl.seller_user_id = (SELECT auth.uid())
      AND vl.is_active = true
      AND vl.started_at <= CURRENT_DATE
      AND (vl.ended_at IS NULL OR vl.ended_at >= CURRENT_DATE)
  )
);

DROP POLICY IF EXISTS store_calendar_exceptions_manage ON public.store_calendar_exceptions;
CREATE POLICY store_calendar_exceptions_manage ON public.store_calendar_exceptions
FOR ALL TO authenticated
USING (
  public.eh_administrador_mx((SELECT auth.uid()))
  OR public.is_owner_of(store_id)
)
WITH CHECK (
  public.eh_administrador_mx((SELECT auth.uid()))
  OR public.is_owner_of(store_id)
);

CREATE OR REPLACE FUNCTION public.is_store_operational_date(
  p_store_id uuid,
  p_date date
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exception_row public.store_calendar_exceptions;
  projection_mode text;
BEGIN
  SELECT * INTO exception_row
  FROM public.store_calendar_exceptions
  WHERE store_id = p_store_id AND exception_date = p_date;

  IF FOUND THEN
    RETURN exception_row.is_operational;
  END IF;

  SELECT COALESCE(rml.projection_mode,'calendar')
  INTO projection_mode
  FROM public.regras_metas_loja rml
  WHERE rml.store_id = p_store_id;

  projection_mode := COALESCE(projection_mode,'calendar');

  IF projection_mode = 'calendar' THEN
    RETURN true;
  END IF;

  -- Concessionárias costumam operar aos sábados; domingo é o fallback não operacional.
  RETURN EXTRACT(DOW FROM p_date)::integer <> 0;
END;
$$;

REVOKE ALL ON FUNCTION public.is_store_operational_date(uuid,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_store_operational_date(uuid,date) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.consolidate_store_target_plan(
  p_store_id uuid,
  p_reference_date date DEFAULT NULL
)
RETURNS SETOF public.store_target_plans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  reference_date date := COALESCE(p_reference_date, timezone('America/Sao_Paulo',now())::date);
  month_start date := date_trunc('month',reference_date)::date;
  month_end date := (date_trunc('month',reference_date) + interval '1 month - 1 day')::date;
  monthly_goal numeric(12,4);
  configured_ratio numeric(12,4) := 3;
  projection_mode text := 'calendar';
  realized numeric(12,4) := 0;
  month_gap numeric(12,4);
  projected_sales numeric(12,4);
  proportional_goal numeric(12,4);
  business_days_total integer := 0;
  business_days_elapsed integer := 0;
  business_days_remaining integer := 0;
  history_start date;
  history_sales numeric(12,4) := 0;
  history_appointments numeric(12,4) := 0;
  history_visits numeric(12,4) := 0;
  appointments_per_sale numeric(12,4);
  operational_basis text;
  horizon_key text;
  horizon_start date;
  horizon_end date;
  horizon_days integer;
  required_sales numeric(12,4);
  required_pace numeric(12,4);
  operational_need numeric(12,4);
  pace_label text;
  focus_message text;
  calculated_source_hash text;
  latest_source_hash text;
  next_version integer;
  existing_row public.store_target_plans;
  inserted_row public.store_target_plans;
BEGIN
  IF caller_id IS NOT NULL
     AND NOT public.eh_administrador_mx(caller_id)
     AND NOT public.is_manager_of(p_store_id)
     AND NOT public.is_owner_of(p_store_id)
     AND NOT EXISTS (
       SELECT 1 FROM public.vendedores_loja vl
       WHERE vl.store_id = p_store_id
         AND vl.seller_user_id = caller_id
         AND vl.is_active = true
         AND vl.started_at <= reference_date
         AND (vl.ended_at IS NULL OR vl.ended_at >= reference_date)
     ) THEN
    RAISE EXCEPTION 'Usuário sem escopo nesta loja.' USING ERRCODE='42501';
  END IF;

  SELECT rml.monthly_goal, rml.appointments_per_sale, COALESCE(rml.projection_mode,'calendar')
  INTO monthly_goal, configured_ratio, projection_mode
  FROM public.regras_metas_loja rml
  WHERE rml.store_id = p_store_id;

  IF NOT FOUND THEN
    monthly_goal := NULL;
    configured_ratio := 3;
    projection_mode := 'calendar';
  END IF;

  SELECT COUNT(*) FILTER (WHERE public.is_store_operational_date(p_store_id,d::date)),
         COUNT(*) FILTER (WHERE d::date <= reference_date AND public.is_store_operational_date(p_store_id,d::date)),
         COUNT(*) FILTER (WHERE d::date >= reference_date AND public.is_store_operational_date(p_store_id,d::date))
  INTO business_days_total, business_days_elapsed, business_days_remaining
  FROM generate_series(month_start,month_end,interval '1 day') d;

  SELECT COALESCE(SUM(
    ld.vnd_porta_prev_day + ld.vnd_cart_prev_day + ld.vnd_net_prev_day
  ),0)::numeric
  INTO realized
  FROM public.lancamentos_diarios ld
  WHERE ld.store_id = p_store_id
    AND ld.metric_scope = 'daily'
    AND ld.reference_date BETWEEN month_start AND reference_date
    AND (
      ld.submission_status = 'on_time'
      OR EXISTS (
        SELECT 1 FROM public.solicitacoes_correcao_lancamento scr
        WHERE scr.checkin_id = ld.id AND scr.status = 'approved'
      )
    );

  proportional_goal := CASE
    WHEN monthly_goal IS NOT NULL AND business_days_total > 0
      THEN monthly_goal * business_days_elapsed / business_days_total
    ELSE NULL
  END;
  month_gap := CASE WHEN monthly_goal IS NULL THEN NULL ELSE GREATEST(monthly_goal-realized,0) END;
  projected_sales := CASE
    WHEN business_days_elapsed > 0 THEN realized / business_days_elapsed * business_days_total
    ELSE 0
  END;

  history_start := reference_date - 29;
  SELECT
    COALESCE(SUM(ld.vnd_porta_prev_day+ld.vnd_cart_prev_day+ld.vnd_net_prev_day),0)::numeric,
    COALESCE(SUM(ld.agd_cart_today+ld.agd_net_today),0)::numeric,
    COALESCE(SUM(ld.visit_prev_day),0)::numeric
  INTO history_sales,history_appointments,history_visits
  FROM public.lancamentos_diarios ld
  WHERE ld.store_id=p_store_id
    AND ld.metric_scope='daily'
    AND ld.reference_date BETWEEN history_start AND reference_date
    AND (
      ld.submission_status='on_time'
      OR EXISTS (
        SELECT 1 FROM public.solicitacoes_correcao_lancamento scr
        WHERE scr.checkin_id=ld.id AND scr.status='approved'
      )
    );

  IF history_sales > 0 AND history_appointments > 0 THEN
    appointments_per_sale := history_appointments/history_sales;
    operational_basis := 'historico_30_dias_agendamentos';
  ELSE
    history_start := reference_date - 89;
    SELECT
      COALESCE(SUM(ld.vnd_porta_prev_day+ld.vnd_cart_prev_day+ld.vnd_net_prev_day),0)::numeric,
      COALESCE(SUM(ld.agd_cart_today+ld.agd_net_today),0)::numeric,
      COALESCE(SUM(ld.visit_prev_day),0)::numeric
    INTO history_sales,history_appointments,history_visits
    FROM public.lancamentos_diarios ld
    WHERE ld.store_id=p_store_id
      AND ld.metric_scope='daily'
      AND ld.reference_date BETWEEN history_start AND reference_date
      AND (
        ld.submission_status='on_time'
        OR EXISTS (
          SELECT 1 FROM public.solicitacoes_correcao_lancamento scr
          WHERE scr.checkin_id=ld.id AND scr.status='approved'
        )
      );

    IF history_sales > 0 AND history_appointments > 0 THEN
      appointments_per_sale := history_appointments/history_sales;
      operational_basis := 'historico_90_dias_agendamentos';
    ELSIF history_sales > 0 AND history_visits > 0 THEN
      appointments_per_sale := history_visits/history_sales;
      operational_basis := 'historico_90_dias_atendimentos';
    ELSE
      appointments_per_sale := configured_ratio;
      operational_basis := 'fallback_configurado';
    END IF;
  END IF;

  FOR horizon_key IN
    SELECT unnest(ARRAY['hoje','esta_semana','esta_dezena','este_mes']::text[])
  LOOP
    horizon_start := reference_date;
    horizon_end := CASE horizon_key
      WHEN 'hoje' THEN reference_date
      WHEN 'esta_semana' THEN reference_date + ((6-EXTRACT(DOW FROM reference_date)::integer+7)%7)
      WHEN 'esta_dezena' THEN CASE
        WHEN EXTRACT(DAY FROM reference_date)::integer <= 10
          THEN make_date(EXTRACT(YEAR FROM reference_date)::integer,EXTRACT(MONTH FROM reference_date)::integer,10)
        WHEN EXTRACT(DAY FROM reference_date)::integer <= 20
          THEN make_date(EXTRACT(YEAR FROM reference_date)::integer,EXTRACT(MONTH FROM reference_date)::integer,20)
        ELSE month_end
      END
      ELSE month_end
    END;

    SELECT COUNT(*) FILTER (WHERE public.is_store_operational_date(p_store_id,d::date))
    INTO horizon_days
    FROM generate_series(horizon_start,horizon_end,interval '1 day') d;

    IF monthly_goal IS NULL OR monthly_goal <= 0 THEN
      required_sales := NULL;
      required_pace := NULL;
      operational_need := NULL;
      pace_label := NULL;
      focus_message := 'Meta ainda não cadastrada.';
    ELSE
      required_sales := CASE
        WHEN horizon_key='este_mes' THEN month_gap
        WHEN business_days_remaining > 0
          THEN LEAST(month_gap,CEIL(month_gap*horizon_days/business_days_remaining))
        ELSE month_gap
      END;
      required_pace := CASE WHEN horizon_days > 0 THEN required_sales/horizon_days ELSE 0 END;
      operational_need := CEIL(required_sales*appointments_per_sale);
      pace_label := CASE
        WHEN required_sales <= 0 THEN 'Objetivo atingido'
        WHEN required_pace > 0 AND required_pace < 1 THEN
          '1 venda a cada ' || trim(to_char(ROUND(1/required_pace,1),'FM999990D0')) || ' dias úteis'
        ELSE trim(to_char(ROUND(required_pace,1),'FM999990D0')) ||
          CASE WHEN ROUND(required_pace,1)=1 THEN ' venda por dia útil' ELSE ' vendas por dia útil' END
      END;
      focus_message := CASE
        WHEN required_sales <= 0 THEN CASE horizon_key
          WHEN 'hoje' THEN 'Objetivo de hoje atingido. Proteja a agenda e antecipe o próximo objetivo.'
          WHEN 'esta_semana' THEN 'Objetivo da semana atingido. Mantenha o ritmo para garantir a meta mensal.'
          WHEN 'esta_dezena' THEN 'Objetivo da dezena atingido. Mantenha consistência até o fechamento.'
          ELSE 'Meta do mês atingida. Sustente o resultado e antecipe oportunidades.'
        END
        WHEN horizon_key='hoje' THEN 'Foco de hoje: elevar a agenda e proteger as negociações prioritárias.'
        WHEN horizon_key='esta_semana' THEN 'Foco da semana: distribuir a necessidade pelos dias úteis restantes.'
        WHEN horizon_key='esta_dezena' THEN 'Foco da dezena: recuperar o ritmo sem transferir todo o déficit para o fim do mês.'
        ELSE 'Foco do mês: manter o ritmo necessário até o fechamento da meta mensal.'
      END;
    END IF;

    calculated_source_hash := md5(concat_ws('|',
      p_store_id::text,reference_date::text,horizon_key,horizon_start::text,horizon_end::text,
      COALESCE(monthly_goal::text,'null'),realized::text,COALESCE(required_sales::text,'null'),
      COALESCE(required_pace::text,'null'),COALESCE(appointments_per_sale::text,'null'),
      business_days_total::text,business_days_elapsed::text,business_days_remaining::text,
      operational_basis,projection_mode
    ));

    SELECT stp.source_hash
    INTO latest_source_hash
    FROM public.store_target_plans stp
    WHERE stp.store_id=p_store_id
      AND stp.reference_date=reference_date
      AND stp.horizon=horizon_key
    ORDER BY stp.version DESC
    LIMIT 1;

    IF latest_source_hash = calculated_source_hash THEN
      SELECT * INTO existing_row
      FROM public.store_target_plans stp
      WHERE stp.store_id=p_store_id
        AND stp.reference_date=reference_date
        AND stp.horizon=horizon_key
      ORDER BY stp.version DESC
      LIMIT 1;
      RETURN NEXT existing_row;
      CONTINUE;
    END IF;

    SELECT COALESCE(MAX(version),0)+1
    INTO next_version
    FROM public.store_target_plans stp
    WHERE stp.store_id=p_store_id
      AND stp.reference_date=reference_date
      AND stp.horizon=horizon_key;

    INSERT INTO public.store_target_plans (
      store_id,reference_date,horizon,period_start,period_end,version,
      monthly_goal,realized,required_sales,required_pace,appointments_per_sale,
      operational_need,focus_message,business_days_elapsed,business_days_remaining,
      business_days_total,proportional_goal,monthly_gap,projected_sales,pace_label,
      operational_basis,source_hash,source_payload
    ) VALUES (
      p_store_id,reference_date,horizon_key,horizon_start,horizon_end,next_version,
      monthly_goal,realized,required_sales,required_pace,appointments_per_sale,
      operational_need,focus_message,business_days_elapsed,business_days_remaining,
      business_days_total,proportional_goal,month_gap,projected_sales,pace_label,
      operational_basis,calculated_source_hash,
      jsonb_build_object(
        'projection_mode',projection_mode,
        'historical_window_start',history_start,
        'historical_sales',history_sales,
        'historical_appointments',history_appointments,
        'historical_visits',history_visits
      )
    ) RETURNING * INTO inserted_row;

    RETURN NEXT inserted_row;
  END LOOP;

  RETURN;
EXCEPTION WHEN others THEN
  PERFORM public.log_rpc_error(
    'consolidate_store_target_plan',SQLSTATE,SQLERRM,caller_id,
    jsonb_build_object('store_id',p_store_id,'reference_date',reference_date)
  );
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.consolidate_store_target_plan(uuid,date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consolidate_store_target_plan(uuid,date) FROM anon;
GRANT EXECUTE ON FUNCTION public.consolidate_store_target_plan(uuid,date) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.run_store_target_plan_refresh_clock()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  store_row record;
  local_date date := timezone('America/Sao_Paulo',now())::date;
BEGIN
  FOR store_row IN SELECT id FROM public.lojas LOOP
    PERFORM public.consolidate_store_target_plan(store_row.id,local_date);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.run_store_target_plan_refresh_clock() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_store_target_plan_refresh_clock() TO service_role;

DO $$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname='mx-refresh-store-target-plans';

  PERFORM cron.schedule(
    'mx-refresh-store-target-plans',
    '5 * * * *',
    'SELECT public.run_store_target_plan_refresh_clock();'
  );
END $$;

COMMIT;
