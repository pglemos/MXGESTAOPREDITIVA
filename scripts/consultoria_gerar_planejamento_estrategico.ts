import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import {
  buildPmrMetricViews,
  buildPmrStrategicPlan,
  derivePmrMetricResults,
  mapRecommendationsToInsert,
  mergeLatestPmrResults,
} from '../src/lib/consultoria/pmr-engine'

dotenv.config()

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (name: string) => {
    const index = args.indexOf(name)
    return index >= 0 ? args[index + 1] : undefined
  }
  return {
    clientId: get('--client-id'),
    dryRun: args.includes('--dry-run'),
  }
}

function envClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.VITE_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) throw new Error('Configure SUPABASE_URL/VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_ANON_KEY.')
  return createClient(supabaseUrl, supabaseKey)
}

async function main() {
  const args = parseArgs()
  if (!args.clientId) throw new Error('Use --client-id UUID')
  const supabase = envClient()

  const [clientRes, responsesRes, metricsRes, catalogRes, parameterSetRes, actionsRes, marketingRes, salesRes, inventoryRes, financialsRes] = await Promise.all([
    supabase.from('clientes_consultoria').select('*').eq('id', args.clientId).single(),
    supabase.from('respostas_formulario_pmr').select('*, template:modelos_formulario_pmr(*)').eq('client_id', args.clientId),
    supabase.from('resultados_metricas_cliente').select('*, metric:catalogo_metricas_consultoria(*)').eq('client_id', args.clientId).order('reference_date', { ascending: false }),
    supabase.from('catalogo_metricas_consultoria').select('*').eq('active', true).order('sort_order', { ascending: true }),
    supabase.from('conjuntos_parametros_consultoria').select('*, values:valores_parametros_consultoria(*)').eq('active', true).maybeSingle(),
    supabase.from('itens_plano_acao').select('*').eq('client_id', args.clientId),
    supabase.from('marketing_mensal_consultoria').select('*').eq('client_id', args.clientId).order('reference_month', { ascending: false }),
    supabase.from('entradas_vendas_consultoria').select('*').eq('client_id', args.clientId).order('sale_date', { ascending: false }),
    supabase.from('snapshots_estoque_consultoria').select('*').eq('client_id', args.clientId).order('reference_month', { ascending: false }),
    supabase.from('financeiro_consultoria').select('*').eq('client_id', args.clientId).order('reference_date', { ascending: false }),
  ])

  const fetchError = clientRes.error || responsesRes.error || metricsRes.error || catalogRes.error || parameterSetRes.error || actionsRes.error || marketingRes.error || salesRes.error || inventoryRes.error || financialsRes.error
  if (fetchError) throw fetchError

  const parameterByMetric = new Map<string, any>()
  for (const value of parameterSetRes.data?.values || []) {
    parameterByMetric.set(value.metric_key, value)
  }

  const derivedResults = derivePmrMetricResults({
    clientId: args.clientId,
    marketing: marketingRes.data || [],
    sales: salesRes.data || [],
    inventory: inventoryRes.data || [],
    financials: financialsRes.data || [],
    source: 'automatic',
  })
  const latestResults = mergeLatestPmrResults(metricsRes.data || [], derivedResults)
  const metricRows = buildPmrMetricViews({
    catalog: catalogRes.data || [],
    latestResults,
    parameterByMetric,
  })

  const draft = buildPmrStrategicPlan({
    clientName: clientRes.data.name,
    metricRows,
    diagnostics: responsesRes.data || [],
    existingActions: actionsRes.data || [],
  })
  const payload = {
    ...draft.payload,
    client: {
      id: clientRes.data.id,
      name: clientRes.data.name,
      product_name: clientRes.data.product_name,
    },
    parameter_set: parameterSetRes.data ? {
      name: parameterSetRes.data.name,
      version: parameterSetRes.data.version,
    } : null,
  }

  if (args.dryRun) {
    console.log(draft.markdown)
    console.log('\n--- payload ---')
    console.log(JSON.stringify({ diagnosisSummary: draft.diagnosisSummary, payload }, null, 2))
    return
  }

  const { data: plan, error: planError } = await supabase
    .from('planejamentos_estrategicos')
    .insert({
      client_id: args.clientId,
      title: draft.title,
      diagnosis_summary: draft.diagnosisSummary,
      market_comparison: { metrics: metricRows, critical_gaps: draft.criticalGaps },
      generated_payload: payload,
    })
    .select('id')
    .single()
  if (planError) throw planError

  const { error: artifactError } = await supabase.from('artefatos_gerados_consultoria').insert({
    client_id: args.clientId,
    strategic_plan_id: plan.id,
    artifact_type: 'strategic_plan_markdown',
    title: `Apresentação Planejamento PMR - ${clientRes.data.name}`,
    content_md: draft.markdown,
    payload,
  })
  if (artifactError) throw artifactError

  if (!actionsRes.data?.length && draft.actions.length) {
    const { error: actionError } = await supabase.from('itens_plano_acao').insert(
      mapRecommendationsToInsert(draft.actions, plan.id).map((action) => ({
        client_id: args.clientId,
        ...action,
      }))
    )
    if (actionError) throw actionError
  }

  console.log(`Planejamento PMR gerado: ${plan.id}`)
}

main().catch((error) => {
  console.error('Falha ao gerar planejamento PMR:', error.message || error)
  process.exit(1)
})
