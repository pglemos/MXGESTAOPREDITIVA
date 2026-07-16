-- Carteira Base44: hardening complementar pós-merge.
-- Mantém a migration 20260716190050 intacta e troca os entrypoints públicos
-- por wrappers validados, concorrentes e com escopo por vendedor.

BEGIN;

ALTER TABLE public.carteira_missoes
  ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 0;

REVOKE ALL ON TABLE public.carteira_missoes FROM PUBLIC;
REVOKE ALL ON TABLE public.carteira_missoes FROM anon;
REVOKE ALL ON TABLE public.carteira_missao_itens FROM PUBLIC;
REVOKE ALL ON TABLE public.carteira_missao_itens FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.carteira_missoes FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.carteira_missao_itens FROM authenticated;
GRANT SELECT ON TABLE public.carteira_missoes TO authenticated;
GRANT SELECT ON TABLE public.carteira_missao_itens TO authenticated;

DROP POLICY IF EXISTS carteira_missao_itens_access ON public.carteira_missao_itens;
DROP POLICY IF EXISTS carteira_missao_itens_read ON public.carteira_missao_itens;
CREATE POLICY carteira_missao_itens_read
  ON public.carteira_missao_itens
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.carteira_missoes m
      WHERE m.id = missao_id
        AND (
          m.seller_user_id = auth.uid()
          OR is_manager_of(m.loja_id)
          OR is_owner_of(m.loja_id)
          OR user_has_role(ARRAY['admin_mx'::text, 'master'::text, 'consultant'::text])
        )
    )
  );

