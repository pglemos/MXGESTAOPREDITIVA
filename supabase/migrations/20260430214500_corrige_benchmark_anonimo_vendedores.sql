BEGIN;

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
    WHERE is_active = true
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

GRANT EXECUTE ON FUNCTION public.listar_benchmark_anonimo_lojas() TO authenticated;

COMMIT;
