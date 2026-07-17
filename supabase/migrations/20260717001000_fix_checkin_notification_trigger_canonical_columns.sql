-- Corrige o trigger de notificação após a remoção das shadow columns de
-- daily_checkins/lancamentos_diarios (20260417000001).
-- O trigger deve usar somente o contrato canônico que existe na stack fresh.

BEGIN;

CREATE OR REPLACE FUNCTION public.notify_manager_on_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_name text;
  v_seller_name text;
BEGIN
  SELECT name INTO v_seller_name
    FROM public.usuarios
   WHERE id = NEW.seller_user_id;

  SELECT name INTO v_store_name
    FROM public.lojas
   WHERE id = NEW.store_id;

  PERFORM pg_notify(
    'manager_routine_events',
    json_build_object(
      'event_type', 'NEW_CHECKIN',
      'store_id', NEW.store_id,
      'seller_id', NEW.seller_user_id,
      'seller_name', v_seller_name,
      'store_name', v_store_name,
      'date', NEW.reference_date,
      'timestamp', now()
    )::text
  );

  RETURN NEW;
END;
$$;

COMMIT;

-- DOWN (manual rollback):
-- A restauração da implementação histórica não é segura na stack fresh,
-- porque ela referencia shadow columns removidas. Reaplique a migration
-- anterior somente em um banco que ainda contenha essas colunas.
