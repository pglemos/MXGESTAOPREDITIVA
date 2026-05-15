-- ============================================================
-- MX development full completion
-- ============================================================
-- Adds persistent library ratings, suggestions, curation, onboarding
-- tracks, feedback/PDI recommendations and the complete 45-indicator
-- planning catalog requested after the Daniel/Jose scope review.

BEGIN;

ALTER TABLE public.treinamentos
  ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS source_kind text NOT NULL DEFAULT 'mx_interno',
  ADD COLUMN IF NOT EXISTS editorial_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS review_after date,
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS xp_reward integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS curator_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS curation_notes text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.progresso_treinamentos
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'concluido',
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS progress_percent integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS source_context text;

ALTER TABLE public.treinamentos DROP CONSTRAINT IF EXISTS trainings_type_check;
ALTER TABLE public.treinamentos DROP CONSTRAINT IF EXISTS treinamentos_type_check;
ALTER TABLE public.treinamentos DROP CONSTRAINT IF EXISTS trainings_target_audience_check;
ALTER TABLE public.treinamentos DROP CONSTRAINT IF EXISTS treinamentos_target_audience_check;
ALTER TABLE public.treinamentos DROP CONSTRAINT IF EXISTS treinamentos_source_kind_check;
ALTER TABLE public.treinamentos DROP CONSTRAINT IF EXISTS treinamentos_editorial_status_check;
ALTER TABLE public.treinamentos DROP CONSTRAINT IF EXISTS treinamentos_duration_check;
ALTER TABLE public.treinamentos DROP CONSTRAINT IF EXISTS treinamentos_xp_check;

ALTER TABLE public.treinamentos
  ADD CONSTRAINT treinamentos_type_check CHECK (type = ANY (ARRAY[
    'prospeccao', 'agendamento', 'atendimento', 'apresentacao',
    'financiamento', 'carro_de_troca', 'fechamento', 'funil',
    'rotina_diaria', 'crm', 'institucional', 'gestao', 'pre-vendas'
  ])),
  ADD CONSTRAINT treinamentos_target_audience_check CHECK (target_audience = ANY (ARRAY['vendedor', 'gerente', 'dono', 'todos'])),
  ADD CONSTRAINT treinamentos_source_kind_check CHECK (source_kind = ANY (ARRAY['mx_interno', 'especialista_convidado', 'fornecedor', 'loja_institucional'])),
  ADD CONSTRAINT treinamentos_editorial_status_check CHECK (editorial_status = ANY (ARRAY['draft', 'active', 'paused', 'review', 'retired'])),
  ADD CONSTRAINT treinamentos_duration_check CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  ADD CONSTRAINT treinamentos_xp_check CHECK (xp_reward >= 0 AND xp_reward <= 10000);

CREATE TABLE IF NOT EXISTS public.treinamento_avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(training_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.sugestoes_conteudo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE,
  theme text NOT NULL,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority = ANY (ARRAY['low', 'medium', 'high'])),
  status text NOT NULL DEFAULT 'received' CHECK (status = ANY (ARRAY['received', 'planned', 'recording', 'published', 'rejected'])),
  linked_training_id uuid REFERENCES public.treinamentos(id) ON DELETE SET NULL,
  curator_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  curator_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trilhas_desenvolvimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  track_type text NOT NULL DEFAULT 'novo_colaborador' CHECK (track_type = ANY (ARRAY['novo_colaborador', 'reciclagem', 'institucional'])),
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, name, track_type)
);

CREATE TABLE IF NOT EXISTS public.etapas_trilha_desenvolvimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.trilhas_desenvolvimento(id) ON DELETE CASCADE,
  training_id uuid REFERENCES public.treinamentos(id) ON DELETE SET NULL,
  step_key text NOT NULL,
  title text NOT NULL,
  description text,
  theme text NOT NULL,
  month_number integer NOT NULL DEFAULT 1 CHECK (month_number BETWEEN 1 AND 24),
  position integer NOT NULL DEFAULT 1,
  unlock_rule text NOT NULL DEFAULT 'previous_completed' CHECK (unlock_rule = ANY (ARRAY['immediate', 'previous_completed', 'manager_release', 'month_reached'])),
  required boolean NOT NULL DEFAULT true,
  manager_feedback_required boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(track_id, step_key)
);

CREATE TABLE IF NOT EXISTS public.atribuicoes_trilha_desenvolvimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.trilhas_desenvolvimento(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status = ANY (ARRAY['active', 'completed', 'paused', 'cancelled'])),
  current_month integer NOT NULL DEFAULT 1 CHECK (current_month BETWEEN 1 AND 24),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  release_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(track_id, seller_id)
);

