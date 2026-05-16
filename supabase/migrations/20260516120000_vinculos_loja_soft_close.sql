BEGIN;

ALTER TABLE public.vinculos_loja
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ended_at date;

CREATE INDEX IF NOT EXISTS idx_vinculos_loja_active_store_user
  ON public.vinculos_loja (store_id, user_id)
  WHERE is_active = true;

COMMIT;
