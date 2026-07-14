-- Keep proof of auth.updateUser server-owned and single-use before clearing
-- the application-level first-login flag.

CREATE TABLE IF NOT EXISTS public.password_change_challenges (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_auth_updated_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.password_change_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.password_change_challenges FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.begin_password_change()
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

  IF v_auth_updated_at IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Usuário inexistente.');
  END IF;

  INSERT INTO public.password_change_challenges (user_id, previous_auth_updated_at, created_at)
  VALUES (v_user_id, v_auth_updated_at, now())
  ON CONFLICT (user_id) DO UPDATE
    SET previous_auth_updated_at = EXCLUDED.previous_auth_updated_at,
        created_at = EXCLUDED.created_at;

  RETURN jsonb_build_object('ok', true);
EXCEPTION
  WHEN others THEN
    BEGIN
      PERFORM public.log_rpc_error(
        'begin_password_change',
        SQLSTATE,
        SQLERRM,
        v_user_id,
        '{}'::jsonb
      );
    EXCEPTION
      WHEN others THEN
        NULL;
    END;
    RETURN jsonb_build_object('ok', false, 'error', 'Não foi possível iniciar a troca de senha.');
END;
$$;

DROP FUNCTION IF EXISTS public.complete_password_change(timestamptz);
DROP FUNCTION IF EXISTS public.complete_password_change();

CREATE OR REPLACE FUNCTION public.complete_password_change()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_challenge public.password_change_challenges%ROWTYPE;
  v_auth_updated_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Usuário não autenticado.');
  END IF;

  SELECT *
    INTO v_challenge
    FROM public.password_change_challenges
   WHERE user_id = v_user_id
     AND created_at > now() - interval '10 minutes'
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'A troca de senha não foi iniciada nesta sessão.');
  END IF;

  SELECT updated_at
    INTO v_auth_updated_at
    FROM auth.users
   WHERE id = v_user_id;

  IF v_auth_updated_at IS NULL
     OR v_auth_updated_at <= v_challenge.previous_auth_updated_at THEN
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

  DELETE FROM public.password_change_challenges
   WHERE user_id = v_user_id;

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

REVOKE ALL ON FUNCTION public.begin_password_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.begin_password_change() TO authenticated;
REVOKE ALL ON FUNCTION public.complete_password_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_password_change() TO authenticated;
