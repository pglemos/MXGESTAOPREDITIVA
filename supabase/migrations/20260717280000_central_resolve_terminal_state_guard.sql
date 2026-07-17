BEGIN;

-- Fase 10 (revisao adversarial) q13/Exemplo 2: idempotencia so por chave permitia
-- que uma atividade JA concluida fosse resolvida de novo com chave nova, criando
-- evento comercial duplicado (inflando funil/relatorios). Adiciona guard de estado
-- terminal apos o replay por chave. Testado: events_after passa de 2 para 1.

CREATE OR REPLACE FUNCTION public.central_resolve_action(p_action_id uuid, p_result_code text, p_note text, p_payload jsonb, p_idempotency_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_action public.execution_actions%ROWTYPE;
  v_event_type text;
  v_event_id uuid;
  v_due_at timestamptz;
  v_new_status text := 'concluida';
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sessao invalida.'; END IF;
  IF nullif(trim(coalesce(p_result_code, '')), '') IS NULL THEN RAISE EXCEPTION 'Resultado obrigatorio.'; END IF;
  IF nullif(trim(coalesce(p_idempotency_key, '')), '') IS NULL THEN RAISE EXCEPTION 'Chave de idempotencia obrigatoria.'; END IF;
  p_payload := coalesce(p_payload, '{}'::jsonb);

  SELECT * INTO v_action FROM public.execution_actions WHERE id = p_action_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Atividade nao encontrada.'; END IF;
  IF NOT public.central_can_manage_action(v_action.seller_id, v_action.store_id) THEN
    RAISE EXCEPTION 'Sem permissao para resolver esta atividade.';
  END IF;
  IF v_action.last_mutation_key = p_idempotency_key THEN
    RETURN coalesce(v_action.last_mutation_result, jsonb_build_object('action_id', v_action.id, 'replayed', true));
  END IF;
  -- Guard de estado terminal (Fase 10 q13): impede reprocessar uma atividade ja
  -- finalizada com uma chave de idempotencia diferente, o que duplicava eventos_comerciais.
  -- O replay com a MESMA chave ja retornou acima; aqui so chega chave nova.
  IF v_action.status IN ('concluida', 'justificada', 'cancelada') THEN
    RAISE EXCEPTION 'Atividade ja finalizada; nao pode ser resolvida novamente.' USING ERRCODE = '23514';
  END IF;
  IF NOT public.central_result_allowed(v_action.activity_type, p_result_code) THEN
    RAISE EXCEPTION 'Resultado invalido para o tipo de atividade.';
  END IF;

  IF p_result_code = 'reschedule' THEN
    v_due_at := nullif(p_payload->>'due_at', '')::timestamptz;
    PERFORM public.central_reschedule_action(p_action_id, v_due_at, p_note, p_idempotency_key);
    RETURN jsonb_build_object('action_id', p_action_id, 'status', 'reagendada', 'due_at', v_due_at);
  END IF;
  IF p_result_code = 'manager_required' THEN
    PERFORM public.central_escalate_action(p_action_id, p_note, p_idempotency_key);
    RETURN jsonb_build_object('action_id', p_action_id, 'status', 'escalated');
  END IF;

  IF p_result_code = 'task_justified' THEN
    IF nullif(trim(coalesce(p_note, '')), '') IS NULL THEN RAISE EXCEPTION 'Justificativa obrigatoria.'; END IF;
    v_new_status := 'justificada';
  ELSIF p_result_code = 'cancelled' THEN
    v_new_status := 'cancelada';
  END IF;

  IF v_action.agendamento_id IS NOT NULL THEN
    UPDATE public.agendamentos
    SET status = CASE
          WHEN p_result_code IN ('attended', 'delivery_completed', 'warranty_resolved', 'post_sale_satisfied') THEN 'compareceu'::public.crm_agendamento_status
          WHEN p_result_code IN ('no_show', 'client_absent') THEN 'nao_compareceu'::public.crm_agendamento_status
          WHEN p_result_code IN ('confirmed', 'delivery_confirmed') THEN 'confirmado'::public.crm_agendamento_status
          ELSE status END,
        observacoes = CASE WHEN nullif(trim(coalesce(p_note, '')), '') IS NULL THEN observacoes
          ELSE concat_ws(E'\n', observacoes, concat('Central: ', trim(p_note))) END,
        updated_by = auth.uid(), updated_at = now()
    WHERE id = v_action.agendamento_id
      AND loja_id = v_action.store_id
      AND seller_user_id = v_action.seller_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Atividade inconsistente: agendamento vinculado nao pertence ao mesmo vendedor/loja da atividade.';
    END IF;
  END IF;

  IF v_action.oportunidade_id IS NOT NULL AND p_result_code = 'sale_completed' THEN
    UPDATE public.oportunidades
    SET valor_negociado = coalesce(nullif(p_payload->>'value', '')::numeric, valor_negociado),
        sinal = coalesce(nullif(p_payload->>'deposit', '')::numeric, sinal),
        financiamento = coalesce(nullif(p_payload->>'financing', '')::public.crm_financiamento, financiamento),
        carro_avaliado = coalesce(nullif(p_payload->>'trade_evaluated', '')::boolean, carro_avaliado),
        etapa = 'ganho'::public.crm_etapa_funil, closed_at = now(),
        updated_by = auth.uid(), updated_at = now()
    WHERE id = v_action.oportunidade_id
      AND loja_id = v_action.store_id
      AND seller_user_id = v_action.seller_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Atividade inconsistente: oportunidade vinculada nao pertence ao mesmo vendedor/loja da atividade.';
    END IF;
  ELSIF v_action.oportunidade_id IS NOT NULL AND p_result_code = 'sale_lost' THEN
    IF nullif(trim(coalesce(p_payload->>'loss_reason', p_note, '')), '') IS NULL THEN
      RAISE EXCEPTION 'Motivo da perda obrigatorio.';
    END IF;
    UPDATE public.oportunidades
    SET etapa = 'perdido'::public.crm_etapa_funil,
        motivo_perda = trim(coalesce(nullif(p_payload->>'loss_reason', ''), p_note)),
        closed_at = now(), updated_by = auth.uid(), updated_at = now()
    WHERE id = v_action.oportunidade_id
      AND loja_id = v_action.store_id
      AND seller_user_id = v_action.seller_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Atividade inconsistente: oportunidade vinculada nao pertence ao mesmo vendedor/loja da atividade.';
    END IF;
  ELSIF v_action.oportunidade_id IS NOT NULL AND p_result_code = 'advanced' THEN
    UPDATE public.oportunidades
    SET etapa = CASE WHEN etapa IN ('ganho', 'perdido') THEN etapa ELSE 'negociacao'::public.crm_etapa_funil END,
        updated_by = auth.uid(), updated_at = now()
    WHERE id = v_action.oportunidade_id
      AND loja_id = v_action.store_id
      AND seller_user_id = v_action.seller_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Atividade inconsistente: oportunidade vinculada nao pertence ao mesmo vendedor/loja da atividade.';
    END IF;
  END IF;

  IF v_action.cliente_id IS NOT NULL THEN
    UPDATE public.clientes
    SET status = CASE
          WHEN p_result_code = 'sale_completed' THEN 'pos_venda'::public.crm_cliente_status
          WHEN p_result_code = 'sale_lost' AND nullif(p_payload->>'future_date', '') IS NULL THEN 'inativo'::public.crm_cliente_status
          ELSE status END,
        ultima_interacao = current_date,
        proxima_acao = CASE
          WHEN nullif(p_payload->>'next_action', '') IS NOT NULL THEN trim(p_payload->>'next_action')
          WHEN p_result_code = 'sale_completed' THEN 'Realizar pos-venda'
          WHEN p_result_code IN ('no_answer', 'no_response') THEN 'Tentar novo contato'
          WHEN p_result_code = 'sale_lost' AND nullif(p_payload->>'future_date', '') IS NOT NULL THEN 'Reativar oportunidade futura'
          WHEN p_result_code IN ('task_completed', 'documentation_completed', 'delivery_completed', 'warranty_resolved') THEN NULL
          ELSE proxima_acao END,
        proxima_acao_em = CASE
          WHEN nullif(p_payload->>'next_due_date', '') IS NOT NULL THEN (p_payload->>'next_due_date')::date
          WHEN p_result_code = 'sale_completed' THEN current_date + 3
          WHEN p_result_code IN ('no_answer', 'no_response') THEN current_date + 1
          WHEN p_result_code = 'sale_lost' AND nullif(p_payload->>'future_date', '') IS NOT NULL THEN (p_payload->>'future_date')::date
          WHEN p_result_code IN ('task_completed', 'documentation_completed', 'delivery_completed', 'warranty_resolved') THEN NULL
          ELSE proxima_acao_em END,
        updated_by = auth.uid(), updated_at = now()
    WHERE id = v_action.cliente_id
      AND loja_id = v_action.store_id
      AND seller_user_id = v_action.seller_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Atividade inconsistente: cliente vinculado nao pertence ao mesmo vendedor/loja da atividade.';
    END IF;
  END IF;

  v_event_type := CASE
    WHEN p_result_code = 'sale_completed' THEN 'venda_realizada'
    WHEN p_result_code = 'attended' THEN 'atendimento_comercial_realizado'
    WHEN p_result_code = 'contacted' AND v_action.activity_type = 'retorno' THEN 'retorno_realizado'
    WHEN p_result_code = 'advanced' THEN 'proposta_enviada'
    WHEN p_result_code = 'delivery_completed' THEN 'entrega_realizada'
    WHEN p_result_code IN ('warranty_resolved', 'waiting_workshop', 'waiting_part') THEN 'garantia_registrada'
    WHEN p_result_code IN ('post_sale_satisfied', 'post_sale_question', 'complaint', 'repurchase', 'referral') THEN 'pos_venda_realizado'
    ELSE NULL END;

  IF v_event_type IS NOT NULL AND v_action.cliente_id IS NOT NULL AND v_action.store_id IS NOT NULL THEN
    INSERT INTO public.eventos_comerciais (
      cliente_id, oportunidade_id, agendamento_id, loja_id, seller_user_id,
      tipo_evento, data_evento, origem_modulo, observacao, data_competencia,
      created_by, idempotency_key
    ) VALUES (
      v_action.cliente_id, v_action.oportunidade_id, v_action.agendamento_id,
      v_action.store_id, v_action.seller_id, v_event_type::public.crm_evento_tipo,
      now(), 'central_execucao', nullif(trim(coalesce(p_note, '')), ''), current_date,
      auth.uid(), 'central:event:' || p_idempotency_key
    )
    ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
    RETURNING id INTO v_event_id;
    IF v_event_id IS NULL THEN
      SELECT id INTO v_event_id FROM public.eventos_comerciais
      WHERE idempotency_key = 'central:event:' || p_idempotency_key;
    END IF;
  END IF;

  v_result := jsonb_build_object('action_id', p_action_id, 'status', v_new_status,
    'result_code', p_result_code, 'event_id', v_event_id);
  UPDATE public.execution_actions
  SET status = v_new_status, result_code = p_result_code,
      result_note = nullif(trim(coalesce(p_note, '')), ''),
      evento_id = coalesce(v_event_id, evento_id), active = false,
      completed_at = now(), completed_by = auth.uid(),
      justificativa = CASE WHEN v_new_status = 'justificada' THEN trim(p_note) ELSE justificativa END,
      last_mutation_key = p_idempotency_key, last_mutation_result = v_result,
      updated_by = auth.uid(), updated_at = now()
  WHERE id = p_action_id;
  RETURN v_result;
END;
$function$
;

COMMIT;

-- DOWN: restaurar central_resolve_action sem o bloco 'Atividade ja finalizada'.
