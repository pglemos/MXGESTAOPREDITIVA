-- Migration: PDI MX 360 RPCs
-- Created by @data-engineer

-- 1. Function to get PDI form template (competencies and scale) based on cargo level
CREATE OR REPLACE FUNCTION public.get_pdi_form_template(p_cargo_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_escala JSONB;
    v_competencias JSONB;
    v_frases JSONB;
    v_cargo_max INTEGER;
BEGIN
    -- Get scale for cargo
    SELECT jsonb_agg(
        jsonb_build_object(
            'nota', nota,
            'descritor', descritor,
            'ordem', ordem
        ) ORDER BY ordem
    ), MAX(nota) INTO v_escala, v_cargo_max
    FROM public.pdi_descritores_escala
    WHERE nivel_cargo_id = p_cargo_id;

    -- Get competencies
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

    -- Get inspirational phrases
    SELECT jsonb_agg(texto) INTO v_frases
    FROM public.pdi_frases_inspiracionais;

    RETURN jsonb_build_object(
        'escala', COALESCE(v_escala, '[]'::jsonb),
        'competencias', COALESCE(v_competencias, '[]'::jsonb),
        'frases', COALESCE(v_frases, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to get suggested actions for a given competency
CREATE OR REPLACE FUNCTION public.get_suggested_actions(p_competencia_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_actions JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'descricao_acao', descricao_acao
        )
    ) INTO v_actions
    FROM public.pdi_acoes_sugeridas
    WHERE competencia_id = p_competencia_id;

    RETURN COALESCE(v_actions, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to save a complete session bundle (called at the end of the 45min wizard)
CREATE OR REPLACE FUNCTION public.create_pdi_session_bundle(p_payload JSONB)
RETURNS UUID AS $$
DECLARE
    v_sessao_id UUID;
    v_meta JSONB;
    v_avaliacao JSONB;
    v_acao JSONB;
BEGIN
    -- Extract session data
    INSERT INTO public.pdi_sessoes (colaborador_id, gerente_id, loja_id, proxima_revisao_data, status)
    VALUES (
        (p_payload->>'colaborador_id')::UUID,
        auth.uid(), -- Manager creating it
        (p_payload->>'loja_id')::UUID,
        (p_payload->>'proxima_revisao_data')::TIMESTAMP WITH TIME ZONE,
        'concluido'
    ) RETURNING id INTO v_sessao_id;

    -- Insert metas
    FOR v_meta IN SELECT * FROM jsonb_array_elements(p_payload->'metas')
    LOOP
        INSERT INTO public.pdi_metas (sessao_id, prazo, tipo, descricao)
        VALUES (
            v_sessao_id,
            v_meta->>'prazo',
            v_meta->>'tipo',
            v_meta->>'descricao'
        );
    END LOOP;

    -- Insert avaliacoes
    FOR v_avaliacao IN SELECT * FROM jsonb_array_elements(p_payload->'avaliacoes')
    LOOP
        INSERT INTO public.pdi_avaliacoes_competencia (sessao_id, competencia_id, nota_atribuida, alvo)
        VALUES (
            v_sessao_id,
            (v_avaliacao->>'competencia_id')::UUID,
            (v_avaliacao->>'nota_atribuida')::INTEGER,
            (v_avaliacao->>'alvo')::INTEGER
        );
    END LOOP;

    -- Insert plano de acao (5 actions)
    FOR v_acao IN SELECT * FROM jsonb_array_elements(p_payload->'plano_acao')
    LOOP
        INSERT INTO public.pdi_plano_acao (sessao_id, competencia_id, descricao_acao, data_conclusao, impacto, custo, status)
        VALUES (
            v_sessao_id,
            (v_acao->>'competencia_id')::UUID,
            v_acao->>'descricao_acao',
            (v_acao->>'data_conclusao')::DATE,
            v_acao->>'impacto',
            v_acao->>'custo',
            'pendente'
        );
    END LOOP;

    RETURN v_sessao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to retrieve the entire PDI bundle for PDF generation
CREATE OR REPLACE FUNCTION public.get_pdi_print_bundle(p_sessao_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_sessao RECORD;
    v_metas JSONB;
    v_avaliacoes JSONB;
    v_plano_acao JSONB;
    v_top_gaps JSONB;
BEGIN
    -- Ensure user has access
    SELECT * INTO v_sessao FROM public.pdi_sessoes WHERE id = p_sessao_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sessão não encontrada ou sem acesso.';
    END IF;

    SELECT jsonb_agg(row_to_json(m)) INTO v_metas FROM public.pdi_metas m WHERE sessao_id = p_sessao_id;
    
    SELECT jsonb_agg(
        jsonb_build_object(
            'competencia', c.nome,
            'tipo', c.tipo,
            'nota', a.nota_atribuida,
            'alvo', a.alvo,
            'gap', a.alvo - a.nota_atribuida
        )
    ) INTO v_avaliacoes 
    FROM public.pdi_avaliacoes_competencia a
    JOIN public.pdi_competencias c ON a.competencia_id = c.id
    WHERE sessao_id = p_sessao_id;

    -- Calculate top 5 gaps based on avaliacoes
    SELECT jsonb_agg(gap_info) INTO v_top_gaps FROM (
        SELECT jsonb_build_object(
            'competencia', c.nome,
            'gap', a.alvo - a.nota_atribuida
        ) as gap_info
        FROM public.pdi_avaliacoes_competencia a
        JOIN public.pdi_competencias c ON a.competencia_id = c.id
        WHERE sessao_id = p_sessao_id
        ORDER BY (a.alvo - a.nota_atribuida) DESC
        LIMIT 5
    ) AS sub;

    SELECT jsonb_agg(
        jsonb_build_object(
            'competencia', c.nome,
            'descricao_acao', pa.descricao_acao,
            'data_conclusao', pa.data_conclusao,
            'impacto', pa.impacto,
            'custo', pa.custo,
            'status', pa.status
        )
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to approve evidence
CREATE OR REPLACE FUNCTION public.approve_pdi_action_evidence(p_action_id UUID, p_approval_payload JSONB)
RETURNS VOID AS $$
BEGIN
    UPDATE public.pdi_plano_acao
    SET status = 'concluido',
        aprovado_por = auth.uid(),
        data_aprovacao = NOW(),
        updated_at = NOW()
    WHERE id = p_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
