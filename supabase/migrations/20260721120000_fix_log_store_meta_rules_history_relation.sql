-- Fix: log_store_meta_rules_changes() ainda insere em public.store_meta_rules_history,
-- mas essa tabela foi renomeada para public.historico_regras_metas_loja em
-- 20260430230000_fund02_nomenclatura_secundaria_portugues.sql. ALTER TABLE RENAME não
-- reescreve corpo de função, entao todo UPDATE em regras_metas_loja falha com
-- "relation public.store_meta_rules_history does not exist".

CREATE OR REPLACE FUNCTION public.log_store_meta_rules_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.historico_regras_metas_loja (store_id, changed_by, old_values, new_values)
    VALUES (NEW.store_id, NEW.updated_by, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
END;
$function$;
