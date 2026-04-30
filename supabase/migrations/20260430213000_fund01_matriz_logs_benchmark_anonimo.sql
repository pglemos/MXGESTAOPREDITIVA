BEGIN;

-- Complemento FUND-01: matriz de permissoes, log sensivel e benchmark anonimo.
-- Mantem nomes tecnicos em portugues sem acento.

INSERT INTO public.perfis_permissoes (perfil_codigo, modulo_codigo, permissao_codigo, escopo)
SELECT perfil_codigo, modulo_codigo, permissao_codigo, escopo
FROM (
  VALUES
    ('administrador_geral', 'lancamentos_diarios', 'visualizar', 'rede_mx'),
    ('administrador_geral', 'lancamentos_diarios', 'criar', 'rede_mx'),
    ('administrador_geral', 'lancamentos_diarios', 'editar', 'rede_mx'),
    ('administrador_geral', 'lancamentos_diarios', 'excluir', 'rede_mx'),
    ('administrador_geral', 'metas', 'visualizar', 'rede_mx'),
    ('administrador_geral', 'metas', 'criar', 'rede_mx'),
    ('administrador_geral', 'metas', 'editar', 'rede_mx'),
    ('administrador_geral', 'metas', 'excluir', 'rede_mx'),
    ('administrador_geral', 'classificacao', 'visualizar', 'rede_mx'),
    ('administrador_geral', 'consultoria', 'visualizar', 'rede_mx'),
    ('administrador_geral', 'consultoria', 'criar', 'rede_mx'),
    ('administrador_geral', 'consultoria', 'editar', 'rede_mx'),
    ('administrador_geral', 'consultoria', 'excluir', 'rede_mx'),
    ('administrador_geral', 'financeiro', 'visualizar', 'rede_mx'),
    ('administrador_geral', 'financeiro', 'criar', 'rede_mx'),
    ('administrador_geral', 'financeiro', 'editar', 'rede_mx'),
    ('administrador_geral', 'financeiro', 'excluir', 'rede_mx'),
    ('administrador_geral', 'financeiro', 'exportar', 'rede_mx'),
    ('administrador_geral', 'comparativos', 'visualizar', 'rede_mx'),
    ('administrador_geral', 'comparativos', 'comparar', 'rede_mx'),
    ('administrador_geral', 'evidencias', 'visualizar', 'rede_mx'),
    ('administrador_geral', 'evidencias', 'criar', 'rede_mx'),
    ('administrador_geral', 'evidencias', 'editar', 'rede_mx'),
    ('administrador_geral', 'evidencias', 'excluir', 'rede_mx'),

    ('administrador_mx', 'lancamentos_diarios', 'visualizar', 'rede_mx'),
    ('administrador_mx', 'lancamentos_diarios', 'criar', 'rede_mx'),
    ('administrador_mx', 'lancamentos_diarios', 'editar', 'rede_mx'),
    ('administrador_mx', 'metas', 'visualizar', 'rede_mx'),
    ('administrador_mx', 'metas', 'criar', 'rede_mx'),
    ('administrador_mx', 'metas', 'editar', 'rede_mx'),
    ('administrador_mx', 'classificacao', 'visualizar', 'rede_mx'),
    ('administrador_mx', 'consultoria', 'visualizar', 'rede_mx'),
    ('administrador_mx', 'consultoria', 'criar', 'rede_mx'),
    ('administrador_mx', 'consultoria', 'editar', 'rede_mx'),
    ('administrador_mx', 'financeiro', 'visualizar', 'rede_mx'),
    ('administrador_mx', 'financeiro', 'criar', 'rede_mx'),
    ('administrador_mx', 'financeiro', 'editar', 'rede_mx'),
    ('administrador_mx', 'financeiro', 'exportar', 'rede_mx'),
    ('administrador_mx', 'comparativos', 'visualizar', 'rede_mx'),
    ('administrador_mx', 'comparativos', 'comparar', 'rede_mx'),
    ('administrador_mx', 'evidencias', 'visualizar', 'rede_mx'),
    ('administrador_mx', 'evidencias', 'criar', 'rede_mx'),
    ('administrador_mx', 'evidencias', 'editar', 'rede_mx'),
    ('administrador_mx', 'evidencias', 'excluir', 'rede_mx'),

    ('consultor_mx', 'lancamentos_diarios', 'visualizar', 'anonimizado'),
    ('consultor_mx', 'metas', 'visualizar', 'anonimizado'),
    ('consultor_mx', 'classificacao', 'visualizar', 'anonimizado'),
    ('consultor_mx', 'consultoria', 'visualizar', 'carteira_mx'),
    ('consultor_mx', 'consultoria', 'criar', 'carteira_mx'),
    ('consultor_mx', 'consultoria', 'editar', 'carteira_mx'),
    ('consultor_mx', 'comparativos', 'visualizar', 'anonimizado'),
    ('consultor_mx', 'comparativos', 'comparar', 'anonimizado'),
    ('consultor_mx', 'evidencias', 'visualizar', 'carteira_mx'),
    ('consultor_mx', 'evidencias', 'criar', 'carteira_mx'),
    ('consultor_mx', 'evidencias', 'editar', 'carteira_mx'),
    ('consultor_mx', 'evidencias', 'excluir', 'carteira_mx'),

    ('dono', 'lancamentos_diarios', 'visualizar', 'loja'),
    ('dono', 'metas', 'visualizar', 'loja'),
    ('dono', 'metas', 'editar', 'loja'),
    ('dono', 'classificacao', 'visualizar', 'loja'),

    ('gerente', 'lancamentos_diarios', 'visualizar', 'loja'),
    ('gerente', 'metas', 'visualizar', 'loja'),
    ('gerente', 'metas', 'editar', 'loja'),
    ('gerente', 'classificacao', 'visualizar', 'loja'),

    ('vendedor', 'lancamentos_diarios', 'visualizar', 'proprio'),
    ('vendedor', 'lancamentos_diarios', 'criar', 'proprio'),
    ('vendedor', 'metas', 'visualizar', 'proprio'),
    ('vendedor', 'classificacao', 'visualizar', 'proprio')
) AS matriz(perfil_codigo, modulo_codigo, permissao_codigo, escopo)
ON CONFLICT (perfil_codigo, modulo_codigo, permissao_codigo)
DO UPDATE SET escopo = EXCLUDED.escopo;

