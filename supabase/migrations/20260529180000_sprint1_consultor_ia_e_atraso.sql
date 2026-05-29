-- ============================================================================
-- Migration: 20260529180000_sprint1_consultor_ia_e_atraso.sql
-- Sprint:    1 (pós-Blitz)
-- Story:     S1-T4 (Consultor IA rules-based) + S1-T5 (cálculo atraso plano)
-- PRD:       docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md §4.8, §4.5
-- Fonte:     .docx §215–§225 + ata 2026-05-22 §01:33–§01:38 (delta N9)
-- Owner:     @aiox-master (Orion)
--
-- ESCOPO:
--   • consultor_solucoes — banco de soluções (N10 da ata).
--   • consultor_ia_sugestoes — view consolidada de sugestões para a UI.
--   • RPC public.consultor_ia_sugerir_acao(p_store_id, p_period)
--   • RPC public.mx_score_atualizar_atraso_plano(p_store_id?)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. consultor_solucoes — banco de soluções (N10)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consultor_solucoes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type      public.score_scope_type NOT NULL,
  scope_id        uuid,
  rule_code       text NOT NULL,
  problem         text NOT NULL CHECK (length(trim(problem)) > 0),
  recommendation  text NOT NULL CHECK (length(trim(recommendation)) > 0),
  rationale       text,
  source_alert_id uuid REFERENCES public.alerts(id) ON DELETE SET NULL,
  source_plano_id uuid REFERENCES public.planos_acao(id) ON DELETE SET NULL,
  priority        public.action_priority NOT NULL DEFAULT 'media',
  rule_version    text NOT NULL,
  metadata        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultor_solucoes_scope
  ON public.consultor_solucoes(scope_type, scope_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultor_solucoes_rule
  ON public.consultor_solucoes(rule_code, created_at DESC);

COMMENT ON TABLE public.consultor_solucoes IS
  'Banco de soluções do Consultor IA — rules-based v1 (N10 ata 2026-05-22 §01:33).';

ALTER TABLE public.consultor_solucoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consultor_solucoes_read ON public.consultor_solucoes;
CREATE POLICY consultor_solucoes_read ON public.consultor_solucoes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS consultor_solucoes_insert_admin ON public.consultor_solucoes;
CREATE POLICY consultor_solucoes_insert_admin ON public.consultor_solucoes
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_role(ARRAY['master','director','consultant','admin_mx']));

