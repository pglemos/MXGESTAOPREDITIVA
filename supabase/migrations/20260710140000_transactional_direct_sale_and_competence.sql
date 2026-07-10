-- Story MX-AUDIT-20260710 / Fase 3
-- Venda direta transacional, competência explícita e dedupe loja+telefone.

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS data_competencia date,
  ADD COLUMN IF NOT EXISTS origem_modulo text NOT NULL DEFAULT 'crm',
  ADD COLUMN IF NOT EXISTS fechamento_id uuid REFERENCES public.lancamentos_diarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL;

ALTER TABLE public.oportunidades
  ADD COLUMN IF NOT EXISTS data_competencia date,
  ADD COLUMN IF NOT EXISTS origem_modulo text NOT NULL DEFAULT 'crm',
  ADD COLUMN IF NOT EXISTS fechamento_id uuid REFERENCES public.lancamentos_diarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS idempotency_key text;

ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS data_competencia date,
  ADD COLUMN IF NOT EXISTS origem_modulo text NOT NULL DEFAULT 'crm',
  ADD COLUMN IF NOT EXISTS fechamento_id uuid REFERENCES public.lancamentos_diarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL;

ALTER TABLE public.eventos_comerciais
  ADD COLUMN IF NOT EXISTS data_competencia date,
  ADD COLUMN IF NOT EXISTS fechamento_id uuid REFERENCES public.lancamentos_diarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE INDEX IF NOT EXISTS idx_clientes_loja_telefone_normalizado
  ON public.clientes (loja_id, telefone_normalizado)
  WHERE telefone_normalizado IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clientes_fechamento_id
  ON public.clientes (fechamento_id) WHERE fechamento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_oportunidades_fechamento_id
  ON public.oportunidades (fechamento_id) WHERE fechamento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agendamentos_fechamento_id
  ON public.agendamentos (fechamento_id) WHERE fechamento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eventos_comerciais_fechamento_id
  ON public.eventos_comerciais (fechamento_id) WHERE fechamento_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_oportunidades_idempotency_key
  ON public.oportunidades (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_eventos_comerciais_idempotency_key
  ON public.eventos_comerciais (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_eventos_comerciais_venda_competencia
  ON public.eventos_comerciais (data_competencia, loja_id, seller_user_id)
  WHERE tipo_evento = 'venda_realizada';

COMMENT ON COLUMN public.clientes.data_competencia IS 'Competência comercial; created_at preserva o instante real de criação.';
COMMENT ON COLUMN public.oportunidades.data_competencia IS 'Competência comercial; created_at preserva o instante real de criação.';
COMMENT ON COLUMN public.eventos_comerciais.data_competencia IS 'Competência do fato comercial, independente de created_at/data_evento.';

CREATE OR REPLACE FUNCTION public.buscar_cliente_loja_por_telefone(p_telefone text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_caller_id uuid := auth.uid();
  v_store_id uuid;
  v_phone text := nullif(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g'), '');
  v_cliente record;
BEGIN
  SELECT store_id INTO v_store_id
    FROM public.vendedores_loja
   WHERE seller_user_id = v_caller_id AND coalesce(is_active, true)
   ORDER BY started_at DESC NULLS LAST LIMIT 1;
  IF v_store_id IS NULL OR length(coalesce(v_phone, '')) < 10 THEN
    RETURN jsonb_build_object('ok', true, 'data', NULL);
  END IF;

  SELECT id, nome, seller_user_id INTO v_cliente
    FROM public.clientes
   WHERE loja_id = v_store_id AND telefone_normalizado = v_phone
   ORDER BY updated_at DESC LIMIT 1;

  RETURN jsonb_build_object(
    'ok', true,
    'data', CASE WHEN v_cliente.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', CASE WHEN v_cliente.seller_user_id = v_caller_id THEN v_cliente.id ELSE NULL END,
      'nome', CASE WHEN v_cliente.seller_user_id = v_caller_id THEN v_cliente.nome ELSE NULL END,
      'exists_in_store', true,
      'owned_by_caller', v_cliente.seller_user_id = v_caller_id
    ) END
  );
END;
$function$;

-- Um cliente pode ser reutilizado por uma venda de outro vendedor da mesma
-- loja. O vendedor só recebe leitura dessa ficha quando já existe uma
-- oportunidade própria vinculada; escrita continua restrita ao dono da ficha.
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

DROP POLICY IF EXISTS clientes_related_opportunity_read ON public.clientes;
CREATE POLICY clientes_related_opportunity_read ON public.clientes
  FOR SELECT TO authenticated
  USING (public.pode_ler_cliente_por_oportunidade(id));

CREATE OR REPLACE FUNCTION public.registrar_venda_direta(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_caller_id uuid := auth.uid();
  v_store_id uuid := nullif(p_payload->>'store_id', '')::uuid;
  v_phone text := nullif(regexp_replace(coalesce(p_payload->>'telefone', ''), '\D', '', 'g'), '');
  v_nome text := nullif(trim(coalesce(p_payload->>'nome', '')), '');
  v_competencia date := coalesce(nullif(p_payload->>'data_competencia', '')::date, timezone('America/Sao_Paulo', now())::date);
  v_key text := nullif(trim(coalesce(p_payload->>'idempotency_key', '')), '');
  v_cliente_id uuid;
  v_oportunidade_id uuid;
  v_evento_id uuid;
  v_agendamento_id uuid;
  v_fechamento_id uuid := nullif(p_payload->>'fechamento_id', '')::uuid;
  v_cliente_existente boolean := false;
  v_canal public.crm_canal;
  v_financiamento public.crm_financiamento;
  v_closed_at timestamptz;
BEGIN
  IF v_caller_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Não autenticado.'); END IF;

  IF v_store_id IS NULL THEN
    SELECT store_id INTO v_store_id
      FROM public.vendedores_loja
     WHERE seller_user_id = v_caller_id AND coalesce(is_active, true)
     ORDER BY started_at DESC NULLS LAST LIMIT 1;
  ELSIF NOT EXISTS (
    SELECT 1 FROM public.vendedores_loja
     WHERE seller_user_id = v_caller_id
       AND store_id = v_store_id
       AND coalesce(is_active, true)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Vendedor sem vínculo ativo com a loja informada.');
  END IF;

  IF v_store_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Vendedor sem vínculo ativo com loja.'); END IF;
  IF length(coalesce(v_phone, '')) < 10 THEN RETURN jsonb_build_object('ok', false, 'error', 'Telefone válido é obrigatório.'); END IF;
  IF v_competencia > timezone('America/Sao_Paulo', now())::date THEN RETURN jsonb_build_object('ok', false, 'error', 'Venda não pode usar competência futura.'); END IF;
  IF coalesce((p_payload->>'valor_venda')::numeric, 0) <= 0 THEN RETURN jsonb_build_object('ok', false, 'error', 'Valor da venda deve ser maior que zero.'); END IF;
  IF nullif(trim(coalesce(p_payload->>'veiculo', '')), '') IS NULL OR nullif(trim(coalesce(p_payload->>'placa', '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Veículo e placa são obrigatórios.');
  END IF;

  v_canal := coalesce(nullif(p_payload->>'canal', '')::public.crm_canal, 'porta'::public.crm_canal);
  v_financiamento := coalesce(nullif(p_payload->>'financiamento', '')::public.crm_financiamento, 'nao_aplica'::public.crm_financiamento);
  v_closed_at := (v_competencia::text || 'T12:00:00-03:00')::timestamptz;
  v_key := v_caller_id::text || ':' || v_store_id::text || ':' || coalesce(
    v_key,
    v_competencia::text || ':' || v_phone || ':' || upper(trim(p_payload->>'placa'))
  );

  IF v_fechamento_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.lancamentos_diarios ld
     WHERE ld.id = v_fechamento_id
       AND ld.seller_user_id = v_caller_id
       AND ld.store_id = v_store_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Fechamento informado não pertence ao vendedor e à loja ativos.');
  END IF;

  SELECT id, cliente_id INTO v_oportunidade_id, v_cliente_id
    FROM public.oportunidades
   WHERE idempotency_key = v_key
     AND seller_user_id = v_caller_id
     AND loja_id = v_store_id
   LIMIT 1;
  IF v_oportunidade_id IS NOT NULL THEN
    SELECT id INTO v_evento_id FROM public.eventos_comerciais WHERE idempotency_key = v_key || ':venda' LIMIT 1;
    RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object(
      'cliente_id', v_cliente_id, 'oportunidade_id', v_oportunidade_id,
      'evento_id', v_evento_id, 'duplicate', true
    ));
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_store_id::text || ':' || v_phone, 0));

  -- Revalida depois de adquirir o lock: outra chamada pode ter concluído
  -- entre a checagem otimista e o lock.
  SELECT id, cliente_id INTO v_oportunidade_id, v_cliente_id
    FROM public.oportunidades
   WHERE idempotency_key = v_key
     AND seller_user_id = v_caller_id
     AND loja_id = v_store_id
   LIMIT 1;
  IF v_oportunidade_id IS NOT NULL THEN
    SELECT id INTO v_evento_id
      FROM public.eventos_comerciais
     WHERE idempotency_key = v_key || ':venda'
       AND seller_user_id = v_caller_id
       AND loja_id = v_store_id
     LIMIT 1;
    RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object(
      'cliente_id', v_cliente_id, 'oportunidade_id', v_oportunidade_id,
      'evento_id', v_evento_id, 'duplicate', true
    ));
  END IF;

  SELECT id INTO v_cliente_id
    FROM public.clientes
   WHERE loja_id = v_store_id AND telefone_normalizado = v_phone
   ORDER BY updated_at DESC LIMIT 1
   FOR UPDATE;

  IF v_cliente_id IS NULL THEN
    IF v_nome IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Nome do cliente é obrigatório.'); END IF;
    INSERT INTO public.clientes (
      loja_id, seller_user_id, nome, telefone, canal_origem, status,
      observacoes, data_competencia, origem_modulo, fechamento_id, created_by
    ) VALUES (
      v_store_id, v_caller_id, v_nome, p_payload->>'telefone', v_canal, 'oportunidade',
      nullif(trim(coalesce(p_payload->>'observacao', '')), ''), v_competencia,
      'terminal_mx', v_fechamento_id, v_caller_id
    ) RETURNING id INTO v_cliente_id;
  ELSE
    v_cliente_existente := true;
  END IF;

  INSERT INTO public.oportunidades (
    cliente_id, loja_id, seller_user_id, veiculo_interesse, valor_negociado,
    etapa, canal, financiamento, carro_avaliado, closed_at, placa_veiculo,
    data_entrega_prevista, data_competencia, origem_modulo, fechamento_id,
    created_by, idempotency_key
  ) VALUES (
    v_cliente_id, v_store_id, v_caller_id, trim(p_payload->>'veiculo'),
    (p_payload->>'valor_venda')::numeric, 'ganho', v_canal, v_financiamento,
    coalesce((p_payload->>'carro_avaliado')::boolean, false), v_closed_at,
    upper(trim(p_payload->>'placa')), nullif(p_payload->>'data_entrega_prevista', '')::timestamptz,
    v_competencia, 'terminal_mx', v_fechamento_id, v_caller_id, v_key
  ) RETURNING id INTO v_oportunidade_id;

  INSERT INTO public.eventos_comerciais (
    cliente_id, oportunidade_id, loja_id, seller_user_id, tipo_evento,
    canal, data_evento, data_competencia, origem_modulo, fechamento_id,
    created_by, idempotency_key, observacao
  ) VALUES (
    v_cliente_id, v_oportunidade_id, v_store_id, v_caller_id, 'venda_realizada',
    v_canal, v_closed_at, v_competencia,
    'terminal_mx', v_fechamento_id, v_caller_id, v_key || ':venda',
    nullif(trim(coalesce(p_payload->>'observacao', '')), '')
  ) RETURNING id INTO v_evento_id;

  IF nullif(p_payload->>'data_entrega_prevista', '') IS NOT NULL THEN
    INSERT INTO public.agendamentos (
      cliente_id, oportunidade_id, loja_id, seller_user_id, data_hora, canal,
      tipo, status, observacoes, data_competencia, origem_modulo, fechamento_id, created_by
    ) VALUES (
      v_cliente_id, v_oportunidade_id, v_store_id, v_caller_id,
      (p_payload->>'data_entrega_prevista')::timestamptz, v_canal, 'entrega', 'aguardando',
      nullif(trim(coalesce(p_payload->>'observacao_entrega', '')), ''),
      v_competencia, 'terminal_mx', v_fechamento_id, v_caller_id
    ) RETURNING id INTO v_agendamento_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object(
    'cliente_id', v_cliente_id, 'cliente_existente', v_cliente_existente,
    'oportunidade_id', v_oportunidade_id, 'evento_id', v_evento_id,
    'agendamento_id', v_agendamento_id, 'duplicate', false
  ));
EXCEPTION
  WHEN unique_violation THEN
    SELECT id, cliente_id INTO v_oportunidade_id, v_cliente_id
      FROM public.oportunidades
     WHERE idempotency_key = v_key AND seller_user_id = v_caller_id AND loja_id = v_store_id
     LIMIT 1;
    IF v_oportunidade_id IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Conflito de integridade ao registrar a venda. Nenhum dado parcial foi mantido.');
    END IF;
    SELECT id INTO v_evento_id
      FROM public.eventos_comerciais
     WHERE idempotency_key = v_key || ':venda' AND seller_user_id = v_caller_id AND loja_id = v_store_id
     LIMIT 1;
    RETURN jsonb_build_object('ok', true, 'data', jsonb_build_object(
      'cliente_id', v_cliente_id, 'oportunidade_id', v_oportunidade_id,
      'evento_id', v_evento_id, 'duplicate', true
    ));
  WHEN others THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$function$;

REVOKE ALL ON FUNCTION public.buscar_cliente_loja_por_telefone(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pode_ler_cliente_por_oportunidade(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_venda_direta(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_cliente_loja_por_telefone(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pode_ler_cliente_por_oportunidade(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_venda_direta(jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
