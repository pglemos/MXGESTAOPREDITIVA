-- Fixture autorizada MX-MGR-20260713 (ciclo PDI) — achado em 2026-07-14.
-- create_pdi_session_bundle gravava toda sessão nova com status='concluido'
-- fixo, mesmo com o plano de ação recém-criado em status='pendente'. Isso
-- fazia isCompleted(status) no front (ManagerPDIReference.tsx) tratar uma
-- sessão que acabou de nascer como já concluída, escondendo/mascarando o
-- ciclo real (Preparação/Ativo/Acompanhamento etc.).
--
-- A especificação (Fase 10, item 17.2) descreve 10 estados de ciclo PDI, mas
-- a constraint pdi_sessoes_status_check só existe para ('draft','concluido')
-- — o motor completo de 10 estados não existe no schema hoje. Implementar os
-- 10 estados é trabalho de produto/design, fora do escopo desta correção
-- pontual (não estou inventando essa parte).
--
-- Fix mínimo e seguro dentro do que já existe: usar 'draft' (valor já
-- validado pela constraint) em vez de 'concluido' na criação — sessão nova
-- nunca deveria nascer marcada como concluída. Reversível: reverter o valor
-- de volta para 'concluido' desfaz a mudança.

CREATE OR REPLACE FUNCTION public.create_pdi_session_bundle(p_payload jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_sessao_id UUID;
    v_loja_id UUID;
    v_meta JSONB;
    v_avaliacao JSONB;
    v_acao JSONB;
BEGIN
    v_loja_id := NULLIF(p_payload->>'loja_id', '')::UUID;

    INSERT INTO public.pdi_sessoes (colaborador_id, gerente_id, loja_id, cargo_id, proxima_revisao_data, status)
    VALUES (
        (p_payload->>'colaborador_id')::UUID,
        auth.uid(),
        v_loja_id,
        NULLIF(p_payload->>'cargo_id', '')::UUID,
        (p_payload->>'proxima_revisao_data')::TIMESTAMP WITH TIME ZONE,
        'draft'
    ) RETURNING id INTO v_sessao_id;

    FOR v_meta IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'metas', '[]'::jsonb))
    LOOP
        INSERT INTO public.pdi_metas (sessao_id, prazo, tipo, descricao)
        VALUES (
            v_sessao_id,
            v_meta->>'prazo',
            v_meta->>'tipo',
            v_meta->>'descricao'
        );
    END LOOP;

    FOR v_avaliacao IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'avaliacoes', '[]'::jsonb))
    LOOP
        INSERT INTO public.pdi_avaliacoes_competencia (sessao_id, competencia_id, nota_atribuida, alvo, origem_nota)
        VALUES (
            v_sessao_id,
            (v_avaliacao->>'competencia_id')::UUID,
            (v_avaliacao->>'nota_atribuida')::INTEGER,
            (v_avaliacao->>'alvo')::INTEGER,
            COALESCE(v_avaliacao->>'origem_nota', 'gestor')
        );
    END LOOP;

    FOR v_acao IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'plano_acao', '[]'::jsonb))
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
$function$;

-- Down:
-- (reverter a CREATE OR REPLACE anterior gravando 'concluido' novamente)