DROP POLICY IF EXISTS carteira_missao_itens_seller_write ON public.carteira_missao_itens;
CREATE POLICY carteira_missao_itens_seller_write
  ON public.carteira_missao_itens
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.carteira_missoes m
      WHERE m.id = missao_id AND m.seller_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carteira_missoes m
      WHERE m.id = missao_id AND m.seller_user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.carteira_salvar_cliente_v2(
  p_payload jsonb,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
      AND (v_oportunidade_id IS NULL OR a.oportunidade_id = v_oportunidade_id)
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
$$;

CREATE OR REPLACE FUNCTION public.carteira_iniciar_missao_v2(
  p_payload jsonb,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_store_id uuid;
  v_client_ids uuid[];
  v_existing_id uuid;
  v_scoped_key text;
  v_payload jsonb;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;
  IF NULLIF(BTRIM(p_idempotency_key), '') IS NULL THEN
    RAISE EXCEPTION 'Chave de idempotência obrigatória.';
  END IF;
  IF jsonb_typeof(COALESCE(p_payload->'clientes_ids', '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'clientes_ids deve ser uma lista.';
  END IF;

  SELECT vl.store_id INTO v_store_id
  FROM public.vinculos_loja vl
  WHERE vl.user_id = v_user
    AND vl.is_active = true
    AND lower(vl.role) IN ('vendedor', 'seller')
  ORDER BY vl.created_at DESC NULLS LAST
  LIMIT 1;

  SELECT COALESCE(array_agg(client_id ORDER BY client_id), '{}'::uuid[])
  INTO v_client_ids
  FROM (
    SELECT DISTINCT value::uuid AS client_id
    FROM jsonb_array_elements_text(COALESCE(p_payload->'clientes_ids', '[]'::jsonb))
  ) ids;

  IF v_store_id IS NULL OR cardinality(v_client_ids) = 0 THEN
    RAISE EXCEPTION 'Missão requer loja e ao menos um cliente.';
  END IF;

  IF (
    SELECT count(*) FROM public.clientes c
    WHERE c.id = ANY(v_client_ids)
      AND c.seller_user_id = v_user
      AND c.loja_id = v_store_id
  ) <> cardinality(v_client_ids) THEN
    RAISE EXCEPTION 'Cliente de missão inválido ou fora do escopo do vendedor.';
  END IF;

  v_scoped_key := v_user::text || ':' || p_idempotency_key;
  PERFORM pg_advisory_xact_lock(
    hashtextextended('carteira:mission:' || v_user::text || ':' || array_to_string(v_client_ids, ','), 0)
  );

  SELECT m.id INTO v_existing_id
  FROM public.carteira_missoes m
  WHERE m.seller_user_id = v_user
    AND m.loja_id = v_store_id
    AND m.status IN ('Preparando', 'Enviando mensagens', 'Respondendo clientes', 'Pausada', 'Aguardando respostas')
    AND ARRAY(SELECT value FROM unnest(m.clientes_ids) value ORDER BY value) = v_client_ids
  ORDER BY m.updated_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'replayed', true, 'missao_id', v_existing_id);
  END IF;

  v_payload := jsonb_set(p_payload, '{clientes_ids}', to_jsonb(v_client_ids), true);
  v_payload := jsonb_set(v_payload, '{total_clientes}', to_jsonb(cardinality(v_client_ids)), true);
  RETURN public.carteira_iniciar_missao(v_payload, v_scoped_key);
END;
$$;

CREATE OR REPLACE FUNCTION public.carteira_atualizar_missao_v2(
  p_missao_id uuid,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_revision bigint;
  v_expected_revision bigint := NULLIF(p_payload->>'expected_revision', '')::bigint;
  v_item jsonb := p_payload->'item';
  v_item_client_id uuid := NULLIF(v_item->>'cliente_id', '')::uuid;
  v_item_status text := NULLIF(v_item->>'status', '');
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  SELECT m.revision INTO v_revision
  FROM public.carteira_missoes m
  WHERE m.id = p_missao_id AND m.seller_user_id = v_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Missão não encontrada ou sem permissão.';
  END IF;
  IF v_expected_revision IS NOT NULL AND v_expected_revision <> v_revision THEN
    RAISE EXCEPTION 'Conflito de concorrência na missão.' USING ERRCODE = '40001';
  END IF;

  IF v_item IS NOT NULL THEN
    IF v_item_client_id IS NULL OR v_item_status IS NULL THEN
      RAISE EXCEPTION 'Item da missão requer cliente_id e status.';
    END IF;

    UPDATE public.carteira_missao_itens i
    SET
      status = v_item_status,
      resultado = CASE WHEN v_item ? 'resultado' THEN NULLIF(v_item->>'resultado', '') ELSE i.resultado END,
      mensagem_enviada_em = CASE WHEN v_item_status = 'Mensagem enviada' THEN COALESCE(i.mensagem_enviada_em, now()) ELSE i.mensagem_enviada_em END,
      respondido_em = CASE WHEN v_item_status IN ('Aguardando vendedor', 'Concluído', 'Sem interesse') THEN COALESCE(i.respondido_em, now()) ELSE i.respondido_em END,
      concluido_em = CASE WHEN v_item_status IN ('Concluído', 'Pulado', 'Sem interesse', 'Não respondeu') THEN COALESCE(i.concluido_em, now()) ELSE i.concluido_em END,
      metadata = i.metadata || COALESCE(v_item->'metadata', '{}'::jsonb),
      updated_at = now()
    WHERE i.missao_id = p_missao_id AND i.cliente_id = v_item_client_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Item não pertence à missão.';
    END IF;
  END IF;

  PERFORM public.carteira_atualizar_missao(
    p_missao_id,
    p_payload - 'item' - 'expected_revision'
  );

  UPDATE public.carteira_missoes
  SET revision = revision + 1, updated_at = now(), updated_by = v_user
  WHERE id = p_missao_id
  RETURNING revision INTO v_revision;

  RETURN jsonb_build_object('ok', true, 'missao_id', p_missao_id, 'revision', v_revision);
END;
$$;

-- Durante o rollout, o frontend de produção ainda usa os entrypoints legados.
-- Bloqueia exposição anônima agora, preservando authenticated até o deploy v2.
REVOKE ALL ON FUNCTION public.carteira_salvar_cliente(jsonb, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.carteira_iniciar_missao(jsonb, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.carteira_atualizar_missao(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.carteira_salvar_cliente(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.carteira_iniciar_missao(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.carteira_atualizar_missao(uuid, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.carteira_salvar_cliente_v2(jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.carteira_salvar_cliente_v2(jsonb, text) FROM anon;
REVOKE ALL ON FUNCTION public.carteira_iniciar_missao_v2(jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.carteira_iniciar_missao_v2(jsonb, text) FROM anon;
REVOKE ALL ON FUNCTION public.carteira_atualizar_missao_v2(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.carteira_atualizar_missao_v2(uuid, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.carteira_salvar_cliente_v2(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.carteira_iniciar_missao_v2(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.carteira_atualizar_missao_v2(uuid, jsonb) TO authenticated;

COMMIT;

-- DOWN: use o rollback complementar supabase/rollbacks/20260716210000_carteira_base44_security_hardening.sql.
