-- Story OPS-20260501: metas da loja administradas apenas por Admin Master/Admin MX.

BEGIN;

ALTER TABLE public.regras_metas_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmarks_loja ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS role_matrix_store_meta_rules_write ON public.regras_metas_loja;
DROP POLICY IF EXISTS regras_metas_loja_write_admin_mx ON public.regras_metas_loja;
CREATE POLICY regras_metas_loja_write_admin_mx ON public.regras_metas_loja
  FOR ALL TO authenticated
  USING (public.eh_administrador_mx())
  WITH CHECK (public.eh_administrador_mx());

DROP POLICY IF EXISTS role_matrix_store_benchmarks_write ON public.benchmarks_loja;
DROP POLICY IF EXISTS benchmarks_loja_write_admin_mx ON public.benchmarks_loja;
CREATE POLICY benchmarks_loja_write_admin_mx ON public.benchmarks_loja
  FOR ALL TO authenticated
  USING (public.eh_administrador_mx())
  WITH CHECK (public.eh_administrador_mx());

COMMIT;
