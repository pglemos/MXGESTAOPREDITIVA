import type { StoreMetaRules } from '@/types/database'

type StoreSalesRulesInput = {
  storeId?: string | null
  monthlyGoal: number
  metaRules?: StoreMetaRules | null
}

export function buildStoreSalesRules({ storeId, monthlyGoal, metaRules }: StoreSalesRulesInput): StoreMetaRules {
  return {
    store_id: storeId || metaRules?.store_id || '',
    monthly_goal: metaRules?.monthly_goal ?? monthlyGoal,
    individual_goal_mode: metaRules?.individual_goal_mode || 'even',
    include_venda_loja_in_store_total: metaRules?.include_venda_loja_in_store_total ?? true,
    include_venda_loja_in_individual_goal: metaRules?.include_venda_loja_in_individual_goal ?? false,
    bench_lead_agd: metaRules?.bench_lead_agd ?? 20,
    bench_agd_visita: metaRules?.bench_agd_visita ?? 60,
    bench_visita_vnd: metaRules?.bench_visita_vnd ?? 33,
    projection_mode: metaRules?.projection_mode || 'calendar',
    updated_by: metaRules?.updated_by ?? null,
    updated_at: metaRules?.updated_at || new Date(0).toISOString(),
  }
}
