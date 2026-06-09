-- ============================================================================
-- Migration: 20260609160000_seed_individual_scores.sql
-- 1) Corrige compute_individual_score_mvp: a tabela de fechamento é
--    public.lancamentos_diarios (daily_checkins foi renomeada em 20260430190000).
-- 2) Semeia o MX Score individual (período atual) para vendedores com dados.
-- Idempotente / reexecutável.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.compute_individual_score_mvp(
  p_user   uuid DEFAULT auth.uid(),
  p_period date DEFAULT CURRENT_DATE
)
RETURNS public.score_calculations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_disciplina numeric := 0;
  v_processo   numeric := 0;
  v_resultado  numeric := 0;
  v_value      numeric := 0;
  v_dias       integer := 0;
  v_ag_total   integer := 0;
  v_ag_comp    integer := 0;
  v_op_total   integer := 0;
  v_op_ganho   integer := 0;
  v_row        public.score_calculations;
BEGIN
  IF p_user IS NULL THEN
    RAISE EXCEPTION 'usuario nao informado';
  END IF;

  -- Disciplina: dias distintos com fechamento nos últimos 7 dias
  SELECT count(DISTINCT reference_date) INTO v_dias
  FROM public.lancamentos_diarios
  WHERE seller_user_id = p_user
    AND reference_date >= (p_period - INTERVAL '6 days')::date
    AND reference_date <= p_period;
  v_disciplina := LEAST(100, round((v_dias::numeric / 7) * 100));

  -- Processo: comparecimento dos agendamentos resolvidos (últimos 30 dias)
  SELECT
    count(*) FILTER (WHERE status IN ('compareceu','nao_compareceu')),
    count(*) FILTER (WHERE status = 'compareceu')
  INTO v_ag_total, v_ag_comp
  FROM public.agendamentos
  WHERE seller_user_id = p_user
    AND data_hora >= (p_period - INTERVAL '30 days');
  v_processo := CASE WHEN v_ag_total > 0 THEN round((v_ag_comp::numeric / v_ag_total) * 100) ELSE 0 END;

  -- Resultado: taxa de ganho do funil (total de oportunidades do vendedor)
  SELECT count(*), count(*) FILTER (WHERE etapa = 'ganho')
  INTO v_op_total, v_op_ganho
  FROM public.oportunidades
  WHERE seller_user_id = p_user;
  v_resultado := CASE WHEN v_op_total > 0 THEN round((v_op_ganho::numeric / v_op_total) * 100) ELSE 0 END;

  v_value := round(0.40 * v_resultado + 0.30 * v_processo + 0.30 * v_disciplina);

  INSERT INTO public.score_calculations
    (scope_type, scope_id, period, value, band, dim_resultado, dim_processo, dim_disciplina, calculation_version)
  VALUES
    ('individual', p_user, p_period, v_value, public.classify_score(v_value),
     v_resultado, v_processo, v_disciplina, 'mvp_v1')
  ON CONFLICT (scope_type, scope_id, period, calculation_version) DO NOTHING
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    SELECT * INTO v_row FROM public.score_calculations
    WHERE scope_type = 'individual' AND scope_id = p_user
      AND period = p_period AND calculation_version = 'mvp_v1'
    LIMIT 1;
  END IF;

  RETURN v_row;
END;
$$;

-- Seed para vendedores com dados de CRM/fechamento
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT seller_user_id AS uid FROM public.clientes
    UNION
    SELECT DISTINCT seller_user_id FROM public.oportunidades
    UNION
    SELECT DISTINCT seller_user_id FROM public.agendamentos
    UNION
    SELECT DISTINCT seller_user_id FROM public.lancamentos_diarios WHERE seller_user_id IS NOT NULL
  LOOP
    PERFORM public.compute_individual_score_mvp(r.uid, CURRENT_DATE);
  END LOOP;
END $$;

COMMIT;
