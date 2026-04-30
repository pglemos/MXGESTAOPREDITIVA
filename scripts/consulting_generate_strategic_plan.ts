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
    supabase.from('clientes_consultoria').select('*').eq('id', args.clientId).single(),
    supabase.from('consulting_pmr_form_responses').select('*, template:consulting_pmr_form_templates(*)').eq('client_id', args.clientId),
    supabase.from('consulting_client_metric_results').select('*, metric:consulting_metric_catalog(*)').eq('client_id', args.clientId).order('reference_date', { ascending: false }),
    supabase.from('consulting_parameter_sets').select('*, values:consulting_parameter_values(*)').eq('active', true).maybeSingle(),
    supabase.from('itens_plano_acao').select('*').eq('client_id', args.clientId),
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

  // Categorize responses by role for the presentation slides
  const getResp = (role: string) => responsesRes.data?.find(r => r.respondent_role?.toLowerCase().includes(role.toLowerCase())) || null

  const donoResp = getResp('dono') || getResp('socio') || responsesRes.data?.[0]
  const gerenteResp = getResp('gerente')
  const vendedorResp = getResp('vendedor')
  const processoResp = getResp('processo')

  const actions = actionsRes.data || []
  const actionPlanGroups = actions.reduce((acc, curr) => {
      if (!acc[curr.priority]) acc[curr.priority] = []
      acc[curr.priority].push(curr)
      return acc
  }, {} as Record<number, any[]>)

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
    diagnostics: {
        dono: donoResp ? { name: donoResp.respondent_name, summary: donoResp.summary } : null,
        gerente: gerenteResp ? { name: gerenteResp.respondent_name, summary: gerenteResp.summary } : null,
        vendedor: vendedorResp ? { name: vendedorResp.respondent_name, summary: vendedorResp.summary } : null,
        processos: processoResp ? { name: processoResp.respondent_name, summary: processoResp.summary } : null,
    },
    market_comparison: marketComparison,
    action_plan: actionPlanGroups,
    swot: {
        strengths: 'Não informado',
        weaknesses: 'Não informado',
        opportunities: 'Não informado',
        threats: 'Não informado',
    },
  }

  // Generate markdown representing presentation slides
  const slidesMd = [
    `# SLIDE 1: CAPA`,
    `## PLANEJAMENTO ESTRATÉGICO PMR`,
    `**Cliente:** ${payload.client.name}`,
    `**Data:** ${new Date().toLocaleDateString('pt-BR')}`,
    `---`,
    `# SLIDE 2: DIAGNÓSTICO DOS SÓCIOS`,
    payload.diagnostics.dono ? `**${payload.diagnostics.dono.name}**\n${payload.diagnostics.dono.summary}` : `(Sem dados de sócio/dono)`,
    `---`,
    `# SLIDE 3: DIAGNÓSTICO DA LIDERANÇA`,
    payload.diagnostics.gerente ? `**${payload.diagnostics.gerente.name}**\n${payload.diagnostics.gerente.summary}` : `(Sem dados de gerente)`,
    `---`,
    `# SLIDE 4: DIAGNÓSTICO COMERCIAL`,
    payload.diagnostics.vendedor ? `**Equipe de Vendas**\n${payload.diagnostics.vendedor.summary}` : `(Sem dados de vendedores)`,
    `---`,
    `# SLIDE 5: BENCHMARK E MÉTRICAS DE MERCADO`,
    ...payload.market_comparison.map(m => {
        return `- **${m.label}**: Realizado: ${m.latest_result} | Mercado: ${m.market_average || 'N/A'} | Boa Prática: ${m.best_practice || 'N/A'}`
    }),
    `---`,
    `# SLIDE 6: FORÇAS (STRENGTHS)`,
    payload.swot.strengths,
    `---`,
    `# SLIDE 7: FRAQUEZAS (WEAKNESSES)`,
    payload.swot.weaknesses,
    `---`,
    `# SLIDE 8: OPORTUNIDADES (OPPORTUNITIES)`,
    payload.swot.opportunities,
    `---`,
    `# SLIDE 9: AMEAÇAS (THREATS)`,
    payload.swot.threats,
    `---`,
    `# SLIDE 10+: PLANO DE AÇÃO E PRIORIDADES`,
    ...Object.entries(payload.action_plan).map(([priority, acts]) => {
        return `\n### PRIORIDADE ${priority}\n` + (acts as any[]).map(a => `- **Ação:** ${a.action}\n  - **Como:** ${a.how || 'N/A'}\n  - **Resp:** ${a.owner_name || 'N/A'} | **Prazo:** ${a.due_date || 'N/A'}`).join('\n')
    }),
    `---`,
    `# SLIDE FINAL: ENCERRAMENTO`,
    `Próximos passos e assinaturas.`
  ].join('\n')

  const diagnosisSummary = `Planejamento Estratégico gerado nativamente contendo ${payload.market_comparison.length} indicadores mapeados contra as Boas Práticas do Mercado e estruturado em ${Object.keys(payload.action_plan).length} níveis de prioridade.`

  if (args.dryRun) {
    console.log(slidesMd)
    console.log('\n--- payload ---')
    console.log(JSON.stringify({ diagnosisSummary, payload }, null, 2))
    return
  }

  const { data: plan, error: planError } = await supabase
    .from('planejamentos_estrategicos')
    .insert({
      client_id: args.clientId,
      title: `Planejamento Estratégico PMR - ${payload.client.name}`,
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
    title: `Apresentação Planejamento PMR - ${payload.client.name}`,
    content_md: slidesMd,
    payload,
  })
  if (artifactError) throw artifactError

  console.log(`Planejamento PMR gerado: ${plan.id}`)
}

main().catch((error) => {
  console.error('Falha ao gerar planejamento PMR:', error.message || error)
  process.exit(1)
})