CREATE TABLE IF NOT EXISTS public.progresso_etapa_trilha (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.atribuicoes_trilha_desenvolvimento(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES public.etapas_trilha_desenvolvimento(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'locked' CHECK (status = ANY (ARRAY['locked', 'available', 'in_progress', 'completed', 'released'])),
  started_at timestamptz,
  completed_at timestamptz,
  released_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  manager_feedback text,
  evidence_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, step_id)
);

CREATE TABLE IF NOT EXISTS public.recomendacoes_desenvolvimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type = ANY (ARRAY['feedback', 'pdi', 'manual', 'rotina'])),
  source_id uuid,
  theme text NOT NULL,
  training_id uuid REFERENCES public.treinamentos(id) ON DELETE SET NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'recommended' CHECK (status = ANY (ARRAY['recommended', 'assigned', 'in_progress', 'completed', 'dismissed'])),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority = ANY (ARRAY['low', 'medium', 'high'])),
  due_date date,
  created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS treinamento_avaliacoes_training_idx ON public.treinamento_avaliacoes(training_id);
CREATE INDEX IF NOT EXISTS sugestoes_conteudo_store_status_idx ON public.sugestoes_conteudo(store_id, status);
CREATE INDEX IF NOT EXISTS trilhas_desenvolvimento_store_type_idx ON public.trilhas_desenvolvimento(store_id, track_type);
CREATE INDEX IF NOT EXISTS atribuicoes_trilha_seller_status_idx ON public.atribuicoes_trilha_desenvolvimento(seller_id, status);
CREATE INDEX IF NOT EXISTS progresso_etapa_assignment_idx ON public.progresso_etapa_trilha(assignment_id);
CREATE INDEX IF NOT EXISTS recomendacoes_desenvolvimento_seller_status_idx ON public.recomendacoes_desenvolvimento(seller_id, status);
CREATE INDEX IF NOT EXISTS recomendacoes_desenvolvimento_source_idx ON public.recomendacoes_desenvolvimento(source_type, source_id);

ALTER TABLE public.treinamento_avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sugestoes_conteudo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trilhas_desenvolvimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etapas_trilha_desenvolvimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atribuicoes_trilha_desenvolvimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progresso_etapa_trilha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recomendacoes_desenvolvimento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS treinamento_avaliacoes_select ON public.treinamento_avaliacoes;
CREATE POLICY treinamento_avaliacoes_select ON public.treinamento_avaliacoes FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.eh_area_interna_mx(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.vinculos_loja meu
    JOIN public.vinculos_loja alvo ON alvo.store_id = meu.store_id
    WHERE meu.user_id = auth.uid()
      AND meu.role IN ('dono', 'gerente')
      AND alvo.user_id = treinamento_avaliacoes.user_id
  )
);

DROP POLICY IF EXISTS treinamento_avaliacoes_upsert_self ON public.treinamento_avaliacoes;
CREATE POLICY treinamento_avaliacoes_upsert_self ON public.treinamento_avaliacoes FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.eh_area_interna_mx(auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.eh_area_interna_mx(auth.uid()));

DROP POLICY IF EXISTS sugestoes_conteudo_select ON public.sugestoes_conteudo;
CREATE POLICY sugestoes_conteudo_select ON public.sugestoes_conteudo FOR SELECT TO authenticated
USING (
  requester_id = auth.uid()
  OR public.eh_area_interna_mx(auth.uid())
  OR (store_id IS NOT NULL AND (public.is_manager_of(store_id) OR public.is_owner_of(store_id)))
);

DROP POLICY IF EXISTS sugestoes_conteudo_insert ON public.sugestoes_conteudo;
CREATE POLICY sugestoes_conteudo_insert ON public.sugestoes_conteudo FOR INSERT TO authenticated
WITH CHECK (
  requester_id = auth.uid()
  AND (store_id IS NULL OR public.tem_papel_loja(store_id, ARRAY['dono','gerente','vendedor'], auth.uid()) OR public.eh_area_interna_mx(auth.uid()))
);

DROP POLICY IF EXISTS sugestoes_conteudo_update_internal ON public.sugestoes_conteudo;
CREATE POLICY sugestoes_conteudo_update_internal ON public.sugestoes_conteudo FOR UPDATE TO authenticated
USING (public.eh_area_interna_mx(auth.uid()) OR (store_id IS NOT NULL AND public.is_manager_of(store_id)))
WITH CHECK (public.eh_area_interna_mx(auth.uid()) OR (store_id IS NOT NULL AND public.is_manager_of(store_id)));

