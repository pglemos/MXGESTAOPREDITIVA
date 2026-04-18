import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

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

  const [clientRes, responsesRes, metricsRes, parameterSetRes, actionsRes] = await Promise.all([
    supabase.from('consulting_clients').select('*').eq('id', args.clientId).single(),
    supabase.from('consulting_pmr_form_responses').select('*, template:consulting_pmr_form_templates(*)').eq('client_id', args.clientId),
    supabase.from('consulting_client_metric_results').select('*, metric:consulting_metric_catalog(*)').eq('client_id', args.clientId).order('reference_date', { ascending: false }),
    supabase.from('consulting_parameter_sets').select('*, values:consulting_parameter_values(*)').eq('active', true).maybeSingle(),
    supabase.from('consulting_action_items').select('*').eq('client_id', args.clientId),
  ])

  const fetchError = clientRes.error || responsesRes.error || metricsRes.error || parameterSetRes.error || actionsRes.error
  if (fetchError) throw fetchError

  const latestByMetric = new Map<string, any>()
  for (const metricResult of metricsRes.data || []) {
    if (!latestByMetric.has(metricResult.metric_key)) latestByMetric.set(metricResult.metric_key, metricResult)
  }

  const parameterByMetric = new Map<string, any>()
  for (const value of parameterSetRes.data?.values || []) {
    parameterByMetric.set(value.metric_key, value)
  }

  const marketComparison = Array.from(latestByMetric.values()).map((result) => {
    const parameters = parameterByMetric.get(result.metric_key)
    return {
      metric_key: result.metric_key,
      label: result.metric?.label || result.metric_key,
      latest_result: result.result_value,
      reference_date: result.reference_date,
      market_average: parameters?.market_average ?? null,
      best_practice: parameters?.best_practice ?? null,
      gap_to_best_practice: parameters?.best_practice != null ? Number(parameters.best_practice) - Number(result.result_value) : null,
    }
  })

  const payload = {
    client: {
      id: clientRes.data.id,
      name: clientRes.data.name,
      product_name: clientRes.data.product_name,
    },
    generated_at: new Date().toISOString(),
    parameter_set: parameterSetRes.data ? {
      name: parameterSetRes.data.name,
      version: parameterSetRes.data.version,
    } : null,
    diagnostics: (responsesRes.data || []).map((response) => ({
      form: response.template?.title || response.template_id,
      respondent: response.respondent_name,
      summary: response.summary,
      submitted_at: response.submitted_at,
    })),
    market_comparison: marketComparison,
    action_items: actionsRes.data || [],
  }

  const diagnosisSummary = [
    `${payload.client.name}: planejamento gerado por dados PMR nativos.`,
    `${payload.diagnostics.length} entrevistas diagnosticas registradas.`,
    `${payload.market_comparison.length} indicadores com realizado para comparativo.`,
    `${payload.action_items.length} acoes cadastradas no plano de acao.`,
  ].join(' ')

  if (args.dryRun) {
    console.log(JSON.stringify({ diagnosisSummary, payload }, null, 2))
    return
  }

  const { data: plan, error: planError } = await supabase
    .from('consulting_strategic_plans')
    .insert({
      client_id: args.clientId,
      title: `Planejamento PMR - ${payload.client.name}`,
      diagnosis_summary: diagnosisSummary,
      market_comparison: { metrics: marketComparison },
      generated_payload: payload,
    })
    .select('id')
    .single()
  if (planError) throw planError

  const { error: artifactError } = await supabase.from('consulting_generated_artifacts').insert({
    client_id: args.clientId,
    strategic_plan_id: plan.id,
    artifact_type: 'strategic_payload',
    title: `Payload Planejamento PMR - ${payload.client.name}`,
    payload,
  })
  if (artifactError) throw artifactError

  console.log(`Planejamento PMR gerado: ${plan.id}`)
}

main().catch((error) => {
  console.error('Falha ao gerar planejamento PMR:', error.message || error)
  process.exit(1)
})
