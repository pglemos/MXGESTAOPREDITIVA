import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const PMR_STEPS = [
  {
    visit_number: 1,
    program_key: 'pmr_7',
    objective: 'DIAGNÓSTICO E INDICADORES QUANTITATIVOS',
    target: 'Proprietário e Gerente',
    duration: '4 horas',
    evidence_required: 'Print do CRM (Funil do Trimestre)',
    checklist_template: ['Coletar vendas últimos 3 meses', 'Validar investimento em marketing', 'Auditar estoque total e por idade', 'Mapear equipe de vendas atual']
  },
  {
    visit_number: 2,
    program_key: 'pmr_7',
    objective: 'PLANEJAMENTO ESTRATÉGICO E METODOLOGIA MULTICANAL',
    target: 'Toda a Equipe',
    duration: '6 horas',
    evidence_required: 'Foto da Gestão à Vista instalada',
    checklist_template: ['Definir meta mensal e individual', 'Instalar quadro de gestão à vista', 'Treinar metodologia Leads/Agd/Visita', 'Configurar CRM com novos parâmetros']
  },
  {
    visit_number: 3,
    program_key: 'pmr_7',
    objective: 'RITUAL DE ROTINAS (DISCIPLINA)',
    target: 'Gerente e Vendedores',
    duration: '3 horas',
    evidence_required: 'Print do preenchimento do SGAP',
    checklist_template: ['Validar reunião matinal 09:30', 'Auditar preenchimento diário SGAP', 'Mapear horários de feedback imediato', 'Definir ritual de auditoria de CRM']
  },
  {
    visit_number: 4,
    program_key: 'pmr_7',
    objective: 'FEEDBACK ESTRUTURADO E CULTURA DE RESULTADO',
    target: 'Individual por Vendedor',
    duration: '3 horas',
    evidence_required: 'Log de feedback assinado no CRM',
    checklist_template: ['Realizar análise de funil individual', 'Identificar gargalo (Leads vs Agd)', 'Pactuar meta-compromisso semanal', 'Registrar pontos de melhoria em CRM']
  },
  {
    visit_number: 5,
    program_key: 'pmr_7',
    objective: 'TREINAMENTO DE TÉCNICAS DE VENDAS',
    target: 'Vendedores',
    duration: '4 horas',
    evidence_required: 'Vídeo ou Foto do treinamento prático',
    checklist_template: ['Treinar contorno de objeções', 'Validar script de abordagem digital', 'Simular fechamento agressivo', 'Mapear uso de gatilhos mentais']
  },
  {
    visit_number: 6,
    program_key: 'pmr_7',
    objective: 'REVISÃO DE METAS E PROJEÇÃO (RUN-RATE)',
    target: 'Proprietário e Gerente',
    duration: '3 horas',
    evidence_required: 'Print da planilha de projeção ajustada',
    checklist_template: ['Analisar run-rate atual do mês', 'Ajustar investimento em tráfego se necessário', 'Rever metas individuais (subida/descida)', 'Pactuar plano de ataque para reta final']
  },
  {
    visit_number: 7,
    program_key: 'pmr_7',
    objective: 'AUDITORIA FINAL E PDI',
    target: 'Individual / Gestor',
    duration: '4 horas',
    evidence_required: 'Relatório Final assinado (PDF)',
    checklist_template: ['Auditoria final de higiene de CRM', 'Verificar tempo médio de preparação', 'Validar ritual de pós-venda ativo', 'Criar PDI (Plano de Carreira) da equipe']
  }
]

async function seed() {
  console.log('Sincronizando metodologia PMR MX...')
  
  // Limpar steps antigos do programa padrão
  await supabase.from('etapas_modelo_visita_consultoria').delete().eq('program_key', 'pmr_7')
  
  const { error } = await supabase.from('etapas_modelo_visita_consultoria').insert(
    PMR_STEPS.map(s => ({ ...s, active: true }))
  )

  if (error) console.error('Erro ao sincronizar:', error)
  else console.log('Metodologia PMR sincronizada com sucesso!')
}

seed()
