-- DOWN for 20260716240000_clientes_shared_read_expires_on_terminal_stage.sql
-- Restores the original unbounded grant (any linked oportunidade, any
-- etapa). Reverting reintroduces the confirmed cross-vendedor client PII
-- leak; kept only for mechanical symmetry.

BEGIN;

CREATE OR REPLACE FUNCTION public.pode_ler_cliente_por_oportunidade(p_cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
      FROM public.oportunidades o
     WHERE o.cliente_id = p_cliente_id
       AND o.seller_user_id = auth.uid()
  );
$function$;

COMMIT;
