-- ============================================================================
-- Migration: 20260616203000_cadencia_configuravel_vendedor.sql
-- Story:     MX-EV2-20260616 - Motor de Cadencia Configuravel
-- Fonte:     docs/prd/modulo-vendedor/02-epic-carteira-cadencia.md#EV-2.2
--
-- ESCOPO:
--   - Catalogo versionado de fluxos de cadencia por canal/loja.
--   - Estado aplicado por cliente, preservando a versao usada.
--   - RPC idempotente para inicializar a cadencia e preencher proxima acao.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.cadencia_fluxos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id        uuid REFERENCES public.lojas(id) ON DELETE CASCADE,
  canal          public.crm_canal NOT NULL,
  etapa_inicial  text NOT NULL,
  nome           text NOT NULL,
  version        integer NOT NULL DEFAULT 1 CHECK (version > 0),
  active         boolean NOT NULL DEFAULT true,
  passos         jsonb NOT NULL CHECK (jsonb_typeof(passos) = 'array'),
  created_by     uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cadencia_fluxos IS
  'Fluxos versionados de cadencia comercial por canal/loja. Vendedor consome, nao cria.';

CREATE UNIQUE INDEX IF NOT EXISTS ux_cadencia_fluxos_global_canal_version
  ON public.cadencia_fluxos(canal, version)
  WHERE loja_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_cadencia_fluxos_loja_canal_version
  ON public.cadencia_fluxos(loja_id, canal, version)
  WHERE loja_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cadencia_fluxos_lookup
  ON public.cadencia_fluxos(canal, loja_id, active, version DESC);

DROP TRIGGER IF EXISTS trg_cadencia_fluxos_updated_at ON public.cadencia_fluxos;
CREATE TRIGGER trg_cadencia_fluxos_updated_at BEFORE UPDATE ON public.cadencia_fluxos
  FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

CREATE TABLE IF NOT EXISTS public.cadencia_estado_cliente (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id       uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  fluxo_id         uuid NOT NULL REFERENCES public.cadencia_fluxos(id) ON DELETE RESTRICT,
  loja_id          uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  seller_user_id   uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  fluxo_version    integer NOT NULL,
  passo_atual_key  text NOT NULL,
  etapa_atual      text NOT NULL,
  proxima_acao     text NOT NULL,
  proxima_acao_em  date NOT NULL,
  status           text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'concluido', 'cancelado')),
  last_result      text CHECK (last_result IS NULL OR last_result IN ('feito', 'nao_feito', 'aguardando')),
  tentativas_passo integer NOT NULL DEFAULT 0 CHECK (tentativas_passo >= 0),
  tentativa_limite integer NOT NULL DEFAULT 1 CHECK (tentativa_limite > 0),
  reagendamentos_sem_sucesso integer NOT NULL DEFAULT 0 CHECK (reagendamentos_sem_sucesso >= 0),
  historico        jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(historico) = 'array'),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cadencia_estado_cliente_unique UNIQUE (cliente_id)
);

COMMENT ON TABLE public.cadencia_estado_cliente IS
  'Estado versionado da cadencia aplicada ao cliente, fonte futura para status de acao, reagendamento e Central.';

CREATE INDEX IF NOT EXISTS idx_cadencia_estado_seller_data
  ON public.cadencia_estado_cliente(seller_user_id, proxima_acao_em, status);

CREATE INDEX IF NOT EXISTS idx_cadencia_estado_loja_data
  ON public.cadencia_estado_cliente(loja_id, proxima_acao_em, status);

DROP TRIGGER IF EXISTS trg_cadencia_estado_cliente_updated_at ON public.cadencia_estado_cliente;
CREATE TRIGGER trg_cadencia_estado_cliente_updated_at BEFORE UPDATE ON public.cadencia_estado_cliente
  FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