-- ----------------------------------------------------------------------------
-- 2. RPC public.consultor_ia_sugerir_acao
-- ----------------------------------------------------------------------------
-- Regras canônicas v1 (sem LLM):
--   C1 — Alerta crítico aberto → sugere plano de mitigação.
--   C2 — Score < 70 → sugere reforço de disciplina (lançamentos diários).
--   C3 — Plano atrasado há > 7 dias → sugere repactuação do prazo.
--   C4 — Vendedores sem checkin 5+ dias → sugere feedback 1:1.
--   C5 — Score >= 90 → sugere replicar boas práticas.
-- Cada sugestão é registrada em consultor_solucoes (idempotente por rule_code+escopo+período).
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.consultor_ia_sugerir_acao(
  p_store_id uuid,
  p_period   date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  solucao_id uuid,
  rule_code text,
  problem   text,
  recommendation text,
  priority  public.action_priority
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_version text := 'consultor-ia-rules-2026.05.29';
  v_score numeric;
  v_critical_count integer;
  v_old_overdue integer;
  v_silent_sellers integer;
  v_new_id uuid;
  v_period_key text := to_char(p_period, 'YYYY-MM');
BEGIN
  IF NOT public.user_has_role(ARRAY['master','director','sales_manager','consultant','admin_mx']) THEN
    RAISE EXCEPTION 'insuficiente: requer role operacional'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Insumos ---------------------------------------------------------
  SELECT sc.value INTO v_score
  FROM public.score_calculations sc
  WHERE sc.scope_type = 'loja' AND sc.scope_id = p_store_id AND sc.period <= p_period
  ORDER BY sc.period DESC, sc.computed_at DESC LIMIT 1;

  SELECT COUNT(*) INTO v_critical_count
  FROM public.alerts
  WHERE scope_type = 'loja' AND scope_id = p_store_id
    AND type = 'critical' AND status IN ('open','acknowledged');

  SELECT COUNT(*) INTO v_old_overdue
  FROM public.planos_acao
  WHERE scope_type = 'loja' AND scope_id = p_store_id
    AND status = 'atrasado' AND prazo < (p_period - INTERVAL '7 days');

  SELECT COUNT(*) INTO v_silent_sellers
  FROM public.vendedores_loja v
  WHERE v.store_id = p_store_id AND v.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.lancamentos_diarios c
      WHERE c.seller_user_id = v.seller_user_id
        AND c.reference_date >= p_period - INTERVAL '5 days'
    );

  ------------------------------------------------------------------
  -- C1
  ------------------------------------------------------------------
  IF v_critical_count > 0 THEN
    INSERT INTO public.consultor_solucoes (
      scope_type, scope_id, rule_code, problem, recommendation, priority, rule_version, metadata
    )
    SELECT 'loja', p_store_id, 'C1_alerta_critico_aberto',
           v_critical_count || ' alerta(s) crítico(s) em aberto na loja.',
           'Abrir reunião imediata para destravar plano de mitigação e definir responsável claro.',
           'critica'::public.action_priority,
           v_version,
           jsonb_build_object('period', v_period_key, 'count', v_critical_count)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.consultor_solucoes s
      WHERE s.scope_type = 'loja' AND s.scope_id = p_store_id
        AND s.rule_code = 'C1_alerta_critico_aberto'
        AND s.metadata ->> 'period' = v_period_key
    )
    RETURNING id INTO v_new_id;
    IF v_new_id IS NOT NULL THEN
      solucao_id := v_new_id; rule_code := 'C1_alerta_critico_aberto';
      problem := v_critical_count || ' alerta(s) crítico(s) em aberto na loja.';
      recommendation := 'Abrir reunião imediata para destravar plano de mitigação e definir responsável claro.';
      priority := 'critica'; RETURN NEXT;
    END IF;
    v_new_id := NULL;
  END IF;

  ------------------------------------------------------------------
  -- C2
  ------------------------------------------------------------------
  IF v_score IS NOT NULL AND v_score < 70 THEN
    INSERT INTO public.consultor_solucoes (
      scope_type, scope_id, rule_code, problem, recommendation, priority, rule_version, metadata
    )
    SELECT 'loja', p_store_id, 'C2_score_baixo',
           'MX Score da loja em ' || v_score::text || ' — abaixo do mínimo Bom (70).',
           'Reforçar trava de lançamento diário do vendedor e revisar funil semanal com gerente.',
           'alta'::public.action_priority,
           v_version,
           jsonb_build_object('period', v_period_key, 'value', v_score)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.consultor_solucoes s
      WHERE s.scope_type = 'loja' AND s.scope_id = p_store_id
        AND s.rule_code = 'C2_score_baixo'
        AND s.metadata ->> 'period' = v_period_key
    )
    RETURNING id INTO v_new_id;
    IF v_new_id IS NOT NULL THEN
      solucao_id := v_new_id; rule_code := 'C2_score_baixo';
      problem := 'MX Score da loja em ' || v_score::text || ' — abaixo do mínimo Bom (70).';
      recommendation := 'Reforçar trava de lançamento diário do vendedor e revisar funil semanal com gerente.';
      priority := 'alta'; RETURN NEXT;
    END IF;
    v_new_id := NULL;
  END IF;

  ------------------------------------------------------------------
  -- C3
  ------------------------------------------------------------------
  IF v_old_overdue > 0 THEN
    INSERT INTO public.consultor_solucoes (
      scope_type, scope_id, rule_code, problem, recommendation, priority, rule_version, metadata
    )
    SELECT 'loja', p_store_id, 'C3_plano_atrasado_7d',
           v_old_overdue || ' plano(s) de ação atrasado(s) há mais de 7 dias.',
           'Repactuar prazo realista por escrito, revisar responsável e calibrar prioridade.',
           'alta'::public.action_priority,
           v_version,
           jsonb_build_object('period', v_period_key, 'count', v_old_overdue)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.consultor_solucoes s
      WHERE s.scope_type = 'loja' AND s.scope_id = p_store_id
        AND s.rule_code = 'C3_plano_atrasado_7d'
        AND s.metadata ->> 'period' = v_period_key
    )
    RETURNING id INTO v_new_id;
    IF v_new_id IS NOT NULL THEN
      solucao_id := v_new_id; rule_code := 'C3_plano_atrasado_7d';
      problem := v_old_overdue || ' plano(s) de ação atrasado(s) há mais de 7 dias.';
      recommendation := 'Repactuar prazo realista por escrito, revisar responsável e calibrar prioridade.';
      priority := 'alta'; RETURN NEXT;
    END IF;
    v_new_id := NULL;
  END IF;

  ------------------------------------------------------------------
  -- C4
  ------------------------------------------------------------------
  IF v_silent_sellers > 0 THEN
    INSERT INTO public.consultor_solucoes (
      scope_type, scope_id, rule_code, problem, recommendation, priority, rule_version, metadata
    )
    SELECT 'loja', p_store_id, 'C4_vendedor_silencioso',
           v_silent_sellers || ' vendedor(es) sem lançamento há 5 dias ou mais.',
           'Agendar feedback 1:1 e reforçar trava operacional N3 (sem lançamento, sem leads).',
           'media'::public.action_priority,
           v_version,
           jsonb_build_object('period', v_period_key, 'count', v_silent_sellers)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.consultor_solucoes s
      WHERE s.scope_type = 'loja' AND s.scope_id = p_store_id
        AND s.rule_code = 'C4_vendedor_silencioso'
        AND s.metadata ->> 'period' = v_period_key
    )
    RETURNING id INTO v_new_id;
    IF v_new_id IS NOT NULL THEN
      solucao_id := v_new_id; rule_code := 'C4_vendedor_silencioso';
      problem := v_silent_sellers || ' vendedor(es) sem lançamento há 5 dias ou mais.';
      recommendation := 'Agendar feedback 1:1 e reforçar trava operacional N3 (sem lançamento, sem leads).';
      priority := 'media'; RETURN NEXT;
    END IF;
    v_new_id := NULL;
  END IF;

  ------------------------------------------------------------------
  -- C5
  ------------------------------------------------------------------
  IF v_score IS NOT NULL AND v_score >= 90 THEN
    INSERT INTO public.consultor_solucoes (
      scope_type, scope_id, rule_code, problem, recommendation, priority, rule_version, metadata
    )
    SELECT 'loja', p_store_id, 'C5_replicar_elite',
           'MX Score em zona Elite — referência potencial para a rede.',
           'Documentar boas práticas no banco de soluções e propor mentoria entre lojas.',
           'baixa'::public.action_priority,
           v_version,
           jsonb_build_object('period', v_period_key, 'value', v_score)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.consultor_solucoes s
      WHERE s.scope_type = 'loja' AND s.scope_id = p_store_id
        AND s.rule_code = 'C5_replicar_elite'
        AND s.metadata ->> 'period' = v_period_key
    )
    RETURNING id INTO v_new_id;
    IF v_new_id IS NOT NULL THEN
      solucao_id := v_new_id; rule_code := 'C5_replicar_elite';
      problem := 'MX Score em zona Elite — referência potencial para a rede.';
      recommendation := 'Documentar boas práticas no banco de soluções e propor mentoria entre lojas.';
      priority := 'baixa'; RETURN NEXT;
    END IF;
  END IF;

  RETURN;
