-- MX Performance — snapshot oficial da Rotina do Vendedor.
-- Regras: PDF §§ 7.2–7.5, 14.1, 14.2 e Apêndice A.

BEGIN;

ALTER TABLE public.prospecting_schedule
  ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS seller_user_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_prospecting_schedule_store_seller
  ON public.prospecting_schedule(store_id,seller_user_id,dia_semana,semana_mes)
  WHERE ativo=true;

ALTER TABLE public.seller_routine_snapshots
  ADD COLUMN IF NOT EXISTS score_denominator numeric(6,2),
  ADD COLUMN IF NOT EXISTS source_hash text;

CREATE INDEX IF NOT EXISTS idx_seller_routine_snapshots_source_hash
  ON public.seller_routine_snapshots(seller_user_id,reference_date,source_hash);

CREATE TABLE IF NOT EXISTS public.seller_day_eligibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  reference_date date NOT NULL,
  version integer NOT NULL CHECK (version>=1),
  is_eligible boolean NOT NULL,
  reason text NOT NULL,
  source text NOT NULL DEFAULT 'operational',
  created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id,seller_user_id,reference_date,version)
);

CREATE TABLE IF NOT EXISTS public.seller_routine_block_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  reference_date date NOT NULL,
  block_key text NOT NULL CHECK (block_key IN (
    'acesso','pendencias','plano_ataque','prospeccao','atualizacao','fechamento'
  )),
  version integer NOT NULL CHECK (version>=1),
  diagnostic_status text NOT NULL CHECK (diagnostic_status IN (
    'normal','zero_legitimo','sem_base','sem_planejamento','erro_geracao','nao_aplicavel'
  )),
  reason text,
  created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id,seller_user_id,reference_date,block_key,version)
);

CREATE INDEX IF NOT EXISTS idx_seller_day_eligibility_lookup
  ON public.seller_day_eligibility(store_id,seller_user_id,reference_date,version DESC);
CREATE INDEX IF NOT EXISTS idx_seller_routine_block_diagnostics_lookup
  ON public.seller_routine_block_diagnostics(store_id,seller_user_id,reference_date,block_key,version DESC);

ALTER TABLE public.seller_day_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_routine_block_diagnostics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS seller_day_eligibility_select ON public.seller_day_eligibility;
CREATE POLICY seller_day_eligibility_select ON public.seller_day_eligibility
FOR SELECT TO authenticated USING (
  seller_user_id=(SELECT auth.uid())
  OR public.eh_administrador_mx((SELECT auth.uid()))
  OR public.is_manager_of(store_id)
  OR public.is_owner_of(store_id)
);

DROP POLICY IF EXISTS seller_day_eligibility_insert ON public.seller_day_eligibility;
CREATE POLICY seller_day_eligibility_insert ON public.seller_day_eligibility
FOR INSERT TO authenticated WITH CHECK (
  public.eh_administrador_mx((SELECT auth.uid()))
  OR public.is_manager_of(store_id)
  OR public.is_owner_of(store_id)
);

DROP POLICY IF EXISTS seller_routine_block_diagnostics_select ON public.seller_routine_block_diagnostics;
CREATE POLICY seller_routine_block_diagnostics_select ON public.seller_routine_block_diagnostics
FOR SELECT TO authenticated USING (
  seller_user_id=(SELECT auth.uid())
  OR public.eh_administrador_mx((SELECT auth.uid()))
  OR public.is_manager_of(store_id)
  OR public.is_owner_of(store_id)
);

DROP POLICY IF EXISTS seller_routine_block_diagnostics_insert ON public.seller_routine_block_diagnostics;
CREATE POLICY seller_routine_block_diagnostics_insert ON public.seller_routine_block_diagnostics
FOR INSERT TO authenticated WITH CHECK (
  public.eh_administrador_mx((SELECT auth.uid()))
  OR public.is_manager_of(store_id)
  OR public.is_owner_of(store_id)
);

