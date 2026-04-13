-- Migration to resolve DB-07: Secure PDI Constraints & Integrity

-- 1. Ensure no NULLs exist before applying NOT NULL constraints
UPDATE public.pdis
SET 
    meta_6m = COALESCE(meta_6m, 'Não definida'),
    meta_12m = COALESCE(meta_12m, 'Não definida'),
    meta_24m = COALESCE(meta_24m, 'Não definida'),
    action_1 = COALESCE(action_1, 'Ação pendente'),
    status = COALESCE(status, 'aberto'),
    acknowledged = COALESCE(acknowledged, false),
    updated_at = COALESCE(updated_at, now())
WHERE 
    meta_6m IS NULL OR meta_12m IS NULL OR meta_24m IS NULL 
    OR action_1 IS NULL OR status IS NULL OR acknowledged IS NULL;

-- 2. Apply NOT NULL constraints to mandatory business columns
ALTER TABLE public.pdis
    ALTER COLUMN store_id SET NOT NULL,
    ALTER COLUMN manager_id SET NOT NULL,
    ALTER COLUMN seller_id SET NOT NULL,
    ALTER COLUMN meta_6m SET NOT NULL,
    ALTER COLUMN meta_12m SET NOT NULL,
    ALTER COLUMN meta_24m SET NOT NULL,
    ALTER COLUMN action_1 SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN acknowledged SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

-- 3. Add integrity check for action dates if applicable (future proofing)
-- ALTER TABLE public.pdis ADD CONSTRAINT pdi_due_date_future CHECK (due_date >= created_at::date);
