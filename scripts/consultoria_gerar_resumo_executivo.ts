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

  const [clientRes, plansRes, responsesRes, actionsRes] = await Promise.all([
    supabase.from('clientes_consultoria').select('*').eq('id', args.clientId).single(),
    supabase.from('planejamentos_estrategicos').select('*').eq('client_id', args.clientId).order('generated_at', { ascending: false }).limit(1),
    supabase.from('respostas_formulario_pmr').select('*, template:modelos_formulario_pmr(*)').eq('client_id', args.clientId).order('submitted_at', { ascending: false }),
    supabase.from('itens_plano_acao').select('*').eq('client_id', args.clientId).order('priority', { ascending: true }),
  ])

  const fetchError = clientRes.error || plansRes.error || responsesRes.error || actionsRes.error
  if (fetchError) throw fetchError

  const latestPlan = plansRes.data?.[0] || null
  const actions = actionsRes.data || []
  
  // Categorize responses by role
  const getResp = (role: string) => responsesRes.data?.find(r => r.respondent_role?.toLowerCase().includes(role.toLowerCase())) || null

  const donoResp = getResp('dono') || getResp('socio') || responsesRes.data?.[0]
  const gerenteResp = getResp('gerente')
  const vendedorResp = getResp('vendedor')
  const processoResp = getResp('processo')

  const summary = {
    client: clientRes.data.name,
    generated_at: new Date().toISOString(),
    headline: latestPlan?.diagnosis_summary || `${clientRes.data.name}: resumo gerado a partir do diagnostico PMR nativo.`,
    diagnostics: {
        dono: donoResp ? { name: donoResp.respondent_name, summary: donoResp.summary } : null,
        gerente: gerenteResp ? { name: gerenteResp.respondent_name, summary: gerenteResp.summary } : null,
        vendedor: vendedorResp ? { name: vendedorResp.respondent_name, summary: vendedorResp.summary } : null,
        processos: processoResp ? { name: processoResp.respondent_name, summary: processoResp.summary } : null,
    },
    action_plan: {
      total: actions.length,
      priorities: actions.reduce((acc, curr) => {
          if (!acc[curr.priority]) acc[curr.priority] = []
          acc[curr.priority].push(curr.action)
          return acc
      }, {} as Record<number, string[]>)
    },
  }

  const contentMd = [
    `# RELATÓRIO EXECUTIVO DE DIAGNÓSTICO`,
    `**Programa PMR – Programa de Maximização de Resultados**`,
    `**Empresa:** ${summary.client}`,
    `**Data:** ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
    '',
    `---`,
    '',
    `## 1. VISÃO GERAL DO NEGÓCIO`,
    summary.headline,
    '',
    `---`,
    '',
    `## 2. DIAGNÓSTICO ESTRATÉGICO DOS SÓCIOS`,
    summary.diagnostics.dono ? `**${summary.diagnostics.dono.name || 'Sócio/Dono'} (visão macro e potencial)**\n${summary.diagnostics.dono.summary}` : `*(Diagnóstico de Sócio pendente)*`,
    '',
    `---`,
    '',
    `## 3. DIAGNÓSTICO GERENCIAL`,
    summary.diagnostics.gerente ? `**${summary.diagnostics.gerente.name || 'Gerente'}**\n${summary.diagnostics.gerente.summary}` : `*(Diagnóstico Gerencial pendente)*`,
    '',
    `---`,
    '',
    `## 4. DIAGNÓSTICO COMERCIAL (VENDEDORES)`,
    summary.diagnostics.vendedor ? `**Equipe de Vendas**\n${summary.diagnostics.vendedor.summary}` : `*(Diagnóstico Comercial pendente)*`,
    '',
    `---`,
    '',
    `## 5. DIAGNÓSTICO DE PROCESSOS`,
    summary.diagnostics.processos ? `${summary.diagnostics.processos.summary}` : `*(Diagnóstico de Processos pendente)*`,
    '',
    `---`,
    '',
    `## 6. PRINCIPAIS GARGALOS`,
    `- Identificados na Visão Geral e nas entrevistas. (Consolidado automático pendente da IA)`,
    '',
    `---`,
    '',
    `## 7. RISCOS DO NEGÓCIO`,
    `- Identificados nas entrevistas. (Consolidado automático pendente da IA)`,
    '',
    `---`,
    '',
    `## 8. DIRECIONAMENTO ESTRATÉGICO (PMR)`,
    ...Object.entries(summary.action_plan.priorities as Record<string, string[]>).map(([priority, acts]) => {
        return `\n**PRIORIDADE ${priority}**\n` + acts.map(a => `• ${a}`).join('\n')
    }),
    '',
    `---`,
    '',
    `## CONCLUSÃO EXECUTIVA`,
    `A ${summary.client} possui potencial que será destravado mediante execução rigorosa da gestão.`,
    '',
    `## DIAGNÓSTICO FINAL (DIRETO)`,
    `👉 O gargalo não está no mercado`,
    `👉 Está dentro da operação`
  ].join('\n')

  if (args.dryRun) {
    console.log(contentMd)
    console.log('\n--- payload ---')
    console.log(JSON.stringify(summary, null, 2))
    return
  }

  const { error: artifactError } = await supabase.from('artefatos_gerados_consultoria').insert({
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
