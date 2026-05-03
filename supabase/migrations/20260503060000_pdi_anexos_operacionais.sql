-- Story OPS-20260503: PDI alinhado aos anexos operacionais.

ALTER TABLE public.pdi_sessoes
  ADD COLUMN IF NOT EXISTS cargo_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pdi_sessoes_cargo_id_fkey'
      AND conrelid = 'public.pdi_sessoes'::regclass
  ) THEN
    ALTER TABLE public.pdi_sessoes
      ADD CONSTRAINT pdi_sessoes_cargo_id_fkey
      FOREIGN KEY (cargo_id) REFERENCES public.pdi_niveis_cargo(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.pdis
  ADD COLUMN IF NOT EXISTS seller_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS manager_acknowledged_at timestamptz;

WITH escala AS (
  SELECT
    nc.id AS nivel_cargo_id,
    gs.nota,
    gs.nota - nc.nota_min + 1 AS ordem,
    CASE gs.nota - nc.nota_min + 1
      WHEN 1 THEN 'Baixa capacidade'
      WHEN 2 THEN 'Demonstra raramente'
      WHEN 3 THEN 'Demonstra parcialmente'
      WHEN 4 THEN 'Demonstra com consistencia'
      ELSE 'Alta capacidade'
    END AS descritor
  FROM public.pdi_niveis_cargo nc
  CROSS JOIN LATERAL generate_series(nc.nota_min, nc.nota_max) AS gs(nota)
)
INSERT INTO public.pdi_descritores_escala (nivel_cargo_id, nota, descritor, ordem)
SELECT e.nivel_cargo_id, e.nota, e.descritor, e.ordem
FROM escala e
WHERE NOT EXISTS (
  SELECT 1
  FROM public.pdi_descritores_escala d
  WHERE d.nivel_cargo_id = e.nivel_cargo_id
    AND d.nota = e.nota
);

CREATE OR REPLACE FUNCTION public.get_pdi_form_template(p_cargo_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
    v_escala jsonb;
    v_competencias jsonb;
    v_frases jsonb;
    v_cargo_min integer;
    v_cargo_max integer;
BEGIN
    SELECT nota_min, nota_max
    INTO v_cargo_min, v_cargo_max
    FROM public.pdi_niveis_cargo
    WHERE id = p_cargo_id;

    IF v_cargo_min IS NULL OR v_cargo_max IS NULL THEN
      RAISE EXCEPTION 'Cargo do PDI nao localizado.';
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'nota', nota,
            'descritor', descritor,
            'ordem', ordem
        ) ORDER BY nota ASC
    ) INTO v_escala
    FROM public.pdi_descritores_escala
    WHERE nivel_cargo_id = p_cargo_id;

    IF v_escala IS NULL OR jsonb_array_length(v_escala) = 0 THEN
      SELECT jsonb_agg(
          jsonb_build_object(
            'nota', nota,
            'descritor', descritor,
            'ordem', ordem
          ) ORDER BY nota ASC
      ) INTO v_escala
      FROM (
        SELECT
          gs.nota,
          gs.nota - v_cargo_min + 1 AS ordem,
          CASE gs.nota - v_cargo_min + 1
            WHEN 1 THEN 'Baixa capacidade'
            WHEN 2 THEN 'Demonstra raramente'
            WHEN 3 THEN 'Demonstra parcialmente'
            WHEN 4 THEN 'Demonstra com consistencia'
            ELSE 'Alta capacidade'
          END AS descritor
        FROM generate_series(v_cargo_min, v_cargo_max) AS gs(nota)
      ) fallback_escala;
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'nome', nome,
            'tipo', tipo,
            'descricao_completa', descricao_completa,
            'indicador', indicador,
            'ordem', ordem,
            'alvo', v_cargo_max
        ) ORDER BY tipo DESC, ordem ASC
    ) INTO v_competencias
    FROM public.pdi_competencias;

    SELECT jsonb_agg(texto) INTO v_frases
    FROM public.pdi_frases_inspiracionais;

    RETURN jsonb_build_object(
        'escala', COALESCE(v_escala, '[]'::jsonb),
        'competencias', COALESCE(v_competencias, '[]'::jsonb),
        'frases', COALESCE(v_frases, '[]'::jsonb)
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_pdi_session_bundle(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
    v_sessao_id uuid;
    v_colaborador_id uuid;
    v_loja_id uuid;
    v_cargo_id uuid;
    v_cargo_min integer;
    v_cargo_max integer;
    v_competencias_count integer;
    v_avaliacoes_count integer;
    v_avaliacoes_distinct integer;
    v_meta_total integer;
    v_count integer;
    v_pessoal integer;
    v_profissional integer;
    v_prazo text;
    v_meta jsonb;
    v_avaliacao jsonb;
    v_acao jsonb;
    v_nota integer;
    v_acao_data date;
    v_seen_competencias uuid[] := ARRAY[]::uuid[];
BEGIN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Usuario nao autenticado.';
    END IF;

    v_colaborador_id := NULLIF(p_payload->>'colaborador_id', '')::uuid;
    v_loja_id := NULLIF(p_payload->>'loja_id', '')::uuid;
    v_cargo_id := NULLIF(p_payload->>'cargo_id', '')::uuid;

    IF v_colaborador_id IS NULL THEN
      RAISE EXCEPTION 'Colaborador do PDI e obrigatorio.';
    END IF;

    IF v_loja_id IS NULL THEN
      SELECT store_id INTO v_loja_id
      FROM public.vinculos_loja
      WHERE user_id = v_colaborador_id
        AND role = 'vendedor'
      ORDER BY created_at DESC NULLS LAST
      LIMIT 1;
    END IF;

    IF v_loja_id IS NULL THEN
      RAISE EXCEPTION 'Loja do PDI e obrigatoria.';
    END IF;

    IF NOT (
      public.is_admin()
      OR public.is_owner_of(v_loja_id)
      OR public.is_manager_of(v_loja_id)
    ) THEN
      RAISE EXCEPTION 'Usuario sem permissao para aplicar PDI nesta loja.';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.vinculos_loja
      WHERE user_id = v_colaborador_id
        AND store_id = v_loja_id
        AND role = 'vendedor'
    ) THEN
      RAISE EXCEPTION 'Colaborador selecionado nao esta vinculado como vendedor nesta loja.';
    END IF;

    IF v_cargo_id IS NULL THEN
      SELECT id INTO v_cargo_id
      FROM public.pdi_niveis_cargo
      WHERE lower(nome) LIKE '%consultor%'
      ORDER BY nivel ASC
      LIMIT 1;
    END IF;

    SELECT nota_min, nota_max
    INTO v_cargo_min, v_cargo_max
    FROM public.pdi_niveis_cargo
    WHERE id = v_cargo_id;

    IF v_cargo_min IS NULL OR v_cargo_max IS NULL THEN
      RAISE EXCEPTION 'Cargo do PDI nao localizado.';
    END IF;

    IF jsonb_typeof(p_payload->'metas') <> 'array' THEN
      RAISE EXCEPTION 'Metas do PDI devem ser enviadas em lista.';
    END IF;

    SELECT count(*) INTO v_meta_total
    FROM jsonb_array_elements(p_payload->'metas') meta
    WHERE btrim(COALESCE(meta->>'descricao', '')) <> '';

    IF v_meta_total <> 9 THEN
      RAISE EXCEPTION 'O PDI deve conter exatamente 9 metas preenchidas: 3 para 6, 12 e 24 meses.';
    END IF;

    FOREACH v_prazo IN ARRAY ARRAY['6_meses', '12_meses', '24_meses']
    LOOP
      SELECT
        count(*),
        count(*) FILTER (WHERE meta->>'tipo' = 'pessoal'),
        count(*) FILTER (WHERE meta->>'tipo' = 'profissional')
      INTO v_count, v_pessoal, v_profissional
      FROM jsonb_array_elements(p_payload->'metas') meta
      WHERE meta->>'prazo' = v_prazo
        AND btrim(COALESCE(meta->>'descricao', '')) <> '';

      IF v_count <> 3 OR v_pessoal < 1 OR v_profissional < 1 THEN
        RAISE EXCEPTION 'Cada horizonte do PDI deve ter 3 metas, com ao menos 1 pessoal e 1 profissional.';
      END IF;
    END LOOP;

    IF jsonb_typeof(p_payload->'avaliacoes') <> 'array' THEN
      RAISE EXCEPTION 'Avaliacoes do PDI devem ser enviadas em lista.';
    END IF;

    SELECT count(*) INTO v_competencias_count FROM public.pdi_competencias;
    SELECT count(*), count(DISTINCT avaliacao->>'competencia_id')
    INTO v_avaliacoes_count, v_avaliacoes_distinct
    FROM jsonb_array_elements(p_payload->'avaliacoes') avaliacao;

    IF v_avaliacoes_count <> v_competencias_count OR v_avaliacoes_distinct <> v_competencias_count THEN
      RAISE EXCEPTION 'Todas as competencias do mapa devem ser avaliadas uma unica vez.';
    END IF;

    FOR v_avaliacao IN SELECT * FROM jsonb_array_elements(p_payload->'avaliacoes')
    LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM public.pdi_competencias
        WHERE id = (v_avaliacao->>'competencia_id')::uuid
      ) THEN
        RAISE EXCEPTION 'Competencia de avaliacao nao localizada.';
      END IF;

      v_nota := (v_avaliacao->>'nota_atribuida')::integer;
      IF v_nota < v_cargo_min OR v_nota > v_cargo_max THEN
        RAISE EXCEPTION 'Nota de competencia fora da escala do cargo.';
      END IF;
    END LOOP;

    IF jsonb_typeof(p_payload->'plano_acao') <> 'array'
      OR jsonb_array_length(p_payload->'plano_acao') <> 5 THEN
      RAISE EXCEPTION 'O plano de acao do PDI deve conter exatamente 5 acoes.';
    END IF;

    FOR v_acao IN SELECT * FROM jsonb_array_elements(p_payload->'plano_acao')
    LOOP
      IF NULLIF(v_acao->>'competencia_id', '') IS NULL
        OR btrim(COALESCE(v_acao->>'descricao_acao', '')) = ''
        OR NULLIF(v_acao->>'data_conclusao', '') IS NULL THEN
        RAISE EXCEPTION 'Todas as 5 acoes devem ter competencia, descricao e data.';
      END IF;

      IF (v_acao->>'competencia_id')::uuid = ANY(v_seen_competencias) THEN
        RAISE EXCEPTION 'Cada acao deve estar vinculada a uma competencia diferente.';
      END IF;
      v_seen_competencias := array_append(v_seen_competencias, (v_acao->>'competencia_id')::uuid);

      v_acao_data := (v_acao->>'data_conclusao')::date;
      IF v_acao_data < current_date OR v_acao_data > (current_date + interval '6 months')::date THEN
        RAISE EXCEPTION 'Acoes de desenvolvimento devem concluir dentro dos proximos 6 meses.';
      END IF;
    END LOOP;

    IF NULLIF(p_payload->>'proxima_revisao_data', '') IS NULL THEN
      RAISE EXCEPTION 'Data da proxima revisao mensal e obrigatoria.';
    END IF;

    INSERT INTO public.pdi_sessoes (colaborador_id, gerente_id, loja_id, cargo_id, proxima_revisao_data, status)
    VALUES (
        v_colaborador_id,
        auth.uid(),
        v_loja_id,
        v_cargo_id,
        (p_payload->>'proxima_revisao_data')::timestamptz,
        'concluido'
    ) RETURNING id INTO v_sessao_id;

    FOR v_meta IN SELECT * FROM jsonb_array_elements(p_payload->'metas')
    LOOP
        INSERT INTO public.pdi_metas (sessao_id, prazo, tipo, descricao)
        VALUES (
            v_sessao_id,
            v_meta->>'prazo',
            v_meta->>'tipo',
            btrim(v_meta->>'descricao')
        );
    END LOOP;

    FOR v_avaliacao IN SELECT * FROM jsonb_array_elements(p_payload->'avaliacoes')
    LOOP
        INSERT INTO public.pdi_avaliacoes_competencia (sessao_id, competencia_id, nota_atribuida, alvo)
        VALUES (
            v_sessao_id,
            (v_avaliacao->>'competencia_id')::uuid,
            (v_avaliacao->>'nota_atribuida')::integer,
            (v_avaliacao->>'alvo')::integer
        );
    END LOOP;

    FOR v_acao IN SELECT * FROM jsonb_array_elements(p_payload->'plano_acao')
    LOOP
        INSERT INTO public.pdi_plano_acao (sessao_id, competencia_id, descricao_acao, data_conclusao, impacto, custo, status)
        VALUES (
            v_sessao_id,
            (v_acao->>'competencia_id')::uuid,
            btrim(v_acao->>'descricao_acao'),
            (v_acao->>'data_conclusao')::date,
            v_acao->>'impacto',
            v_acao->>'custo',
            'pendente'
        );
    END LOOP;

    RETURN v_sessao_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_pdi_print_bundle(p_sessao_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
    v_sessao record;
    v_metas jsonb;
    v_avaliacoes jsonb;
    v_plano_acao jsonb;
    v_top_gaps jsonb;
BEGIN
    SELECT
      s.*,
      u.name AS colaborador_nome,
      g.name AS gerente_nome,
      l.name AS loja_nome,
      nc.nome AS cargo_nome
    INTO v_sessao
    FROM public.pdi_sessoes s
    LEFT JOIN public.usuarios u ON u.id = s.colaborador_id
    LEFT JOIN public.usuarios g ON g.id = s.gerente_id
    LEFT JOIN public.lojas l ON l.id = s.loja_id
    LEFT JOIN public.pdi_niveis_cargo nc ON nc.id = s.cargo_id
    WHERE s.id = p_sessao_id
      AND (
        public.is_admin()
        OR public.is_owner_of(s.loja_id)
        OR public.is_manager_of(s.loja_id)
        OR s.colaborador_id = auth.uid()
        OR s.gerente_id = auth.uid()
      );

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sessao nao encontrada ou sem acesso.';
    END IF;

    SELECT jsonb_agg(row_to_json(m) ORDER BY
      CASE m.prazo
        WHEN '6_meses' THEN 1
        WHEN '12_meses' THEN 2
        WHEN '24_meses' THEN 3
        ELSE 4
      END,
      m.created_at
    ) INTO v_metas
    FROM public.pdi_metas m
    WHERE sessao_id = p_sessao_id;
    
    SELECT jsonb_agg(
        jsonb_build_object(
            'competencia', c.nome,
            'tipo', c.tipo,
            'nota', a.nota_atribuida,
            'alvo', a.alvo,
            'gap', a.alvo - a.nota_atribuida
        ) ORDER BY c.tipo DESC, c.ordem ASC
    ) INTO v_avaliacoes 
    FROM public.pdi_avaliacoes_competencia a
    JOIN public.pdi_competencias c ON a.competencia_id = c.id
    WHERE sessao_id = p_sessao_id;

    SELECT jsonb_agg(gap_info) INTO v_top_gaps
    FROM (
        SELECT jsonb_build_object(
            'competencia', c.nome,
            'gap', a.alvo - a.nota_atribuida
        ) AS gap_info
        FROM public.pdi_avaliacoes_competencia a
        JOIN public.pdi_competencias c ON a.competencia_id = c.id
        WHERE sessao_id = p_sessao_id
        ORDER BY (a.alvo - a.nota_atribuida) DESC, c.ordem ASC
        LIMIT 5
    ) AS sub;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', pa.id,
            'competencia', c.nome,
            'descricao_acao', pa.descricao_acao,
            'data_conclusao', pa.data_conclusao,
            'impacto', pa.impacto,
            'custo', pa.custo,
            'status', pa.status,
            'evidencia_url', pa.evidencia_url
        ) ORDER BY pa.data_conclusao ASC, c.ordem ASC
    ) INTO v_plano_acao
    FROM public.pdi_plano_acao pa
    JOIN public.pdi_competencias c ON pa.competencia_id = c.id
    WHERE sessao_id = p_sessao_id;

    RETURN jsonb_build_object(
        'sessao', row_to_json(v_sessao),
        'metas', COALESCE(v_metas, '[]'::jsonb),
        'avaliacoes', COALESCE(v_avaliacoes, '[]'::jsonb),
        'top_5_gaps', COALESCE(v_top_gaps, '[]'::jsonb),
        'plano_acao', COALESCE(v_plano_acao, '[]'::jsonb)
    );
