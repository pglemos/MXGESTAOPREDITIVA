-- ============================================================================
-- Migration: 20260530170000_sprint3_criar_plano_acao_rpc.sql
-- Sprint:    3
-- Story:     S3-T2 (criar_plano_acao RPC + segmentação N1)
-- PRD:       docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md §4.5 (FR-PLAN-1)
-- Fonte:     .docx §270 + ata 2026-05-22 §00:25 (delta N1)
-- Owner:     @aiox-master (Orion)
--
-- ESCOPO: RPC public.criar_plano_acao que valida escopo + autoria e insere
-- com auditoria. Aceita scope_type IN (loja, departamento, vendedor, consultor)
-- e popula created_by = auth.uid().
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.criar_plano_acao(
  p_scope_type   public.score_scope_type,
  p_scope_id     uuid,
  p_departamento text,
  p_indicador    text,
  p_problema     text,
  p_acao         text,
  p_como         text DEFAULT NULL,
  p_responsavel_id uuid DEFAULT NULL,
  p_prazo        date DEFAULT NULL,
  p_prioridade   public.action_priority DEFAULT 'media',
  p_origem       public.action_origin DEFAULT 'manual',
  p_origem_ref_id    uuid DEFAULT NULL,
  p_origem_ref_table text DEFAULT NULL
)
RETURNS public.planos_acao
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.planos_acao;
BEGIN
  IF NOT public.user_has_role(ARRAY['master','director','sales_manager','consultant','admin_mx']) THEN
    RAISE EXCEPTION 'insuficiente: requer role operacional'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_scope_id IS NULL THEN
    RAISE EXCEPTION 'scope_id obrigatorio';
  END IF;
  IF length(trim(p_departamento)) = 0 THEN
    RAISE EXCEPTION 'departamento obrigatorio';
  END IF;
  IF length(trim(p_indicador)) = 0 THEN
    RAISE EXCEPTION 'indicador obrigatorio';
  END IF;
  IF length(trim(p_problema)) = 0 THEN
    RAISE EXCEPTION 'problema obrigatorio';
  END IF;
  IF length(trim(p_acao)) = 0 THEN
    RAISE EXCEPTION 'acao obrigatoria';
  END IF;

  INSERT INTO public.planos_acao (
    scope_type, scope_id, departamento, indicador,
    problema, acao, como, responsavel_id, prazo,
    prioridade, origem, origem_ref_id, origem_ref_table,
    created_by
  )
  VALUES (
    p_scope_type, p_scope_id, p_departamento, p_indicador,
    p_problema, p_acao, p_como, p_responsavel_id, p_prazo,
    p_prioridade, p_origem, p_origem_ref_id, p_origem_ref_table,
    auth.uid()
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.criar_plano_acao IS
  'Cria plano de acao com escopo segmentado (loja/dept/vendedor) — delta N1 da ata 2026-05-22.';

GRANT EXECUTE ON FUNCTION public.criar_plano_acao TO authenticated;

COMMIT;