DROP POLICY IF EXISTS trilhas_desenvolvimento_select ON public.trilhas_desenvolvimento;
CREATE POLICY trilhas_desenvolvimento_select ON public.trilhas_desenvolvimento FOR SELECT TO authenticated
USING (store_id IS NULL OR public.eh_area_interna_mx(auth.uid()) OR public.tem_papel_loja(store_id, ARRAY['dono','gerente','vendedor'], auth.uid()));

DROP POLICY IF EXISTS trilhas_desenvolvimento_write ON public.trilhas_desenvolvimento;
CREATE POLICY trilhas_desenvolvimento_write ON public.trilhas_desenvolvimento FOR ALL TO authenticated
USING (public.eh_area_interna_mx(auth.uid()) OR (store_id IS NOT NULL AND public.is_manager_of(store_id)))
WITH CHECK (public.eh_area_interna_mx(auth.uid()) OR (store_id IS NOT NULL AND public.is_manager_of(store_id)));

DROP POLICY IF EXISTS etapas_trilha_select ON public.etapas_trilha_desenvolvimento;
CREATE POLICY etapas_trilha_select ON public.etapas_trilha_desenvolvimento FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trilhas_desenvolvimento t
    WHERE t.id = etapas_trilha_desenvolvimento.track_id
      AND (t.store_id IS NULL OR public.eh_area_interna_mx(auth.uid()) OR public.tem_papel_loja(t.store_id, ARRAY['dono','gerente','vendedor'], auth.uid()))
  )
);

DROP POLICY IF EXISTS etapas_trilha_write ON public.etapas_trilha_desenvolvimento;
CREATE POLICY etapas_trilha_write ON public.etapas_trilha_desenvolvimento FOR ALL TO authenticated
USING (
  public.eh_area_interna_mx(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.trilhas_desenvolvimento t
    WHERE t.id = etapas_trilha_desenvolvimento.track_id
      AND t.store_id IS NOT NULL
      AND public.is_manager_of(t.store_id)
  )
)
WITH CHECK (
  public.eh_area_interna_mx(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.trilhas_desenvolvimento t
    WHERE t.id = etapas_trilha_desenvolvimento.track_id
      AND t.store_id IS NOT NULL
      AND public.is_manager_of(t.store_id)
  )
);

DROP POLICY IF EXISTS atribuicoes_trilha_select ON public.atribuicoes_trilha_desenvolvimento;
CREATE POLICY atribuicoes_trilha_select ON public.atribuicoes_trilha_desenvolvimento FOR SELECT TO authenticated
USING (
  seller_id = auth.uid()
  OR public.eh_area_interna_mx(auth.uid())
  OR public.is_owner_of(store_id)
  OR public.is_manager_of(store_id)
);

DROP POLICY IF EXISTS atribuicoes_trilha_write ON public.atribuicoes_trilha_desenvolvimento;
CREATE POLICY atribuicoes_trilha_write ON public.atribuicoes_trilha_desenvolvimento FOR ALL TO authenticated
USING (public.eh_area_interna_mx(auth.uid()) OR public.is_manager_of(store_id))
WITH CHECK (public.eh_area_interna_mx(auth.uid()) OR public.is_manager_of(store_id));

DROP POLICY IF EXISTS progresso_etapa_select ON public.progresso_etapa_trilha;
CREATE POLICY progresso_etapa_select ON public.progresso_etapa_trilha FOR SELECT TO authenticated
USING (
  seller_id = auth.uid()
  OR public.eh_area_interna_mx(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.atribuicoes_trilha_desenvolvimento a
    WHERE a.id = progresso_etapa_trilha.assignment_id
      AND (public.is_owner_of(a.store_id) OR public.is_manager_of(a.store_id))
  )
);

DROP POLICY IF EXISTS progresso_etapa_update ON public.progresso_etapa_trilha;
CREATE POLICY progresso_etapa_update ON public.progresso_etapa_trilha FOR ALL TO authenticated
USING (
  seller_id = auth.uid()
  OR public.eh_area_interna_mx(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.atribuicoes_trilha_desenvolvimento a
    WHERE a.id = progresso_etapa_trilha.assignment_id
      AND public.is_manager_of(a.store_id)
  )
)
WITH CHECK (
  seller_id = auth.uid()
  OR public.eh_area_interna_mx(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.atribuicoes_trilha_desenvolvimento a
    WHERE a.id = progresso_etapa_trilha.assignment_id
      AND public.is_manager_of(a.store_id)
  )
);

DROP POLICY IF EXISTS recomendacoes_desenvolvimento_select ON public.recomendacoes_desenvolvimento;
CREATE POLICY recomendacoes_desenvolvimento_select ON public.recomendacoes_desenvolvimento FOR SELECT TO authenticated
USING (
  seller_id = auth.uid()
  OR public.eh_area_interna_mx(auth.uid())
  OR (store_id IS NOT NULL AND (public.is_owner_of(store_id) OR public.is_manager_of(store_id)))
);

