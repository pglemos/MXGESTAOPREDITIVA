-- Carteira Base44: ledger persistente de idempotência por missão, usuário e chave.
-- Mantém as migrations 21:30 e 21:40 imutáveis e substitui o replay de slot único
-- por um histórico que também rejeita reutilização da chave com payload diferente.

BEGIN;

CREATE TABLE IF NOT EXISTS public.carteira_missao_mutations (
  missao_id uuid NOT NULL REFERENCES public.carteira_missoes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  payload_hash text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (missao_id, user_id, idempotency_key)
);

ALTER TABLE public.carteira_missao_mutations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.carteira_missao_mutations FROM PUBLIC, anon, authenticated;

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
  v_payload_hash text := md5(p_payload::text);
  v_existing_hash text;
  v_existing_result jsonb;
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

  SELECT m.revision
  INTO v_revision
  FROM public.carteira_missoes m
  WHERE m.id = p_missao_id AND m.seller_user_id = v_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Missão não encontrada ou sem permissão.';
  END IF;

  SELECT mutation.payload_hash, mutation.result
  INTO v_existing_hash, v_existing_result
  FROM public.carteira_missao_mutations mutation
  WHERE mutation.missao_id = p_missao_id
    AND mutation.user_id = v_user
    AND mutation.idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF v_existing_hash <> v_payload_hash THEN
      RAISE sqlstate 'PT409'
        USING message = 'Chave de idempotência reutilizada com payload diferente.';
    END IF;
    RETURN v_existing_result || jsonb_build_object('replayed', true);
  END IF;

  IF v_expected_revision <> v_revision THEN
    RAISE sqlstate 'PT409'
      USING message = 'Conflito de concorrência na missão.';
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

  INSERT INTO public.carteira_missao_mutations (
    missao_id,
    user_id,
    idempotency_key,
    payload_hash,
    result
  ) VALUES (
    p_missao_id,
    v_user,
    p_idempotency_key,
    v_payload_hash,
    v_result
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.carteira_atualizar_missao_v2(uuid, jsonb, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.carteira_atualizar_missao_v2(uuid, jsonb, text)
  TO authenticated;

COMMIT;

-- DOWN: use supabase/rollbacks/20260716215000_carteira_mission_idempotency_ledger.sql.
