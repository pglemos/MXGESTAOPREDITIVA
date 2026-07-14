-- Keep one active registration per store/e-mail while preserving rejected history.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY store_id, lower(btrim(email))
      ORDER BY submitted_at ASC, id ASC
    ) AS duplicate_rank
  FROM public.pre_cadastros_loja
  WHERE status <> 'rejected'
)
UPDATE public.pre_cadastros_loja AS registration
SET
  status = 'rejected',
  reviewed_at = COALESCE(registration.reviewed_at, now()),
  rejected_at = COALESCE(registration.rejected_at, now()),
  approved_at = NULL,
  approval_note = 'Registro duplicado consolidado automaticamente; o primeiro cadastro ativo foi preservado.'
FROM ranked
WHERE registration.id = ranked.id
  AND ranked.duplicate_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS pre_cadastros_loja_active_email_normalized_uidx
  ON public.pre_cadastros_loja (store_id, lower(btrim(email)))
  WHERE status <> 'rejected';
