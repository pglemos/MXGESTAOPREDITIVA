BEGIN;

CREATE OR REPLACE FUNCTION public.get_pdi_form_template(p_cargo_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_is_service_role boolean := auth.role() = 'service_role';
  v_escala jsonb;
  v_competencias jsonb;
  v_frases jsonb;
  v_cargo_min integer;
  v_cargo_max integer;
BEGIN
  IF NOT v_is_service_role AND v_caller IS NULL THEN
    RAISE EXCEPTION 'Sessao invalida.' USING ERRCODE = '42501';
  END IF;

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
  )
  INTO v_escala
  FROM public.pdi_descritores_escala
  WHERE nivel_cargo_id = p_cargo_id;

  IF v_escala IS NULL OR jsonb_array_length(v_escala) = 0 THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'nota', nota,
        'descritor', descritor,
        'ordem', ordem
      ) ORDER BY nota ASC
    )
    INTO v_escala
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
  )
  INTO v_competencias
  FROM public.pdi_competencias;

  SELECT jsonb_agg(texto ORDER BY id ASC)
  INTO v_frases
  FROM public.pdi_frases_inspiracionais;

  RETURN jsonb_build_object(
    'escala', COALESCE(v_escala, '[]'::jsonb),
    'competencias', COALESCE(v_competencias, '[]'::jsonb),
    'frases', COALESCE(v_frases, '[]'::jsonb)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_suggested_actions(p_competencia_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_is_service_role boolean := auth.role() = 'service_role';
  v_actions jsonb;
BEGIN
  IF NOT v_is_service_role AND v_caller IS NULL THEN
    RAISE EXCEPTION 'Sessao invalida.' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'descricao_acao', descricao_acao
    ) ORDER BY id ASC
  )
  INTO v_actions
  FROM public.pdi_acoes_sugeridas
  WHERE competencia_id = p_competencia_id;

  RETURN COALESCE(v_actions, '[]'::jsonb);
END;
$function$;

REVOKE ALL ON FUNCTION public.get_pdi_form_template(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_pdi_form_template(uuid)
  TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_suggested_actions(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_suggested_actions(uuid)
  TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.mx_development_theme_from_text(text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mx_development_theme_from_text(text)
  TO service_role;

REVOKE ALL ON FUNCTION public.mx_first_active_training_for_theme(text,uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mx_first_active_training_for_theme(text,uuid)
  TO service_role;

-- DOWN
-- Restore the previous catalog definitions and broad PUBLIC grants only with
-- explicit incident approval. Doing so reopens anonymous catalog and helper
-- execution and removes the session checks added by this migration.

COMMIT;
