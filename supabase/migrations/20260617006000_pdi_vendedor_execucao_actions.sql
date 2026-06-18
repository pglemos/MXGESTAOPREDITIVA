-- Sprint auditoria vendedor 2026-06-17:
-- PDI do vendedor deixa de ser decorativo e passa a persistir acoes,
-- conclusoes/justificativas e envio para a Central de Execucao.

ALTER TABLE public.pdi_plano_acao
  ADD COLUMN IF NOT EXISTS justificativa text,
  ADD COLUMN IF NOT EXISTS central_enviada_at timestamptz;

CREATE TABLE IF NOT EXISTS public.execution_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type = ANY (ARRAY['pdi', 'feedback', 'funil', 'manual'])),
  source_id uuid,
  title text NOT NULL,
  description text,
  due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status = ANY (ARRAY['pendente', 'em_andamento', 'concluida', 'justificada', 'cancelada'])),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority = ANY (ARRAY['low', 'medium', 'high', 'urgent'])),
  alert_tone text NOT NULL DEFAULT 'warning' CHECK (alert_tone = ANY (ARRAY['info', 'warning', 'error'])),
  created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  completed_at timestamptz,
  completed_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  justificativa text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS execution_actions_seller_status_due_idx
  ON public.execution_actions (seller_id, status, due_at);

CREATE INDEX IF NOT EXISTS execution_actions_source_idx
  ON public.execution_actions (source_type, source_id)
  WHERE source_id IS NOT NULL;

ALTER TABLE public.execution_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS execution_actions_select_operacional ON public.execution_actions;
CREATE POLICY execution_actions_select_operacional ON public.execution_actions
FOR SELECT TO authenticated
USING (
  seller_id = auth.uid()
  OR public.is_admin()
  OR public.eh_area_interna_mx(auth.uid())
  OR (
    store_id IS NOT NULL
    AND (
      public.is_owner_of(store_id)
      OR public.is_manager_of(store_id)
    )
  )
);

DROP POLICY IF EXISTS execution_actions_insert_operacional ON public.execution_actions;
CREATE POLICY execution_actions_insert_operacional ON public.execution_actions
FOR INSERT TO authenticated
WITH CHECK (
  seller_id = auth.uid()
  OR public.is_admin()
  OR public.eh_area_interna_mx(auth.uid())
  OR (
    store_id IS NOT NULL
    AND (
      public.is_owner_of(store_id)
      OR public.is_manager_of(store_id)
    )
  )
);

DROP POLICY IF EXISTS execution_actions_update_operacional ON public.execution_actions;
CREATE POLICY execution_actions_update_operacional ON public.execution_actions
FOR UPDATE TO authenticated
USING (
  seller_id = auth.uid()
  OR public.is_admin()
  OR public.eh_area_interna_mx(auth.uid())
  OR (
    store_id IS NOT NULL
    AND (
      public.is_owner_of(store_id)
      OR public.is_manager_of(store_id)
    )
  )
)
WITH CHECK (
  seller_id = auth.uid()
  OR public.is_admin()
  OR public.eh_area_interna_mx(auth.uid())
  OR (
    store_id IS NOT NULL
    AND (
      public.is_owner_of(store_id)
      OR public.is_manager_of(store_id)
    )
  )
);

