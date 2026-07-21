-- ==========================================================================
-- Secure summary of the owner's consulting program.
-- public.visitas_consultoria is deliberately blocked for store roles
-- (20260515162000_harden_consulting_visits_role_scope.sql) — this bridge
-- returns only the safe aggregate fields the Owner surface needs (program
-- name, visit count, next meeting), never the internal visit record.
-- ==========================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.get_owner_consulting_program_summary(p_store_id uuid)
RETURNS TABLE (
  client_id uuid,
  program_key text,
  program_name text,
  total_visits integer,
  client_status text,
  client_modality text,
  visits_completed integer,
  next_visit_number integer,
  next_visit_scheduled_at timestamptz,
  next_visit_objective text,
  next_visit_meet_link text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_store_id IS NULL OR NOT (
    public.eh_area_interna_mx(auth.uid())
    OR public.user_is_master_loja(p_store_id, auth.uid())
    OR public.tem_papel_loja(p_store_id, ARRAY['dono'], auth.uid())
    OR public.is_owner_of(p_store_id)
  ) THEN
    RAISE EXCEPTION 'Sem permissão para consultar o programa de consultoria da loja.'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    client.id,
    program.program_key,
    program.name,
    program.total_visits,
    client.status,
    client.modality,
    (
      SELECT count(*)::integer
      FROM public.visitas_consultoria v
      WHERE v.client_id = client.id
        AND v.status = 'concluida'
    ),
    next_visit.visit_number,
    next_visit.scheduled_at,
    next_visit.objective,
    next_visit.google_meet_link
  FROM public.clientes_consultoria client
  JOIN public.programas_visita_consultoria program
    ON program.program_key = client.program_template_key
  LEFT JOIN LATERAL (
    SELECT v.visit_number, v.scheduled_at, v.objective, v.google_meet_link
    FROM public.visitas_consultoria v
    WHERE v.client_id = client.id
      AND v.status IN ('agendada', 'em_andamento')
    ORDER BY v.scheduled_at ASC
    LIMIT 1
  ) next_visit ON true
  WHERE client.primary_store_id = p_store_id
    AND client.status = 'ativo'
  ORDER BY client.updated_at DESC
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_owner_consulting_program_summary(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_owner_consulting_program_summary(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_owner_consulting_program_summary(uuid) IS
  'Retorna resumo agregado (programa, contagem de visitas concluidas, proxima visita) da consultoria vinculada a loja, sem expor a tabela interna visitas_consultoria.';

COMMIT;
