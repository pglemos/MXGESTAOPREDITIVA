import { z } from 'zod'

export const DREFinancialSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string(),
  reference_date: z.string(),
  revenue_proprios: z.number(),
  revenue_consignados: z.number(),
  revenue_repasse: z.number(),
  ded_preparacao: z.number(),
  ded_comissoes: z.number(),
  ded_impostos: z.number(),
  other_revenue_financiamento: z.number(),
  other_revenue_outros1: z.number(),
  other_revenue_outros2: z.number(),
  other_revenue_outros3: z.number(),
  payroll_salarios: z.number(),
  payroll_inss: z.number(),
  payroll_fgts: z.number(),
  payroll_seguro_social: z.number(),
  payroll_tempo_servico: z.number(),
  payroll_13salario: z.number(),
  payroll_ferias: z.number(),
  payroll_indenizacao: z.number(),
  payroll_outros: z.number(),
  pro_labore: z.number(),
  exp_fornecedores: z.number(),
  exp_agua: z.number(),
  exp_limpeza: z.number(),
  exp_viagens: z.number(),
  exp_energia: z.number(),
  exp_telefone: z.number(),
  exp_contabilidade: z.number(),
  exp_aluguel: z.number(),
  exp_frete: z.number(),
  exp_contribuicoes: z.number(),
  exp_terceiros: z.number(),
  exp_marketing: z.number(),
  exp_iptu: z.number(),
  exp_combustivel: z.number(),
  exp_manutencao_imovel: z.number(),
  exp_seguranca: z.number(),
  exp_cartorio: z.number(),
  exp_pos_venda: z.number(),
  exp_ir_csll: z.number(),
  exp_sistemas: z.number(),
  exp_emprestimo_pf: z.number(),
  exp_emprestimo_pj: z.number(),
  exp_tarifas: z.number(),
  exp_informatica: z.number(),
  exp_treinamentos: z.number(),
  exp_outras: z.number(),
  volume_vendas: z.number(),
  capital_proprio: z.number(),
  revenue: z.number(),
  fixed_expenses: z.number(),
  marketing_expenses: z.number(),
  investments: z.number(),
  financing: z.number(),
  net_profit: z.number(),
  roi: z.number(),
  conversion_rate: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type DREFinancial = z.infer<typeof DREFinancialSchema>

export function parseDREFinancial(data: unknown): DREFinancial {
  return DREFinancialSchema.parse(data)
}

export function parseDREFinancialArray(data: unknown): DREFinancial[] {
  return z.array(DREFinancialSchema).parse(data)
}

export const DREComputedSchema = z.object({
  gross_margin: z.number(),
  total_deductions: z.number(),
  net_sales_margin: z.number(),
  other_revenue: z.number(),
  gross_profit: z.number(),
  total_payroll: z.number(),
  total_fixed: z.number(),
  pro_labore: z.number(),
  total_expenses: z.number(),
  net_profit: z.number(),
  avg_ticket: z.number(),
  margin_per_car: z.number(),
  net_margin_per_car: z.number(),
  prep_cost_per_car: z.number(),
  posvenda_per_car: z.number(),
  profit_per_car: z.number(),
  rentability: z.number(),
  cac: z.number(),
})

export type DREComputed = z.infer<typeof DREComputedSchema>
