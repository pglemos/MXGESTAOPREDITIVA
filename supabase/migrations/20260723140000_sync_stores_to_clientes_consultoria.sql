-- ==========================================================================
-- Sincronização automática entre lojas (public.lojas) e clientes da consultoria (public.clientes_consultoria).
-- Garante que toda loja ativa cadastrada no sistema possua seu registro correspondente em clientes_consultoria,
-- permitindo agendamento de visitas na Agenda MX (/agenda).
-- ==========================================================================

BEGIN;

-- 1. Inserir registros em clientes_consultoria para lojas ativas sem vínculo de primary_store_id
INSERT INTO public.clientes_consultoria (
  name,
  slug,
  status,
  primary_store_id,
  current_visit_step
)
SELECT
  l.name,
  lower(regexp_replace(l.name, '[^a-zA-Z0-9]+', '-', 'g')),
  'ativo',
  l.id,
  0
FROM public.lojas l
WHERE l.active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.clientes_consultoria cc WHERE cc.primary_store_id = l.id
  )
ON CONFLICT DO NOTHING;

-- 2. Atualização da RPC admin_create_store para criar automaticamente o cliente de consultoria
CREATE OR REPLACE FUNCTION public.admin_create_store(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_role text;
  v_store_id uuid;
  v_store_name text := upper(trim(coalesce(p_payload->>'name', '')));
  v_manager_email text := nullif(lower(trim(coalesce(p_payload->>'manager_email', ''))), '');
  v_partners jsonb := coalesce(p_payload->'partners', '[]'::jsonb);
BEGIN
  SELECT role
    INTO v_caller_role
    FROM public.usuarios
   WHERE id = v_caller_id
     AND active = true;

  IF v_caller_role NOT IN ('administrador_geral', 'administrador_mx') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Apenas administradores MX podem criar lojas.');
  END IF;

  IF v_store_name = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nome da loja é obrigatório.');
  END IF;

  IF jsonb_typeof(v_partners) IS DISTINCT FROM 'array' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sócios da loja devem ser enviados como lista.');
  END IF;

  INSERT INTO public.lojas (
    name,
    manager_email,
    legal_name,
    cnpj,
    address,
    administrative_phone,
    partners,
    active,
    source_mode
  ) VALUES (
    v_store_name,
    v_manager_email,
    nullif(trim(coalesce(p_payload->>'legal_name', '')), ''),
    nullif(trim(coalesce(p_payload->>'cnpj', '')), ''),
    nullif(trim(coalesce(p_payload->>'address', '')), ''),
    nullif(trim(coalesce(p_payload->>'administrative_phone', '')), ''),
    v_partners,
    true,
    'native_app'
  )
  RETURNING id INTO v_store_id;

  -- Criar/Vincular registro em clientes_consultoria para permitir agendamentos na Agenda MX
  INSERT INTO public.clientes_consultoria (
    name,
    slug,
    status,
    primary_store_id,
    created_by,
    current_visit_step
  ) VALUES (
    v_store_name,
    lower(regexp_replace(v_store_name, '[^a-zA-Z0-9]+', '-', 'g')),
    'ativo',
    v_store_id,
    v_caller_id,
    0
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO public.regras_entrega_loja (
    store_id,
    matinal_recipients,
    weekly_recipients,
    monthly_recipients,
    timezone,
    active,
    updated_by
  ) VALUES (
    v_store_id,
    CASE WHEN v_manager_email IS NULL THEN ARRAY[]::text[] ELSE ARRAY[v_manager_email] END,
    CASE WHEN v_manager_email IS NULL THEN ARRAY[]::text[] ELSE ARRAY[v_manager_email] END,
    CASE WHEN v_manager_email IS NULL THEN ARRAY[]::text[] ELSE ARRAY[v_manager_email] END,
    'America/Sao_Paulo',
    true,
    v_caller_id
  )
  ON CONFLICT (store_id) DO UPDATE SET
    matinal_recipients = EXCLUDED.matinal_recipients,
    weekly_recipients = EXCLUDED.weekly_recipients,
    monthly_recipients = EXCLUDED.monthly_recipients,
    timezone = EXCLUDED.timezone,
    active = EXCLUDED.active,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();

  INSERT INTO public.regras_metas_loja (
    store_id,
    monthly_goal,
    individual_goal_mode,
    include_venda_loja_in_store_total,
    include_venda_loja_in_individual_goal,
    bench_lead_agd,
    bench_agd_visita,
    bench_visita_vnd,
    projection_mode,
    updated_by
  ) VALUES (
    v_store_id,
    coalesce(nullif(p_payload->>'monthly_goal', '')::integer, 0),
    'even',
    true,
    false,
    20,
    60,
    33,
    'calendar',
    v_caller_id
  )
  ON CONFLICT (store_id) DO UPDATE SET
    monthly_goal = EXCLUDED.monthly_goal,
    individual_goal_mode = EXCLUDED.individual_goal_mode,
    include_venda_loja_in_store_total = EXCLUDED.include_venda_loja_in_store_total,
    include_venda_loja_in_individual_goal = EXCLUDED.include_venda_loja_in_individual_goal,
    bench_lead_agd = EXCLUDED.bench_lead_agd,
    bench_agd_visita = EXCLUDED.bench_agd_visita,
    bench_visita_vnd = EXCLUDED.bench_visita_vnd,
    projection_mode = EXCLUDED.projection_mode,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();

  INSERT INTO public.benchmarks_loja (
    store_id,
    lead_to_agend,
    agend_to_visit,
    visit_to_sale,
    updated_by
  ) VALUES (
    v_store_id,
    20,
    60,
    33,
    v_caller_id
  )
  ON CONFLICT (store_id) DO UPDATE SET
    lead_to_agend = EXCLUDED.lead_to_agend,
    agend_to_visit = EXCLUDED.agend_to_visit,
    visit_to_sale = EXCLUDED.visit_to_sale,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();

  RETURN jsonb_build_object(
    'ok', true,
    'data', jsonb_build_object('id', v_store_id)
  );
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_store(jsonb) TO authenticated, service_role;

COMMIT;
