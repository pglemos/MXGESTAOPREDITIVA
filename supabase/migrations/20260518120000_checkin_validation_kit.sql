-- Story 1.10 — checkin_validation_kit (DB-028)
-- Centraliza validação "pode lançar checkin?" em UMA função chamada por:
--   - Policy `lancamentos_diarios_insert/update` (direct-POST path)
--   - RPC `submit_checkin` (path canônico)
--
-- Resolve inconsistência DB-028 onde policy via pode_lancar_checkin() valida
-- vendedores_loja.is_active mas RPC submit_checkin (pré-Story 1.6) não.
-- Após Story 1.6, ambos os caminhos validam — mas duplicação de lógica permanece.
-- Esta migration unifica em UMA fonte de verdade.
--
-- Referências:
--   docs/reviews/submit-checkin-rpc-audit.md §6 (descoberta DB-028)
--   docs/adr/0042-checkin-validation-kit.md (a criar)

-- =====================================================
-- 1. Função única checkin_validation_kit
-- =====================================================
CREATE OR REPLACE FUNCTION public.checkin_validation_kit(
  p_caller_id uuid,
  p_seller_id uuid,
  p_store_id uuid,
  p_reference_date date,
  p_scope text DEFAULT 'daily',
  p_now timestamptz DEFAULT now()
)
RETURNS TABLE(ok boolean, error_code text, error_message text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_caller_active boolean;
  v_is_internal boolean;
  v_official_reference date := ((timezone('America/Sao_Paulo', p_now))::date - 1);
  v_current_sp_time time := (timezone('America/Sao_Paulo', p_now))::time;
BEGIN
  -- 1) Caller autenticado e ativo
  IF p_caller_id IS NULL THEN
    RETURN QUERY SELECT false, 'unauthenticated', 'Não autenticado.';
    RETURN;
  END IF;

  SELECT role, active
    INTO v_caller_role, v_caller_active
    FROM public.usuarios
   WHERE id = p_caller_id;

  IF v_caller_role IS NULL OR NOT coalesce(v_caller_active, false) THEN
    RETURN QUERY SELECT false, 'caller_inactive', 'Usuário não autenticado ou inativo.';
    RETURN;
  END IF;

  v_is_internal := v_caller_role IN ('administrador_geral', 'administrador_mx', 'consultor_mx');

  -- 2) Payload mínimo
  IF p_store_id IS NULL OR p_seller_id IS NULL OR p_reference_date IS NULL THEN
    RETURN QUERY SELECT false, 'incomplete_payload', 'Dados de checkin incompletos.';
    RETURN;
  END IF;

  -- 3) Scope válido
  IF p_scope NOT IN ('daily', 'adjustment', 'historical') THEN
    RETURN QUERY SELECT false, 'invalid_scope', 'Escopo de checkin inválido.';
    RETURN;
  END IF;

  -- 4) Admin MX bypassa demais regras (mas ainda valida payload e scope)
  IF v_is_internal THEN
    -- Data futura é sempre bloqueada
    IF p_reference_date > v_official_reference THEN
      RETURN QUERY SELECT false, 'future_date', 'Lançamentos não podem usar data futura.';
      RETURN;
    END IF;

    RETURN QUERY SELECT true, NULL::text, NULL::text;
    RETURN;
  END IF;

  -- 5) Regras de vendedor (não-internal)

  -- 5.1) Scope daily: apenas vendedor
  IF p_scope = 'daily' THEN
    IF v_caller_role <> 'vendedor' THEN
      RETURN QUERY SELECT false, 'role_required', 'Registro diário é permitido apenas para vendedor.';
      RETURN;
    END IF;

    -- 5.2) Self-only (sem impersonation)
    IF p_caller_id <> p_seller_id THEN
      RETURN QUERY SELECT false, 'self_only', 'Registro diário deve ser feito pelo próprio vendedor.';
      RETURN;
    END IF;

    -- 5.3) Reference date deve ser a referência oficial (ontem)
    IF p_reference_date <> v_official_reference THEN
      RETURN QUERY SELECT false, 'invalid_reference_date', 'Registro diário aceita somente a referência oficial.';
      RETURN;
    END IF;

    -- 5.4) Janela horária 09:45
    IF v_current_sp_time > time '09:45:00' THEN
      RETURN QUERY SELECT false, 'time_window_closed', 'Lançamentos diários ficam disponíveis somente até 09:45.';
      RETURN;
    END IF;
  END IF;

  -- 6) Data futura (qualquer scope)
  IF p_reference_date > v_official_reference THEN
    RETURN QUERY SELECT false, 'future_date', 'Lançamentos não podem usar data futura ou o dia corrente.';
    RETURN;
  END IF;

  -- 7) Vínculo de loja ativo
  IF NOT EXISTS (
    SELECT 1 FROM public.vinculos_loja
     WHERE user_id = p_seller_id
       AND store_id = p_store_id
       AND coalesce(is_active, true) = true
  ) THEN
    RETURN QUERY SELECT false, 'no_active_store_link', 'Usuário não possui vínculo ativo com a loja.';
    RETURN;
  END IF;

  -- 8) Vendedor ativo na loja (DB-001 generalizado)
  IF NOT EXISTS (
    SELECT 1 FROM public.vendedores_loja
     WHERE seller_user_id = p_seller_id
       AND store_id = p_store_id
       AND coalesce(is_active, true) = true
       AND (started_at IS NULL OR started_at <= p_reference_date)
       AND (ended_at IS NULL OR ended_at >= p_reference_date)
  ) THEN
    RETURN QUERY SELECT false, 'vendor_inactive', 'Vendedor não está ativo nesta loja no período informado.';
    RETURN;
  END IF;

  -- ✅ Todas validações passaram
  RETURN QUERY SELECT true, NULL::text, NULL::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.checkin_validation_kit(uuid, uuid, uuid, date, text, timestamptz) TO authenticated;