END;
$$;

COMMENT ON FUNCTION public.consultor_ia_sugerir_acao(uuid, date) IS
  'Consultor IA rules-based v1 — sugere ações determinísticas com base em score/alertas/planos/disciplina.';

GRANT EXECUTE ON FUNCTION public.consultor_ia_sugerir_acao(uuid, date) TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. RPC public.mx_score_atualizar_atraso_plano
-- ----------------------------------------------------------------------------
-- Varre planos_acao com prazo passado e status pendente/em_andamento; marca como atrasado.
-- Pode ser invocada com escopo (loja específica) ou global (cron noturno).
-- Retorna a quantidade de planos atualizados.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mx_score_atualizar_atraso_plano(
  p_store_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT public.user_has_role(ARRAY['master','director','sales_manager','consultant','admin_mx']) THEN
    RAISE EXCEPTION 'insuficiente: requer role operacional'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  WITH affected AS (
    UPDATE public.planos_acao
       SET status = 'atrasado',
           updated_at = now()
     WHERE prazo IS NOT NULL
       AND prazo < CURRENT_DATE
       AND status IN ('pendente', 'em_andamento')
       AND (p_store_id IS NULL OR (scope_type = 'loja' AND scope_id = p_store_id))
     RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM affected;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.mx_score_atualizar_atraso_plano(uuid) IS
  'Varre planos_acao com prazo passado e marca como atrasado. Idempotente — pode rodar via cron noturno.';

GRANT EXECUTE ON FUNCTION public.mx_score_atualizar_atraso_plano(uuid) TO authenticated;

COMMIT;