CREATE OR REPLACE FUNCTION public.get_seller_routine_block_diagnostic(
  p_store_id uuid,
  p_seller_user_id uuid,
  p_reference_date date,
  p_block_key text
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
  SELECT COALESCE((
    SELECT jsonb_build_object('status',d.diagnostic_status,'reason',d.reason,'version',d.version)
    FROM public.seller_routine_block_diagnostics d
    WHERE d.store_id=p_store_id
      AND d.seller_user_id=p_seller_user_id
      AND d.reference_date=p_reference_date
      AND d.block_key=p_block_key
    ORDER BY d.version DESC
    LIMIT 1
  ),jsonb_build_object('status','normal','reason',NULL,'version',0));
$$;

REVOKE ALL ON FUNCTION public.get_seller_routine_block_diagnostic(uuid,uuid,date,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_seller_routine_block_diagnostic(uuid,uuid,date,text) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.consolidate_seller_routine_snapshots(
  p_store_id uuid,
  p_reference_date date DEFAULT NULL
)
RETURNS SETOF public.seller_routine_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  caller_id uuid:=auth.uid();
  target_date date:=COALESCE(p_reference_date,timezone('America/Sao_Paulo',now())::date);
  local_now timestamp:=timezone('America/Sao_Paulo',now());
  seller_row record;
  eligibility_row public.seller_day_eligibility;
  eligible_value boolean;
  not_applicable_reason_value text;
  reliable_work_base_value boolean;
  accessed boolean;
  access_numerator_value integer;
  access_denominator_value integer:=1;
  pending_resolved_value integer;
  pending_expected_value integer;
  attack_executed_value integer;
  attack_expected_value integer;
  prospecting_executed_value integer;
  prospecting_expected_value integer;
  updates_completed_value integer;
  updates_expected_value integer;
  closing_official boolean;
  closing_status text;
  access_points_value numeric(6,2);
  pending_points_value numeric(6,2);
  attack_points_value numeric(6,2);
  prospecting_points_value numeric(6,2);
  update_points_value numeric(6,2);
  closing_points_value numeric(6,2);
  execution_score_value numeric(6,2);
  score_denominator_value numeric(6,2);
  routine_status_value text;
  diagnostic jsonb;
  diagnostic_status text;
  block_weight numeric(6,2);
  source_payload_value jsonb;
  calculated_source_hash text;
  latest_source_hash text;
  next_version integer;
  existing_row public.seller_routine_snapshots;
  inserted_row public.seller_routine_snapshots;
BEGIN
  IF caller_id IS NOT NULL
     AND NOT public.eh_administrador_mx(caller_id)
     AND NOT public.is_manager_of(p_store_id)
     AND NOT public.is_owner_of(p_store_id) THEN
    RAISE EXCEPTION 'Usuário sem permissão para consolidar a rotina desta loja.' USING ERRCODE='42501';
  END IF;

  FOR seller_row IN
    SELECT vl.seller_user_id
    FROM public.vendedores_loja vl
    WHERE vl.store_id=p_store_id
      AND vl.is_active=true
      AND vl.started_at<=target_date
      AND (vl.ended_at IS NULL OR vl.ended_at>=target_date)
  LOOP
    SELECT * INTO eligibility_row
    FROM public.seller_day_eligibility e
    WHERE e.store_id=p_store_id
      AND e.seller_user_id=seller_row.seller_user_id
      AND e.reference_date=target_date
    ORDER BY e.version DESC
    LIMIT 1;

    IF NOT public.is_store_operational_date(p_store_id,target_date) THEN
      eligible_value:=false;
      not_applicable_reason_value:='loja_fechada';
    ELSIF FOUND THEN
      eligible_value:=eligibility_row.is_eligible;
      not_applicable_reason_value:=CASE WHEN eligibility_row.is_eligible THEN NULL ELSE eligibility_row.reason END;
    ELSE
      eligible_value:=true;
      not_applicable_reason_value:=NULL;
    END IF;

    reliable_work_base_value:=
      EXISTS(
        SELECT 1 FROM public.clientes c
        WHERE c.loja_id=p_store_id AND c.seller_user_id=seller_row.seller_user_id
      )
      AND EXISTS(
        SELECT 1 FROM public.lancamentos_diarios ld
        WHERE ld.store_id=p_store_id
          AND ld.seller_user_id=seller_row.seller_user_id
          AND ld.metric_scope='daily'
          AND ld.reference_date<target_date
      );

    accessed:=EXISTS(
      SELECT 1 FROM public.central_execucao_aberturas cea
      WHERE cea.seller_user_id=seller_row.seller_user_id AND cea.data=target_date
    );
    access_numerator_value:=CASE WHEN accessed THEN 1 ELSE 0 END;

    SELECT
      COUNT(*) FILTER (
        WHERE cec.status='ativo' AND cec.proxima_acao_em<=target_date
      )::integer
      + COUNT(*) FILTER (
        WHERE cec.last_result='feito'
          AND timezone('America/Sao_Paulo',cec.updated_at)::date=target_date
      )::integer,
      COUNT(*) FILTER (
        WHERE cec.last_result='feito'
          AND timezone('America/Sao_Paulo',cec.updated_at)::date=target_date
      )::integer
    INTO pending_expected_value,pending_resolved_value
    FROM public.cadencia_estado_cliente cec
    WHERE cec.loja_id=p_store_id AND cec.seller_user_id=seller_row.seller_user_id;

    SELECT
      COUNT(*)::integer,
      COUNT(*) FILTER (WHERE ea.status IN ('concluida','justificada'))::integer
    INTO attack_expected_value,attack_executed_value
    FROM public.execution_actions ea
    WHERE ea.store_id=p_store_id
      AND ea.seller_id=seller_row.seller_user_id
      AND timezone('America/Sao_Paulo',ea.due_at)::date=target_date
      AND ea.active=true
      AND (
        ea.source_type='funil'
        OR ea.metadata->>'category'='plano_ataque'
        OR ea.metadata->>'block'='plano_ataque'
      );

    SELECT COALESCE(SUM(ps.quantidade),0)::integer
    INTO prospecting_expected_value
    FROM public.prospecting_schedule ps
    WHERE ps.ativo=true
      AND ps.store_id=p_store_id
      AND (ps.seller_user_id=seller_row.seller_user_id OR ps.seller_user_id IS NULL)
      AND ps.dia_semana=EXTRACT(DOW FROM target_date)::integer
      AND (ps.semana_mes IS NULL OR ps.semana_mes=LEAST(4,CEIL(EXTRACT(DAY FROM target_date)/7.0)::integer));

    SELECT COUNT(*)::integer
    INTO prospecting_executed_value
    FROM public.eventos_comerciais ec
    WHERE ec.loja_id=p_store_id
      AND ec.seller_user_id=seller_row.seller_user_id
      AND ec.tipo_evento::text='cliente_qualificado'
      AND COALESCE(ec.data_competencia,timezone('America/Sao_Paulo',ec.data_evento)::date)=target_date;

    SELECT
      COUNT(*)::integer,
      COUNT(*) FILTER (WHERE COALESCE((ea.metadata->>'customer_updated')::boolean,false)=true)::integer
    INTO updates_expected_value,updates_completed_value
    FROM public.execution_actions ea
    WHERE ea.store_id=p_store_id
      AND ea.seller_id=seller_row.seller_user_id
      AND timezone('America/Sao_Paulo',ea.due_at)::date=target_date
      AND ea.status IN ('concluida','justificada')
      AND COALESCE((ea.metadata->>'requires_customer_update')::boolean,false)=true;

    SELECT ld.submission_status,
      (
        ld.submission_status='on_time'
        OR EXISTS(
          SELECT 1 FROM public.solicitacoes_correcao_lancamento scr
          WHERE scr.checkin_id=ld.id AND scr.status='approved'
        )
      )
    INTO closing_status,closing_official
    FROM public.lancamentos_diarios ld
    WHERE ld.store_id=p_store_id
      AND ld.seller_user_id=seller_row.seller_user_id
      AND ld.metric_scope='daily'
      AND ld.reference_date=target_date
    ORDER BY ld.updated_at DESC NULLS LAST
    LIMIT 1;
    closing_status:=COALESCE(closing_status,'missing');
    closing_official:=COALESCE(closing_official,false);

    access_points_value:=CASE WHEN accessed THEN 10 ELSE 0 END;
    score_denominator_value:=100;

    diagnostic:=public.get_seller_routine_block_diagnostic(p_store_id,seller_row.seller_user_id,target_date,'acesso');
    diagnostic_status:=diagnostic->>'status'; block_weight:=10;
    IF diagnostic_status IN ('erro_geracao','nao_aplicavel') THEN
      access_points_value:=NULL;
      score_denominator_value:=score_denominator_value-block_weight;
    END IF;

    diagnostic:=public.get_seller_routine_block_diagnostic(p_store_id,seller_row.seller_user_id,target_date,'pendencias');
    diagnostic_status:=diagnostic->>'status'; block_weight:=10;
    IF diagnostic_status IN ('erro_geracao','nao_aplicavel') THEN
      pending_points_value:=NULL;
      score_denominator_value:=score_denominator_value-block_weight;
    ELSIF pending_expected_value>0 THEN
      pending_points_value:=LEAST(10,10.0*pending_resolved_value/pending_expected_value);
    ELSIF diagnostic_status='zero_legitimo' AND reliable_work_base_value THEN
      pending_points_value:=10;
    ELSE
      pending_points_value:=0;
    END IF;

    diagnostic:=public.get_seller_routine_block_diagnostic(p_store_id,seller_row.seller_user_id,target_date,'plano_ataque');
    diagnostic_status:=diagnostic->>'status'; block_weight:=20;
    IF diagnostic_status IN ('erro_geracao','nao_aplicavel') THEN
      attack_points_value:=NULL;
      score_denominator_value:=score_denominator_value-block_weight;
    ELSIF attack_expected_value>0 THEN
      attack_points_value:=LEAST(20,20.0*attack_executed_value/attack_expected_value);
    ELSIF diagnostic_status='zero_legitimo' AND reliable_work_base_value THEN
      attack_points_value:=20;
    ELSE
      attack_points_value:=0;
    END IF;

    diagnostic:=public.get_seller_routine_block_diagnostic(p_store_id,seller_row.seller_user_id,target_date,'prospeccao');
    diagnostic_status:=diagnostic->>'status'; block_weight:=20;
    IF diagnostic_status IN ('erro_geracao','nao_aplicavel') THEN
      prospecting_points_value:=NULL;
      score_denominator_value:=score_denominator_value-block_weight;
    ELSIF prospecting_expected_value>0 THEN
      prospecting_points_value:=LEAST(20,20.0*prospecting_executed_value/prospecting_expected_value);
    ELSIF diagnostic_status='zero_legitimo' AND reliable_work_base_value THEN
      prospecting_points_value:=20;
    ELSE
      prospecting_points_value:=0;
    END IF;

    diagnostic:=public.get_seller_routine_block_diagnostic(p_store_id,seller_row.seller_user_id,target_date,'atualizacao');
    diagnostic_status:=diagnostic->>'status'; block_weight:=20;
    IF diagnostic_status IN ('erro_geracao','nao_aplicavel') THEN
      update_points_value:=NULL;
      score_denominator_value:=score_denominator_value-block_weight;
    ELSIF updates_expected_value = 0 THEN 0
      update_points_value:=0;
    ELSE
      update_points_value:=LEAST(20,20.0*updates_completed_value/updates_expected_value);
    END IF;

    closing_points_value:=CASE WHEN closing_official THEN 20 ELSE 0 END;
    diagnostic:=public.get_seller_routine_block_diagnostic(p_store_id,seller_row.seller_user_id,target_date,'fechamento');
    diagnostic_status:=diagnostic->>'status'; block_weight:=20;
    IF diagnostic_status IN ('erro_geracao','nao_aplicavel') THEN
      closing_points_value:=NULL;
      score_denominator_value:=score_denominator_value-block_weight;
    END IF;

    IF NOT eligible_value THEN
      execution_score_value:=NULL;
      score_denominator_value:=0;
      routine_status_value:='nao_aplicavel';
      access_points_value:=NULL; pending_points_value:=NULL; attack_points_value:=NULL;
      prospecting_points_value:=NULL; update_points_value:=NULL; closing_points_value:=NULL;
    ELSE
      execution_score_value:=CASE WHEN score_denominator_value>0 THEN ROUND(
        100*(COALESCE(access_points_value,0)+COALESCE(pending_points_value,0)+
        COALESCE(attack_points_value,0)+COALESCE(prospecting_points_value,0)+
        COALESCE(update_points_value,0)+COALESCE(closing_points_value,0))/score_denominator_value,2
      ) ELSE NULL END;
      routine_status_value:=CASE
        WHEN target_date>local_now::date THEN 'aguardando_inicio'
        WHEN target_date=local_now::date AND NOT accessed AND local_now::time<time '10:00' THEN 'nao_iniciada'
        WHEN score_denominator_value<=0 THEN 'erro_geracao'
        WHEN execution_score_value>=75 THEN 'em_dia'
        WHEN execution_score_value>=50 THEN 'atencao'
        ELSE 'critico'
      END;
    END IF;

    source_payload_value:=jsonb_build_object(
      'sources',jsonb_build_object(
        'access','central_execucao_aberturas','pendencies','cadencia_estado_cliente',
        'attack','execution_actions','prospecting','prospecting_schedule/eventos_comerciais',
        'updates','execution_actions','closing','lancamentos_diarios'
      ),
      'closing_status',closing_status,
      'prospecting_assignment_required',prospecting_expected_value=0,
      'calculated_at',now()
    );

    calculated_source_hash:=md5(concat_ws('|',
      p_store_id::text,seller_row.seller_user_id::text,target_date::text,eligible_value::text,
      reliable_work_base_value::text,access_numerator_value::text,pending_resolved_value::text,
      pending_expected_value::text,attack_executed_value::text,attack_expected_value::text,
      prospecting_executed_value::text,prospecting_expected_value::text,
      updates_completed_value::text,updates_expected_value::text,closing_status,
      COALESCE(execution_score_value::text,'null'),routine_status_value,score_denominator_value::text
    ));

    SELECT srs.source_hash INTO latest_source_hash
    FROM public.seller_routine_snapshots srs
    WHERE srs.seller_user_id=seller_row.seller_user_id AND srs.reference_date=target_date
    ORDER BY srs.version DESC LIMIT 1;

    IF latest_source_hash=calculated_source_hash THEN
      SELECT * INTO existing_row FROM public.seller_routine_snapshots srs
      WHERE srs.seller_user_id=seller_row.seller_user_id AND srs.reference_date=target_date
      ORDER BY srs.version DESC LIMIT 1;
      RETURN NEXT existing_row;
      CONTINUE;
    END IF;

    SELECT COALESCE(MAX(srs.version),0)+1 INTO next_version
    FROM public.seller_routine_snapshots srs
    WHERE srs.seller_user_id=seller_row.seller_user_id AND srs.reference_date=target_date;

    INSERT INTO public.seller_routine_snapshots(
      seller_user_id,store_id,reference_date,version,eligible,not_applicable_reason,
      reliable_work_base,access_numerator,access_denominator,pending_resolved,pending_expected,
      attack_executed,attack_expected,prospecting_executed,prospecting_expected,
      updates_completed,updates_expected,closing_points,access_points,pending_points,
      attack_points,prospecting_points,update_points,execution_score,routine_status,
      score_denominator,source_hash,source_payload
    ) VALUES(
      seller_row.seller_user_id,p_store_id,target_date,next_version,eligible_value,
      not_applicable_reason_value,reliable_work_base_value,access_numerator_value,
      access_denominator_value,pending_resolved_value,pending_expected_value,
      attack_executed_value,attack_expected_value,prospecting_executed_value,
      prospecting_expected_value,updates_completed_value,updates_expected_value,
      closing_points_value,access_points_value,pending_points_value,attack_points_value,
      prospecting_points_value,update_points_value,execution_score_value,routine_status_value,
      score_denominator_value,calculated_source_hash,source_payload_value
    ) RETURNING * INTO inserted_row;

    RETURN NEXT inserted_row;
  END LOOP;
  RETURN;
EXCEPTION WHEN others THEN
  PERFORM public.log_rpc_error(
    'consolidate_seller_routine_snapshots',SQLSTATE,SQLERRM,caller_id,
    jsonb_build_object('store_id',p_store_id,'reference_date',target_date)
  );
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.consolidate_seller_routine_snapshots(uuid,date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consolidate_seller_routine_snapshots(uuid,date) FROM anon;
GRANT EXECUTE ON FUNCTION public.consolidate_seller_routine_snapshots(uuid,date) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.run_seller_routine_snapshot_refresh_clock()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  store_row record;
  local_date date:=timezone('America/Sao_Paulo',now())::date;
BEGIN
  FOR store_row IN SELECT id FROM public.lojas LOOP
    PERFORM public.consolidate_seller_routine_snapshots(store_row.id,local_date);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.run_seller_routine_snapshot_refresh_clock() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.run_seller_routine_snapshot_refresh_clock() TO service_role;

DO $$
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname='mx-refresh-seller-routine-snapshots';
  PERFORM cron.schedule(
    'mx-refresh-seller-routine-snapshots','15 * * * *',
    'SELECT public.run_seller_routine_snapshot_refresh_clock();'
  );
END $$;

COMMIT;