DROP POLICY IF EXISTS recomendacoes_desenvolvimento_write ON public.recomendacoes_desenvolvimento;
CREATE POLICY recomendacoes_desenvolvimento_write ON public.recomendacoes_desenvolvimento FOR ALL TO authenticated
USING (
  public.eh_area_interna_mx(auth.uid())
  OR (store_id IS NOT NULL AND public.is_manager_of(store_id))
)
WITH CHECK (
  public.eh_area_interna_mx(auth.uid())
  OR (store_id IS NOT NULL AND public.is_manager_of(store_id))
);

CREATE OR REPLACE FUNCTION public.mx_development_theme_from_text(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN lower(coalesce(p_text, '')) ~ '(lead|prospec|carteira|ativo)' THEN 'prospeccao'
    WHEN lower(coalesce(p_text, '')) ~ '(agenda|agd|confirm)' THEN 'agendamento'
    WHEN lower(coalesce(p_text, '')) ~ '(visita|atendimento|abordagem)' THEN 'atendimento'
    WHEN lower(coalesce(p_text, '')) ~ '(apresent|demonstr|produto|carro)' THEN 'apresentacao'
    WHEN lower(coalesce(p_text, '')) ~ '(financ|credito|ficha)' THEN 'financiamento'
    WHEN lower(coalesce(p_text, '')) ~ '(troca|avaliacao|usado)' THEN 'carro_de_troca'
    WHEN lower(coalesce(p_text, '')) ~ '(fech|negocia|proposta|venda)' THEN 'fechamento'
    WHEN lower(coalesce(p_text, '')) ~ '(crm|follow|retorno)' THEN 'crm'
    WHEN lower(coalesce(p_text, '')) ~ '(rotina|diaria|puxada|disciplina)' THEN 'rotina_diaria'
    ELSE 'funil'
  END
$$;

CREATE OR REPLACE FUNCTION public.mx_first_active_training_for_theme(p_theme text, p_store_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id
  FROM public.treinamentos t
  WHERE t.active = true
    AND t.editorial_status = 'active'
    AND t.type = p_theme
    AND (t.store_id IS NULL OR t.store_id = p_store_id)
  ORDER BY CASE WHEN t.store_id = p_store_id THEN 0 ELSE 1 END, t.created_at DESC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.gerar_recomendacoes_desenvolvimento_feedback(p_feedback_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_feedback record;
  v_theme text;
  v_training uuid;
BEGIN
  SELECT * INTO v_feedback FROM public.devolutivas WHERE id = p_feedback_id;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  v_theme := public.mx_development_theme_from_text(
    concat_ws(' ', v_feedback.attention_points, v_feedback.action, v_feedback.diagnostic_json::text)
  );
  v_training := public.mx_first_active_training_for_theme(v_theme, v_feedback.store_id);

  INSERT INTO public.recomendacoes_desenvolvimento (
    seller_id, store_id, source_type, source_id, theme, training_id, reason, priority, due_date, created_by
  )
  VALUES (
    v_feedback.seller_id,
    v_feedback.store_id,
    'feedback',
    v_feedback.id,
    v_theme,
    v_training,
    concat('Recomendacao criada a partir da devolutiva semanal: ', left(coalesce(v_feedback.attention_points, v_feedback.action), 220)),
    CASE WHEN v_feedback.vnd_week = 0 THEN 'high' ELSE 'medium' END,
    (current_date + interval '7 days')::date,
    v_feedback.manager_id
  );

  RETURN 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.gerar_recomendacoes_desenvolvimento_pdi(p_sessao_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sessao record;
  v_gap record;
  v_theme text;
  v_training uuid;
  v_count integer := 0;
BEGIN
  SELECT * INTO v_sessao FROM public.pdi_sessoes WHERE id = p_sessao_id;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  FOR v_gap IN
    SELECT av.*, c.nome, c.indicador
    FROM public.pdi_avaliacoes_competencia av
    JOIN public.pdi_competencias c ON c.id = av.competencia_id
    WHERE av.sessao_id = p_sessao_id
    ORDER BY (av.alvo - av.nota_atribuida) DESC
    LIMIT 5
  LOOP
    v_theme := public.mx_development_theme_from_text(concat_ws(' ', v_gap.nome, v_gap.indicador));
    v_training := public.mx_first_active_training_for_theme(v_theme, v_sessao.loja_id);

    INSERT INTO public.recomendacoes_desenvolvimento (
      seller_id, store_id, source_type, source_id, theme, training_id, reason, priority, due_date, created_by
    )
    VALUES (
      v_sessao.colaborador_id,
      v_sessao.loja_id,
      'pdi',
      p_sessao_id,
      v_theme,
      v_training,
      concat('Lacuna PDI em ', v_gap.nome, ': nota ', v_gap.nota_atribuida, ' de alvo ', v_gap.alvo, '.'),
      CASE WHEN (v_gap.alvo - v_gap.nota_atribuida) >= 3 THEN 'high' ELSE 'medium' END,
      coalesce(v_sessao.proxima_revisao_data::date, (current_date + interval '30 days')::date),
      v_sessao.gerente_id
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.inicializar_progresso_trilha(p_assignment_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment record;
  v_step record;
  v_count integer := 0;
BEGIN
  SELECT * INTO v_assignment FROM public.atribuicoes_trilha_desenvolvimento WHERE id = p_assignment_id;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  FOR v_step IN
    SELECT *
    FROM public.etapas_trilha_desenvolvimento
    WHERE track_id = v_assignment.track_id
      AND active = true
    ORDER BY month_number, position
  LOOP
    INSERT INTO public.progresso_etapa_trilha (assignment_id, step_id, seller_id, status)
    VALUES (
      p_assignment_id,
      v_step.id,
      v_assignment.seller_id,
      CASE WHEN v_step.unlock_rule = 'immediate' OR (v_step.month_number = 1 AND v_step.position = 1) THEN 'available' ELSE 'locked' END
    )
    ON CONFLICT (assignment_id, step_id) DO NOTHING;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.concluir_etapa_trilha(p_progress_id uuid, p_feedback text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress record;
  v_assignment record;
  v_remaining integer;
BEGIN
  SELECT * INTO v_progress FROM public.progresso_etapa_trilha WHERE id = p_progress_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Etapa da trilha nao encontrada';
  END IF;

  SELECT * INTO v_assignment FROM public.atribuicoes_trilha_desenvolvimento WHERE id = v_progress.assignment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Atribuicao da trilha nao encontrada';
  END IF;

  IF v_progress.seller_id <> auth.uid() AND NOT public.eh_area_interna_mx(auth.uid()) AND NOT public.is_manager_of(v_assignment.store_id) THEN
    RAISE EXCEPTION 'Sem permissao para concluir esta etapa';
  END IF;

  UPDATE public.progresso_etapa_trilha
  SET status = 'completed',
      started_at = coalesce(started_at, now()),
      completed_at = now(),
      manager_feedback = coalesce(p_feedback, manager_feedback),
      updated_at = now()
  WHERE id = p_progress_id;

  UPDATE public.progresso_etapa_trilha next_step
  SET status = 'available', updated_at = now()
  FROM public.etapas_trilha_desenvolvimento current_step,
       public.etapas_trilha_desenvolvimento next_def
  WHERE current_step.id = v_progress.step_id
    AND next_def.id = next_step.step_id
    AND next_step.assignment_id = v_progress.assignment_id
    AND next_step.status = 'locked'
    AND next_def.month_number <= greatest(v_assignment.current_month, current_step.month_number)
    AND (
      next_def.unlock_rule = 'previous_completed'
      OR next_def.unlock_rule = 'immediate'
      OR next_def.unlock_rule = 'month_reached'
    )
    AND (
      next_def.month_number > current_step.month_number
      OR (next_def.month_number = current_step.month_number AND next_def.position > current_step.position)
    );

  SELECT count(*) INTO v_remaining
  FROM public.progresso_etapa_trilha p
  JOIN public.etapas_trilha_desenvolvimento e ON e.id = p.step_id
  WHERE p.assignment_id = v_progress.assignment_id
    AND e.required = true
    AND p.status <> 'completed';

  IF v_remaining = 0 THEN
    UPDATE public.atribuicoes_trilha_desenvolvimento
    SET status = 'completed', completed_at = now(), updated_at = now()
    WHERE id = v_progress.assignment_id;

    INSERT INTO public.notificacoes (recipient_id, sender_id, store_id, title, message, target_type, type, priority, link, read)
    VALUES (
      v_assignment.assigned_by,
      v_assignment.seller_id,
      v_assignment.store_id,
      'Trilha de entrada concluida',
      'O novo colaborador concluiu a trilha inicial. Chame para feedback, conte a historia da empresa e valide liberacao para venda.',
      'all',
      'training',
      'high',
      '/gerente/treinamentos',
      false
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object('completed', true, 'remaining_required_steps', v_remaining);
END;
$$;

INSERT INTO public.treinamentos (title, description, type, video_url, target_audience, active, source_kind, editorial_status, duration_minutes, xp_reward, curation_notes)
VALUES
  ('Prospecao ativa e carteira quente', 'Como organizar contatos, abrir conversa e transformar carteira parada em agenda.', 'prospeccao', 'https://mxgestaopreditiva.com.br/academy/prospeccao-ativa', 'vendedor', true, 'mx_interno', 'active', 18, 120, 'Conteudo base da biblioteca MX.'),
  ('Agendamento de visita com confirmacao', 'Script simples para vender o compromisso e reduzir furos de agenda.', 'agendamento', 'https://mxgestaopreditiva.com.br/academy/agendamento-confirmacao', 'vendedor', true, 'mx_interno', 'active', 14, 100, 'Conteudo base da biblioteca MX.'),
  ('Atendimento de loja e abordagem consultiva', 'Sequencia de abertura para receber cliente sem perder controle da venda.', 'atendimento', 'https://mxgestaopreditiva.com.br/academy/atendimento-consultivo', 'vendedor', true, 'mx_interno', 'active', 16, 100, 'Conteudo base da biblioteca MX.'),
  ('Apresentacao do carro por valor percebido', 'Como demonstrar carro, beneficio e condicao sem virar leitor de ficha tecnica.', 'apresentacao', 'https://mxgestaopreditiva.com.br/academy/apresentacao-carro', 'vendedor', true, 'mx_interno', 'active', 20, 120, 'Conteudo base da biblioteca MX.'),
  ('Financiamento: ficha, entrada e aprovacao', 'Fundamentos para preparar cliente e reduzir perda por credito.', 'financiamento', 'https://mxgestaopreditiva.com.br/academy/financiamento-basico', 'vendedor', true, 'fornecedor', 'active', 22, 120, 'Conteudo base com potencial fornecedor convidado.'),
  ('Avaliacao de carro de troca', 'Perguntas, documentos e criterios para qualificar troca antes da proposta.', 'carro_de_troca', 'https://mxgestaopreditiva.com.br/academy/carro-de-troca', 'vendedor', true, 'especialista_convidado', 'active', 21, 120, 'Conteudo base com especialista convidado.'),
  ('Fechamento e contorno de objecoes', 'Como conduzir proposta, urgencia e compromisso sem improviso.', 'fechamento', 'https://mxgestaopreditiva.com.br/academy/fechamento', 'vendedor', true, 'mx_interno', 'active', 19, 120, 'Conteudo base da biblioteca MX.'),
  ('Funil comercial e conversoes', 'Leitura dos indicadores lead, agenda, visita e venda para decidir a rotina.', 'funil', 'https://mxgestaopreditiva.com.br/academy/funil-conversoes', 'todos', true, 'mx_interno', 'active', 17, 100, 'Conteudo base da biblioteca MX.'),
  ('Puxada diaria e rotina do vendedor', 'Como preencher, interpretar e usar a rotina diaria para vender mais.', 'rotina_diaria', 'https://mxgestaopreditiva.com.br/academy/rotina-diaria', 'vendedor', true, 'mx_interno', 'active', 15, 100, 'Conteudo base da biblioteca MX.'),
  ('CRM, follow-up e aquecimento de cliente', 'Sequencia de retorno para nao deixar cliente esfriar.', 'crm', 'https://mxgestaopreditiva.com.br/academy/crm-follow-up', 'vendedor', true, 'mx_interno', 'active', 18, 100, 'Conteudo base da biblioteca MX.'),
  ('Historia, valores e cultura da loja', 'Modulo institucional editavel para entrada de novos colaboradores.', 'institucional', 'https://mxgestaopreditiva.com.br/academy/institucional-loja', 'todos', true, 'loja_institucional', 'active', 12, 80, 'Template institucional para personalizacao por loja.')
ON CONFLICT DO NOTHING;

INSERT INTO public.trilhas_desenvolvimento (store_id, name, description, track_type, active)
VALUES (
  NULL,
  'Trilha MX - Novo Colaborador',
  'Trilha obrigatoria de entrada para novo vendedor antes da liberacao operacional.',
  'novo_colaborador',
  true
)
ON CONFLICT (store_id, name, track_type) DO NOTHING;

WITH base_track AS (
  SELECT id FROM public.trilhas_desenvolvimento
  WHERE store_id IS NULL AND name = 'Trilha MX - Novo Colaborador' AND track_type = 'novo_colaborador'
  LIMIT 1
)
INSERT INTO public.etapas_trilha_desenvolvimento (track_id, step_key, title, description, theme, month_number, position, unlock_rule, required, manager_feedback_required, training_id)
SELECT base_track.id, step_key, title, description, theme, month_number, position, unlock_rule, required, manager_feedback_required,
       (SELECT id FROM public.treinamentos t WHERE t.type = theme AND t.active = true ORDER BY t.created_at DESC LIMIT 1)
FROM base_track,
(VALUES
  ('m1_institucional', 'Historia, valores e cultura da loja', 'Conhecer empresa, cultura, postura e combinados de entrada.', 'institucional', 1, 1, 'immediate', true, false),
  ('m1_rotina', 'Rotina diaria e puxada MX', 'Aprender preenchimento diario, disciplina e leitura de funil.', 'rotina_diaria', 1, 2, 'previous_completed', true, false),
  ('m1_atendimento', 'Atendimento inicial e abordagem', 'Treinar abertura da venda e abordagem consultiva.', 'atendimento', 1, 3, 'previous_completed', true, true),
  ('m2_funil', 'Funil comercial da loja', 'Entender conversoes e gargalos individuais.', 'funil', 2, 1, 'month_reached', true, false),
  ('m2_agendamento', 'Agendamento e confirmacao de visita', 'Executar script de agenda e reduzir no-show.', 'agendamento', 2, 2, 'previous_completed', true, true),
  ('m3_apresentacao', 'Apresentacao do carro', 'Conduzir demonstracao com valor percebido.', 'apresentacao', 3, 1, 'month_reached', true, true),
  ('m3_financiamento', 'Fundamentos de financiamento', 'Preparar ficha, entrada e documentacao.', 'financiamento', 3, 2, 'previous_completed', true, false),
  ('m4_troca', 'Carro de troca e avaliacao', 'Coletar informacoes e qualificar troca com criterio.', 'carro_de_troca', 4, 1, 'month_reached', true, true),
  ('m4_crm', 'CRM e follow-up', 'Aquecer carteira e manter retorno organizado.', 'crm', 4, 2, 'previous_completed', true, false),
  ('m5_fechamento', 'Fechamento e proposta', 'Conduzir proposta, objecoes e compromisso.', 'fechamento', 5, 1, 'month_reached', true, true),
  ('m6_validacao', 'Validacao final e liberacao', 'Gerente avalia postura, rotina, tecnica e liberacao para venda.', 'gestao', 6, 1, 'manager_release', true, true)
) AS steps(step_key, title, description, theme, month_number, position, unlock_rule, required, manager_feedback_required)
ON CONFLICT (track_id, step_key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  theme = EXCLUDED.theme,
  month_number = EXCLUDED.month_number,
  position = EXCLUDED.position,
  unlock_rule = EXCLUDED.unlock_rule,
  required = EXCLUDED.required,
  manager_feedback_required = EXCLUDED.manager_feedback_required,
  training_id = EXCLUDED.training_id,
  active = true,
  updated_at = now();

INSERT INTO public.catalogo_metricas_consultoria (
  metric_key, label, direction, value_type, area, source_scope, formula_key, sort_order, active
)
VALUES
  ('sales_goal', 'Meta de vendas', 'increase', 'number', 'Vendas', 'target', 'metas_metricas_cliente.sales_total', 10, true),
  ('sales_total', 'Vendas total', 'increase', 'number', 'Vendas', 'sales', 'sum_sales_channels', 20, true),
  ('goal_achievement_rate', 'Realizacao da meta', 'increase', 'percent', 'Vendas', 'computed', 'sales_total/sales_goal', 30, true),
  ('sales_door_flow', 'Vendas - fluxo de porta', 'increase', 'number', 'Vendas', 'sales', null, 40, true),
  ('sales_referral', 'Vendas - indicacao', 'increase', 'number', 'Vendas', 'sales', null, 50, true),
  ('sales_company_wallet', 'Vendas - carteira empresa', 'increase', 'number', 'Vendas', 'sales', null, 60, true),
  ('sales_seller_wallet', 'Vendas - carteira vendedor', 'increase', 'number', 'Vendas', 'sales', null, 70, true),
  ('sales_internet', 'Vendas - internet', 'increase', 'number', 'Vendas', 'sales', null, 80, true),
  ('sales_other', 'Vendas - outros', 'increase', 'number', 'Vendas', 'sales', null, 90, true),
  ('seller_count', 'Volume de vendedores', 'increase', 'number', 'Equipe', 'manual', null, 100, true),
  ('avg_sales_per_seller', 'Media de vendas por vendedor', 'increase', 'number', 'Equipe', 'computed', 'sales_total/seller_count', 110, true),
  ('active_sellers_rate', 'Percentual de vendedores ativos', 'increase', 'percent', 'Equipe', 'computed', 'active_sellers/seller_count', 120, true),
  ('leads_received', 'Leads recebidos', 'increase', 'number', 'Funil', 'marketing', null, 130, true),
  ('avg_leads_per_seller', 'Media de leads por vendedor', 'increase', 'number', 'Funil', 'computed', 'leads_received/seller_count', 140, true),
  ('appointments', 'Agendamentos', 'increase', 'number', 'Funil', 'daily_tracking', null, 150, true),
  ('visits', 'Comparecimentos', 'increase', 'number', 'Funil', 'daily_tracking', null, 160, true),
  ('appointments_per_sale', 'Agendamentos por venda', 'decrease', 'number', 'Funil', 'computed', 'appointments/sales_internet', 170, true),
  ('lead_to_appointment_rate', 'Conversao lead para agendamento', 'increase', 'percent', 'Funil', 'computed', 'appointments/leads_received', 180, true),
  ('appointment_to_visit_rate', 'Conversao agendamento para visita', 'increase', 'percent', 'Funil', 'computed', 'visits/appointments', 190, true),
  ('visit_to_sale_rate', 'Conversao visita para venda', 'increase', 'percent', 'Funil', 'computed', 'sales_total/visits', 200, true),
  ('no_show_rate', 'Taxa de no-show', 'decrease', 'percent', 'Funil', 'computed', '(appointments-visits)/appointments', 210, true),
  ('crm_follow_up_rate', 'Taxa de follow-up CRM', 'increase', 'percent', 'CRM', 'daily_tracking', null, 220, true),
  ('internet_investment', 'Investimento internet', 'decrease', 'currency', 'Marketing', 'marketing', null, 230, true),
  ('internet_cost_per_sale', 'Custo por venda internet', 'decrease', 'currency', 'Marketing', 'computed', 'internet_investment/sales_internet', 240, true),
  ('cost_per_lead', 'Custo por lead', 'decrease', 'currency', 'Marketing', 'computed', 'internet_investment/leads_received', 250, true),
  ('instagram_followers', 'Seguidores Instagram', 'increase', 'number', 'Marketing', 'manual', null, 260, true),
  ('google_rating', 'Avaliacao Google Meu Negocio', 'increase', 'number', 'Marketing', 'manual', null, 270, true),
  ('content_quality', 'Qualidade do conteudo', 'increase', 'number', 'Marketing', 'diagnostic', null, 280, true),
  ('stock_total', 'Estoque total', 'increase', 'number', 'Estoque', 'inventory', null, 290, true),
  ('active_stock', 'Estoque ativo', 'increase', 'number', 'Estoque', 'inventory', null, 300, true),
  ('stock_turnover', 'Giro de estoque', 'increase', 'number', 'Estoque', 'computed', 'sales_total/stock_total', 310, true),
  ('stock_over_90_rate', 'Estoque acima de 90 dias', 'decrease', 'percent', 'Estoque', 'inventory', null, 320, true),
  ('avg_stock_age_days', 'Idade media do estoque', 'decrease', 'number', 'Estoque', 'inventory', null, 330, true),
  ('trade_in_volume', 'Volume de carros de troca', 'increase', 'number', 'Troca', 'manual', null, 340, true),
  ('trade_in_to_sales_rate', 'Participacao da troca nas vendas', 'increase', 'percent', 'Troca', 'computed', 'trade_in_volume/sales_total', 350, true),
  ('trade_in_avg_margin', 'Margem media carro de troca', 'increase', 'currency', 'Troca', 'manual', null, 360, true),
  ('gross_revenue', 'Receita bruta', 'increase', 'currency', 'Financeiro', 'dre', null, 370, true),
  ('net_revenue', 'Receita liquida', 'increase', 'currency', 'Financeiro', 'dre', null, 380, true),
  ('net_profit', 'Lucro liquido', 'increase', 'currency', 'Financeiro', 'dre', null, 390, true),
  ('avg_margin', 'Margem media', 'increase', 'currency', 'Financeiro', 'dre', null, 400, true),
  ('gross_margin_rate', 'Percentual de margem bruta', 'increase', 'percent', 'Financeiro', 'computed', 'gross_margin/gross_revenue', 410, true),
  ('preparation_cost', 'Custo de preparacao', 'decrease', 'currency', 'Financeiro', 'dre', null, 420, true),
  ('post_sale_cost', 'Custo pos-venda', 'decrease', 'currency', 'Financeiro', 'dre', null, 430, true),
  ('fixed_expense_rate', 'Percentual de despesas fixas', 'decrease', 'percent', 'Financeiro', 'computed', 'fixed_expenses/net_revenue', 440, true),
  ('training_completion_rate', 'Conclusao de treinamentos', 'increase', 'percent', 'Desenvolvimento', 'training', null, 450, true)
ON CONFLICT (metric_key) DO UPDATE SET
  label = EXCLUDED.label,
  direction = EXCLUDED.direction,
  value_type = EXCLUDED.value_type,
  area = EXCLUDED.area,
  source_scope = EXCLUDED.source_scope,
  formula_key = EXCLUDED.formula_key,
  sort_order = EXCLUDED.sort_order,
  active = true;

COMMIT;
