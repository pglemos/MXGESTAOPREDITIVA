-- Carteira: permite que perfis internos MX executem a esteira como o vendedor
-- selecionado na simulação. A sessão continua autenticada como administrador;
-- a identidade efetiva só é trocada dentro desta transação, depois de validar
-- o chamador, o vendedor e a loja. Chamadas normais continuam no fluxo v2.

BEGIN;

CREATE OR REPLACE FUNCTION public.carteira_salvar_cliente_simulado_v1(
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
  v_user uuid := NULLIF(p_payload->>'acting_seller_user_id', '')::uuid;
  v_store_id uuid := NULLIF(p_payload->>'acting_store_id', '')::uuid;
  v_cliente_id uuid := NULLIF(p_payload->>'cliente_id', '')::uuid;
  v_oportunidade_id uuid := NULLIF(p_payload->>'oportunidade_id', '')::uuid;
  v_agendamento_id uuid := NULLIF(p_payload->>'agendamento_id', '')::uuid;
  v_scoped_key text;
  v_payload jsonb;
  v_result jsonb;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  IF NULLIF(BTRIM(p_idempotency_key), '') IS NULL THEN
    RAISE EXCEPTION 'Chave de idempotência obrigatória.';
  END IF;

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

  -- Defesa em profundidade antes de delegar a identidade para a RPC existente.
  IF v_cliente_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.clientes c
    WHERE c.id = v_cliente_id
      AND c.seller_user_id = v_user
      AND c.loja_id = v_store_id
  ) THEN
    RAISE EXCEPTION 'Cliente não encontrado ou fora do escopo do vendedor simulado.'
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
    RAISE EXCEPTION 'Oportunidade fora do escopo do vendedor simulado.'
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
    RAISE EXCEPTION 'Agendamento fora do escopo do vendedor simulado.'
      USING ERRCODE = '42501';
  END IF;

  v_scoped_key := v_caller::text || ':' || v_user::text || ':' || p_idempotency_key;
  PERFORM pg_advisory_xact_lock(hashtextextended('carteira:simulation:save:' || v_scoped_key, 0));

  v_payload :=
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

  -- auth.uid() é derivado de request.jwt.claim.sub. A troca é LOCAL à
  -- transação e ocorre apenas após todas as validações acima. Assim a RPC v2
  -- reutiliza suas regras de ownership, locks e idempotência como o vendedor.
  PERFORM set_config('request.jwt.claim.sub', v_user::text, true);
  v_result := public.carteira_salvar_cliente_v2(v_payload, v_scoped_key);
  PERFORM set_config('request.jwt.claim.sub', v_caller::text, true);

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    IF v_caller IS NOT NULL THEN
      PERFORM set_config('request.jwt.claim.sub', v_caller::text, true);
    END IF;
    RAISE;
END;
$function$;

REVOKE ALL ON FUNCTION public.carteira_salvar_cliente_simulado_v1(jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.carteira_salvar_cliente_simulado_v1(jsonb, text) TO authenticated;

COMMENT ON FUNCTION public.carteira_salvar_cliente_simulado_v1(jsonb, text) IS
  'Executa a mutação transacional da Carteira como vendedor simulado, restrita a perfis internos MX e auditada em eventos_comerciais.metadata.';

-- Mantém o mesmo entrypoint consumido pelo frontend. Apenas payloads com os
-- dois campos de atuação delegada entram no fluxo simulado; vendedores reais
-- continuam executando exatamente as validações anteriores.
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
  IF p_payload ? 'acting_seller_user_id' OR p_payload ? 'acting_store_id' THEN
    RETURN public.carteira_salvar_cliente_simulado_v1(p_payload, p_idempotency_key);
  END IF;

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

-- DOWN: use supabase/rollbacks/20260721110000_carteira_simulacao_vendedor.sql.
