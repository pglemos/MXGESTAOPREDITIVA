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

  const [clientRes, plansRes, responsesRes, actionsRes, metricsRes] = await Promise.all([
    supabase.from('consulting_clients').select('*').eq('id', args.clientId).single(),
    supabase.from('consulting_strategic_plans').select('*').eq('client_id', args.clientId).order('generated_at', { ascending: false }).limit(1),
    supabase.from('consulting_pmr_form_responses').select('*, template:consulting_pmr_form_templates(*)').eq('client_id', args.clientId).order('submitted_at', { ascending: false }),
    supabase.from('consulting_action_items').select('*').eq('client_id', args.clientId).order('priority', { ascending: true }),
    supabase.from('consulting_client_metric_results').select('*, metric:consulting_metric_catalog(*)').eq('client_id', args.clientId).order('reference_date', { ascending: false }),
  ])

  const fetchError = clientRes.error || plansRes.error || responsesRes.error || actionsRes.error || metricsRes.error
  if (fetchError) throw fetchError

  const latestPlan = plansRes.data?.[0] || null
  const openActions = (actionsRes.data || []).filter((action) => action.status !== 'realizado')
  const topMetrics = (metricsRes.data || []).slice(0, 8).map((metric) => ({
    label: metric.metric?.label || metric.metric_key,
    value: metric.result_value,
    reference_date: metric.reference_date,
  }))

  const summary = {
    client: clientRes.data.name,
    generated_at: new Date().toISOString(),
    headline: latestPlan?.diagnosis_summary || `${clientRes.data.name}: resumo gerado a partir do diagnostico PMR nativo.`,
    diagnostics: (responsesRes.data || []).slice(0, 4).map((response) => ({
      form: response.template?.title || response.template_id,
      respondent: response.respondent_name,
      summary: response.summary,
    })),
    indicators: topMetrics,
    action_plan: {
      total: actionsRes.data?.length || 0,
      open: openActions.length,
      top_priorities: openActions.slice(0, 5).map((action) => ({
        priority: action.priority,
        action: action.action,
        owner_name: action.owner_name,
        due_date: action.due_date,
      })),
    },
  }

  const contentMd = [
    `# Resumo Executivo PMR - ${summary.client}`,
    '',
    `Gerado em: ${summary.generated_at}`,
    '',
    '## Sintese',
    summary.headline,
    '',
    '## Diagnostico',
    ...(summary.diagnostics.length ? summary.diagnostics.map((item) => `- ${item.form}: ${item.summary || 'Sem resumo registrado.'}`) : ['- Sem entrevistas registradas.']),
    '',
    '## Indicadores',
    ...(summary.indicators.length ? summary.indicators.map((item) => `- ${item.label}: ${item.value} (${item.reference_date})`) : ['- Sem indicadores realizados registrados.']),
    '',
    '## Plano de Acao',
    `Total de acoes: ${summary.action_plan.total}`,
    `Acoes abertas: ${summary.action_plan.open}`,
    ...(summary.action_plan.top_priorities.length ? summary.action_plan.top_priorities.map((item) => `- P${item.priority}: ${item.action} (${item.owner_name || 'sem responsavel'})`) : ['- Sem acoes abertas.']),
  ].join('\n')

  if (args.dryRun) {
    console.log(contentMd)
    console.log('\n--- payload ---')
    console.log(JSON.stringify(summary, null, 2))
    return
  }

  const { error: artifactError } = await supabase.from('consulting_generated_artifacts').insert({
    client_id: args.clientId,
    strategic_plan_id: latestPlan?.id || null,
    artifact_type: 'executive_summary',
    title: `Resumo Executivo PMR - ${clientRes.data.name}`,
    content_md: contentMd,
    payload: summary,
  })

  if (artifactError) throw artifactError
  console.log(`Resumo executivo PMR gerado para ${clientRes.data.name}.`)
}

main().catch((error) => {
  console.error('Falha ao gerar resumo executivo PMR:', error.message || error)
  process.exit(1)
})
