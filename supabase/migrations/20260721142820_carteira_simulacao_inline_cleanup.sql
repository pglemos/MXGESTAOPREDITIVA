-- Mantém o contrato público da Carteira estável: a atuação delegada passa a
-- ser validada e executada dentro da RPC v2 existente. A função auxiliar da
-- migration anterior é removida para não ampliar a superfície pública do banco.

BEGIN;

CREATE OR REPLACE FUNCTION public.carteira_salvar_cliente_v2(
  p_payload jsonb,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_is_simulation boolean := p_payload ? 'acting_seller_user_id' OR p_payload ? 'acting_store_id';
  v_user uuid;
  v_store_id uuid;
  v_cliente_id uuid := NULLIF(p_payload->>'cliente_id', '')::uuid;
  v_oportunidade_id uuid := NULLIF(p_payload->>'oportunidade_id', '')::uuid;
  v_agendamento_id uuid := NULLIF(p_payload->>'agendamento_id', '')::uuid;
  v_phone text := regexp_replace(COALESCE(p_payload->>'telefone', p_payload->>'whatsapp', ''), '\D', '', 'g');
  v_scoped_key text;
  v_effective_payload jsonb := p_payload;
  v_result jsonb;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  IF NULLIF(BTRIM(p_idempotency_key), '') IS NULL THEN
    RAISE EXCEPTION 'Chave de idempotência obrigatória.';
  END IF;

  IF v_is_simulation THEN
    v_user := NULLIF(p_payload->>'acting_seller_user_id', '')::uuid;
    v_store_id := NULLIF(p_payload->>'acting_store_id', '')::uuid;

    IF v_user IS NULL OR v_store_id IS NULL THEN
      RAISE EXCEPTION 'Vendedor e loja da simulação são obrigatórios.';
    END IF;

    IF NOT public.eh_area_interna_mx(v_caller) THEN
      RAISE EXCEPTION 'Somente perfis internos MX podem executar uma simulação.'
        USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.vinculos_loja vl
      JOIN public.usuarios u ON u.id = vl.user_id
      WHERE vl.user_id = v_user
        AND vl.store_id = v_store_id
        AND vl.is_active = true
        AND lower(vl.role) IN ('vendedor', 'seller')
        AND u.active = true
    ) THEN
      RAISE EXCEPTION 'Vendedor simulado sem vínculo ativo com a loja.'
        USING ERRCODE = '42501';
    END IF;

    v_scoped_key := v_caller::text || ':' || v_user::text || ':' || p_idempotency_key;
    v_effective_payload :=
      (p_payload - 'acting_seller_user_id' - 'acting_store_id')
      || jsonb_build_object(
        'evento_metadata',
        COALESCE(p_payload->'evento_metadata', '{}'::jsonb)
        || jsonb_build_object(
          'simulated_by', v_caller,
          'acting_seller_user_id', v_user,
          'acting_store_id', v_store_id
        )
      );
  ELSE
    v_user := v_caller;
    v_scoped_key := v_user::text || ':' || p_idempotency_key;

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
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('carteira:save:' || v_scoped_key, 0));

  IF v_cliente_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.clientes c
    WHERE c.id = v_cliente_id
      AND c.seller_user_id = v_user
      AND c.loja_id = v_store_id
  ) THEN
    RAISE EXCEPTION 'Cliente não encontrado ou fora do escopo do vendedor.'
      USING ERRCODE = '42501';
  END IF;

  IF v_oportunidade_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.oportunidades o
    WHERE o.id = v_oportunidade_id
      AND o.seller_user_id = v_user
      AND o.loja_id = v_store_id
      AND (v_cliente_id IS NULL OR o.cliente_id = v_cliente_id)
  ) THEN
    RAISE EXCEPTION 'Oportunidade não encontrada ou fora do escopo do vendedor.'
      USING ERRCODE = '42501';
  END IF;

  IF v_agendamento_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.agendamentos a
    WHERE a.id = v_agendamento_id
      AND a.seller_user_id = v_user
      AND a.loja_id = v_store_id
      AND (v_cliente_id IS NULL OR a.cliente_id = v_cliente_id)
      AND (v_oportunidade_id IS NULL OR a.oportunidade_id = v_oportunidade_id OR a.oportunidade_id IS NULL)
  ) THEN
    RAISE EXCEPTION 'Agendamento não encontrado ou fora do escopo do vendedor.'
      USING ERRCODE = '42501';
  END IF;

  IF v_cliente_id IS NULL AND v_phone <> '' THEN
    PERFORM pg_advisory_xact_lock(
      hashtextextended('carteira:phone:' || v_user::text || ':' || v_store_id::text || ':' || v_phone, 0)
    );
  END IF;

  IF v_is_simulation THEN
    PERFORM set_config('request.jwt.claim.sub', v_user::text, true);
    v_result := public.carteira_salvar_cliente(v_effective_payload, v_scoped_key);
    PERFORM set_config('request.jwt.claim.sub', v_caller::text, true);
    RETURN v_result;
  END IF;

  RETURN public.carteira_salvar_cliente(v_effective_payload, v_scoped_key);
EXCEPTION
  WHEN OTHERS THEN
    IF v_is_simulation AND v_caller IS NOT NULL THEN
      PERFORM set_config('request.jwt.claim.sub', v_caller::text, true);
    END IF;
    RAISE;
END;
$function$;

DROP FUNCTION IF EXISTS public.carteira_salvar_cliente_simulado_v1(jsonb, text);

COMMIT;;
