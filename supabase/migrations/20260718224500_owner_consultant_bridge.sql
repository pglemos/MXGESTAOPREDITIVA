-- ==========================================================================
-- Secure bridge between an owner store and its assigned consultant.
-- Returns one scoped contact instead of exposing internal assignment tables.
-- ==========================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.get_owner_consultant_contact(p_store_id uuid)
RETURNS TABLE (
  client_id uuid,
  client_name text,
  consultant_user_id uuid,
  consultant_name text,
  consultant_email text,
  consultant_phone text,
  consultant_avatar_url text,
  assignment_role text
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
    RAISE EXCEPTION 'Sem permissão para consultar o responsável da loja.'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    client.id,
    client.name,
    assignment.user_id,
    consultant.name,
    consultant.email,
    consultant.phone,
    consultant.avatar_url,
    assignment.assignment_role
  FROM public.clientes_consultoria client
  LEFT JOIN LATERAL (
    SELECT linked.user_id, linked.assignment_role
    FROM public.atribuicoes_consultoria linked
    WHERE linked.client_id = client.id
      AND linked.active = true
    ORDER BY
      CASE linked.assignment_role
        WHEN 'responsavel' THEN 0
        WHEN 'auxiliar' THEN 1
        ELSE 2
      END,
      linked.created_at ASC
    LIMIT 1
  ) assignment ON true
  LEFT JOIN public.usuarios consultant
    ON consultant.id = assignment.user_id
   AND consultant.active = true
  WHERE client.primary_store_id = p_store_id
    AND client.status = 'ativo'
  ORDER BY client.updated_at DESC
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_owner_consultant_contact(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_owner_consultant_contact(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_owner_consultant_contact(uuid) IS
  'Retorna somente o cliente e o consultor ativo vinculados à loja, após validar o escopo executivo do usuário autenticado.';

COMMIT;
