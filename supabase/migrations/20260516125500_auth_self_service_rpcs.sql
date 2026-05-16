CREATE OR REPLACE FUNCTION public.update_my_profile(p_updates jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_name text := nullif(trim(coalesce(p_updates->>'name', '')), '');
  v_phone text := nullif(trim(coalesce(p_updates->>'phone', '')), '');
  v_avatar_url text := nullif(trim(coalesce(p_updates->>'avatar_url', '')), '');
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Usuário não autenticado.');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE id = v_user_id AND active = true) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Usuário inativo.');
  END IF;

  UPDATE public.usuarios
     SET name = coalesce(v_name, name),
         phone = CASE WHEN p_updates ? 'phone' THEN v_phone ELSE phone END,
         avatar_url = CASE WHEN p_updates ? 'avatar_url' THEN v_avatar_url ELSE avatar_url END
   WHERE id = v_user_id;

  RETURN jsonb_build_object('ok', true);
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_password_change()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Usuário não autenticado.');
  END IF;

  UPDATE public.usuarios
     SET must_change_password = false
   WHERE id = v_user_id
     AND active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Usuário inativo ou inexistente.');
  END IF;

  RETURN jsonb_build_object('ok', true);
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_my_profile(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_password_change() TO authenticated;
