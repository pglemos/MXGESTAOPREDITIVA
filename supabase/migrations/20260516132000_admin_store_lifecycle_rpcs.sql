CREATE OR REPLACE FUNCTION public.admin_update_store(p_store_id uuid, p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_role text;
  v_active boolean;
BEGIN
  SELECT role
    INTO v_caller_role
    FROM public.usuarios
   WHERE id = v_caller_id
     AND active = true;

  IF v_caller_role NOT IN ('administrador_geral', 'administrador_mx') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Apenas administradores MX podem editar lojas.');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.lojas WHERE id = p_store_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Loja não encontrada.');
  END IF;

  v_active := CASE
    WHEN p_payload ? 'active' THEN (p_payload->>'active')::boolean
    ELSE NULL
  END;

  UPDATE public.lojas
     SET name = CASE WHEN p_payload ? 'name' THEN upper(trim(p_payload->>'name')) ELSE name END,
         manager_email = CASE WHEN p_payload ? 'manager_email' THEN nullif(lower(trim(coalesce(p_payload->>'manager_email', ''))), '') ELSE manager_email END,
         legal_name = CASE WHEN p_payload ? 'legal_name' THEN nullif(trim(coalesce(p_payload->>'legal_name', '')), '') ELSE legal_name END,
         cnpj = CASE WHEN p_payload ? 'cnpj' THEN nullif(trim(coalesce(p_payload->>'cnpj', '')), '') ELSE cnpj END,
         address = CASE WHEN p_payload ? 'address' THEN nullif(trim(coalesce(p_payload->>'address', '')), '') ELSE address END,
         administrative_phone = CASE WHEN p_payload ? 'administrative_phone' THEN nullif(trim(coalesce(p_payload->>'administrative_phone', '')), '') ELSE administrative_phone END,
         partners = CASE WHEN p_payload ? 'partners' THEN coalesce(p_payload->'partners', '[]'::jsonb) ELSE partners END,
         active = coalesce(v_active, active),
         updated_at = now()
   WHERE id = p_store_id;

  IF v_active IS FALSE THEN
    UPDATE public.vendedores_loja
       SET is_active = false,
           ended_at = coalesce(ended_at, current_date)
     WHERE store_id = p_store_id
       AND is_active = true;

    UPDATE public.vinculos_loja
       SET is_active = false,
           ended_at = coalesce(ended_at, current_date)
     WHERE store_id = p_store_id
       AND is_active = true;
  END IF;

  RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object('id', p_store_id));
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_archive_store(p_store_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.admin_update_store(p_store_id, jsonb_build_object('active', false));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_restore_store(p_store_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.admin_update_store(p_store_id, jsonb_build_object('active', true));
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_store(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_archive_store(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_restore_store(uuid) TO authenticated;