WITH seed(canal, nome, etapa_inicial, passos) AS (
  VALUES
    (
      'internet'::public.crm_canal,
      'Cadencia padrao Internet',
      'lead',
      jsonb_build_array(
        jsonb_build_object('key','internet_mensagem_1','etapaId','lead','titulo','Mensagem 1','proximaAcao','Enviar mensagem 1 de primeiro contato','prazoDias',0,'limiteTentativas',1,'aoFazer','internet_qualificacao','aoNaoFazer','internet_mensagem_2','aoAguardar','internet_mensagem_2'),
        jsonb_build_object('key','internet_mensagem_2','etapaId','lead','titulo','Mensagem 2','proximaAcao','Enviar mensagem 2 com opcao de veiculo e convite para conversa','prazoDias',1,'limiteTentativas',1,'aoFazer','internet_qualificacao','aoNaoFazer','internet_mensagem_3','aoAguardar','internet_mensagem_3'),
        jsonb_build_object('key','internet_qualificacao','etapaId','contato','titulo','Qualificacao','proximaAcao','Confirmar veiculo, forma de pagamento e carro na troca','prazoDias',0,'limiteTentativas',3,'aoFazer','internet_agendar_visita','aoNaoFazer','internet_mensagem_2','aoAguardar','internet_mensagem_2'),
        jsonb_build_object('key','internet_mensagem_3','etapaId','contato','titulo','Mensagem 3','proximaAcao','Enviar mensagem 3 com pergunta objetiva para destravar resposta','prazoDias',1,'limiteTentativas',1,'aoFazer','internet_agendar_visita','aoNaoFazer','internet_retorno_7d','aoAguardar','internet_retorno_7d'),
        jsonb_build_object('key','internet_retorno_7d','etapaId','contato','titulo','Retorno em 7 dias','proximaAcao','Retomar contato em 7 dias','prazoDias',7,'limiteTentativas',1,'aoFazer','internet_agendar_visita','aoNaoFazer',null,'aoAguardar',null),
        jsonb_build_object('key','internet_agendar_visita','etapaId','agendamento','titulo','Agendar visita','proximaAcao','Agendar visita ou chamada com compromisso definido','prazoDias',0,'limiteTentativas',2,'aoFazer','internet_confirmar_visita','aoNaoFazer','internet_retorno_7d','aoAguardar','internet_retorno_7d'),
        jsonb_build_object('key','internet_confirmar_visita','etapaId','visita','titulo','Confirmar visita','proximaAcao','Confirmar presenca antes da visita','prazoDias',0,'limiteTentativas',2,'aoFazer','internet_negociar','aoNaoFazer','internet_retorno_7d','aoAguardar','internet_retorno_7d'),
        jsonb_build_object('key','internet_negociar','etapaId','negociacao','titulo','Negociacao','proximaAcao','Apresentar proposta e combinar proximo compromisso','prazoDias',0,'limiteTentativas',2,'aoFazer',null,'aoNaoFazer','internet_retorno_7d','aoAguardar','internet_retorno_7d')
      )
    ),
    (
      'carteira'::public.crm_canal,
      'Cadencia padrao Carteira',
      'agendamento',
      jsonb_build_array(
        jsonb_build_object('key','carteira_retorno_1','etapaId','agendamento','titulo','Retorno ativo','proximaAcao','Ligar para cliente da carteira e propor proximo compromisso','prazoDias',0,'limiteTentativas',1,'aoFazer','carteira_confirmar_visita','aoNaoFazer','carteira_retorno_2','aoAguardar','carteira_retorno_2'),
        jsonb_build_object('key','carteira_retorno_2','etapaId','agendamento','titulo','Segundo retorno','proximaAcao','Enviar mensagem de follow-up com oferta ou novidade relevante','prazoDias',2,'limiteTentativas',1,'aoFazer','carteira_confirmar_visita','aoNaoFazer','carteira_retorno_7d','aoAguardar','carteira_retorno_7d'),
        jsonb_build_object('key','carteira_retorno_7d','etapaId','agendamento','titulo','Retorno programado','proximaAcao','Retornar ao cliente da carteira em 7 dias','prazoDias',7,'limiteTentativas',1,'aoFazer','carteira_confirmar_visita','aoNaoFazer',null,'aoAguardar',null),
        jsonb_build_object('key','carteira_confirmar_visita','etapaId','visita','titulo','Confirmar visita','proximaAcao','Confirmar visita ou test drive com horario definido','prazoDias',0,'limiteTentativas',2,'aoFazer','carteira_negociar','aoNaoFazer','carteira_retorno_7d','aoAguardar','carteira_retorno_7d'),
        jsonb_build_object('key','carteira_negociar','etapaId','negociacao','titulo','Negociacao','proximaAcao','Apresentar proposta e proximo passo da negociacao','prazoDias',0,'limiteTentativas',2,'aoFazer',null,'aoNaoFazer','carteira_retorno_7d','aoAguardar','carteira_retorno_7d')
      )
    ),
    (
      'porta'::public.crm_canal,
      'Cadencia padrao Porta/Showroom',
      'atendimento',
      jsonb_build_array(
        jsonb_build_object('key','porta_pos_atendimento','etapaId','atendimento','titulo','Pos-atendimento','proximaAcao','Enviar mensagem de pos-atendimento e salvar interesse do cliente','prazoDias',0,'limiteTentativas',1,'aoFazer','porta_retorno_24h','aoNaoFazer','porta_retorno_24h','aoAguardar','porta_retorno_24h'),
        jsonb_build_object('key','porta_retorno_24h','etapaId','atendimento','titulo','Retorno 24h','proximaAcao','Retornar em ate 24h com opcoes e convite para negociacao','prazoDias',1,'limiteTentativas',1,'aoFazer','porta_negociar','aoNaoFazer','porta_retorno_7d','aoAguardar','porta_retorno_7d'),
        jsonb_build_object('key','porta_retorno_7d','etapaId','atendimento','titulo','Retorno em 7 dias','proximaAcao','Retomar contato em 7 dias com nova oferta ou condicao','prazoDias',7,'limiteTentativas',1,'aoFazer','porta_negociar','aoNaoFazer',null,'aoAguardar',null),
        jsonb_build_object('key','porta_negociar','etapaId','negociacao','titulo','Negociacao','proximaAcao','Apresentar proposta e combinar decisao com data definida','prazoDias',0,'limiteTentativas',2,'aoFazer',null,'aoNaoFazer','porta_retorno_7d','aoAguardar','porta_retorno_7d')
      )
    )
)
INSERT INTO public.cadencia_fluxos (loja_id, canal, etapa_inicial, nome, version, active, passos)
SELECT NULL, seed.canal, seed.etapa_inicial, seed.nome, 1, true, seed.passos
FROM seed
WHERE NOT EXISTS (
  SELECT 1
  FROM public.cadencia_fluxos existing
  WHERE existing.loja_id IS NULL
    AND existing.canal = seed.canal
    AND existing.version = 1
);

