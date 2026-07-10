-- ============================================================================
-- Migration: 20260710230000_cadencia_canal_contato.sql
-- Origem:    Auditoria Integral 2026-07-10 (Sprint CRM item 3 / planilha #9)
--
-- ESCOPO: "Executar Proximo Passo" forcava WhatsApp como unico canal.
--   Esta migration adiciona p_canal_contato (whatsapp|ligacao|presencial,
--   opcional) ao RPC registrar_status_acao_cadencia e grava 'canalContato'
--   no historico jsonb da cadencia — auditavel por acao executada.
--
--   A funcao antiga de 3 argumentos e removida para nao criar overload
--   ambiguo; o novo parametro tem DEFAULT NULL, entao chamadas existentes
--   de 3 argumentos continuam funcionando.
--
--   Corpo da funcao copiado de 20260616203000_cadencia_configuravel_vendedor
--   com as tres alteracoes acima (assinatura, validacao, historico).
-- ============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.registrar_status_acao_cadencia(uuid, text, text);

CREATE OR REPLACE FUNCTION public.registrar_status_acao_cadencia(
  p_cliente_id uuid,
  p_status text,
  p_observacao text DEFAULT NULL,
  p_canal_contato text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estado public.cadencia_estado_cliente%ROWTYPE;
  v_fluxo public.cadencia_fluxos%ROWTYPE;
  v_passo_atual jsonb;
  v_proximo_key text;
  v_proximo_passo jsonb;
  v_proxima_acao text;
  v_prazo_dias integer;
  v_proxima_data date;
  v_proximo_status text;
  v_status_sem_sucesso boolean;
  v_tentativas_passo integer;
  v_tentativa_registrada integer;
  v_limite_atual integer;
  v_limite_proximo integer;
  v_reagendamento_automatico boolean := false;
  v_limite_estourado boolean := false;
BEGIN
  IF p_status NOT IN ('feito', 'nao_feito', 'aguardando') THEN
    RAISE EXCEPTION 'Status de acao de cadencia invalido: %.', p_status;
  END IF;

  IF p_canal_contato IS NOT NULL AND p_canal_contato NOT IN ('whatsapp', 'ligacao', 'presencial') THEN
    RAISE EXCEPTION 'Canal de contato invalido: %.', p_canal_contato;
  END IF;

  SELECT *
    INTO v_estado
  FROM public.cadencia_estado_cliente
  WHERE cliente_id = p_cliente_id
  FOR UPDATE;

  IF NOT FOUND THEN
    PERFORM public.inicializar_cadencia_cliente(p_cliente_id);
    SELECT *
      INTO v_estado
    FROM public.cadencia_estado_cliente
    WHERE cliente_id = p_cliente_id
    FOR UPDATE;
  END IF;

  IF NOT (
    v_estado.seller_user_id = auth.uid()
    OR public.is_manager_of(v_estado.loja_id)
    OR public.is_owner_of(v_estado.loja_id)
    OR public.user_has_role(ARRAY['admin_mx','master','consultant'])
  ) THEN
    RAISE EXCEPTION 'Sem permissao para registrar status desta cadencia.';
  END IF;

  SELECT *
    INTO v_fluxo
  FROM public.cadencia_fluxos
  WHERE id = v_estado.fluxo_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fluxo de cadencia aplicado nao encontrado.';
  END IF;

  SELECT passo
    INTO v_passo_atual
  FROM jsonb_array_elements(v_fluxo.passos) AS passo
  WHERE passo->>'key' = v_estado.passo_atual_key
  LIMIT 1;

  IF v_passo_atual IS NULL THEN
    RAISE EXCEPTION 'Passo atual % nao encontrado no fluxo %.', v_estado.passo_atual_key, v_fluxo.id;
  END IF;

  v_proximo_key := CASE p_status
    WHEN 'feito' THEN v_passo_atual->>'aoFazer'
    WHEN 'nao_feito' THEN v_passo_atual->>'aoNaoFazer'
    ELSE v_passo_atual->>'aoAguardar'
  END;

  v_status_sem_sucesso := p_status IN ('nao_feito', 'aguardando');
  v_limite_atual := GREATEST(COALESCE((v_passo_atual->>'limiteTentativas')::integer, v_estado.tentativa_limite, 1), 1);
  v_tentativas_passo := CASE
    WHEN v_status_sem_sucesso THEN v_estado.tentativas_passo + 1
    ELSE 0
  END;
  v_tentativa_registrada := v_tentativas_passo;

  IF v_status_sem_sucesso AND v_tentativas_passo < v_limite_atual THEN
    v_proximo_key := v_estado.passo_atual_key;
    v_proximo_passo := v_passo_atual;
    v_proxima_acao := v_passo_atual->>'proximaAcao';
    v_proxima_data := CURRENT_DATE + 1;
    v_proximo_status := 'ativo';
    v_limite_proximo := v_limite_atual;
    v_reagendamento_automatico := true;
  ELSE
    v_limite_estourado := v_status_sem_sucesso;

    IF v_proximo_key IS NOT NULL THEN
      SELECT passo
        INTO v_proximo_passo
      FROM jsonb_array_elements(v_fluxo.passos) AS passo
      WHERE passo->>'key' = v_proximo_key
      LIMIT 1;

      IF v_proximo_passo IS NULL THEN
        RAISE EXCEPTION 'Proximo passo % nao encontrado no fluxo %.', v_proximo_key, v_fluxo.id;
      END IF;

      v_proxima_acao := v_proximo_passo->>'proximaAcao';
      v_prazo_dias := COALESCE((v_proximo_passo->>'prazoDias')::integer, 0);
      v_proxima_data := CURRENT_DATE + GREATEST(v_prazo_dias, CASE WHEN v_status_sem_sucesso THEN 1 ELSE 0 END);
      v_proximo_status := 'ativo';
      v_tentativas_passo := 0;
      v_limite_proximo := GREATEST(COALESCE((v_proximo_passo->>'limiteTentativas')::integer, 1), 1);
    ELSE
      v_proximo_key := v_estado.passo_atual_key;
      v_proximo_passo := v_passo_atual;
      v_proxima_acao := CASE
        WHEN v_status_sem_sucesso THEN 'Cadencia encerrada por limite de tentativas'
        ELSE 'Cadencia concluida'
      END;
      v_proxima_data := CASE
        WHEN v_status_sem_sucesso THEN CURRENT_DATE + 1
        ELSE CURRENT_DATE
      END;
      v_proximo_status := CASE
        WHEN v_status_sem_sucesso THEN 'cancelado'
        ELSE 'concluido'
      END;
      v_tentativas_passo := 0;
      v_limite_proximo := v_limite_atual;
    END IF;
  END IF;

  UPDATE public.cadencia_estado_cliente
  SET
    last_result = p_status,
    passo_atual_key = v_proximo_key,
    etapa_atual = COALESCE(v_proximo_passo->>'etapaId', etapa_atual),
    proxima_acao = v_proxima_acao,
    proxima_acao_em = v_proxima_data,
    status = v_proximo_status,
    tentativas_passo = v_tentativas_passo,
    tentativa_limite = v_limite_proximo,
    reagendamentos_sem_sucesso = reagendamentos_sem_sucesso + CASE
      WHEN v_status_sem_sucesso AND v_proximo_status = 'ativo' THEN 1
      ELSE 0
    END,
    historico = COALESCE(historico, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'at', now(),
      'from', v_estado.passo_atual_key,
      'to', v_proximo_key,
      'result', p_status,
      'tentativa', CASE WHEN v_status_sem_sucesso THEN v_tentativa_registrada ELSE NULL END,
      'limiteTentativas', v_limite_atual,
      'reagendamentoAutomatico', v_reagendamento_automatico,
      'limiteEstourado', v_limite_estourado,
      'proximaAcaoEm', v_proxima_data,
      'observacao', NULLIF(BTRIM(COALESCE(p_observacao, '')), ''),
      'canalContato', p_canal_contato
    ))
  WHERE id = v_estado.id
  RETURNING * INTO v_estado;

  UPDATE public.clientes
  SET
    proxima_acao = v_estado.proxima_acao,
    proxima_acao_em = v_estado.proxima_acao_em,
    ultima_interacao = CURRENT_DATE
  WHERE id = v_estado.cliente_id;

  RETURN v_estado.id;
END;
$$;

COMMENT ON FUNCTION public.registrar_status_acao_cadencia(uuid, text, text, text) IS
  'Registra Feito/Nao feito/Aguardando na cadencia com canal de contato opcional (whatsapp/ligacao/presencial), atualiza historico e recalcula a proxima acao.';

REVOKE ALL ON FUNCTION public.registrar_status_acao_cadencia(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_status_acao_cadencia(uuid, text, text, text) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- DOWN (rollback emergencial): reaplicar a definicao de 3 argumentos que esta
-- em 20260616203000_cadencia_configuravel_vendedor.sql (linhas 244-424).
-- ============================================================================
