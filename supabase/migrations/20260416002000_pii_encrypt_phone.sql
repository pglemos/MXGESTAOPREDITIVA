-- ============================================================
-- STORY-TD-009 (DB-09): PII Encryption — users.phone
-- Encrypts users.phone with pgcrypto using app crypto key GUC
-- users.email kept plaintext (needed for import/search)
-- consulting_oauth_tokens already encrypted via Edge Functions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_encrypted bytea;

UPDATE public.users
SET phone_encrypted = encrypt(
  COALESCE(phone::bytea, ''::bytea),
  current_setting('app.crypto_key')::bytea,
  'aes'
)
WHERE phone IS NOT NULL;

ALTER TABLE public.users DROP COLUMN IF EXISTS phone;
ALTER TABLE public.users RENAME COLUMN phone_encrypted TO phone;

CREATE OR REPLACE FUNCTION public.decrypt_phone(p_phone bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN convert_from(
    decrypt(p_phone, current_setting('app.crypto_key')::bytea, 'aes'),
    'UTF8'
  );
END;
$$;
