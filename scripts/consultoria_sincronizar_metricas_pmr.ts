import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { derivePmrMetricResults } from '../src/lib/consultoria/pmr-engine'

dotenv.config()

type SupabaseScriptClient = ReturnType<typeof createClient<any>>

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (name: string) => {
    const index = args.indexOf(name)
    return index >= 0 ? args[index + 1] : undefined
  }
  return {
    clientId: get('--client-id'),
    all: args.includes('--all'),
    dryRun: args.includes('--dry-run'),
  }
}

function envClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.VITE_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) throw new Error('Configure SUPABASE_URL/VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_ANON_KEY.')
  return createClient(supabaseUrl, supabaseKey)
}

async function getClientIds(supabase: SupabaseScriptClient, args: ReturnType<typeof parseArgs>) {
  if (args.clientId) return [args.clientId]
  if (!args.all) throw new Error('Use --client-id UUID ou --all.')

  const { data, error } = await supabase
    .from('clientes_consultoria')
    .select('id')
    .in('status', ['active', 'ativo', 'em_andamento'])

  if (error) throw error
  return ((data || []) as Array<{ id: string }>).map((client) => client.id)
}

async function syncClient(supabase: SupabaseScriptClient, clientId: string, dryRun: boolean) {
  const [marketingRes, salesRes, inventoryRes, financialsRes] = await Promise.all([
    supabase.from('marketing_mensal_consultoria').select('*').eq('client_id', clientId).order('reference_month', { ascending: false }),
    supabase.from('entradas_vendas_consultoria').select('*').eq('client_id', clientId).order('sale_date', { ascending: false }),
    supabase.from('snapshots_estoque_consultoria').select('*').eq('client_id', clientId).order('reference_month', { ascending: false }),
    supabase.from('financeiro_consultoria').select('*').eq('client_id', clientId).order('reference_date', { ascending: false }),
  ])

  const fetchError = marketingRes.error || salesRes.error || inventoryRes.error || financialsRes.error
  if (fetchError) throw fetchError

  const results = derivePmrMetricResults({
    clientId,
    marketing: marketingRes.data || [],
    sales: salesRes.data || [],
    inventory: inventoryRes.data || [],
    financials: financialsRes.data || [],
    source: 'automatic',
  })

  if (dryRun) {
    return {
      clientId,
      derived: results.length,
      metrics: results.map((result) => ({
        metric_key: result.metric_key,
        reference_date: result.reference_date,
        result_value: result.result_value,
      })),
    }
  }

  if (results.length) {
    const { error } = await supabase.from('resultados_metricas_cliente').upsert(
      results.map((result) => ({
        client_id: clientId,
        metric_key: result.metric_key,
        reference_date: result.reference_date,
        result_value: result.result_value,
        source: 'automatic',
        source_payload: result.source_payload,
      })),
      { onConflict: 'client_id,metric_key,reference_date,source' }
    )
    if (error) throw error
  }

  return { clientId, derived: results.length }
}

async function main() {
  const args = parseArgs()
  const supabase = envClient()
  const clientIds = await getClientIds(supabase, args)
  const summaries = []

  for (const clientId of clientIds) {
    summaries.push(await syncClient(supabase, clientId, args.dryRun))
  }

  if (args.dryRun) {
    console.log(JSON.stringify(summaries, null, 2))
    return
  }

  const total = summaries.reduce((sum, item) => sum + item.derived, 0)
  console.log(`Sincronização PMR concluída. Clientes: ${summaries.length}. Indicadores atualizados: ${total}.`)
}

main().catch((error) => {
  console.error('Falha ao sincronizar métricas PMR:', error.message || error)
  process.exit(1)
})
