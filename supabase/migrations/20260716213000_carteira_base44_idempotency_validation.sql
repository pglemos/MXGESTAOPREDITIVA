-- Carteira Base44: correção forward-only após o hardening 21:00 já aplicado.
-- Torna revisão/idempotência obrigatórias nas atualizações de missão e evita
-- duplicidade ao registrar veículos no Plano de Ataque.

BEGIN;

ALTER TABLE public.carteira_missoes
  ADD COLUMN IF NOT EXISTS last_mutation_key text,
  ADD COLUMN IF NOT EXISTS last_mutation_result jsonb;

ALTER TABLE public.veiculos_estoque
  ADD COLUMN IF NOT EXISTS idempotency_key text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'veiculos_estoque_created_by_idempotency_key_key'
      AND conrelid = 'public.veiculos_estoque'::regclass
  ) THEN
    ALTER TABLE public.veiculos_estoque
      ADD CONSTRAINT veiculos_estoque_created_by_idempotency_key_key
      UNIQUE (created_by, idempotency_key);
  END IF;
END;
$$;

-- A assinatura de dois argumentos fica indisponível durante a transição.
-- Produção ainda usa somente as RPCs legadas sem sufixo v2 neste momento.
REVOKE ALL ON FUNCTION public.carteira_atualizar_missao_v2(uuid, jsonb)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.carteira_atualizar_missao_v2(
  p_missao_id uuid,
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
  v_revision bigint;
  v_expected_revision bigint := NULLIF(p_payload->>'expected_revision', '')::bigint;
  v_item jsonb := p_payload->'item';
  v_item_client_id uuid := NULLIF(v_item->>'cliente_id', '')::uuid;
  v_item_status text := NULLIF(v_item->>'status', '');
  v_scoped_key text;
  v_last_mutation_key text;
  v_last_mutation_result jsonb;
  v_result jsonb;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;
  IF NULLIF(BTRIM(p_idempotency_key), '') IS NULL THEN
    RAISE EXCEPTION 'Chave de idempotência obrigatória.';
  END IF;
  IF v_expected_revision IS NULL THEN
    RAISE EXCEPTION 'expected_revision é obrigatório.';
  END IF;

  v_scoped_key := v_user::text || ':' || p_idempotency_key;

  SELECT m.revision, m.last_mutation_key, m.last_mutation_result
  INTO v_revision, v_last_mutation_key, v_last_mutation_result
  FROM public.carteira_missoes m
  WHERE m.id = p_missao_id AND m.seller_user_id = v_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Missão não encontrada ou sem permissão.';
  END IF;

  IF v_last_mutation_key = v_scoped_key AND v_last_mutation_result IS NOT NULL THEN
    RETURN v_last_mutation_result || jsonb_build_object('replayed', true);
  END IF;

  IF v_expected_revision <> v_revision THEN
    RAISE EXCEPTION 'Conflito de concorrência na missão.' USING ERRCODE = '40001';
  END IF;

  IF v_item IS NOT NULL THEN
    IF v_item_client_id IS NULL OR v_item_status IS NULL THEN
      RAISE EXCEPTION 'Item da missão requer cliente_id e status.';
    END IF;
    IF v_item_status NOT IN (
      'Pendente',
      'Mensagem enviada',
      'Aguardando resposta',
      'Aguardando vendedor',
      'Concluído',
      'Pulado',
      'Sem interesse',
      'Não respondeu'
    ) THEN
      RAISE EXCEPTION 'Status de item da missão inválido.';
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
  SET
    revision = revision + 1,
    last_mutation_key = v_scoped_key,
    last_mutation_result = jsonb_build_object(
      'ok', true,
      'missao_id', p_missao_id,
      'revision', revision + 1,
      'replayed', false
    ),
    updated_at = now(),
    updated_by = v_user
  WHERE id = p_missao_id
  RETURNING last_mutation_result INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.carteira_atualizar_missao_v2(uuid, jsonb, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.carteira_atualizar_missao_v2(uuid, jsonb, text)
  TO authenticated;

COMMIT;

-- DOWN: use supabase/rollbacks/20260716213000_carteira_base44_idempotency_validation.sql.
