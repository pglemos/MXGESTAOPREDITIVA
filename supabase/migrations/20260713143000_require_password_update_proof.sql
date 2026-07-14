-- Require proof that auth.updateUser changed the Auth record before clearing
-- the application-level first-login flag.

DROP FUNCTION IF EXISTS public.complete_password_change();

CREATE OR REPLACE FUNCTION public.complete_password_change(
  p_previous_auth_updated_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_auth_updated_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Usuário não autenticado.');
  END IF;

  SELECT updated_at
    INTO v_auth_updated_at
    FROM auth.users
   WHERE id = v_user_id;

  IF p_previous_auth_updated_at IS NULL
     OR v_auth_updated_at IS NULL
     OR v_auth_updated_at <= p_previous_auth_updated_at THEN
    RETURN jsonb_build_object('ok', false, 'error', 'A senha não foi atualizada nesta sessão.');
  END IF;

  PERFORM set_config('mx.allow_password_change', 'true', true);

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
    BEGIN
      PERFORM public.log_rpc_error(
        'complete_password_change',
        SQLSTATE,
        SQLERRM,
        v_user_id,
        jsonb_build_object('operation', 'clear_must_change_password')
      );
    EXCEPTION
      WHEN others THEN
        NULL;
    END;
    RETURN jsonb_build_object('ok', false, 'error', 'Não foi possível concluir a troca de senha.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_password_change(timestamptz) TO authenticated;
