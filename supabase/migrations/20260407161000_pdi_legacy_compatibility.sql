BEGIN;

ALTER TABLE public.pdis
    ALTER COLUMN objective DROP NOT NULL,
    ALTER COLUMN action DROP NOT NULL;

UPDATE public.pdis
SET
    meta_6m = COALESCE(NULLIF(meta_6m, ''), NULLIF(objective, ''), 'Definir horizonte de 6 meses'),
    meta_12m = COALESCE(NULLIF(meta_12m, ''), NULLIF(objective, ''), 'Definir horizonte de 12 meses'),
    meta_24m = COALESCE(NULLIF(meta_24m, ''), NULLIF(objective, ''), 'Definir horizonte de 24 meses'),
    action_1 = COALESCE(NULLIF(action_1, ''), NULLIF(action, ''), 'Definir ação prioritária'),
    objective = COALESCE(NULLIF(objective, ''), NULLIF(meta_6m, ''), NULLIF(meta_12m, ''), NULLIF(meta_24m, ''), 'Definir horizonte principal'),
    action = COALESCE(NULLIF(action, ''), NULLIF(action_1, ''), NULLIF(action_2, ''), NULLIF(action_3, ''), NULLIF(action_4, ''), NULLIF(action_5, ''), 'Definir ação prioritária');

CREATE OR REPLACE FUNCTION public.sync_pdi_legacy_shadow_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.meta_6m := COALESCE(NULLIF(NEW.meta_6m, ''), NULLIF(NEW.objective, ''), 'Definir horizonte de 6 meses');
    NEW.meta_12m := COALESCE(NULLIF(NEW.meta_12m, ''), NULLIF(NEW.objective, ''), NEW.meta_6m, 'Definir horizonte de 12 meses');
    NEW.meta_24m := COALESCE(NULLIF(NEW.meta_24m, ''), NULLIF(NEW.objective, ''), NEW.meta_12m, 'Definir horizonte de 24 meses');

    NEW.action_1 := COALESCE(NULLIF(NEW.action_1, ''), NULLIF(NEW.action, ''), 'Definir ação prioritária');
    NEW.action_2 := NULLIF(NEW.action_2, '');
    NEW.action_3 := NULLIF(NEW.action_3, '');
    NEW.action_4 := NULLIF(NEW.action_4, '');
    NEW.action_5 := NULLIF(NEW.action_5, '');

    NEW.objective := COALESCE(NULLIF(NEW.objective, ''), NULLIF(NEW.meta_6m, ''), NULLIF(NEW.meta_12m, ''), NULLIF(NEW.meta_24m, ''), 'Definir horizonte principal');
    NEW.action := COALESCE(NULLIF(NEW.action, ''), NULLIF(NEW.action_1, ''), NULLIF(NEW.action_2, ''), NULLIF(NEW.action_3, ''), NULLIF(NEW.action_4, ''), NULLIF(NEW.action_5, ''), 'Definir ação prioritária');

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pdis_sync_legacy_shadow_columns ON public.pdis;
CREATE TRIGGER pdis_sync_legacy_shadow_columns
BEFORE INSERT OR UPDATE ON public.pdis
FOR EACH ROW
EXECUTE FUNCTION public.sync_pdi_legacy_shadow_columns();

COMMENT ON FUNCTION public.sync_pdi_legacy_shadow_columns() IS 'Mantém objective/action como sombra legada do PDI 2.0 por 1 release.';

COMMIT;