COMMENT ON FUNCTION public.checkin_validation_kit IS
  'DB-028: Single source of truth para validação de checkin. Chamada por policy e por RPC submit_checkin. '
  'Retorna (ok, error_code, error_message). Story 1.10. '
  'Reposiciona pode_lancar_checkin() como wrapper deprecated em Sprint 2.';

-- =====================================================
-- 2. Marcar pode_lancar_checkin() como DEPRECATED
-- (não muda comportamento — apenas anota; remove em Sprint 2)
-- =====================================================
COMMENT ON FUNCTION public.pode_lancar_checkin(uuid, uuid, date, uuid) IS
  'DEPRECATED — use checkin_validation_kit(p_caller_id, p_seller_id, p_store_id, p_reference_date, p_scope) instead. '
  'Removal target: Sprint 2 (DB-028 cleanup).';

-- =====================================================
-- 3. Refatorar submit_checkin para usar checkin_validation_kit
-- (preserva: wrap SQLERRM da Story 1.5 + validações Story 1.6)
-- =====================================================
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

  -- Insert canônico
  INSERT INTO public.lancamentos_diarios (
    seller_user_id, store_id, reference_date, submitted_at, metric_scope,
    submission_status, submitted_late, edit_locked_at,
    leads_prev_day, agd_cart_prev_day, agd_net_prev_day,
    agd_cart_today, agd_net_today,
    vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day,
    visit_prev_day, zero_reason, note, created_by, updated_at
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
    v_caller_id, now()
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
    updated_at = now()
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

-- =====================================================
-- DOWN (rollback emergencial)
-- =====================================================
-- 1. Reverter submit_checkin para versão Story 1.6 (20260517130000)
-- 2. DROP FUNCTION IF EXISTS public.checkin_validation_kit(uuid, uuid, uuid, date, text, timestamptz);
-- 3. pode_lancar_checkin permanece funcional (não foi alterado)
