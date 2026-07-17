-- Migration registrada no Supabase de produção como seller_routine_snapshot_helpers.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_seller_routine_block_diagnostic(
  p_store_id uuid,
  p_seller_user_id uuid,
  p_reference_date date,
  p_block_key text
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
  SELECT COALESCE((
    SELECT jsonb_build_object('status',d.diagnostic_status,'reason',d.reason,'version',d.version)
    FROM public.seller_routine_block_diagnostics d
    WHERE d.store_id=p_store_id
      AND d.seller_user_id=p_seller_user_id
      AND d.reference_date=p_reference_date
      AND d.block_key=p_block_key
    ORDER BY d.version DESC
    LIMIT 1
  ),jsonb_build_object('status','normal','reason',NULL,'version',0));
$$;

CREATE OR REPLACE FUNCTION public.calculate_seller_routine_component(
  p_planned integer,
  p_executed integer,
  p_weight numeric,
  p_reliable_base boolean,
  p_diagnostic_status text
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_diagnostic_status IN ('erro_geracao','nao_aplicavel') THEN
    RETURN NULL;
  END IF;
  IF COALESCE(p_planned,0)>0 THEN
    RETURN LEAST(p_weight,p_weight*GREATEST(COALESCE(p_executed,0),0)/p_planned);
  END IF;
  IF p_diagnostic_status='zero_legitimo' AND p_reliable_base THEN
    RETURN p_weight;
  END IF;
  RETURN 0;
END;
$$;

REVOKE ALL ON FUNCTION public.get_seller_routine_block_diagnostic(uuid,uuid,date,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_seller_routine_block_diagnostic(uuid,uuid,date,text) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.calculate_seller_routine_component(integer,integer,numeric,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.calculate_seller_routine_component(integer,integer,numeric,boolean,text) TO authenticated,service_role;

COMMIT;
