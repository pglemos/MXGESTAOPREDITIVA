BEGIN;

-- Restore the store scope of legacy PDI sessions only when the active relationship
-- between collaborator and assigned manager resolves to exactly one common store.
WITH shared_store AS (
  SELECT
    s.id AS session_id,
    min(vc.store_id::text)::uuid AS store_id
  FROM public.pdi_sessoes s
  JOIN public.vinculos_loja vc
    ON vc.user_id = s.colaborador_id
   AND vc.is_active = true
  JOIN public.vinculos_loja vg
    ON vg.user_id = s.gerente_id
   AND vg.store_id = vc.store_id
   AND vg.is_active = true
   AND lower(vg.role) IN ('gerente', 'dono')
  WHERE s.loja_id IS NULL
  GROUP BY s.id
  HAVING count(DISTINCT vc.store_id) = 1
)
UPDATE public.pdi_sessoes s
SET loja_id = shared_store.store_id,
    updated_at = now()
FROM shared_store
WHERE s.id = shared_store.session_id
  AND s.loja_id IS NULL;

CREATE OR REPLACE FUNCTION public.create_pdi_session_bundle(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sessao_id uuid;
  v_caller uuid := auth.uid();
  v_is_service_role boolean := auth.role() = 'service_role';
  v_colaborador_id uuid;
  v_loja_id uuid;
  v_cargo_id uuid;
  v_candidate_store_count integer := 0;
  v_candidate_store_id uuid;
  v_meta jsonb;
  v_avaliacao jsonb;
  v_acao jsonb;
BEGIN
  IF v_is_service_role AND v_caller IS NULL THEN
    v_caller := NULLIF(p_payload->>'gerente_id', '')::uuid;
  END IF;

  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Sessao invalida.' USING ERRCODE = '42501';
  END IF;

  v_colaborador_id := NULLIF(p_payload->>'colaborador_id', '')::uuid;
  v_loja_id := NULLIF(p_payload->>'loja_id', '')::uuid;
  v_cargo_id := NULLIF(p_payload->>'cargo_id', '')::uuid;

  IF v_colaborador_id IS NULL OR v_cargo_id IS NULL THEN
    RAISE EXCEPTION 'Colaborador e cargo sao obrigatorios para criar o PDI.' USING ERRCODE = '22023';
  END IF;

  IF v_colaborador_id = v_caller THEN
    RAISE EXCEPTION 'Nao e permitido criar o proprio PDI por este fluxo.' USING ERRCODE = '42501';
  END IF;

  IF v_loja_id IS NULL THEN
    IF v_is_service_role OR public.eh_area_interna_mx(v_caller) THEN
      SELECT count(DISTINCT vc.store_id)::integer,
             min(vc.store_id::text)::uuid
        INTO v_candidate_store_count, v_candidate_store_id
      FROM public.vinculos_loja vc
      JOIN public.usuarios colaborador
        ON colaborador.id = vc.user_id
       AND colaborador.active = true
      WHERE vc.user_id = v_colaborador_id
        AND vc.is_active = true
        AND lower(vc.role) = 'vendedor';
    ELSE
      SELECT count(DISTINCT vc.store_id)::integer,
             min(vc.store_id::text)::uuid
        INTO v_candidate_store_count, v_candidate_store_id
      FROM public.vinculos_loja vc
      JOIN public.vinculos_loja vg
        ON vg.user_id = v_caller
       AND vg.store_id = vc.store_id
       AND vg.is_active = true
       AND lower(vg.role) IN ('gerente', 'dono')
      JOIN public.usuarios colaborador
        ON colaborador.id = vc.user_id
       AND colaborador.active = true
      WHERE vc.user_id = v_colaborador_id
        AND vc.is_active = true
        AND lower(vc.role) = 'vendedor';
    END IF;

    IF v_candidate_store_count <> 1 THEN
      RAISE EXCEPTION 'Nao foi possivel resolver uma unica loja autorizada para o PDI.' USING ERRCODE = '42501';
    END IF;

    v_loja_id := v_candidate_store_id;
  END IF;

  IF NOT public.tem_papel_loja(v_loja_id, ARRAY['vendedor'], v_colaborador_id) THEN
    RAISE EXCEPTION 'Colaborador nao possui vinculo ativo de vendedor nesta loja.' USING ERRCODE = '42501';
  END IF;

  IF NOT v_is_service_role
    AND NOT public.eh_area_interna_mx(v_caller)
    AND NOT public.is_manager_of(v_loja_id)
    AND NOT public.is_owner_of(v_loja_id)
  THEN
    RAISE EXCEPTION 'Sem permissao para criar PDI nesta loja.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.pdi_sessoes (
    colaborador_id,
    gerente_id,
    loja_id,
    cargo_id,
    proxima_revisao_data,
    status,
    updated_by
  ) VALUES (
    v_colaborador_id,
    v_caller,
    v_loja_id,
    v_cargo_id,
    NULLIF(p_payload->>'proxima_revisao_data', '')::timestamptz,
    'draft',
    v_caller
  )
  RETURNING id INTO v_sessao_id;

  FOR v_meta IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'metas', '[]'::jsonb))
  LOOP
    INSERT INTO public.pdi_metas (sessao_id, prazo, tipo, descricao, updated_by)
    VALUES (
      v_sessao_id,
      v_meta->>'prazo',
      v_meta->>'tipo',
      v_meta->>'descricao',
      v_caller
    );
  END LOOP;

  FOR v_avaliacao IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'avaliacoes', '[]'::jsonb))
  LOOP
    INSERT INTO public.pdi_avaliacoes_competencia (
      sessao_id,
      competencia_id,
      nota_atribuida,
      alvo,
      origem_nota
    ) VALUES (
      v_sessao_id,
      (v_avaliacao->>'competencia_id')::uuid,
      (v_avaliacao->>'nota_atribuida')::integer,
      (v_avaliacao->>'alvo')::integer,
      COALESCE(v_avaliacao->>'origem_nota', 'gestor')
    );
  END LOOP;

  FOR v_acao IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'plano_acao', '[]'::jsonb))
  LOOP
    INSERT INTO public.pdi_plano_acao (
      sessao_id,
      competencia_id,
      descricao_acao,
      data_conclusao,
      impacto,
      custo,
      status,
      updated_by
    ) VALUES (
      v_sessao_id,
      (v_acao->>'competencia_id')::uuid,
      v_acao->>'descricao_acao',
      (v_acao->>'data_conclusao')::date,
      v_acao->>'impacto',
      v_acao->>'custo',
      'pendente',
      v_caller
    );
  END LOOP;

  RETURN v_sessao_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.approve_pdi_action_evidence(
  p_action_id uuid,
  p_approval_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_is_service_role boolean := auth.role() = 'service_role';
  v_effective_approver uuid;
  v_session record;
BEGIN
  IF v_is_service_role AND v_caller IS NULL THEN
    v_caller := NULLIF(p_approval_payload->>'approved_by', '')::uuid;
  END IF;

  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Sessao invalida.' USING ERRCODE = '42501';
  END IF;

  SELECT
    a.sessao_id,
    a.status AS previous_status,
    s.colaborador_id,
    s.gerente_id,
    s.loja_id
  INTO v_session
  FROM public.pdi_plano_acao a
  JOIN public.pdi_sessoes s ON s.id = a.sessao_id
  WHERE a.id = p_action_id
  FOR UPDATE OF a;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Acao de PDI nao encontrada.' USING ERRCODE = 'P0002';
  END IF;

  IF v_session.colaborador_id = v_caller THEN
    RAISE EXCEPTION 'Autoaprovacao de acao de PDI nao permitida.' USING ERRCODE = '42501';
  END IF;

  IF NOT v_is_service_role
    AND NOT public.eh_area_interna_mx(v_caller)
    AND NOT (v_session.gerente_id = v_caller)
    AND NOT (
      v_session.loja_id IS NOT NULL
      AND public.is_owner_of(v_session.loja_id)
    )
  THEN
    RAISE EXCEPTION 'Sem permissao para aprovar esta acao de PDI.' USING ERRCODE = '42501';
  END IF;

  v_effective_approver := v_caller;

  UPDATE public.pdi_plano_acao
  SET status = 'concluido',
      aprovado_por = v_effective_approver,
      data_aprovacao = now(),
      updated_at = now(),
      updated_by = v_effective_approver
  WHERE id = p_action_id;

  INSERT INTO public.logs_auditoria (
    user_id,
    action,
    entity,
    entity_id,
    details_json
  ) VALUES (
    v_effective_approver,
    'approve_pdi_action_evidence',
    'pdi_plano_acao',
    p_action_id,
    jsonb_build_object(
      'sessao_id', v_session.sessao_id,
      'loja_id', v_session.loja_id,
      'colaborador_id', v_session.colaborador_id,
      'previous_status', v_session.previous_status,
      'new_status', 'concluido',
      'approval_payload', COALESCE(p_approval_payload, '{}'::jsonb)
    )
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.create_pdi_session_bundle(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_pdi_session_bundle(jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.approve_pdi_action_evidence(uuid,jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.approve_pdi_action_evidence(uuid,jsonb) TO authenticated, service_role;

-- DOWN
-- Restore create_pdi_session_bundle from 20260714130000_fix_pdi_session_initial_status.sql
-- and approve_pdi_action_evidence from 20260501040000_fix_remote_lint_findings.sql.
-- Reopen prior grants only with explicit incident approval:
-- GRANT EXECUTE ON FUNCTION public.create_pdi_session_bundle(jsonb) TO PUBLIC, anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.approve_pdi_action_evidence(uuid,jsonb) TO PUBLIC, anon, authenticated, service_role;
-- The deterministic loja_id backfill is intentionally not nulled during rollback because
-- it repairs valid historical scope and removing it would reintroduce ambiguous records.

COMMIT;
