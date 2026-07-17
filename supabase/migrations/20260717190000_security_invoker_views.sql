BEGIN;

-- The happiness aggregate is used by the Owner RH dashboard. Keep the same
-- columns, but enforce store scope explicitly before aggregation. Internal MX
-- users retain their cross-store operational visibility.
CREATE OR REPLACE VIEW public.indice_felicidade_agregado
WITH (security_invoker = true)
AS
SELECT
  r.loja_id,
  r.ciclo,
  round(avg(r.nota_clima), 2) AS media_clima,
  round(avg(r.nota_lideranca), 2) AS media_lideranca,
  round(avg(r.nota_carreira), 2) AS media_carreira,
  count(*) AS total_respostas
FROM public.indice_felicidade_respostas AS r
WHERE public.eh_area_interna_mx()
   OR public.tem_papel_loja(
        r.loja_id,
        ARRAY['dono'::text, 'gerente'::text]
      )
GROUP BY r.loja_id, r.ciclo;

-- PostgreSQL views are security-definer by default. Security invoker makes the
-- caller's grants and every base-table RLS policy apply to these operational
-- projections.
ALTER VIEW public.view_daily_team_status SET (security_invoker = true);
ALTER VIEW public.view_seller_tenure_status SET (security_invoker = true);
ALTER VIEW public.indice_felicidade_agregado SET (security_invoker = true);
ALTER VIEW public.view_sem_registro SET (security_invoker = true);
ALTER VIEW public.view_store_daily_production SET (security_invoker = true);

-- Views are read models. Anonymous users must not enumerate operational data,
-- and signed-in users do not need write-like privileges on them.
REVOKE ALL ON public.view_daily_team_status FROM PUBLIC;
REVOKE ALL ON public.view_daily_team_status FROM anon;
REVOKE ALL ON public.view_daily_team_status FROM authenticated;
REVOKE ALL ON public.view_daily_team_status FROM service_role;
GRANT SELECT ON public.view_daily_team_status TO authenticated;
GRANT SELECT ON public.view_daily_team_status TO service_role;

REVOKE ALL ON public.view_seller_tenure_status FROM PUBLIC;
REVOKE ALL ON public.view_seller_tenure_status FROM anon;
REVOKE ALL ON public.view_seller_tenure_status FROM authenticated;
REVOKE ALL ON public.view_seller_tenure_status FROM service_role;
GRANT SELECT ON public.view_seller_tenure_status TO authenticated;
GRANT SELECT ON public.view_seller_tenure_status TO service_role;

REVOKE ALL ON public.indice_felicidade_agregado FROM PUBLIC;
REVOKE ALL ON public.indice_felicidade_agregado FROM anon;
REVOKE ALL ON public.indice_felicidade_agregado FROM authenticated;
REVOKE ALL ON public.indice_felicidade_agregado FROM service_role;
GRANT SELECT ON public.indice_felicidade_agregado TO authenticated;
GRANT SELECT ON public.indice_felicidade_agregado TO service_role;

REVOKE ALL ON public.view_sem_registro FROM PUBLIC;
REVOKE ALL ON public.view_sem_registro FROM anon;
REVOKE ALL ON public.view_sem_registro FROM authenticated;
REVOKE ALL ON public.view_sem_registro FROM service_role;
GRANT SELECT ON public.view_sem_registro TO authenticated;
GRANT SELECT ON public.view_sem_registro TO service_role;

REVOKE ALL ON public.view_store_daily_production FROM PUBLIC;
REVOKE ALL ON public.view_store_daily_production FROM anon;
REVOKE ALL ON public.view_store_daily_production FROM authenticated;
REVOKE ALL ON public.view_store_daily_production FROM service_role;
GRANT SELECT ON public.view_store_daily_production TO authenticated;
GRANT SELECT ON public.view_store_daily_production TO service_role;

COMMENT ON VIEW public.indice_felicidade_agregado IS
  'Anonymous happiness aggregate scoped by caller store; security_invoker applies base-table RLS.';
COMMENT ON VIEW public.view_daily_team_status IS
  'Daily team status projection with caller RLS enforced through security_invoker.';
COMMENT ON VIEW public.view_seller_tenure_status IS
  'Seller tenure projection with caller RLS enforced through security_invoker.';
COMMENT ON VIEW public.view_sem_registro IS
  'Missing daily records projection with caller RLS enforced through security_invoker.';
COMMENT ON VIEW public.view_store_daily_production IS
  'Store daily production projection with caller RLS enforced through security_invoker.';

COMMIT;

-- DOWN
-- Manual rollback only. Reverting this migration intentionally restores the
-- former security-definer behavior and broad legacy grants, so it must require
-- an incident-approved maintenance window.
-- BEGIN;
-- CREATE OR REPLACE VIEW public.indice_felicidade_agregado AS
-- SELECT
--   r.loja_id,
--   r.ciclo,
--   round(avg(r.nota_clima), 2) AS media_clima,
--   round(avg(r.nota_lideranca), 2) AS media_lideranca,
--   round(avg(r.nota_carreira), 2) AS media_carreira,
--   count(*) AS total_respostas
-- FROM public.indice_felicidade_respostas AS r
-- GROUP BY r.loja_id, r.ciclo;
-- ALTER VIEW public.view_daily_team_status RESET (security_invoker);
-- ALTER VIEW public.view_seller_tenure_status RESET (security_invoker);
-- ALTER VIEW public.indice_felicidade_agregado RESET (security_invoker);
-- ALTER VIEW public.view_sem_registro RESET (security_invoker);
-- ALTER VIEW public.view_store_daily_production RESET (security_invoker);
-- GRANT ALL ON public.view_daily_team_status TO anon, authenticated, service_role;
-- GRANT ALL ON public.view_seller_tenure_status TO anon, authenticated, service_role;
-- GRANT ALL ON public.indice_felicidade_agregado TO anon, authenticated, service_role;
-- GRANT ALL ON public.view_sem_registro TO anon, authenticated, service_role;
-- GRANT ALL ON public.view_store_daily_production TO anon, authenticated, service_role;
-- COMMIT;
