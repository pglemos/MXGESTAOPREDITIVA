-- Allow the authenticated password-change RPC to clear only the temporary
-- password flag without weakening the direct self-update hardening trigger.

CREATE OR REPLACE FUNCTION public.bloquear_self_update_usuarios_sensivel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = NEW.id AND NOT public.eh_administrador_mx(auth.uid()) THEN
    IF OLD.role IS DISTINCT FROM NEW.role
      OR OLD.active IS DISTINCT FROM NEW.active
      OR (to_jsonb(OLD)->'store_id') IS DISTINCT FROM (to_jsonb(NEW)->'store_id')
      OR OLD.email IS DISTINCT FROM NEW.email
      OR (
        OLD.must_change_password IS DISTINCT FROM NEW.must_change_password
        AND NOT (
          coalesce(current_setting('mx.allow_password_change', true), 'false') = 'true'
          AND OLD.must_change_password IS TRUE
          AND NEW.must_change_password IS FALSE
        )
      )
      OR OLD.is_venda_loja IS DISTINCT FROM NEW.is_venda_loja THEN
      RAISE EXCEPTION 'Self-update de campos sensiveis de usuario nao permitido';
    END IF;
  END IF;

  RETURN NEW;
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

  -- This transaction-local marker is set only by this SECURITY DEFINER RPC;
  -- direct REST self-updates remain blocked by the trigger above.
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
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_password_change() TO authenticated;
