BEGIN;

DROP INDEX IF EXISTS public.feedbacks_seller_week_unique;
DROP INDEX IF EXISTS public.devolutivas_seller_week_unique;

CREATE UNIQUE INDEX IF NOT EXISTS devolutivas_store_manager_seller_week_unique
  ON public.devolutivas (store_id, manager_id, seller_id, week_reference);

COMMIT;
