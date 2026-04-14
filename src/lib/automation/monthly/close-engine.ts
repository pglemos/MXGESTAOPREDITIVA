import { supabase } from '@/lib/supabase';
import { somarVendas } from '@/lib/calculations';

interface MonthlyCloseResult {
    store_id: string;
    store_name: string;
    total_sales: number;
    total_leads: number;
    total_agd: number;
    total_visits: number;
    status: 'success' | 'skipped' | 'error';
    error?: string;
}

export async function runMonthlyCloseWorkflow(): Promise<MonthlyCloseResult[]> {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const monthStart = lastMonth.toISOString().slice(0, 10)
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)

    const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('active', true)

    if (storesError || !stores) {
        console.error('[close-engine] Falha ao buscar lojas:', storesError?.message)
        return []
    }

    const results: MonthlyCloseResult[] = []

    for (const store of stores) {
        try {
            const { data: checkins } = await supabase
                .from('daily_checkins')
                .select('*')
                .eq('store_id', store.id)
                .gte('reference_date', monthStart)
                .lte('reference_date', monthEnd)

            if (!checkins || checkins.length === 0) {
                results.push({ store_id: store.id, store_name: store.name, total_sales: 0, total_leads: 0, total_agd: 0, total_visits: 0, status: 'skipped' })
                continue
            }

            const total_sales = somarVendas(checkins)
            const total_leads = checkins.reduce((s, c) => s + (c.leads_prev_day || 0), 0)
            const total_agd = checkins.reduce((s, c) => s + (c.agd_cart_prev_day || 0) + (c.agd_net_prev_day || 0), 0)
            const total_visits = checkins.reduce((s, c) => s + (c.visit_prev_day || 0), 0)

            results.push({ store_id: store.id, store_name: store.name, total_sales, total_leads, total_agd, total_visits, status: 'success' })
        } catch (err) {
            results.push({ store_id: store.id, store_name: store.name, total_sales: 0, total_leads: 0, total_agd: 0, total_visits: 0, status: 'error', error: String(err) })
        }
    }

    console.log(`[close-engine] Fechamento mensal ${monthStart} a ${monthEnd}: ${results.filter(r => r.status === 'success').length}/${results.length} lojas processadas.`)
    return results
}
