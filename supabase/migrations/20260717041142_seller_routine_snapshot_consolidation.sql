-- Migration registrada no Supabase de produção como seller_routine_snapshot_consolidation.

BEGIN;

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
  s record;
  e public.seller_day_eligibility;
  eligibility_found boolean;
  eligible_value boolean;
  reason_value text;
  reliable_value boolean;
  accessed boolean;
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
  d_access text;
  d_pending text;
  d_attack text;
  d_prospecting text;
  d_update text;
  d_closing text;
  access_points_value numeric;
  pending_points_value numeric;
  attack_points_value numeric;
  prospecting_points_value numeric;
  update_points_value numeric;
  closing_points_value numeric;
  denominator_value numeric;
  score_value numeric;
  status_value text;
  payload_value jsonb;
  hash_value text;
  previous_hash text;
  next_version integer;
  result_row public.seller_routine_snapshots;
BEGIN
  IF caller_id IS NOT NULL
     AND NOT public.eh_administrador_mx(caller_id)
     AND NOT public.is_manager_of(p_store_id)
     AND NOT public.is_owner_of(p_store_id) THEN
    RAISE EXCEPTION 'Usuário sem permissão para consolidar a rotina desta loja.' USING ERRCODE='42501';
  END IF;

  FOR s IN
    SELECT vl.seller_user_id
    FROM public.vendedores_loja vl
    WHERE vl.store_id=p_store_id
      AND vl.is_active=true
      AND vl.started_at<=target_date
      AND (vl.ended_at IS NULL OR vl.ended_at>=target_date)
  LOOP
    SELECT * INTO e
    FROM public.seller_day_eligibility x
    WHERE x.store_id=p_store_id
      AND x.seller_user_id=s.seller_user_id
      AND x.reference_date=target_date
    ORDER BY x.version DESC LIMIT 1;
    eligibility_found:=FOUND;

    IF NOT public.is_store_operational_date(p_store_id,target_date) THEN
      eligible_value:=false; reason_value:='loja_fechada';
    ELSIF eligibility_found THEN
      eligible_value:=e.is_eligible; reason_value:=CASE WHEN e.is_eligible THEN NULL ELSE e.reason END;
    ELSE
      eligible_value:=true; reason_value:=NULL;
    END IF;

    reliable_value:=EXISTS(
      SELECT 1 FROM public.clientes c
      WHERE c.loja_id=p_store_id AND c.seller_user_id=s.seller_user_id
    ) AND EXISTS(
      SELECT 1 FROM public.lancamentos_diarios ld
      WHERE ld.store_id=p_store_id AND ld.seller_user_id=s.seller_user_id
        AND ld.metric_scope='daily' AND ld.reference_date<target_date
    );

    accessed:=EXISTS(
      SELECT 1 FROM public.central_execucao_aberturas a
      WHERE a.seller_user_id=s.seller_user_id AND a.data=target_date
    );

    SELECT
      (COUNT(*) FILTER (WHERE c.status='ativo' AND c.proxima_acao_em<=target_date)
       + COUNT(*) FILTER (WHERE c.last_result='feito' AND timezone('America/Sao_Paulo',c.updated_at)::date=target_date))::integer,
      COUNT(*) FILTER (WHERE c.last_result='feito' AND timezone('America/Sao_Paulo',c.updated_at)::date=target_date)::integer
    INTO pending_expected_value,pending_resolved_value
    FROM public.cadencia_estado_cliente c
    WHERE c.loja_id=p_store_id AND c.seller_user_id=s.seller_user_id;

    SELECT COUNT(*)::integer,
      COUNT(*) FILTER (WHERE a.status IN ('concluida','justificada'))::integer
    INTO attack_expected_value,attack_executed_value
    FROM public.execution_actions a
    WHERE a.store_id=p_store_id AND a.seller_id=s.seller_user_id
      AND timezone('America/Sao_Paulo',a.due_at)::date=target_date AND a.active=true
      AND (a.source_type='funil' OR a.metadata->>'category'='plano_ataque' OR a.metadata->>'block'='plano_ataque');

    SELECT COALESCE(SUM(p.quantidade),0)::integer
    INTO prospecting_expected_value
    FROM public.prospecting_schedule p
    WHERE p.ativo=true AND p.store_id=p_store_id
      AND (p.seller_user_id=s.seller_user_id OR p.seller_user_id IS NULL)
      AND p.dia_semana=EXTRACT(DOW FROM target_date)::integer
      AND (p.semana_mes IS NULL OR p.semana_mes=LEAST(4,CEIL(EXTRACT(DAY FROM target_date)/7.0)::integer));

    SELECT COUNT(*)::integer INTO prospecting_executed_value
    FROM public.eventos_comerciais v
    WHERE v.loja_id=p_store_id AND v.seller_user_id=s.seller_user_id
      AND v.tipo_evento::text='cliente_qualificado'
      AND COALESCE(v.data_competencia,timezone('America/Sao_Paulo',v.data_evento)::date)=target_date;

    SELECT COUNT(*)::integer,
      COUNT(*) FILTER (WHERE COALESCE((a.metadata->>'customer_updated')::boolean,false))::integer
    INTO updates_expected_value,updates_completed_value
    FROM public.execution_actions a
    WHERE a.store_id=p_store_id AND a.seller_id=s.seller_user_id
      AND timezone('America/Sao_Paulo',a.due_at)::date=target_date
      AND a.status IN ('concluida','justificada')
      AND COALESCE((a.metadata->>'requires_customer_update')::boolean,false);

    SELECT ld.submission_status,
      (ld.submission_status='on_time' OR EXISTS(
        SELECT 1 FROM public.solicitacoes_correcao_lancamento r
        WHERE r.checkin_id=ld.id AND r.status='approved'
      ))
    INTO closing_status,closing_official
    FROM public.lancamentos_diarios ld
    WHERE ld.store_id=p_store_id AND ld.seller_user_id=s.seller_user_id
      AND ld.metric_scope='daily' AND ld.reference_date=target_date
    ORDER BY ld.updated_at DESC NULLS LAST LIMIT 1;
    closing_status:=COALESCE(closing_status,'missing');
    closing_official:=COALESCE(closing_official,false);

    d_access:=public.get_seller_routine_block_diagnostic(p_store_id,s.seller_user_id,target_date,'acesso')->>'status';
    d_pending:=public.get_seller_routine_block_diagnostic(p_store_id,s.seller_user_id,target_date,'pendencias')->>'status';
    d_attack:=public.get_seller_routine_block_diagnostic(p_store_id,s.seller_user_id,target_date,'plano_ataque')->>'status';
    d_prospecting:=public.get_seller_routine_block_diagnostic(p_store_id,s.seller_user_id,target_date,'prospeccao')->>'status';
    d_update:=public.get_seller_routine_block_diagnostic(p_store_id,s.seller_user_id,target_date,'atualizacao')->>'status';
    d_closing:=public.get_seller_routine_block_diagnostic(p_store_id,s.seller_user_id,target_date,'fechamento')->>'status';

    access_points_value:=CASE WHEN d_access IN ('erro_geracao','nao_aplicavel') THEN NULL WHEN accessed THEN 10 ELSE 0 END;
    pending_points_value:=public.calculate_seller_routine_component(pending_expected_value,pending_resolved_value,10,reliable_value,d_pending);
    attack_points_value:=public.calculate_seller_routine_component(attack_expected_value,attack_executed_value,20,reliable_value,d_attack);
    prospecting_points_value:=public.calculate_seller_routine_component(prospecting_expected_value,prospecting_executed_value,20,reliable_value,d_prospecting);
    update_points_value:=CASE WHEN d_update IN ('erro_geracao','nao_aplicavel') THEN NULL WHEN updates_expected_value=0 THEN 0 ELSE LEAST(20,20.0*updates_completed_value/updates_expected_value) END;
    closing_points_value:=CASE WHEN d_closing IN ('erro_geracao','nao_aplicavel') THEN NULL WHEN closing_official THEN 20 ELSE 0 END;

    denominator_value:=100
      - CASE WHEN d_access IN ('erro_geracao','nao_aplicavel') THEN 10 ELSE 0 END
      - CASE WHEN d_pending IN ('erro_geracao','nao_aplicavel') THEN 10 ELSE 0 END
      - CASE WHEN d_attack IN ('erro_geracao','nao_aplicavel') THEN 20 ELSE 0 END
      - CASE WHEN d_prospecting IN ('erro_geracao','nao_aplicavel') THEN 20 ELSE 0 END
      - CASE WHEN d_update IN ('erro_geracao','nao_aplicavel') THEN 20 ELSE 0 END
      - CASE WHEN d_closing IN ('erro_geracao','nao_aplicavel') THEN 20 ELSE 0 END;

    IF NOT eligible_value THEN
      score_value:=NULL; denominator_value:=0; status_value:='nao_aplicavel';
      access_points_value:=NULL; pending_points_value:=NULL; attack_points_value:=NULL;
      prospecting_points_value:=NULL; update_points_value:=NULL; closing_points_value:=NULL;
    ELSE
      score_value:=CASE WHEN denominator_value>0 THEN ROUND(100*(
        COALESCE(access_points_value,0)+COALESCE(pending_points_value,0)+COALESCE(attack_points_value,0)+
        COALESCE(prospecting_points_value,0)+COALESCE(update_points_value,0)+COALESCE(closing_points_value,0)
      )/denominator_value,2) ELSE NULL END;
      status_value:=CASE
        WHEN target_date>local_now::date THEN 'aguardando_inicio'
        WHEN target_date=local_now::date AND NOT accessed AND local_now::time<time '10:00' THEN 'nao_iniciada'
        WHEN denominator_value<=0 THEN 'erro_geracao'
        WHEN score_value>=75 THEN 'em_dia'
        WHEN score_value>=50 THEN 'atencao'
        ELSE 'critico' END;
    END IF;

    payload_value:=jsonb_build_object(
      'closing_status',closing_status,
      'diagnostics',jsonb_build_object('acesso',d_access,'pendencias',d_pending,'plano',d_attack,'prospeccao',d_prospecting,'atualizacao',d_update,'fechamento',d_closing),
      'prospecting_assignment_required',prospecting_expected_value=0,
      'calculated_at',now()
    );
    hash_value:=md5(concat_ws('|',p_store_id,s.seller_user_id,target_date,eligible_value,reliable_value,
      accessed,pending_expected_value,pending_resolved_value,attack_expected_value,attack_executed_value,
      prospecting_expected_value,prospecting_executed_value,updates_expected_value,updates_completed_value,
      closing_status,COALESCE(score_value::text,'null'),status_value,denominator_value));

    SELECT x.source_hash INTO previous_hash
    FROM public.seller_routine_snapshots x
    WHERE x.seller_user_id=s.seller_user_id AND x.reference_date=target_date
    ORDER BY x.version DESC LIMIT 1;

    IF previous_hash=hash_value THEN
      SELECT * INTO result_row FROM public.seller_routine_snapshots x
      WHERE x.seller_user_id=s.seller_user_id AND x.reference_date=target_date
      ORDER BY x.version DESC LIMIT 1;
      RETURN NEXT result_row;
    ELSE
      SELECT COALESCE(MAX(x.version),0)+1 INTO next_version
      FROM public.seller_routine_snapshots x
      WHERE x.seller_user_id=s.seller_user_id AND x.reference_date=target_date;
      INSERT INTO public.seller_routine_snapshots(
        seller_user_id,store_id,reference_date,version,eligible,not_applicable_reason,reliable_work_base,
        access_numerator,access_denominator,pending_resolved,pending_expected,attack_executed,attack_expected,
        prospecting_executed,prospecting_expected,updates_completed,updates_expected,closing_points,
        access_points,pending_points,attack_points,prospecting_points,update_points,execution_score,routine_status,
        source_payload,score_denominator,source_hash
      ) VALUES (
        s.seller_user_id,p_store_id,target_date,next_version,eligible_value,reason_value,reliable_value,
        CASE WHEN accessed THEN 1 ELSE 0 END,1,pending_resolved_value,pending_expected_value,
        attack_executed_value,attack_expected_value,prospecting_executed_value,prospecting_expected_value,
        updates_completed_value,updates_expected_value,closing_points_value,access_points_value,pending_points_value,
        attack_points_value,prospecting_points_value,update_points_value,score_value,status_value,payload_value,
        denominator_value,hash_value
      ) RETURNING * INTO result_row;
      RETURN NEXT result_row;
    END IF;
  END LOOP;
  RETURN;
EXCEPTION WHEN others THEN
  PERFORM public.log_rpc_error('consolidate_seller_routine_snapshots',SQLSTATE,SQLERRM,caller_id,
    jsonb_build_object('store_id',p_store_id,'reference_date',target_date));
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.consolidate_seller_routine_snapshots(uuid,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.consolidate_seller_routine_snapshots(uuid,date) TO authenticated,service_role;

COMMIT;