END;
$function$;

DROP POLICY IF EXISTS "Gerente ve sessoes que criou" ON public.pdi_sessoes;
DROP POLICY IF EXISTS "Vendedor ve suas sessoes" ON public.pdi_sessoes;
DROP POLICY IF EXISTS pdi_sessoes_select_operacional ON public.pdi_sessoes;
CREATE POLICY pdi_sessoes_select_operacional ON public.pdi_sessoes
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.is_owner_of(loja_id)
    OR public.is_manager_of(loja_id)
    OR colaborador_id = auth.uid()
    OR gerente_id = auth.uid()
  );

DROP POLICY IF EXISTS pdi_sessoes_insert_operacional ON public.pdi_sessoes;
CREATE POLICY pdi_sessoes_insert_operacional ON public.pdi_sessoes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.is_owner_of(loja_id)
    OR public.is_manager_of(loja_id)
  );

DROP POLICY IF EXISTS pdi_sessoes_update_operacional ON public.pdi_sessoes;
CREATE POLICY pdi_sessoes_update_operacional ON public.pdi_sessoes
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR public.is_owner_of(loja_id)
    OR public.is_manager_of(loja_id)
    OR gerente_id = auth.uid()
  )
  WITH CHECK (
    public.is_admin()
    OR public.is_owner_of(loja_id)
    OR public.is_manager_of(loja_id)
    OR gerente_id = auth.uid()
  );

