-- clientes: pode_ler_cliente_por_oportunidade() (20260710140000) never
-- expires. Reproduced live against fbhcmzzgwjdgkctlfvbo: vendedor@ has a
-- 'ganho' oportunidade for cliente "JOSÉ" from 2026-07-12; that cliente's
-- current owner (clientes.seller_user_id) is a different vendedor
-- (jose.vendedor@). vendedor@ can still SELECT the full clientes row —
-- current phone, situação_atual, observações, do_not_contact, everything —
-- indefinitely, via clientes_related_opportunity_read, because the check
-- only asks "do I have any oportunidade linked to this cliente_id", with
-- no regard for whether that oportunidade is still open or who currently
-- owns the client.
--
-- Original intent (20260710140000 comment): "Um cliente pode ser reutilizado
-- por uma venda de outro vendedor da mesma loja. O vendedor só recebe
-- leitura dessa ficha quando já existe uma oportunidade própria vinculada."
-- That's a legitimate shared-lead pattern — a vendedor picking up an
-- existing client record needs to read it while working their own
-- opportunity on it. The bug is that the grant never expires: closing the
-- opportunity (ganho or perdido) should end that vendedor's reason to keep
-- reading a client record they no longer own or are working.
--
-- Restricts the check to non-terminal etapas. A vendedor with an open
-- (prospeccao..fechamento) opportunity on a shared client keeps read access
-- exactly as before; once their opportunity reaches ganho/perdido, access
-- reverts to ownership-only (clientes_seller_rw / clientes_store_read).

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
       AND o.etapa NOT IN ('ganho'::crm_etapa_funil, 'perdido'::crm_etapa_funil)
  );
$function$;

COMMIT;

-- DOWN: use supabase/rollbacks/20260716240000_clientes_shared_read_expires_on_terminal_stage.sql.
