-- Carteira Base44: carteira_salvar_cliente_v2's ownership check for
-- agendamento_id required a.oportunidade_id to equal the oportunidade_id
-- being saved, or the call is rejected as "fora do escopo do vendedor".
-- Reproduced live: a client with an "aguardando" agendamento whose
-- oportunidade_id is NULL (a legitimate, common state — the agendamento
-- predates or is independent of the currently open opportunity) can no
-- longer be saved once any oportunidade_id is also present in the payload,
-- because the check treats "linked to a different/no opportunity" the same
-- as "belongs to someone else".
--
-- Ownership (seller_user_id + loja_id + cliente_id) is what authorization
-- should enforce here; requiring the agendamento to already be linked to
-- this exact oportunidade is business logic, not a security boundary, and
-- it has no equivalent for the oportunidade_id/cliente_id check just above
-- it (which only checks ownership, not that the opportunity is already
-- linked to some cliente-scoped resource). Widened to also accept an
-- agendamento that isn't linked to any opportunity yet; a genuine
-- cross-opportunity tampering attempt (agendamento already linked to a
-- *different* opportunity than the one in the payload) is still rejected.

BEGIN;

CREATE OR REPLACE FUNCTION public.carteira_salvar_cliente_v2(p_payload jsonb, p_idempotency_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_store_id uuid;
  v_cliente_id uuid := NULLIF(p_payload->>'cliente_id', '')::uuid;
  v_oportunidade_id uuid := NULLIF(p_payload->>'oportunidade_id', '')::uuid;
  v_agendamento_id uuid := NULLIF(p_payload->>'agendamento_id', '')::uuid;
  v_phone text := regexp_replace(COALESCE(p_payload->>'telefone', p_payload->>'whatsapp', ''), '\D', '', 'g');
  v_scoped_key text;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;
  IF NULLIF(BTRIM(p_idempotency_key), '') IS NULL THEN
    RAISE EXCEPTION 'Chave de idempotência obrigatória.';
  END IF;

  v_scoped_key := v_user::text || ':' || p_idempotency_key;
  PERFORM pg_advisory_xact_lock(hashtextextended('carteira:save:' || v_scoped_key, 0));

  SELECT vl.store_id INTO v_store_id
  FROM public.vinculos_loja vl
  WHERE vl.user_id = v_user
    AND vl.is_active = true
    AND lower(vl.role) IN ('vendedor', 'seller')
  ORDER BY vl.created_at DESC NULLS LAST
  LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Vendedor sem vínculo ativo com loja.';
  END IF;

  IF v_cliente_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.clientes c
    WHERE c.id = v_cliente_id AND c.seller_user_id = v_user AND c.loja_id = v_store_id
  ) THEN
    RAISE EXCEPTION 'Cliente não encontrado ou fora do escopo do vendedor.';
  END IF;

  IF v_oportunidade_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.oportunidades o
    WHERE o.id = v_oportunidade_id
      AND o.seller_user_id = v_user
      AND o.loja_id = v_store_id
      AND (v_cliente_id IS NULL OR o.cliente_id = v_cliente_id)
  ) THEN
    RAISE EXCEPTION 'Oportunidade não encontrada ou fora do escopo do vendedor.';
  END IF;

  IF v_agendamento_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.agendamentos a
    WHERE a.id = v_agendamento_id
      AND a.seller_user_id = v_user
      AND a.loja_id = v_store_id
      AND (v_cliente_id IS NULL OR a.cliente_id = v_cliente_id)
      AND (v_oportunidade_id IS NULL OR a.oportunidade_id = v_oportunidade_id OR a.oportunidade_id IS NULL)
  ) THEN
    RAISE EXCEPTION 'Agendamento não encontrado ou fora do escopo do vendedor.';
  END IF;

  IF v_cliente_id IS NULL AND v_phone <> '' THEN
    PERFORM pg_advisory_xact_lock(
      hashtextextended('carteira:phone:' || v_user::text || ':' || v_store_id::text || ':' || v_phone, 0)
    );
  END IF;

  RETURN public.carteira_salvar_cliente(p_payload, v_scoped_key);
END;
$function$;

COMMIT;

-- DOWN: use supabase/rollbacks/20260716231000_carteira_salvar_cliente_v2_unlinked_agendamento.sql.