DROP POLICY IF EXISTS "Acesso as metas via sessao" ON public.pdi_metas;
DROP POLICY IF EXISTS pdi_metas_access_operacional ON public.pdi_metas;
CREATE POLICY pdi_metas_access_operacional ON public.pdi_metas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.colaborador_id = auth.uid()
          OR s.gerente_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.gerente_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "Acesso as avaliacoes via sessao" ON public.pdi_avaliacoes_competencia;
DROP POLICY IF EXISTS pdi_avaliacoes_access_operacional ON public.pdi_avaliacoes_competencia;
CREATE POLICY pdi_avaliacoes_access_operacional ON public.pdi_avaliacoes_competencia
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.colaborador_id = auth.uid()
          OR s.gerente_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.gerente_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "Acesso ao plano via sessao" ON public.pdi_plano_acao;
DROP POLICY IF EXISTS pdi_plano_access_operacional ON public.pdi_plano_acao;
CREATE POLICY pdi_plano_access_operacional ON public.pdi_plano_acao
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.colaborador_id = auth.uid()
          OR s.gerente_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.gerente_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "Acesso aos obj pessoais via sessao" ON public.pdi_objetivos_pessoais;
DROP POLICY IF EXISTS pdi_objetivos_access_operacional ON public.pdi_objetivos_pessoais;
CREATE POLICY pdi_objetivos_access_operacional ON public.pdi_objetivos_pessoais
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.colaborador_id = auth.uid()
          OR s.gerente_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.gerente_id = auth.uid()
        )
    )
  );
