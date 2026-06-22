-- ============================================================================
-- Seller module live-action fixes
-- - Permite que vendedor vinculado gere sugestões rules-based da própria loja.
-- - Garante colunas de notificação do fechamento em vendedor_perfil quando
--   ambientes remotos ainda não aplicaram a migration base completa.
-- ============================================================================

BEGIN;

ALTER TABLE public.vendedor_perfil
  ADD COLUMN IF NOT EXISTS fechar_dia_notificacao_ativa boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS fechar_dia_notificacao_hora time;

COMMENT ON COLUMN public.vendedor_perfil.fechar_dia_notificacao_ativa IS
  'Preferência do vendedor para receber lembrete de fechamento diário.';
COMMENT ON COLUMN public.vendedor_perfil.fechar_dia_notificacao_hora IS
  'Horário preferencial do lembrete de fechamento diário.';

CREATE OR REPLACE FUNCTION public.consultor_ia_sugerir_acao(
  p_store_id uuid,
  p_period date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  solucao_id uuid,
  rule_code text,
  problem text,
  recommendation text,
  priority public.action_priority
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_version text := 'consultor-ia-rules-2026.06.19';
  v_score numeric;
  v_critical_count integer := 0;
  v_old_overdue integer := 0;
  v_silent_sellers integer := 0;
  v_new_id uuid;
  v_period date := COALESCE(p_period, CURRENT_DATE);
  v_period_key text := to_char(COALESCE(p_period, CURRENT_DATE), 'YYYY-MM');
  v_can_run boolean;
BEGIN
  v_can_run :=
    public.user_has_role(ARRAY['master','director','sales_manager','consultant','admin_mx'])
    OR public.tem_papel_loja(p_store_id, ARRAY['dono','gerente','vendedor'], auth.uid());

  IF NOT v_can_run THEN
    RAISE EXCEPTION 'insuficiente: requer role operacional ou vínculo ativo na loja'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT sc.value
    INTO v_score
    FROM public.score_calculations sc
   WHERE sc.scope_type = 'store'::public.score_scope_type
     AND sc.scope_id = p_store_id
     AND sc.period <= v_period
   ORDER BY sc.period DESC, sc.computed_at DESC
   LIMIT 1;

  SELECT COUNT(*)
    INTO v_critical_count
    FROM public.alerts a
   WHERE a.scope_type = 'store'::public.score_scope_type
     AND a.scope_id = p_store_id
     AND a.type = 'critical'
     AND a.status IN ('open','acknowledged');

  SELECT COUNT(*)
    INTO v_old_overdue
    FROM public.planos_acao p
   WHERE p.scope_type = 'store'::public.score_scope_type
     AND p.scope_id = p_store_id
     AND p.status = 'atrasado'
     AND p.prazo < (v_period - INTERVAL '7 days');

  SELECT COUNT(*)
    INTO v_silent_sellers
    FROM public.vendedores_loja v
   WHERE v.store_id = p_store_id
     AND v.is_active = true
     AND NOT EXISTS (
       SELECT 1
         FROM public.lancamentos_diarios c
        WHERE c.seller_user_id = v.seller_user_id
          AND c.reference_date >= v_period - INTERVAL '5 days'
     );

  IF v_critical_count > 0 THEN
    INSERT INTO public.consultor_solucoes (
      scope_type, scope_id, rule_code, problem, recommendation, priority, rule_version, metadata
    )
    SELECT
      'store'::public.score_scope_type,
      p_store_id,
      'C1_alerta_critico_aberto',
      v_critical_count || ' alerta(s) crítico(s) em aberto na loja.',
      'Abrir reunião imediata com o responsável, registrar ação na Central e acompanhar até baixar criticidade.',
      'critica'::public.action_priority,
      v_version,
      jsonb_build_object('period', v_period_key, 'count', v_critical_count)
    WHERE NOT EXISTS (
      SELECT 1
        FROM public.consultor_solucoes s
       WHERE s.scope_type = 'store'::public.score_scope_type
         AND s.scope_id = p_store_id
         AND s.rule_code = 'C1_alerta_critico_aberto'
         AND s.metadata ->> 'period' = v_period_key
    )
    RETURNING id INTO v_new_id;

    IF v_new_id IS NOT NULL THEN
      solucao_id := v_new_id;
      rule_code := 'C1_alerta_critico_aberto';
      problem := v_critical_count || ' alerta(s) crítico(s) em aberto na loja.';
      recommendation := 'Abrir reunião imediata com o responsável, registrar ação na Central e acompanhar até baixar criticidade.';
      priority := 'critica';
      RETURN NEXT;
    END IF;
    v_new_id := NULL;
  END IF;

  IF v_score IS NOT NULL AND v_score < 70 THEN
    INSERT INTO public.consultor_solucoes (
      scope_type, scope_id, rule_code, problem, recommendation, priority, rule_version, metadata
    )
    SELECT
      'store'::public.score_scope_type,
      p_store_id,
      'C2_score_baixo',
      'MX Score da loja em ' || v_score::text || ' — abaixo do mínimo Bom (70).',
      'Reforçar fechamento diário, revisar funil semanal e priorizar ações da Central de Execução.',
      'alta'::public.action_priority,
      v_version,
      jsonb_build_object('period', v_period_key, 'value', v_score)
    WHERE NOT EXISTS (
      SELECT 1
        FROM public.consultor_solucoes s
       WHERE s.scope_type = 'store'::public.score_scope_type
         AND s.scope_id = p_store_id
         AND s.rule_code = 'C2_score_baixo'
         AND s.metadata ->> 'period' = v_period_key
    )
    RETURNING id INTO v_new_id;

    IF v_new_id IS NOT NULL THEN
      solucao_id := v_new_id;
      rule_code := 'C2_score_baixo';
      problem := 'MX Score da loja em ' || v_score::text || ' — abaixo do mínimo Bom (70).';
      recommendation := 'Reforçar fechamento diário, revisar funil semanal e priorizar ações da Central de Execução.';
      priority := 'alta';
      RETURN NEXT;
    END IF;
    v_new_id := NULL;
  END IF;

  IF v_old_overdue > 0 THEN
    INSERT INTO public.consultor_solucoes (
      scope_type, scope_id, rule_code, problem, recommendation, priority, rule_version, metadata
    )
    SELECT
      'store'::public.score_scope_type,
      p_store_id,
      'C3_plano_atrasado_7d',
      v_old_overdue || ' plano(s) de ação atrasado(s) há mais de 7 dias.',
      'Repactuar prazo realista por escrito, revisar responsável e calibrar prioridade.',
      'alta'::public.action_priority,
      v_version,
      jsonb_build_object('period', v_period_key, 'count', v_old_overdue)
    WHERE NOT EXISTS (
      SELECT 1
        FROM public.consultor_solucoes s
       WHERE s.scope_type = 'store'::public.score_scope_type
         AND s.scope_id = p_store_id
         AND s.rule_code = 'C3_plano_atrasado_7d'
         AND s.metadata ->> 'period' = v_period_key
    )
    RETURNING id INTO v_new_id;

    IF v_new_id IS NOT NULL THEN
      solucao_id := v_new_id;
      rule_code := 'C3_plano_atrasado_7d';
      problem := v_old_overdue || ' plano(s) de ação atrasado(s) há mais de 7 dias.';
      recommendation := 'Repactuar prazo realista por escrito, revisar responsável e calibrar prioridade.';
      priority := 'alta';
      RETURN NEXT;
    END IF;
    v_new_id := NULL;
  END IF;

  IF v_silent_sellers > 0 THEN
    INSERT INTO public.consultor_solucoes (
      scope_type, scope_id, rule_code, problem, recommendation, priority, rule_version, metadata
    )
    SELECT
      'store'::public.score_scope_type,
      p_store_id,
      'C4_vendedor_silencioso',
      v_silent_sellers || ' vendedor(es) sem lançamento há 5 dias ou mais.',
      'Agendar feedback 1:1 e reforçar trava operacional N3: sem lançamento, sem leads.',
      'media'::public.action_priority,
      v_version,
      jsonb_build_object('period', v_period_key, 'count', v_silent_sellers)
    WHERE NOT EXISTS (
      SELECT 1
        FROM public.consultor_solucoes s
       WHERE s.scope_type = 'store'::public.score_scope_type
         AND s.scope_id = p_store_id
         AND s.rule_code = 'C4_vendedor_silencioso'
         AND s.metadata ->> 'period' = v_period_key
    )
    RETURNING id INTO v_new_id;

    IF v_new_id IS NOT NULL THEN
      solucao_id := v_new_id;
      rule_code := 'C4_vendedor_silencioso';
      problem := v_silent_sellers || ' vendedor(es) sem lançamento há 5 dias ou mais.';
      recommendation := 'Agendar feedback 1:1 e reforçar trava operacional N3: sem lançamento, sem leads.';
      priority := 'media';
      RETURN NEXT;
    END IF;
    v_new_id := NULL;
  END IF;

  IF v_score IS NOT NULL AND v_score >= 90 THEN
    INSERT INTO public.consultor_solucoes (
      scope_type, scope_id, rule_code, problem, recommendation, priority, rule_version, metadata
    )
    SELECT
      'store'::public.score_scope_type,
      p_store_id,
      'C5_replicar_elite',
      'MX Score em zona Elite — referência potencial para a rede.',
      'Documentar boas práticas no banco de soluções e propor mentoria entre lojas.',
      'baixa'::public.action_priority,
      v_version,
      jsonb_build_object('period', v_period_key, 'value', v_score)
    WHERE NOT EXISTS (
      SELECT 1
        FROM public.consultor_solucoes s
       WHERE s.scope_type = 'store'::public.score_scope_type
         AND s.scope_id = p_store_id
         AND s.rule_code = 'C5_replicar_elite'
         AND s.metadata ->> 'period' = v_period_key
    )
    RETURNING id INTO v_new_id;

    IF v_new_id IS NOT NULL THEN
      solucao_id := v_new_id;
      rule_code := 'C5_replicar_elite';
      problem := 'MX Score em zona Elite — referência potencial para a rede.';
      recommendation := 'Documentar boas práticas no banco de soluções e propor mentoria entre lojas.';
      priority := 'baixa';
      RETURN NEXT;
    END IF;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consultor_ia_sugerir_acao(uuid, date) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
