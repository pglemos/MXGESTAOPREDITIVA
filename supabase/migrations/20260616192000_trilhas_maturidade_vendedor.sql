-- ============================================================================
-- MX Vendedor - Trilhas automaticas por maturidade N1-N4
-- ============================================================================
-- PRD EV-5.3: vendedor entra automaticamente na trilha obrigatoria do nivel
-- derivado de tempo de mercado, experiencia declarada e cargo atual.

BEGIN;

ALTER TABLE public.trilhas_desenvolvimento
  DROP CONSTRAINT IF EXISTS trilhas_desenvolvimento_track_type_check;

ALTER TABLE public.trilhas_desenvolvimento
  ADD CONSTRAINT trilhas_desenvolvimento_track_type_check CHECK (track_type = ANY (ARRAY[
    'novo_colaborador',
    'reciclagem',
    'institucional',
    'maturidade_n1',
    'maturidade_n2',
    'maturidade_n3',
    'maturidade_n4'
  ]));

WITH tracks(track_type, name, description) AS (
  VALUES
    ('maturidade_n1', 'Trilha MX - N1 Iniciante', 'Conteudos obrigatorios para vendedor sem experiencia ou em entrada comercial.'),
    ('maturidade_n2', 'Trilha MX - N2 Intermediario', 'Conteudos obrigatorios para vendedor com base comercial em consolidacao.'),
    ('maturidade_n3', 'Trilha MX - N3 Performance', 'Conteudos obrigatorios para vendedor consistente que precisa elevar conversao e margem.'),
    ('maturidade_n4', 'Trilha MX - N4 Alta Performance', 'Conteudos obrigatorios para vendedor maduro focado em escala, recorrencia e influencia.')
)
INSERT INTO public.trilhas_desenvolvimento (store_id, name, description, track_type, active)
SELECT NULL, tracks.name, tracks.description, tracks.track_type, true
FROM tracks
WHERE NOT EXISTS (
  SELECT 1
  FROM public.trilhas_desenvolvimento existing
  WHERE existing.store_id IS NULL
    AND existing.track_type = tracks.track_type
);

WITH track_steps(track_type, step_key, title, description, theme, month_number, position, unlock_rule, manager_feedback_required) AS (
  VALUES
    ('maturidade_n1', 'n1_rotina', 'Rotina e disciplina comercial', 'Dominar preenchimento diario, agenda e follow-up basico.', 'rotina_diaria', 1, 1, 'immediate', false),
    ('maturidade_n1', 'n1_atendimento', 'Atendimento inicial', 'Aprender abordagem, perguntas e registro correto do cliente.', 'atendimento', 1, 2, 'previous_completed', true),
    ('maturidade_n1', 'n1_agendamento', 'Agendamento e confirmacao', 'Criar compromissos simples e reduzir no-show.', 'agendamento', 1, 3, 'previous_completed', true),
    ('maturidade_n2', 'n2_prospeccao', 'Prospecção estruturada', 'Organizar carteira, origem e primeira tentativa por canal.', 'prospeccao', 1, 1, 'immediate', false),
    ('maturidade_n2', 'n2_funil', 'Funil comercial por etapa', 'Entender gargalos e avancar clientes sem perder rastreabilidade.', 'funil', 1, 2, 'previous_completed', true),
    ('maturidade_n2', 'n2_crm', 'CRM e carteira ativa', 'Manter cliente aquecido e registrar a proxima acao.', 'crm', 1, 3, 'previous_completed', false),
    ('maturidade_n3', 'n3_financiamento', 'Financiamento e ficha', 'Qualificar entrada, pendencias e aprovacao sem travar o fechamento.', 'financiamento', 1, 1, 'immediate', false),
    ('maturidade_n3', 'n3_troca', 'Carro de troca e avaliacao', 'Conduzir coleta, expectativa e proposta com criterio.', 'carro_de_troca', 1, 2, 'previous_completed', true),
    ('maturidade_n3', 'n3_fechamento', 'Fechamento consultivo', 'Trabalhar objecoes, proposta e compromisso com foco em conversao.', 'fechamento', 1, 3, 'previous_completed', true),
    ('maturidade_n4', 'n4_performance', 'Alta performance comercial', 'Sustentar rotina, qualidade e consistencia em volume alto.', 'rotina_diaria', 1, 1, 'immediate', false),
    ('maturidade_n4', 'n4_influencia', 'Influência e liderança pelo exemplo', 'Apoiar o time, compartilhar pratica e elevar padrao comercial.', 'gestao', 1, 2, 'previous_completed', true),
    ('maturidade_n4', 'n4_recorrencia', 'Carteira, pós-venda e recorrência', 'Gerar indicacao, recompra e relacionamento de longo prazo.', 'crm', 1, 3, 'previous_completed', false)
)
INSERT INTO public.etapas_trilha_desenvolvimento (
  track_id,
  step_key,
  title,
  description,
  theme,
  month_number,
  position,
  unlock_rule,
  required,
  manager_feedback_required,
  training_id
)
SELECT
  track.id,
  track_steps.step_key,
  track_steps.title,
  track_steps.description,
  track_steps.theme,
  track_steps.month_number,
  track_steps.position,
  track_steps.unlock_rule,
  true,
  track_steps.manager_feedback_required,
  (
    SELECT training.id
    FROM public.treinamentos training
    WHERE training.type = track_steps.theme
      AND training.active = true
    ORDER BY training.created_at DESC
    LIMIT 1
  )
