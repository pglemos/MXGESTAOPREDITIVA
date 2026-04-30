ALTER TABLE public.users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;
-- Set existing users to false just in case
UPDATE public.users SET must_change_password = FALSE WHERE must_change_password IS NULL;;
