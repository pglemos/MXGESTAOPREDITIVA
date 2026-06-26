-- ============================================================================
-- Migration: 20260626120000_ev1_5_disciplina_persistida.sql
-- Story:     MX-EV1-20260626 (docs/stories/story-MX-EV1-20260626-disciplina-persistida.md)
-- Epic:      EV-1.5 (docs/prd/modulo-vendedor/01-epic-fechamento.md#EV-1.5)
--
-- ESCOPO: persiste a Disciplina do Fechamento Diário (fórmula 70% base + até
--   30% de detalhamento D+1, -10pp se atraso liberado) em `lancamentos_diarios`,
--   hoje só calculada em memória/localStorage no client (useCheckinPage.ts).
--   A fórmula em si (70/30) continua calculada no client — esta migration só
--   persiste o resultado e recalcula a penalidade de atraso no servidor
--   (defesa em profundidade: o client não decide se a penalidade se aplica,
--   só informa a base; o servidor deriva o final a partir do seu próprio
--   relógio e do flag de liberação).
--   Também corrige `compute_individual_score_mvp` para usar a disciplina real
--   (média dos últimos 7 dias de `pontuacao_disciplina_final`) em vez da
--   fórmula de frequência ("% dias com fechamento") quando houver dado novo.
--   Aditivo e reversível (bloco DOWN comentado ao final).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Colunas novas em lancamentos_diarios
-- ----------------------------------------------------------------------------
ALTER TABLE public.lancamentos_diarios
  ADD COLUMN IF NOT EXISTS pontuacao_disciplina_base    numeric,
  ADD COLUMN IF NOT EXISTS pontuacao_disciplina_final   numeric,
  ADD COLUMN IF NOT EXISTS finalizado_apos_prazo        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS penalizacao_atraso_aplicada  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS percentual_penalizacao_atraso numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fechamento_liberado          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS liberado_por_id              uuid REFERENCES public.usuarios(id),
  ADD COLUMN IF NOT EXISTS liberado_por_nome            text,
  ADD COLUMN IF NOT EXISTS data_hora_liberacao          timestamptz;

COMMENT ON COLUMN public.lancamentos_diarios.pontuacao_disciplina_base IS
  'Disciplina antes da penalidade de atraso (70% preenchimento básico + até 30% detalhamento D+1). Calculada no client (useCheckinPage.ts), persistida aqui para ranking/comissão/histórico.';
COMMENT ON COLUMN public.lancamentos_diarios.pontuacao_disciplina_final IS
  'pontuacao_disciplina_base - 10pp se finalizado_apos_prazo, clamped [0,100]. Derivada no servidor (submit_checkin), não confia no valor enviado pelo client.';
COMMENT ON COLUMN public.lancamentos_diarios.fechamento_liberado IS
  'true quando um gerente/supervisor/admin/dono liberou este fechamento atrasado (Especificação Funcional — Tela Fechamento Diário, §5).';

-- ----------------------------------------------------------------------------
-- 2. submit_checkin: persiste os campos de disciplina/liberação
--    Mantém 100% do comportamento anterior (validação via checkin_validation_kit,
--    insert/upsert dos campos de produção) e adiciona o bloco de disciplina.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_checkin(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_store_id uuid;
  v_seller_id uuid;
  v_reference_date date;
  v_scope text := coalesce(p_payload->>'metric_scope', 'daily');
  v_checkin_id uuid;
  v_validation record;
  -- Disciplina / atraso
  v_current_sp_time time := (timezone('America/Sao_Paulo', now()))::time;
  v_is_late_now boolean := v_current_sp_time > time '09:30:00';
  v_liberado boolean := coalesce((p_payload->>'fechamento_liberado')::boolean, false);
  v_finalizado_apos_prazo boolean;
  v_disciplina_base numeric;
  v_penalizacao_pp numeric;
  v_disciplina_final numeric;
BEGIN
  v_store_id := nullif(p_payload->>'store_id', '')::uuid;
  v_seller_id := coalesce(nullif(p_payload->>'seller_user_id', '')::uuid, v_caller_id);
  v_reference_date := nullif(p_payload->>'reference_date', '')::date;

  -- Validação centralizada (DB-028)
  SELECT * INTO v_validation
    FROM public.checkin_validation_kit(v_caller_id, v_seller_id, v_store_id, v_reference_date, v_scope);

  IF NOT v_validation.ok THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', v_validation.error_message,
      'error_code', v_validation.error_code
    );
  END IF;

  -- Disciplina: só se aplica a scope daily/historical (regularização atrasada).
  -- 'adjustment' é correção de gestor — sem penalidade, sem recálculo de atraso.
  v_disciplina_base := LEAST(100, GREATEST(0, coalesce((p_payload->>'pontuacao_disciplina_base')::numeric, 0)));

  IF v_scope IN ('daily', 'historical') THEN
    v_finalizado_apos_prazo := v_is_late_now AND v_liberado;
  ELSE
    v_finalizado_apos_prazo := false;
  END IF;

  v_penalizacao_pp := CASE WHEN v_finalizado_apos_prazo THEN 10 ELSE 0 END;
  v_disciplina_final := LEAST(100, GREATEST(0, v_disciplina_base - v_penalizacao_pp));

  -- Insert canônico
  INSERT INTO public.lancamentos_diarios (
    seller_user_id, store_id, reference_date, submitted_at, metric_scope,
    submission_status, submitted_late, edit_locked_at,
    leads_prev_day, agd_cart_prev_day, agd_net_prev_day,
    agd_cart_today, agd_net_today,
    vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day,
    visit_prev_day, zero_reason, note, created_by, updated_at,
    pontuacao_disciplina_base, pontuacao_disciplina_final,
    finalizado_apos_prazo, penalizacao_atraso_aplicada, percentual_penalizacao_atraso,
    fechamento_liberado, liberado_por_id, liberado_por_nome, data_hora_liberacao
  ) VALUES (
    v_seller_id, v_store_id, v_reference_date,
    coalesce(nullif(p_payload->>'submitted_at', '')::timestamptz, now()),
    v_scope,
    coalesce(nullif(p_payload->>'submission_status', ''), 'on_time'),
    coalesce((p_payload->>'submitted_late')::boolean, false),
    nullif(p_payload->>'edit_locked_at', '')::timestamptz,
    coalesce((p_payload->>'leads_prev_day')::integer, 0),
    coalesce((p_payload->>'agd_cart_prev_day')::integer, 0),
    coalesce((p_payload->>'agd_net_prev_day')::integer, 0),
    coalesce((p_payload->>'agd_cart_today')::integer, 0),
    coalesce((p_payload->>'agd_net_today')::integer, 0),
    coalesce((p_payload->>'vnd_porta_prev_day')::integer, 0),
    coalesce((p_payload->>'vnd_cart_prev_day')::integer, 0),
    coalesce((p_payload->>'vnd_net_prev_day')::integer, 0),
    coalesce((p_payload->>'visit_prev_day')::integer, 0),
    nullif(trim(coalesce(p_payload->>'zero_reason', '')), ''),
    nullif(trim(coalesce(p_payload->>'note', '')), ''),
    v_caller_id, now(),
    v_disciplina_base, v_disciplina_final,
    v_finalizado_apos_prazo, v_finalizado_apos_prazo, v_penalizacao_pp,
    v_liberado,
    nullif(p_payload->>'liberado_por_id', '')::uuid,
    nullif(p_payload->>'liberado_por_nome', ''),
    nullif(p_payload->>'data_hora_liberacao', '')::timestamptz
  )
  ON CONFLICT (seller_user_id, store_id, reference_date, metric_scope)
  DO UPDATE SET
    submitted_at = EXCLUDED.submitted_at,
    submission_status = EXCLUDED.submission_status,
    submitted_late = EXCLUDED.submitted_late,
    edit_locked_at = EXCLUDED.edit_locked_at,
    leads_prev_day = EXCLUDED.leads_prev_day,
    agd_cart_prev_day = EXCLUDED.agd_cart_prev_day,
    agd_net_prev_day = EXCLUDED.agd_net_prev_day,
    agd_cart_today = EXCLUDED.agd_cart_today,
    agd_net_today = EXCLUDED.agd_net_today,
    vnd_porta_prev_day = EXCLUDED.vnd_porta_prev_day,
    vnd_cart_prev_day = EXCLUDED.vnd_cart_prev_day,
    vnd_net_prev_day = EXCLUDED.vnd_net_prev_day,
    visit_prev_day = EXCLUDED.visit_prev_day,
    zero_reason = EXCLUDED.zero_reason,
    note = EXCLUDED.note,
    created_by = EXCLUDED.created_by,
    updated_at = now(),
    pontuacao_disciplina_base = EXCLUDED.pontuacao_disciplina_base,
    pontuacao_disciplina_final = EXCLUDED.pontuacao_disciplina_final,
    finalizado_apos_prazo = EXCLUDED.finalizado_apos_prazo,
    penalizacao_atraso_aplicada = EXCLUDED.penalizacao_atraso_aplicada,
    percentual_penalizacao_atraso = EXCLUDED.percentual_penalizacao_atraso,
    fechamento_liberado = EXCLUDED.fechamento_liberado,
    liberado_por_id = EXCLUDED.liberado_por_id,
    liberado_por_nome = EXCLUDED.liberado_por_nome,
    data_hora_liberacao = EXCLUDED.data_hora_liberacao
  RETURNING id INTO v_checkin_id;

  RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object('id', v_checkin_id));
