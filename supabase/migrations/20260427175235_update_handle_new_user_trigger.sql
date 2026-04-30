CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, must_change_password)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'vendedor'),
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, TRUE)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), public.users.name),
    must_change_password = COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, public.users.must_change_password);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;
