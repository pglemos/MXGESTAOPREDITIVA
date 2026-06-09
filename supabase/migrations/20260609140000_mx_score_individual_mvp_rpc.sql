-- ============================================================================
-- Migration: 20260609140000_mx_score_individual_mvp_rpc.sql
-- Epic:      EPIC-MX-CRM-VENDEDOR
-- ESCOPO: RPC para calcular o MX Score INDIVIDUAL do vendedor a partir de dados
--   reais e inserir em score_calculations (imutável; INSERT-only).
--   Dimensões (0–100), transparentes:
--     - disciplina: % de dias com fechamento (daily_checkins) nos últimos 7 dias
--     - processo:   taxa de comparecimento dos agendamentos resolvidos (30d)
--     - resultado:  taxa de ganho do funil (oportunidades ganho / total)
--   value = round(0.40*resultado + 0.30*processo + 0.30*disciplina)
--   band  = public.classify_score(value)
--   calculation_version = 'mvp_v1'. Idempotente por (scope,period,version).
--   SECURITY DEFINER: contorna RLS para gravar o cálculo do próprio usuário.
--   Aditivo e reversível (DOWN ao final).
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
  FROM public.daily_checkins
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

  -- Se já existia (conflito), retorna o existente
  IF v_row.id IS NULL THEN
    SELECT * INTO v_row FROM public.score_calculations
    WHERE scope_type = 'individual' AND scope_id = p_user
      AND period = p_period AND calculation_version = 'mvp_v1'
    LIMIT 1;
  END IF;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.compute_individual_score_mvp(uuid, date) IS
  'Calcula e grava o MX Score individual (MVP v1) do vendedor a partir de dados reais (disciplina/processo/resultado). Idempotente por período.';

REVOKE ALL ON FUNCTION public.compute_individual_score_mvp(uuid, date) FROM public;
GRANT EXECUTE ON FUNCTION public.compute_individual_score_mvp(uuid, date) TO authenticated;

COMMIT;

-- ============================================================================
-- DOWN
-- ============================================================================
-- BEGIN;
--   DROP FUNCTION IF EXISTS public.compute_individual_score_mvp(uuid, date);
-- COMMIT;
