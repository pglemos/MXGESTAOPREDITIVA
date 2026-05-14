-- Story OPS-20260514: Conclusao legada de visitas PMR ja realizadas.

BEGIN;

ALTER TABLE public.clientes_consultoria
  ADD COLUMN IF NOT EXISTS legacy_migration_summary text,
  ADD COLUMN IF NOT EXISTS legacy_migrated_at timestamptz,
  ADD COLUMN IF NOT EXISTS legacy_migrated_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.clientes_consultoria.legacy_migration_summary
  IS 'Resumo geral usado para migrar visitas PMR historicas ja realizadas fora do sistema.';

COMMENT ON COLUMN public.clientes_consultoria.legacy_migrated_at
  IS 'Data/hora da ultima conclusao legada de visitas PMR.';

COMMENT ON COLUMN public.clientes_consultoria.legacy_migrated_by
  IS 'Usuario interno MX que executou a ultima conclusao legada de visitas PMR.';

CREATE OR REPLACE FUNCTION public.concluir_visitas_legadas_consultoria(
  p_cliente_id uuid,
  p_visit_numbers integer[],
  p_resumo_geral text,
  p_effective_visit_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente public.clientes_consultoria;
  v_visit_number integer;
  v_visit_id uuid;
  v_scheduled_at timestamptz;
  v_checklist jsonb;
  v_objective text;
  v_target text;
  v_completed integer[] := ARRAY[]::integer[];
  v_invalid integer[];
  v_summary text := NULLIF(BTRIM(COALESCE(p_resumo_geral, '')), '');
  v_max_visit integer;
BEGIN
  IF NOT public.eh_administrador_mx(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores MX podem concluir visitas legadas';
  END IF;

  IF p_cliente_id IS NULL THEN
    RAISE EXCEPTION 'Cliente obrigatorio';
  END IF;

  IF v_summary IS NULL THEN
    RAISE EXCEPTION 'Resumo geral obrigatorio';
  END IF;

  IF p_visit_numbers IS NULL OR array_length(p_visit_numbers, 1) IS NULL THEN
    RAISE EXCEPTION 'Selecione ao menos uma visita';
  END IF;

  SELECT array_agg(n ORDER BY n)
    INTO v_invalid
  FROM unnest(p_visit_numbers) AS n
  WHERE n IS NULL OR n < 1 OR n > 7;

  IF COALESCE(array_length(v_invalid, 1), 0) > 0 THEN
    RAISE EXCEPTION 'Visitas invalidas: %', array_to_string(v_invalid, ', ');
  END IF;

  SELECT *
    INTO v_cliente
  FROM public.clientes_consultoria
  WHERE id = p_cliente_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cliente de consultoria nao encontrado';
  END IF;

  v_scheduled_at := (COALESCE(p_effective_visit_date, CURRENT_DATE)::timestamp + time '09:00') AT TIME ZONE 'America/Sao_Paulo';

  FOR v_visit_number IN
    SELECT DISTINCT n
    FROM unnest(p_visit_numbers) AS n
    ORDER BY n
  LOOP
    SELECT
      s.objective,
      s.target,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'task',
              NULLIF(
                BTRIM(
                  CASE
                    WHEN jsonb_typeof(item.value) = 'string' THEN item.value #>> '{}'
                    WHEN jsonb_typeof(item.value) = 'object' THEN item.value ->> 'task'
                    ELSE item.value::text
                  END
                ),
                ''
              ),
              'completed',
              true
            )
          )
          FROM jsonb_array_elements(COALESCE(s.checklist_template, '[]'::jsonb)) AS item(value)
        ),
        '[]'::jsonb
      )
      INTO v_objective, v_target, v_checklist
    FROM public.etapas_modelo_visita_consultoria s
    WHERE s.program_key = COALESCE(v_cliente.program_template_key, 'pmr_7')
      AND s.visit_number = v_visit_number
    ORDER BY s.active DESC NULLS LAST
    LIMIT 1;

    SELECT id
      INTO v_visit_id
    FROM public.visitas_consultoria
    WHERE client_id = p_cliente_id
      AND visit_number = v_visit_number
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_visit_id IS NULL THEN
      INSERT INTO public.visitas_consultoria (
        client_id,
        visit_number,
        scheduled_at,
        duration_hours,
        modality,
        status,
        consultant_id,
        objective,
        target_audience,
        checklist_data,
        feedback_client,
        executive_summary,
        effective_visit_date,
        consultant_name_manual
      )
      VALUES (
        p_cliente_id,
        v_visit_number,
        v_scheduled_at,
        3,
        COALESCE(v_cliente.modality, 'Presencial'),
        'concluida',
        auth.uid(),
        v_objective,
        v_target,
        v_checklist,
        'Concluida via migracao legada.',
        v_summary,
        COALESCE(p_effective_visit_date, CURRENT_DATE),
        'Migracao legado MX'
      )
      RETURNING id INTO v_visit_id;
    ELSE
      UPDATE public.visitas_consultoria
      SET
        status = 'concluida',
        scheduled_at = COALESCE(scheduled_at, v_scheduled_at),
        consultant_id = COALESCE(consultant_id, auth.uid()),
        objective = COALESCE(objective, v_objective),
        target_audience = COALESCE(target_audience, v_target),
        checklist_data = CASE
          WHEN v_checklist <> '[]'::jsonb THEN v_checklist
          ELSE COALESCE(checklist_data, '[]'::jsonb)
        END,
        feedback_client = COALESCE(feedback_client, 'Concluida via migracao legada.'),
        executive_summary = v_summary,
        effective_visit_date = COALESCE(effective_visit_date, p_effective_visit_date, CURRENT_DATE),
        consultant_name_manual = COALESCE(consultant_name_manual, 'Migracao legado MX'),
        updated_at = now()
      WHERE id = v_visit_id;
    END IF;

    v_completed := array_append(v_completed, v_visit_number);
  END LOOP;

  SELECT COALESCE(MAX(n), 0)
    INTO v_max_visit
  FROM unnest(v_completed) AS n;

  UPDATE public.clientes_consultoria
  SET
    current_visit_step = GREATEST(COALESCE(current_visit_step, 0), COALESCE(v_max_visit, 0)),
    legacy_migration_summary = v_summary,
    legacy_migrated_at = now(),
    legacy_migrated_by = auth.uid(),
    updated_at = now()
  WHERE id = p_cliente_id;

  INSERT INTO public.logs_auditoria (
    user_id,
    action,
    entity,
    entity_id,
    details_json
  )
  VALUES (
    auth.uid(),
    'COMPLETE_LEGACY_CONSULTING_VISITS',
    'clientes_consultoria',
    p_cliente_id,
    jsonb_build_object(
      'visit_numbers', to_jsonb(v_completed),
      'summary', v_summary,
      'effective_visit_date', COALESCE(p_effective_visit_date, CURRENT_DATE),
      'source', 'legacy_pmr_visit_completion'
    )
  );

  RETURN jsonb_build_object(
    'client_id', p_cliente_id,
    'visit_numbers', to_jsonb(v_completed),
    'completed_count', COALESCE(array_length(v_completed, 1), 0)
  );
END;
$$;

COMMIT;