CREATE OR REPLACE FUNCTION public.inicializar_cadencia_cliente(p_cliente_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente public.clientes%ROWTYPE;
  v_canal public.crm_canal;
  v_fluxo public.cadencia_fluxos%ROWTYPE;
  v_passo jsonb;
  v_passo_key text;
  v_etapa text;
  v_proxima_acao text;
  v_prazo_dias integer;
  v_limite_tentativas integer;
  v_estado_id uuid;
BEGIN
  SELECT *
    INTO v_cliente
  FROM public.clientes
  WHERE id = p_cliente_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cliente nao encontrado para inicializar cadencia.';
  END IF;

  IF NOT (
    v_cliente.seller_user_id = auth.uid()
    OR public.is_manager_of(v_cliente.loja_id)
    OR public.is_owner_of(v_cliente.loja_id)
    OR public.user_has_role(ARRAY['admin_mx','master','consultant'])
  ) THEN
    RAISE EXCEPTION 'Sem permissao para inicializar cadencia deste cliente.';
  END IF;

  v_canal := CASE
    WHEN v_cliente.canal_origem = 'internet'::public.crm_canal THEN 'internet'::public.crm_canal
    WHEN v_cliente.canal_origem = 'carteira'::public.crm_canal THEN 'carteira'::public.crm_canal
    ELSE 'porta'::public.crm_canal
  END;

  SELECT *
    INTO v_fluxo
  FROM public.cadencia_fluxos
  WHERE active = true
    AND canal = v_canal
    AND (loja_id = v_cliente.loja_id OR loja_id IS NULL)
  ORDER BY (loja_id IS NOT NULL) DESC, version DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fluxo de cadencia ativo nao encontrado para canal %.', v_canal;
  END IF;

  v_passo := v_fluxo.passos->0;
  v_passo_key := v_passo->>'key';
  v_etapa := COALESCE(v_passo->>'etapaId', v_fluxo.etapa_inicial);
  v_proxima_acao := v_passo->>'proximaAcao';
  v_prazo_dias := COALESCE((v_passo->>'prazoDias')::integer, 0);
  v_limite_tentativas := GREATEST(COALESCE((v_passo->>'limiteTentativas')::integer, 1), 1);

  IF v_passo_key IS NULL OR v_proxima_acao IS NULL THEN
    RAISE EXCEPTION 'Fluxo de cadencia % esta sem passo inicial valido.', v_fluxo.id;
  END IF;

  INSERT INTO public.cadencia_estado_cliente (
    cliente_id,
    fluxo_id,
    loja_id,
    seller_user_id,
    fluxo_version,
    passo_atual_key,
    etapa_atual,
    proxima_acao,
    proxima_acao_em,
    tentativa_limite,
    status
  )
  VALUES (
    v_cliente.id,
    v_fluxo.id,
    v_cliente.loja_id,
    v_cliente.seller_user_id,
    v_fluxo.version,
    v_passo_key,
    v_etapa,
    v_proxima_acao,
    CURRENT_DATE + GREATEST(v_prazo_dias, 0),
    v_limite_tentativas,
    'ativo'
  )
  ON CONFLICT (cliente_id) DO UPDATE
    SET updated_at = cadencia_estado_cliente.updated_at
  RETURNING id INTO v_estado_id;

  UPDATE public.clientes
  SET
    proxima_acao = COALESCE(proxima_acao, v_proxima_acao),
    proxima_acao_em = COALESCE(proxima_acao_em, CURRENT_DATE + GREATEST(v_prazo_dias, 0))
  WHERE id = v_cliente.id;

  RETURN v_estado_id;
END;
$$;

COMMENT ON FUNCTION public.inicializar_cadencia_cliente(uuid) IS
  'Inicializa de forma idempotente a cadencia de um cliente e preserva a versao do fluxo aplicado.';

GRANT EXECUTE ON FUNCTION public.inicializar_cadencia_cliente(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.registrar_status_acao_cadencia(
  p_cliente_id uuid,
  p_status text,
  p_observacao text DEFAULT NULL
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
      'observacao', NULLIF(BTRIM(COALESCE(p_observacao, '')), '')
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

COMMENT ON FUNCTION public.registrar_status_acao_cadencia(uuid, text, text) IS
  'Registra Feito/Nao feito/Aguardando na cadencia, atualiza historico e recalcula a proxima acao.';

GRANT EXECUTE ON FUNCTION public.registrar_status_acao_cadencia(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.listar_acoes_cadencia_vendedor(
  p_data_inicio date DEFAULT NULL,
  p_data_fim date DEFAULT NULL
)
RETURNS TABLE (
  cadencia_estado_id uuid,
  cliente_id uuid,
  cliente_nome text,
  cliente_telefone text,
  loja_id uuid,
  seller_user_id uuid,
  canal public.crm_canal,
  passo_atual_key text,
  etapa_atual text,
  proxima_acao text,
  proxima_acao_em date,
  status text,
  last_result text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    estado.id AS cadencia_estado_id,
    cliente.id AS cliente_id,
    cliente.nome AS cliente_nome,
    cliente.telefone AS cliente_telefone,
    estado.loja_id,
    estado.seller_user_id,
    cliente.canal_origem AS canal,
    estado.passo_atual_key,
    estado.etapa_atual,
    estado.proxima_acao,
    estado.proxima_acao_em,
    estado.status,
    estado.last_result
  FROM public.cadencia_estado_cliente estado
  JOIN public.clientes cliente ON cliente.id = estado.cliente_id
  WHERE estado.status = 'ativo'
    AND (p_data_inicio IS NULL OR estado.proxima_acao_em >= p_data_inicio)
    AND (p_data_fim IS NULL OR estado.proxima_acao_em <= p_data_fim)
    AND (
      estado.seller_user_id = auth.uid()
      OR public.is_manager_of(estado.loja_id)
      OR public.is_owner_of(estado.loja_id)
      OR public.user_has_role(ARRAY['admin_mx','master','consultant'])
    )
  ORDER BY estado.proxima_acao_em ASC, cliente.nome ASC;
$$;

COMMENT ON FUNCTION public.listar_acoes_cadencia_vendedor(date, date) IS
  'Lista proximas acoes ativas de cadencia para consumo compartilhado pela Carteira e Central de Execucao.';

GRANT EXECUTE ON FUNCTION public.listar_acoes_cadencia_vendedor(date, date) TO authenticated;

ALTER TABLE public.cadencia_fluxos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadencia_estado_cliente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cadencia_fluxos_read ON public.cadencia_fluxos;
CREATE POLICY cadencia_fluxos_read ON public.cadencia_fluxos FOR SELECT TO authenticated
  USING (
    loja_id IS NULL
    OR public.is_member_of(loja_id)
    OR public.user_has_role(ARRAY['admin_mx','master','consultant'])
  );

DROP POLICY IF EXISTS cadencia_fluxos_write ON public.cadencia_fluxos;
CREATE POLICY cadencia_fluxos_write ON public.cadencia_fluxos FOR ALL TO authenticated
  USING (
    public.user_has_role(ARRAY['admin_mx','master','consultant'])
    OR (loja_id IS NOT NULL AND public.is_manager_of(loja_id))
  )
  WITH CHECK (
    public.user_has_role(ARRAY['admin_mx','master','consultant'])
    OR (loja_id IS NOT NULL AND public.is_manager_of(loja_id))
  );

DROP POLICY IF EXISTS cadencia_estado_seller_rw ON public.cadencia_estado_cliente;
CREATE POLICY cadencia_estado_seller_rw ON public.cadencia_estado_cliente FOR ALL TO authenticated
  USING (seller_user_id = auth.uid())
  WITH CHECK (seller_user_id = auth.uid());

DROP POLICY IF EXISTS cadencia_estado_store_read ON public.cadencia_estado_cliente;
CREATE POLICY cadencia_estado_store_read ON public.cadencia_estado_cliente FOR SELECT TO authenticated
  USING (
    public.is_manager_of(loja_id)
    OR public.is_owner_of(loja_id)
    OR public.user_has_role(ARRAY['admin_mx','master','consultant'])
  );

COMMIT;

-- ============================================================================
-- DOWN (rollback manual)
-- ============================================================================
-- BEGIN;
--   DROP POLICY IF EXISTS cadencia_estado_store_read ON public.cadencia_estado_cliente;
--   DROP POLICY IF EXISTS cadencia_estado_seller_rw ON public.cadencia_estado_cliente;
--   DROP POLICY IF EXISTS cadencia_fluxos_write ON public.cadencia_fluxos;
--   DROP POLICY IF EXISTS cadencia_fluxos_read ON public.cadencia_fluxos;
--   DROP FUNCTION IF EXISTS public.listar_acoes_cadencia_vendedor(date, date);
--   DROP FUNCTION IF EXISTS public.registrar_status_acao_cadencia(uuid, text, text);
--   DROP FUNCTION IF EXISTS public.inicializar_cadencia_cliente(uuid);
--   DROP TABLE IF EXISTS public.cadencia_estado_cliente;
--   DROP TABLE IF EXISTS public.cadencia_fluxos;
-- COMMIT;
