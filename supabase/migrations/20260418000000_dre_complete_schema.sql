-- ============================================================
-- DRE COMPLETO — Baseado no DRE.xlsx da MX
-- Expande consulting_financials com todas as categorias
-- do demonstrativo real: Receitas, Deducoes, Despesas, Indicadores
-- ============================================================

ALTER TABLE public.consulting_financials
  ADD COLUMN IF NOT EXISTS revenue_proprios numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_consignados numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_repasse numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ded_preparacao numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ded_comissoes numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ded_impostos numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_revenue_financiamento numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_revenue_outros1 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_revenue_outros2 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_revenue_outros3 numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payroll_salarios numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payroll_inss numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payroll_fgts numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payroll_seguro_social numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payroll_tempo_servico numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payroll_13salario numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payroll_ferias numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payroll_indenizacao numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payroll_outros numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pro_labore numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_fornecedores numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_agua numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_limpeza numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_viagens numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_energia numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_telefone numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_contabilidade numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_aluguel numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_frete numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_contribuicoes numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_terceiros numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_marketing numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_iptu numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_combustivel numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_manutencao_imovel numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_seguranca numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_cartorio numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_pos_venda numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_ir_csll numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_sistemas numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_emprestimo_pf numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_emprestimo_pj numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_tarifas numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_informatica numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_treinamentos numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exp_outras numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS volume_vendas integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS capital_proprio numeric DEFAULT 0;

CREATE OR REPLACE FUNCTION public.compute_dre(p_row public.consulting_financials)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_gross_margin numeric;
  v_total_deductions numeric;
  v_net_sales_margin numeric;
  v_other_revenue numeric;
  v_gross_profit numeric;
  v_total_payroll numeric;
  v_total_fixed numeric;
  v_total_expenses numeric;
  v_net_profit numeric;
  v_avg_ticket numeric;
  v_margin_per_car numeric;
  v_net_margin_per_car numeric;
  v_prep_cost_per_car numeric;
  v_posvenda_per_car numeric;
  v_profit_per_car numeric;
  v_rentability numeric;
BEGIN
  v_gross_margin := COALESCE(p_row.revenue_proprios,0) + COALESCE(p_row.revenue_consignados,0) + COALESCE(p_row.revenue_repasse,0);
  v_total_deductions := COALESCE(p_row.ded_preparacao,0) + COALESCE(p_row.ded_comissoes,0) + COALESCE(p_row.ded_impostos,0);
  v_net_sales_margin := v_gross_margin - v_total_deductions;
  v_other_revenue := COALESCE(p_row.other_revenue_financiamento,0) + COALESCE(p_row.other_revenue_outros1,0) + COALESCE(p_row.other_revenue_outros2,0) + COALESCE(p_row.other_revenue_outros3,0);
  v_gross_profit := v_net_sales_margin + v_other_revenue;

  v_total_payroll := COALESCE(p_row.payroll_salarios,0) + COALESCE(p_row.payroll_inss,0) + COALESCE(p_row.payroll_fgts,0) + COALESCE(p_row.payroll_seguro_social,0) + COALESCE(p_row.payroll_tempo_servico,0) + COALESCE(p_row.payroll_13salario,0) + COALESCE(p_row.payroll_ferias,0) + COALESCE(p_row.payroll_indenizacao,0) + COALESCE(p_row.payroll_outros,0);

  v_total_fixed := COALESCE(p_row.exp_fornecedores,0) + COALESCE(p_row.exp_agua,0) + COALESCE(p_row.exp_limpeza,0) + COALESCE(p_row.exp_viagens,0) + COALESCE(p_row.exp_energia,0) + COALESCE(p_row.exp_telefone,0) + COALESCE(p_row.exp_contabilidade,0) + COALESCE(p_row.exp_aluguel,0) + COALESCE(p_row.exp_frete,0) + COALESCE(p_row.exp_contribuicoes,0) + COALESCE(p_row.exp_terceiros,0) + COALESCE(p_row.exp_marketing,0) + COALESCE(p_row.exp_iptu,0) + COALESCE(p_row.exp_combustivel,0) + COALESCE(p_row.exp_manutencao_imovel,0) + COALESCE(p_row.exp_seguranca,0) + COALESCE(p_row.exp_cartorio,0) + COALESCE(p_row.exp_pos_venda,0) + COALESCE(p_row.exp_ir_csll,0) + COALESCE(p_row.exp_sistemas,0) + COALESCE(p_row.exp_emprestimo_pf,0) + COALESCE(p_row.exp_emprestimo_pj,0) + COALESCE(p_row.exp_tarifas,0) + COALESCE(p_row.exp_informatica,0) + COALESCE(p_row.exp_treinamentos,0) + COALESCE(p_row.exp_outras,0);

  v_total_expenses := v_total_payroll + COALESCE(p_row.pro_labore,0) + v_total_fixed;
  v_net_profit := v_gross_profit - v_total_expenses;

  v_avg_ticket := CASE WHEN COALESCE(p_row.volume_vendas,0) > 0 THEN v_gross_margin / p_row.volume_vendas ELSE 0 END;
  v_margin_per_car := CASE WHEN COALESCE(p_row.volume_vendas,0) > 0 THEN v_gross_margin / p_row.volume_vendas ELSE 0 END;
  v_net_margin_per_car := CASE WHEN COALESCE(p_row.volume_vendas,0) > 0 THEN v_net_sales_margin / p_row.volume_vendas ELSE 0 END;
  v_prep_cost_per_car := CASE WHEN COALESCE(p_row.volume_vendas,0) > 0 THEN COALESCE(p_row.ded_preparacao,0) / p_row.volume_vendas ELSE 0 END;
  v_posvenda_per_car := CASE WHEN COALESCE(p_row.volume_vendas,0) > 0 THEN COALESCE(p_row.exp_pos_venda,0) / p_row.volume_vendas ELSE 0 END;
  v_profit_per_car := CASE WHEN COALESCE(p_row.volume_vendas,0) > 0 THEN v_net_profit / p_row.volume_vendas ELSE 0 END;
  v_rentability := CASE WHEN COALESCE(p_row.capital_proprio,0) > 0 THEN v_net_profit / p_row.capital_proprio ELSE 0 END;

  RETURN jsonb_build_object(
    'gross_margin', v_gross_margin,
    'total_deductions', v_total_deductions,
    'net_sales_margin', v_net_sales_margin,
    'other_revenue', v_other_revenue,
    'gross_profit', v_gross_profit,
    'total_payroll', v_total_payroll,
    'total_fixed', v_total_fixed,
    'pro_labore', COALESCE(p_row.pro_labore,0),
    'total_expenses', v_total_expenses,
    'net_profit', v_net_profit,
    'avg_ticket', ROUND(v_avg_ticket, 2),
    'margin_per_car', ROUND(v_margin_per_car, 2),
    'net_margin_per_car', ROUND(v_net_margin_per_car, 2),
    'prep_cost_per_car', ROUND(v_prep_cost_per_car, 2),
    'posvenda_per_car', ROUND(v_posvenda_per_car, 2),
    'profit_per_car', ROUND(v_profit_per_car, 2),
    'rentability', ROUND(v_rentability, 4)
  );
END;
$$;
