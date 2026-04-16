import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { parseDREFinancialArray, type DREFinancial, type DREComputed } from '@/lib/schemas/dre.schema'

function computeDRE(f: Partial<DREFinancial>): DREComputed {
  const v = (n: number | undefined | null) => n ?? 0
  const gross_margin = v(f.revenue_proprios) + v(f.revenue_consignados) + v(f.revenue_repasse)
  const total_deductions = v(f.ded_preparacao) + v(f.ded_comissoes) + v(f.ded_impostos)
  const net_sales_margin = gross_margin - total_deductions
  const other_revenue = v(f.other_revenue_financiamento) + v(f.other_revenue_outros1) + v(f.other_revenue_outros2) + v(f.other_revenue_outros3)
  const gross_profit = net_sales_margin + other_revenue

  const total_payroll = v(f.payroll_salarios) + v(f.payroll_inss) + v(f.payroll_fgts) + v(f.payroll_seguro_social) + v(f.payroll_tempo_servico) + v(f.payroll_13salario) + v(f.payroll_ferias) + v(f.payroll_indenizacao) + v(f.payroll_outros)
  const total_fixed = v(f.exp_fornecedores) + v(f.exp_agua) + v(f.exp_limpeza) + v(f.exp_viagens) + v(f.exp_energia) + v(f.exp_telefone) + v(f.exp_contabilidade) + v(f.exp_aluguel) + v(f.exp_frete) + v(f.exp_contribuicoes) + v(f.exp_terceiros) + v(f.exp_marketing) + v(f.exp_iptu) + v(f.exp_combustivel) + v(f.exp_manutencao_imovel) + v(f.exp_seguranca) + v(f.exp_cartorio) + v(f.exp_pos_venda) + v(f.exp_ir_csll) + v(f.exp_sistemas) + v(f.exp_emprestimo_pf) + v(f.exp_emprestimo_pj) + v(f.exp_tarifas) + v(f.exp_informatica) + v(f.exp_treinamentos) + v(f.exp_outras)

  const total_expenses = total_payroll + v(f.pro_labore) + total_fixed
  const net_profit = gross_profit - total_expenses

  const vol = v(f.volume_vendas) || 0
  const cap = v(f.capital_proprio) || 0

  return {
    gross_margin,
    total_deductions,
    net_sales_margin,
    other_revenue,
    gross_profit,
    total_payroll,
    total_fixed,
    pro_labore: v(f.pro_labore),
    total_expenses,
    net_profit,
    avg_ticket: vol > 0 ? Math.round((gross_margin / vol) * 100) / 100 : 0,
    margin_per_car: vol > 0 ? Math.round((gross_margin / vol) * 100) / 100 : 0,
    net_margin_per_car: vol > 0 ? Math.round((net_sales_margin / vol) * 100) / 100 : 0,
    prep_cost_per_car: vol > 0 ? Math.round((v(f.ded_preparacao) / vol) * 100) / 100 : 0,
    posvenda_per_car: vol > 0 ? Math.round((v(f.exp_pos_venda) / vol) * 100) / 100 : 0,
    profit_per_car: vol > 0 ? Math.round((net_profit / vol) * 100) / 100 : 0,
    rentability: cap > 0 ? Math.round((net_profit / cap) * 10000) / 10000 : 0,
  }
}

export function useDRE(clientId?: string) {
  const { supabaseUser } = useAuth()
  const [financials, setFinancials] = useState<DREFinancial[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFinancials = useCallback(async () => {
    if (!clientId || !supabaseUser?.id) {
      setFinancials([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('consulting_financials')
      .select('*')
      .eq('client_id', clientId)
      .order('reference_date', { ascending: false })
    if (fetchError) {
      setError(fetchError.message)
      setFinancials([])
    } else {
      setFinancials(parseDREFinancialArray(data || []))
    }
    setLoading(false)
  }, [clientId, supabaseUser?.id])

  const upsertFinancial = useCallback(async (row: Partial<DREFinancial>) => {
    if (!clientId) return false
    setSaving(true)
    setError(null)
    try {
      const payload = { ...row, client_id: clientId }
      const { error: upsertError } = await supabase
        .from('consulting_financials')
        .upsert(payload, { onConflict: 'id' })
      if (upsertError) throw upsertError
      await fetchFinancials()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
      return false
    } finally {
      setSaving(false)
    }
  }, [clientId, fetchFinancials])

  const deleteFinancial = useCallback(async (id: string) => {
    const { error: delError } = await supabase
      .from('consulting_financials')
      .delete()
      .eq('id', id)
    if (delError) {
      setError(delError.message)
      return false
    }
    await fetchFinancials()
    return true
  }, [fetchFinancials])

  useEffect(() => {
    fetchFinancials()
  }, [fetchFinancials])

  const computedMap = useMemo(() => {
    const map = new Map<string, DREComputed>()
    for (const f of financials) {
      map.set(f.id, computeDRE(f))
    }
    return map
  }, [financials])

  return {
    financials,
    computed: computedMap,
    computeDRE,
    loading,
    saving,
    error,
    upsertFinancial,
    deleteFinancial,
    refresh: fetchFinancials,
  }
}

export { computeDRE }
export type { DREComputed }
