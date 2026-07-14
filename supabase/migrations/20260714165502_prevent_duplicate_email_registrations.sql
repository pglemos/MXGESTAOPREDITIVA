-- Prevent parallel or case-variant registrations from creating duplicate identities.
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_normalized_uidx
  ON public.usuarios (lower(btrim(email)))
  WHERE email IS NOT NULL AND btrim(email) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS pre_cadastros_loja_pending_email_normalized_uidx
  ON public.pre_cadastros_loja (store_id, lower(btrim(email)))
  WHERE status = 'pending';