CREATE OR REPLACE FUNCTION public.vendedor_criar_pdi_acao(
  p_sessao_id uuid,
  p_competencia_id uuid,
  p_descricao_acao text,
  p_data_conclusao date,
  p_impacto text,
  p_custo text DEFAULT 'Vendedor',
  p_status text DEFAULT 'pendente'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sessao public.pdi_sessoes%ROWTYPE;
  v_acao_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sessao invalida.';
  END IF;

  SELECT * INTO v_sessao
  FROM public.pdi_sessoes
  WHERE id = p_sessao_id
    AND colaborador_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PDI nao encontrado para o vendedor autenticado.';
  END IF;

  IF trim(coalesce(p_descricao_acao, '')) = '' THEN
    RAISE EXCEPTION 'Descricao da acao e obrigatoria.';
  END IF;

  IF p_status NOT IN ('pendente', 'em_andamento', 'concluida', 'justificada') THEN
    RAISE EXCEPTION 'Status de acao PDI invalido.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.pdi_avaliacoes_competencia av
    WHERE av.sessao_id = p_sessao_id
      AND av.competencia_id = p_competencia_id
  ) THEN
    RAISE EXCEPTION 'Competencia nao pertence a sessao de PDI.';
  END IF;

  INSERT INTO public.pdi_plano_acao (
    sessao_id,
    competencia_id,
    descricao_acao,
    data_conclusao,
    impacto,
    custo,
    status
  )
  VALUES (
    p_sessao_id,
    p_competencia_id,
    trim(p_descricao_acao),
    p_data_conclusao,
    left(trim(coalesce(p_impacto, 'PDI')), 50),
    left(trim(coalesce(p_custo, 'Vendedor')), 50),
    p_status
  )
  RETURNING id INTO v_acao_id;

  RETURN v_acao_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.vendedor_atualizar_pdi_acao(
  p_acao_id uuid,
  p_descricao_acao text,
  p_data_conclusao date,
  p_impacto text,
  p_custo text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_acao_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sessao invalida.';
  END IF;

  UPDATE public.pdi_plano_acao pa
  SET
    descricao_acao = trim(p_descricao_acao),
    data_conclusao = p_data_conclusao,
    impacto = left(trim(coalesce(p_impacto, pa.impacto)), 50),
    custo = left(trim(coalesce(p_custo, pa.custo)), 50)
  FROM public.pdi_sessoes s
  WHERE pa.id = p_acao_id
    AND s.id = pa.sessao_id
    AND s.colaborador_id = auth.uid()
  RETURNING pa.id INTO v_acao_id;

  IF v_acao_id IS NULL THEN
    RAISE EXCEPTION 'Acao de PDI nao encontrada para o vendedor autenticado.';
  END IF;

  RETURN v_acao_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.vendedor_atualizar_pdi_acao_status(
  p_acao_id uuid,
  p_status text,
  p_justificativa text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_acao_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sessao invalida.';
  END IF;

  IF p_status NOT IN ('pendente', 'em_andamento', 'concluida', 'justificada') THEN
    RAISE EXCEPTION 'Status de acao PDI invalido.';
  END IF;

  UPDATE public.pdi_plano_acao pa
  SET
    status = p_status,
    justificativa = CASE
      WHEN p_status = 'justificada' THEN nullif(trim(coalesce(p_justificativa, '')), '')
      ELSE pa.justificativa
    END
  FROM public.pdi_sessoes s
  WHERE pa.id = p_acao_id
    AND s.id = pa.sessao_id
    AND s.colaborador_id = auth.uid()
  RETURNING pa.id INTO v_acao_id;

  IF v_acao_id IS NULL THEN
    RAISE EXCEPTION 'Acao de PDI nao encontrada para o vendedor autenticado.';
  END IF;

  RETURN v_acao_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.vendedor_atualizar_pdi_metas(
  p_sessao_id uuid,
  p_prazo text,
  p_metas jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meta jsonb;
  v_count integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sessao invalida.';
  END IF;

  IF p_prazo NOT IN ('6_meses', '12_meses', '24_meses') THEN
    RAISE EXCEPTION 'Prazo de meta invalido.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.pdi_sessoes s
    WHERE s.id = p_sessao_id
      AND s.colaborador_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'PDI nao encontrado para o vendedor autenticado.';
  END IF;

  DELETE FROM public.pdi_metas
  WHERE sessao_id = p_sessao_id
    AND prazo = p_prazo;

  FOR v_meta IN SELECT * FROM jsonb_array_elements(coalesce(p_metas, '[]'::jsonb))
  LOOP
    IF trim(coalesce(v_meta->>'descricao', '')) <> '' THEN
      INSERT INTO public.pdi_metas (sessao_id, prazo, tipo, descricao)
      VALUES (
        p_sessao_id,
        p_prazo,
        coalesce(nullif(v_meta->>'tipo', ''), 'profissional'),
        trim(v_meta->>'descricao')
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.vendedor_vincular_conteudo_pdi_acao(p_acao_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_acao record;
  v_recomendacao_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sessao invalida.';
  END IF;

  SELECT
    pa.id,
    pa.descricao_acao,
    s.colaborador_id,
    s.loja_id
  INTO v_acao
  FROM public.pdi_plano_acao pa
  JOIN public.pdi_sessoes s ON s.id = pa.sessao_id
  WHERE pa.id = p_acao_id
    AND s.colaborador_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Acao de PDI nao encontrada para o vendedor autenticado.';
  END IF;

  SELECT id INTO v_recomendacao_id
  FROM public.recomendacoes_desenvolvimento
  WHERE source_type = 'pdi'
    AND source_id = p_acao_id
    AND seller_id = auth.uid()
    AND status <> 'dismissed'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_recomendacao_id IS NULL THEN
    INSERT INTO public.recomendacoes_desenvolvimento (
      seller_id,
      store_id,
      source_type,
      source_id,
      theme,
      reason,
      priority,
      due_date,
      created_by
    )
    VALUES (
      v_acao.colaborador_id,
      v_acao.loja_id,
      'pdi',
      v_acao.id,
      public.mx_development_theme_from_text(v_acao.descricao_acao),
      concat('Conteudo vinculado a acao do PDI: ', v_acao.descricao_acao),
      'medium',
      current_date + 7,
      auth.uid()
    )
    RETURNING id INTO v_recomendacao_id;
  END IF;

  RETURN v_recomendacao_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.vendedor_enviar_pdi_acao_central(p_acao_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_acao record;
  v_execution_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sessao invalida.';
  END IF;

  SELECT
    pa.id,
    pa.descricao_acao,
    pa.data_conclusao,
    pa.impacto,
    s.colaborador_id,
    s.loja_id
  INTO v_acao
  FROM public.pdi_plano_acao pa
  JOIN public.pdi_sessoes s ON s.id = pa.sessao_id
  WHERE pa.id = p_acao_id
    AND s.colaborador_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Acao de PDI nao encontrada para o vendedor autenticado.';
  END IF;

  SELECT id INTO v_execution_id
  FROM public.execution_actions
  WHERE source_type = 'pdi'
    AND source_id = p_acao_id
    AND seller_id = auth.uid()
    AND status IN ('pendente', 'em_andamento')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_execution_id IS NULL THEN
    INSERT INTO public.execution_actions (
      store_id,
      seller_id,
      source_type,
      source_id,
      title,
      description,
      due_at,
      status,
      priority,
      alert_tone,
      created_by,
      metadata
    )
    VALUES (
      v_acao.loja_id,
      v_acao.colaborador_id,
      'pdi',
      v_acao.id,
      v_acao.descricao_acao,
      concat('PDI: ', coalesce(v_acao.impacto, 'Plano de desenvolvimento')),
      (v_acao.data_conclusao::timestamp AT TIME ZONE 'America/Sao_Paulo'),
      'pendente',
      'medium',
      'warning',
      auth.uid(),
      jsonb_build_object('pdi_acao_id', v_acao.id)
    )
    RETURNING id INTO v_execution_id;
  END IF;

  UPDATE public.pdi_plano_acao
  SET central_enviada_at = now()
  WHERE id = p_acao_id;

  RETURN v_execution_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.vendedor_concluir_execution_action(p_action_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sessao invalida.';
  END IF;

  UPDATE public.execution_actions
  SET
    status = 'concluida',
    completed_at = now(),
    completed_by = auth.uid(),
    updated_at = now()
  WHERE id = p_action_id
    AND seller_id = auth.uid()
  RETURNING id INTO v_action_id;

  IF v_action_id IS NULL THEN
    RAISE EXCEPTION 'Acao da Central nao encontrada para o vendedor autenticado.';
  END IF;

  RETURN v_action_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.vendedor_criar_pdi_acao(uuid, uuid, text, date, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vendedor_atualizar_pdi_acao(uuid, text, date, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vendedor_atualizar_pdi_acao_status(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vendedor_atualizar_pdi_metas(uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vendedor_vincular_conteudo_pdi_acao(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vendedor_enviar_pdi_acao_central(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vendedor_concluir_execution_action(uuid) TO authenticated;

COMMENT ON TABLE public.execution_actions IS
  'Acoes rastreaveis da Central de Execucao geradas por PDI, funil, feedback ou entradas manuais.';

COMMENT ON COLUMN public.pdi_plano_acao.justificativa IS
  'Justificativa operacional do vendedor para atraso ou impedimento de uma acao do PDI.';

COMMENT ON COLUMN public.pdi_plano_acao.central_enviada_at IS
  'Momento em que a acao do PDI foi enviada para execution_actions da Central de Execucao.';