EXCEPTION
  WHEN others THEN
    DECLARE v_trace_id uuid;
    BEGIN
      v_trace_id := public.log_rpc_error('submit_checkin', SQLSTATE, SQLERRM, v_caller_id, p_payload);
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'Erro interno ao processar check-in. trace_id=' || v_trace_id::text,
        'trace_id', v_trace_id
      );
    END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_checkin(jsonb) TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. compute_individual_score_mvp: disciplina real (média 7 dias) com fallback
--    para a fórmula de frequência quando não houver pontuacao_disciplina_final.
-- ----------------------------------------------------------------------------
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
  v_disciplina_media numeric;
  v_disciplina_dias  integer;
  v_ag_total   integer := 0;
  v_ag_comp    integer := 0;
  v_op_total   integer := 0;
  v_op_ganho   integer := 0;
  v_row        public.score_calculations;
BEGIN
  IF p_user IS NULL THEN
    RAISE EXCEPTION 'usuario nao informado';
  END IF;

  -- Disciplina real: média de pontuacao_disciplina_final nos últimos 7 dias,
  -- quando houver lançamento com esse campo preenchido (dado novo, pós EV-1.5).
  SELECT avg(pontuacao_disciplina_final), count(pontuacao_disciplina_final)
    INTO v_disciplina_media, v_disciplina_dias
  FROM public.lancamentos_diarios
  WHERE seller_user_id = p_user
    AND reference_date >= (p_period - INTERVAL '6 days')::date
    AND reference_date <= p_period
    AND pontuacao_disciplina_final IS NOT NULL;

  IF v_disciplina_dias > 0 THEN
    v_disciplina := round(v_disciplina_media);
  ELSE
    -- Fallback (dados anteriores a EV-1.5): % de dias com fechamento em 7 dias
    SELECT count(DISTINCT reference_date) INTO v_dias
    FROM public.lancamentos_diarios
    WHERE seller_user_id = p_user
      AND reference_date >= (p_period - INTERVAL '6 days')::date
      AND reference_date <= p_period;
    v_disciplina := LEAST(100, round((v_dias::numeric / 7) * 100));
  END IF;

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
  'Calcula e grava o MX Score individual (MVP v1). Disciplina = média de pontuacao_disciplina_final (7d) quando disponível (EV-1.5); fallback = % dias com fechamento (7d) para dados anteriores.';

COMMIT;

-- ============================================================================
-- DOWN (rollback emergencial)
-- ============================================================================
-- BEGIN;
--   -- Reverter submit_checkin e compute_individual_score_mvp para as versões
--   -- anteriores (20260518120000_checkin_validation_kit.sql e
--   -- 20260609140000_mx_score_individual_mvp_rpc.sql respectivamente).
--   ALTER TABLE public.lancamentos_diarios
--     DROP COLUMN IF EXISTS pontuacao_disciplina_base,
--     DROP COLUMN IF EXISTS pontuacao_disciplina_final,
--     DROP COLUMN IF EXISTS finalizado_apos_prazo,
--     DROP COLUMN IF EXISTS penalizacao_atraso_aplicada,
--     DROP COLUMN IF EXISTS percentual_penalizacao_atraso,
--     DROP COLUMN IF EXISTS fechamento_liberado,
--     DROP COLUMN IF EXISTS liberado_por_id,
--     DROP COLUMN IF EXISTS liberado_por_nome,
--     DROP COLUMN IF EXISTS data_hora_liberacao;
-- COMMIT;
