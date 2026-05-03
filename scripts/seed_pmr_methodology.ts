import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

loadEnv()

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
    objective: 'Diagnóstico',
    target: 'Todos',
    duration: '1 dia',
    evidence_required: 'Formulários de dono, gerente, vendedor e processos preenchidos; dados enviados',
    checklist_template: ['Entrevista Vendedores, Gerentes e Sócios', 'Análise de Processos', 'Levantamento de dados e indicadores base', 'Anexar evidências do diagnóstico']
  },
  {
    visit_number: 2,
    program_key: 'pmr_7',
    objective: 'Planejamento Estratégico, Metodologia Multicanal e Gestão à Vista',
    target: 'Toda a Equipe',
    duration: '1 dia',
    evidence_required: 'Validação do planejamento no sistema; foto do treinamento e vendedores cadastrados',
    checklist_template: ['Apresentação do Planejamento', 'Implementação da Metodologia Multicanal', 'Treinamento Método Vendedor Profissional', 'Acompanhamento Diário de Vendas', 'Gestão à Vista', 'Reforçar área do cliente no sistema', 'Reforçar ações de contratação e treinamento de novos vendedores']
  },
  {
    visit_number: 3,
    program_key: 'pmr_7',
    objective: 'Rotina do Gerente e Rotina do Vendedor',
    target: 'Gerente e Vendedores',
    duration: '3 horas',
    evidence_required: 'Foto da rotina impressa e fixada em local visível; foto do treinamento',
    checklist_template: ['Implementar a Rotina do Gerente', 'Implementar a Rotina do Vendedor', 'Verificar se o novo plano de remuneração foi avaliado']
  },
  {
    visit_number: 4,
    program_key: 'pmr_7',
    objective: 'Feedback Estruturado e Cultura de Resultado',
    target: 'Proprietário e Gerente',
    duration: '3 horas',
    evidence_required: 'Relatório de feedback por vendedor; print do ranking e da gestão à vista no grupo da empresa',
    checklist_template: ['Implementar o Feedback Estruturado', 'Implementar Cultura de Resultados', 'Avaliar se novos vendedores foram contratados e se o processo foi seguido']
  },
  {
    visit_number: 5,
    program_key: 'pmr_7',
    objective: 'Plano de Desenvolvimento Individual (PDI)',
    target: 'Vendedor e Gerente',
    duration: '3 horas',
    evidence_required: 'Todos os PDIs no sistema',
    checklist_template: ['Implementar o PDI da equipe e do Gerente', 'Enviar relatório da performance nos treinamentos', 'Registrar termo de compromisso e ação inicial por pessoa']
  },
  {
    visit_number: 6,
    program_key: 'pmr_7',
    objective: 'Posicionamento de Marketing, Estratégia de Conteúdo e Tráfego Pago',
    target: 'Proprietário e Marketing',
    duration: '3 horas',
    evidence_required: 'Foto da apresentação e definição dos responsáveis e datas',
    checklist_template: ['Apresentação do conteúdo', 'Definição dos responsáveis pela execução', 'Definição do prazo de início', 'Validar canais, criativos, verba e métricas de tráfego pago']
  },
  {
    visit_number: 7,
    program_key: 'pmr_7',
    objective: 'Análise das Implementações e Plano de Ação Trimestral',
    target: 'Proprietário',
    duration: '3 horas',
    evidence_required: 'Plano de ação atualizado',
    checklist_template: ['Analisar resultado do trimestre', 'Apresentar os pontos positivos e a melhorar', 'Solicitar feedback', 'Revisar processos críticos implementados', 'Criar plano de ação dos próximos 3 meses', 'Apresentar o modelo de acompanhamento online']
  }
]

async function seed() {
  console.log('Sincronizando metodologia PMR MX...')

  await supabase.from('programas_visita_consultoria').upsert({
    program_key: 'pmr_7',
    name: 'PMR - 7 Visitas',
    total_visits: 7,
    active: true,
  }, { onConflict: 'program_key' })

  await supabase.from('programas_visita_consultoria').update({ active: false }).eq('program_key', 'pmr_9')
  await supabase.from('etapas_modelo_visita_consultoria').update({ active: false }).eq('program_key', 'pmr_9')
  await supabase.from('clientes_consultoria').update({ program_template_key: 'pmr_7' }).eq('program_template_key', 'pmr_9')
  
  // Limpar steps antigos do programa padrão
  await supabase.from('etapas_modelo_visita_consultoria').delete().eq('program_key', 'pmr_7')
  
  const { error } = await supabase.from('etapas_modelo_visita_consultoria').insert(
    PMR_STEPS.map(s => ({ ...s, active: true }))
  )

  if (error) console.error('Erro ao sincronizar:', error)
  else console.log('Metodologia PMR sincronizada com sucesso!')
}

seed()