FROM track_steps
JOIN public.trilhas_desenvolvimento track
  ON track.store_id IS NULL
 AND track.track_type = track_steps.track_type
ON CONFLICT (track_id, step_key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  theme = EXCLUDED.theme,
  month_number = EXCLUDED.month_number,
  position = EXCLUDED.position,
  unlock_rule = EXCLUDED.unlock_rule,
  required = true,
  manager_feedback_required = EXCLUDED.manager_feedback_required,
  training_id = EXCLUDED.training_id,
  active = true,
  updated_at = now();

CREATE OR REPLACE FUNCTION public.resolve_vendedor_maturidade_track_type(
  p_tempo_mercado_anos numeric,
  p_experiencia public.vendedor_experiencia_declarada,
  p_cargo_atual text
) RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_tempo_score integer := 1;
  v_experiencia_score integer := 1;
  v_cargo_score integer := 1;
  v_score integer := 1;
BEGIN
  v_tempo_score := CASE
    WHEN coalesce(p_tempo_mercado_anos, 0) >= 5 THEN 4
    WHEN coalesce(p_tempo_mercado_anos, 0) >= 3 THEN 3
    WHEN coalesce(p_tempo_mercado_anos, 0) >= 1 THEN 2
    ELSE 1
  END;

  v_experiencia_score := CASE p_experiencia
    WHEN 'especialista' THEN 4
    WHEN 'experiente' THEN 3
    WHEN 'intermediario' THEN 2
    ELSE 1
  END;

  v_cargo_score := CASE
    WHEN coalesce(p_cargo_atual, '') ~* '(gerente|supervisor|coordenador|lider|líder)' THEN 3
    ELSE 1
  END;

  v_score := greatest(v_tempo_score, v_experiencia_score, v_cargo_score);

  RETURN CASE
    WHEN v_score >= 4 THEN 'maturidade_n4'
    WHEN v_score >= 3 THEN 'maturidade_n3'
    WHEN v_score >= 2 THEN 'maturidade_n2'
    ELSE 'maturidade_n1'
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.atribuir_trilha_maturidade_vendedor(
  p_seller_id uuid DEFAULT auth.uid()
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loja_id uuid;
  v_tempo_mercado_anos numeric;
  v_experiencia public.vendedor_experiencia_declarada;
  v_cargo_atual text;
  v_track_type text;
  v_track_id uuid;
  v_assignment_id uuid;
BEGIN
  IF p_seller_id IS NULL THEN
    RAISE EXCEPTION 'Vendedor nao informado.';
  END IF;

  SELECT perfil.loja_id, perfil.tempo_mercado_anos, perfil.experiencia_declarada, perfil.cargo_atual
  INTO v_loja_id, v_tempo_mercado_anos, v_experiencia, v_cargo_atual
  FROM public.vendedor_perfil perfil
  WHERE perfil.seller_user_id = p_seller_id;

  IF v_loja_id IS NULL THEN
    SELECT vinculo.store_id
    INTO v_loja_id
    FROM public.vinculos_loja vinculo
    WHERE vinculo.user_id = p_seller_id
      AND vinculo.is_active = true
      AND vinculo.role = 'vendedor'
    ORDER BY vinculo.created_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF v_loja_id IS NULL THEN
    RAISE EXCEPTION 'Loja nao encontrada para atribuir trilha.';
  END IF;

  IF NOT (
    p_seller_id = auth.uid()
    OR public.eh_area_interna_mx(auth.uid())
    OR public.is_manager_of(v_loja_id)
  ) THEN
    RAISE EXCEPTION 'Sem permissao para atribuir trilha de maturidade.' USING ERRCODE = '42501';
  END IF;

  v_track_type := public.resolve_vendedor_maturidade_track_type(v_tempo_mercado_anos, v_experiencia, v_cargo_atual);

  SELECT track.id
  INTO v_track_id
  FROM public.trilhas_desenvolvimento track
  WHERE track.store_id IS NULL
    AND track.track_type = v_track_type
    AND track.active = true
  ORDER BY track.created_at DESC
  LIMIT 1;

  IF v_track_id IS NULL THEN
    RAISE EXCEPTION 'Trilha de maturidade nao encontrada: %', v_track_type;
  END IF;

  UPDATE public.atribuicoes_trilha_desenvolvimento assignment
  SET status = 'cancelled', updated_at = now()
  WHERE assignment.seller_id = p_seller_id
    AND assignment.status = 'active'
    AND assignment.track_id <> v_track_id
    AND EXISTS (
      SELECT 1
      FROM public.trilhas_desenvolvimento old_track
      WHERE old_track.id = assignment.track_id
        AND old_track.track_type LIKE 'maturidade\_%' ESCAPE '\'
    );

  INSERT INTO public.atribuicoes_trilha_desenvolvimento (
    track_id,
    seller_id,
    store_id,
    assigned_by,
    status,
    current_month
  )
  VALUES (
    v_track_id,
    p_seller_id,
    v_loja_id,
    auth.uid(),
    'active',
    1
  )
  ON CONFLICT (track_id, seller_id) DO UPDATE SET
    store_id = EXCLUDED.store_id,
    assigned_by = EXCLUDED.assigned_by,
    status = 'active',
    updated_at = now()
  RETURNING id INTO v_assignment_id;

  PERFORM public.inicializar_progresso_trilha(v_assignment_id);

  RETURN v_assignment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_vendedor_maturidade_track_type(numeric, public.vendedor_experiencia_declarada, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.atribuir_trilha_maturidade_vendedor(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- DOWN (manual):
-- DROP FUNCTION IF EXISTS public.atribuir_trilha_maturidade_vendedor(uuid);
-- DROP FUNCTION IF EXISTS public.resolve_vendedor_maturidade_track_type(numeric, public.vendedor_experiencia_declarada, text);
-- DELETE FROM public.etapas_trilha_desenvolvimento
-- WHERE track_id IN (SELECT id FROM public.trilhas_desenvolvimento WHERE track_type LIKE 'maturidade\_%' ESCAPE '\');
-- DELETE FROM public.trilhas_desenvolvimento WHERE track_type LIKE 'maturidade\_%' ESCAPE '\';
