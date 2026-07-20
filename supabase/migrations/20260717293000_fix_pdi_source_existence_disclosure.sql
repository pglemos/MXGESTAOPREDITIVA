BEGIN;

-- Follow-up to 20260717292000_harden_pdi_development_recommendations.sql.
-- Scope authorization is applied inside the source SELECT so callers receive
-- the same 42501 response for nonexistent and out-of-scope sources.

CREATE OR REPLACE FUNCTION public.gerar_recomendacoes_desenvolvimento_feedback(p_feedback_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_is_service_role boolean := auth.role() = 'service_role';
  v_feedback record;
  v_theme text;
  v_training uuid;
  v_reason text;
  v_priority text;
  v_due_date date;
  v_effective_creator uuid;
  v_count integer := 0;
  v_generation_lock_key bigint;
BEGIN
  IF NOT v_is_service_role AND v_caller IS NULL THEN
    RAISE EXCEPTION 'Sessao invalida.' USING ERRCODE = '42501';
  END IF;

  SELECT
    d.id,
    d.store_id,
    d.manager_id,
    d.seller_id,
    d.attention_points,
    d.action,
    d.diagnostic_json,
    d.vnd_week
  INTO v_feedback
  FROM public.devolutivas d
  WHERE d.id = p_feedback_id
    AND (
      v_is_service_role
      OR public.eh_area_interna_mx(v_caller)
      OR d.manager_id = v_caller
      OR public.is_manager_of(d.store_id)
      OR public.is_owner_of(d.store_id)
    )
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Feedback nao encontrado ou sem acesso.' USING ERRCODE = '42501';
  END IF;

  IF NOT public.tem_papel_loja(v_feedback.store_id, ARRAY['vendedor'], v_feedback.seller_id) THEN
    RAISE EXCEPTION 'Vendedor do feedback nao possui vinculo ativo nesta loja.' USING ERRCODE = '42501';
  END IF;

  v_effective_creator := COALESCE(v_caller, v_feedback.manager_id);
  v_generation_lock_key := hashtextextended(
    concat_ws('|', 'development-recommendation', 'feedback', p_feedback_id::text),
    0
  );
  PERFORM pg_advisory_xact_lock(v_generation_lock_key);

  v_theme := public.mx_development_theme_from_text(
    concat_ws(' ', v_feedback.attention_points, v_feedback.action, v_feedback.diagnostic_json::text)
  );
  v_training := public.mx_first_active_training_for_theme(v_theme, v_feedback.store_id);
  v_reason := concat(
    'Recomendacao criada a partir da devolutiva semanal: ',
    left(coalesce(v_feedback.attention_points, v_feedback.action), 220)
  );
  v_priority := CASE WHEN v_feedback.vnd_week = 0 THEN 'high' ELSE 'medium' END;
  v_due_date := (current_date + interval '7 days')::date;

  INSERT INTO public.recomendacoes_desenvolvimento (
    seller_id,
    store_id,
    source_type,
    source_id,
    theme,
    training_id,
    reason,
    priority,
    due_date,
    created_by
  ) VALUES (
    v_feedback.seller_id,
    v_feedback.store_id,
    'feedback',
    v_feedback.id,
    v_theme,
    v_training,
    v_reason,
    v_priority,
    v_due_date,
    v_effective_creator
  )
  ON CONFLICT (source_type, source_id)
    WHERE source_type = 'feedback' AND source_id IS NOT NULL
  DO UPDATE SET
    theme = EXCLUDED.theme,
    training_id = EXCLUDED.training_id,
    reason = EXCLUDED.reason,
    priority = EXCLUDED.priority,
    due_date = EXCLUDED.due_date,
    created_by = v_effective_creator,
    updated_at = now()
  WHERE public.recomendacoes_desenvolvimento.status = 'recommended'
  RETURNING 1 INTO v_count;

  v_count := COALESCE(v_count, 0);

  INSERT INTO public.logs_auditoria (
    user_id,
    action,
    entity,
    entity_id,
    details_json
  ) VALUES (
    v_effective_creator,
    'generate_development_recommendations',
    'recomendacoes_desenvolvimento',
    p_feedback_id,
    jsonb_build_object(
      'source_type', 'feedback',
      'source_id', p_feedback_id,
      'store_id', v_feedback.store_id,
      'seller_id', v_feedback.seller_id,
      'affected_count', v_count
    )
  );

  RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.gerar_recomendacoes_desenvolvimento_pdi(p_sessao_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_is_service_role boolean := auth.role() = 'service_role';
  v_sessao record;
  v_gap record;
  v_theme text;
  v_training uuid;
  v_reason text;
  v_effective_creator uuid;
  v_count integer := 0;
  v_affected integer := 0;
  v_generation_lock_key bigint;
BEGIN
  IF NOT v_is_service_role AND v_caller IS NULL THEN
    RAISE EXCEPTION 'Sessao invalida.' USING ERRCODE = '42501';
  END IF;

  SELECT
    s.id,
    s.colaborador_id,
    s.gerente_id,
    s.loja_id,
    s.proxima_revisao_data
  INTO v_sessao
  FROM public.pdi_sessoes s
  WHERE s.id = p_sessao_id
    AND (
      v_is_service_role
      OR public.eh_area_interna_mx(v_caller)
      OR s.gerente_id = v_caller
      OR public.is_manager_of(s.loja_id)
      OR public.is_owner_of(s.loja_id)
    )
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PDI nao encontrado ou sem acesso.' USING ERRCODE = '42501';
  END IF;

  IF v_sessao.loja_id IS NULL
    OR NOT public.tem_papel_loja(v_sessao.loja_id, ARRAY['vendedor'], v_sessao.colaborador_id)
  THEN
    RAISE EXCEPTION 'Vendedor do PDI nao possui vinculo ativo nesta loja.' USING ERRCODE = '42501';
  END IF;

  v_effective_creator := COALESCE(v_caller, v_sessao.gerente_id);
  v_generation_lock_key := hashtextextended(
    concat_ws('|', 'development-recommendation', 'pdi', p_sessao_id::text),
    0
  );
  PERFORM pg_advisory_xact_lock(v_generation_lock_key);

  FOR v_gap IN
    SELECT
      av.nota_atribuida,
      av.alvo,
      c.nome,
      c.indicador
    FROM public.pdi_avaliacoes_competencia av
    JOIN public.pdi_competencias c ON c.id = av.competencia_id
    WHERE av.sessao_id = p_sessao_id
    ORDER BY (av.alvo - av.nota_atribuida) DESC, c.ordem ASC
    LIMIT 5
  LOOP
    v_theme := public.mx_development_theme_from_text(concat_ws(' ', v_gap.nome, v_gap.indicador));
    v_training := public.mx_first_active_training_for_theme(v_theme, v_sessao.loja_id);
    v_reason := concat(
      'Lacuna PDI em ',
      v_gap.nome,
      ': nota ',
      v_gap.nota_atribuida,
      ' de alvo ',
      v_gap.alvo,
      '.'
    );
    v_affected := 0;

    INSERT INTO public.recomendacoes_desenvolvimento (
      seller_id,
      store_id,
      source_type,
      source_id,
      theme,
      training_id,
      reason,
      priority,
      due_date,
      created_by
    ) VALUES (
      v_sessao.colaborador_id,
      v_sessao.loja_id,
      'pdi',
      p_sessao_id,
      v_theme,
      v_training,
      v_reason,
      CASE WHEN (v_gap.alvo - v_gap.nota_atribuida) >= 3 THEN 'high' ELSE 'medium' END,
      coalesce(v_sessao.proxima_revisao_data::date, (current_date + interval '30 days')::date),
      v_effective_creator
    )
    ON CONFLICT (source_type, source_id, reason)
      WHERE source_type = 'pdi' AND source_id IS NOT NULL
    DO UPDATE SET
      theme = EXCLUDED.theme,
      training_id = EXCLUDED.training_id,
      priority = EXCLUDED.priority,
      due_date = EXCLUDED.due_date,
      created_by = v_effective_creator,
      updated_at = now()
    WHERE public.recomendacoes_desenvolvimento.status = 'recommended'
    RETURNING 1 INTO v_affected;

    v_count := v_count + COALESCE(v_affected, 0);
  END LOOP;

  INSERT INTO public.logs_auditoria (
    user_id,
    action,
    entity,
    entity_id,
    details_json
  ) VALUES (
    v_effective_creator,
    'generate_development_recommendations',
    'recomendacoes_desenvolvimento',
    p_sessao_id,
    jsonb_build_object(
      'source_type', 'pdi',
      'source_id', p_sessao_id,
      'store_id', v_sessao.loja_id,
      'seller_id', v_sessao.colaborador_id,
      'affected_count', v_count
    )
  );

  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.gerar_recomendacoes_desenvolvimento_feedback(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.gerar_recomendacoes_desenvolvimento_feedback(uuid)
  TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.gerar_recomendacoes_desenvolvimento_pdi(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.gerar_recomendacoes_desenvolvimento_pdi(uuid)
  TO authenticated, service_role;

-- DOWN
-- Restore the definitions from 20260717292000 only with explicit incident
-- approval. Doing so reintroduces the source-existence oracle for scoped users.

COMMIT;