CREATE OR REPLACE FUNCTION public.registrar_acesso_sensivel(
  p_modulo_codigo text,
  p_entidade text,
  p_entidade_id uuid DEFAULT NULL,
  p_motivo text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.eh_area_interna_mx(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas perfis MX podem registrar acesso sensivel';
  END IF;

  INSERT INTO public.logs_acesso_sensivel (
    usuario_id,
    perfil,
    modulo_codigo,
    entidade,
    entidade_id,
    motivo,
    metadata
  )
  VALUES (
    auth.uid(),
    public.papel_usuario(auth.uid()),
    p_modulo_codigo,
    p_entidade,
    p_entidade_id,
    p_motivo,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.listar_benchmark_anonimo_lojas()
RETURNS TABLE (
  loja_anonima text,
  total_lancamentos bigint,
  total_leads bigint,
  total_agendamentos bigint,
  total_visitas bigint,
  total_vendas bigint,
  disciplina_lancamento numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.eh_area_interna_mx(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas perfis MX podem consultar benchmark anonimo';
  END IF;

  PERFORM public.registrar_acesso_sensivel(
    'comparativos',
    'benchmark_lojas_anonimo',
    NULL,
    'Consulta de benchmark anonimo entre lojas',
    jsonb_build_object('anonimizado', true)
  );

  RETURN QUERY
  WITH vendedores AS (
    SELECT store_id, COUNT(*)::numeric AS total_vendedores
    FROM public.vendedores_loja
    WHERE active = true
    GROUP BY store_id
  ),
  lancamentos AS (
    SELECT
      store_id,
      COUNT(*)::bigint AS total_lancamentos,
      SUM(COALESCE(leads_prev_day, leads, 0))::bigint AS total_leads,
      SUM(COALESCE(agd_cart_today, 0) + COALESCE(agd_net_today, 0) + COALESCE(agd_cart, 0) + COALESCE(agd_net, 0))::bigint AS total_agendamentos,
      SUM(COALESCE(visit_prev_day, visitas, 0))::bigint AS total_visitas,
      SUM(COALESCE(vnd_porta_prev_day, 0) + COALESCE(vnd_cart_prev_day, 0) + COALESCE(vnd_net_prev_day, 0) + COALESCE(vnd_porta, 0) + COALESCE(vnd_cart, 0) + COALESCE(vnd_net, 0))::bigint AS total_vendas,
      COUNT(DISTINCT reference_date)::numeric AS dias_com_lancamento
    FROM public.lancamentos_diarios
    GROUP BY store_id
  )
  SELECT
    'loja_' || SUBSTRING(MD5(l.id::text), 1, 8) AS loja_anonima,
    COALESCE(la.total_lancamentos, 0)::bigint AS total_lancamentos,
    COALESCE(la.total_leads, 0)::bigint AS total_leads,
    COALESCE(la.total_agendamentos, 0)::bigint AS total_agendamentos,
    COALESCE(la.total_visitas, 0)::bigint AS total_visitas,
    COALESCE(la.total_vendas, 0)::bigint AS total_vendas,
    CASE
      WHEN COALESCE(v.total_vendedores, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(la.dias_com_lancamento, 0) / GREATEST(v.total_vendedores, 1))::numeric, 2)
    END AS disciplina_lancamento
  FROM public.lojas l
  LEFT JOIN lancamentos la ON la.store_id = l.id
  LEFT JOIN vendedores v ON v.store_id = l.id
  WHERE l.active = true
  ORDER BY total_vendas DESC, total_leads DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_acesso_sensivel(text, text, uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_benchmark_anonimo_lojas() TO authenticated;

COMMIT;
