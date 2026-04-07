-- Allow dedicated system-owner role in app users table
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role = ANY (ARRAY['admin'::text, 'consultor'::text, 'gerente'::text, 'vendedor'::text]));
