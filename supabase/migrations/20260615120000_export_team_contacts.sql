-- Story OPS-20260615: exportacao auditavel de contatos ativos dos cadastros MX.

CREATE OR REPLACE FUNCTION public.exportar_contatos_cadastros_mx()
RETURNS TABLE (
  loja text,
  papel text,
  nome text,
  telefone text,
  email text,
  origem text,
  vinculo_desde text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.eh_area_interna_mx(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas internos MX podem exportar contatos dos cadastros.'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.logs_auditoria(user_id, action, entity, details_json)
  VALUES (
    auth.uid(),
    'EXPORT_CONTATOS_CADASTROS_MX',
    'contatos_cadastros_mx',
    jsonb_build_object(
      'scope', 'active_current',
      'sources', jsonb_build_array('usuarios/vinculos_loja', 'lojas.partners'),
      'requested_at', now()
    )
  );

  RETURN QUERY
  WITH user_contacts AS (
    SELECT
      l.name::text AS loja,
      CASE v.role
        WHEN 'dono' THEN 'Dono'
        WHEN 'gerente' THEN 'Gerente'
        WHEN 'vendedor' THEN 'Vendedor'
        ELSE v.role
      END::text AS papel,
      COALESCE(NULLIF(BTRIM(u.name), ''), '')::text AS nome,
      COALESCE(NULLIF(BTRIM(u.phone), ''), '')::text AS telefone,
      COALESCE(NULLIF(BTRIM(u.email), ''), '')::text AS email,
      'usuarios/vinculos_loja'::text AS origem,
      COALESCE(v.created_at::text, vl.started_at::text, '')::text AS vinculo_desde
    FROM public.vinculos_loja v
    JOIN public.usuarios u ON u.id = v.user_id
    JOIN public.lojas l ON l.id = v.store_id
    LEFT JOIN public.vendedores_loja vl
      ON vl.seller_user_id = v.user_id
     AND vl.store_id = v.store_id
    WHERE v.role IN ('dono', 'gerente', 'vendedor')
      AND COALESCE(v.is_active, true) = true
      AND v.ended_at IS NULL
      AND u.active = true
      AND l.active = true
      AND (
        v.role <> 'vendedor'
        OR vl.seller_user_id IS NULL
        OR (
          COALESCE(vl.is_active, true) = true
          AND (vl.started_at IS NULL OR vl.started_at <= CURRENT_DATE)
          AND (vl.ended_at IS NULL OR vl.ended_at >= CURRENT_DATE)
        )
      )
  ),
  partner_contacts AS (
    SELECT
      l.name::text AS loja,
      'Dono/Sócio'::text AS papel,
      COALESCE(NULLIF(BTRIM(partner->>'name'), ''), '')::text AS nome,
      COALESCE(NULLIF(BTRIM(partner->>'phone'), ''), '')::text AS telefone,
      COALESCE(NULLIF(BTRIM(partner->>'email'), ''), '')::text AS email,
      'lojas.partners'::text AS origem,
      ''::text AS vinculo_desde
    FROM public.lojas l
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(l.partners, '[]'::jsonb)) partner
    WHERE l.active = true
      AND (
        COALESCE(NULLIF(BTRIM(partner->>'name'), ''), '') <> ''
        OR COALESCE(NULLIF(BTRIM(partner->>'phone'), ''), '') <> ''
        OR COALESCE(NULLIF(BTRIM(partner->>'email'), ''), '') <> ''
      )
  )
  SELECT * FROM user_contacts
  UNION ALL
  SELECT * FROM partner_contacts
  ORDER BY loja, papel, nome;
END;
$$;

GRANT EXECUTE ON FUNCTION public.exportar_contatos_cadastros_mx() TO authenticated;

COMMENT ON FUNCTION public.exportar_contatos_cadastros_mx() IS
  'Exporta contatos ativos atuais de donos, gerentes, vendedores e socios de lojas para internos MX, registrando auditoria.';
