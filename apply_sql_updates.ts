import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://fbhcmzzgwjdgkctlfvbo.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaGNtenpnd2pkZ2tjdGxmdmJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk1NDI1MiwiZXhwIjoyMDg3NTMwMjUyfQ.XMgPD1xn75n4pDQJf6Q9e7bheFxi9_enelcKocWsfpQ"

const supabase = createClient(supabaseUrl, supabaseKey)

const templates = [
  {
    form_key: 'owner',
    title: 'Diagnóstico - Dono/Sócio',
    target_role: 'dono',
    fields: [
      {"key": "macro_vision", "label": "Visão Macro e Potencial", "type": "textarea", "required": true},
      {"key": "monthly_meta_goal", "label": "Meta Mensal Desejada (Vendas)", "type": "number", "required": true},
      {"key": "owner_dependency", "label": "Dependência do Dono (Quanto a operação depende dele)", "type": "scale", "required": true},
      {"key": "partner_alignment", "label": "Alinhamento e Sinergia Societária", "type": "scale", "required": true},
      {"key": "business_stage", "label": "Estágio Atual do Negócio", "type": "select", "options": ["Sobrevivência", "Intermediário", "Boa Prática"], "required": true},
      {"key": "strategic_clarity", "label": "Clareza Estratégica", "type": "scale"},
      {"key": "long_term_vision", "label": "Visão de Longo Prazo", "type": "scale"},
      {"key": "investment_traps", "label": "Principais Travas de Investimento/Decisão", "type": "textarea"}
    ],
    active: true
  },
  {
    form_key: 'manager',
    title: 'Diagnóstico - Gerente',
    target_role: 'gerente',
    fields: [
      {"key": "manager_autonomy", "label": "Autonomia Gerencial e Flexibilidade de Preço", "type": "scale", "required": true},
      {"key": "daily_followup", "label": "Acompanhamento Diário de Vendas", "type": "scale", "required": true},
      {"key": "team_training_process", "label": "Processo de Treinamento da Equipe", "type": "scale", "required": true},
      {"key": "team_dev_process", "label": "Processo de Desenvolvimento da Equipe", "type": "scale", "required": true},
      {"key": "manager_team_synergy", "label": "Sinergia entre Equipe e Gerente", "type": "scale", "required": true},
      {"key": "manager_owner_synergy", "label": "Sinergia entre Gerente e Donos", "type": "scale", "required": true},
      {"key": "recruitment_process", "label": "Processo de Contratação de Vendedores", "type": "scale"},
      {"key": "feedback_routine", "label": "Rotina de Feedback Individual", "type": "scale"},
      {"key": "operational_focus", "label": "Foco no Operacional (Gargalo de Liderança)", "type": "scale"}
    ],
    active: true
  },
  {
    form_key: 'seller',
    title: 'Diagnóstico - Vendedor',
    target_role: 'vendedor',
    fields: [
      {"key": "crm_funnel_usage", "label": "Uso do CRM e Gestão de Funil", "type": "scale", "required": true},
      {"key": "online_service", "label": "Qualidade do Atendimento Online", "type": "scale", "required": true},
      {"key": "in_person_service", "label": "Qualidade do Atendimento Presencial", "type": "scale", "required": true},
      {"key": "lead_to_appointment", "label": "Conversão de Leads em Agendamentos", "type": "scale", "required": true},
      {"key": "referral_sales", "label": "Canal de Vendas – Indicação", "type": "scale"},
      {"key": "seller_wallet", "label": "Canal de Vendas – Carteira do Vendedor", "type": "scale"},
      {"key": "result_culture", "label": "Cultura de Resultado (Comprometimento)", "type": "scale"},
      {"key": "team_climate", "label": "Clima e Motivação da Equipe", "type": "scale"},
      {"key": "compensation_plan", "label": "Satisfação com Plano de Remuneração", "type": "scale"},
      {"key": "main_limitator", "label": "Principal Limitador de Vendas Individual", "type": "textarea"}
    ],
    active: true
  },
  {
    form_key: 'process',
    title: 'Diagnóstico - Processos',
    target_role: 'processo',
    fields: [
      {"key": "traffic_leads_strategy", "label": "Estratégia de Tráfego Pago e Leads", "type": "scale", "required": true},
      {"key": "instagram_innovation", "label": "Instagram: Frequência, Qualidade e Inovação", "type": "scale", "required": true},
      {"key": "branding_investment", "label": "Investimento em Branding", "type": "scale"},
      {"key": "ad_photo_quality", "label": "Qualidade das Fotos dos Anúncios", "type": "scale"},
      {"key": "lead_distribution_system", "label": "Sistema de Distribuição de Leads", "type": "scale"},
      {"key": "vehicle_preparation", "label": "Processo de Preparação de Veículos", "type": "scale", "required": true},
      {"key": "post_sale_process", "label": "Processo de Pós-Venda", "type": "scale", "required": true},
      {"key": "trade_in_evaluation", "label": "Processo de Avaliação de Usado na Troca", "type": "scale", "required": true},
      {"key": "inventory_90_days", "label": "Gestão de Veículos +90 dias no Estoque", "type": "scale"},
      {"key": "pricing_autonomy_process", "label": "Processo de Precificação e Margem", "type": "scale"}
    ],
    active: true
  }
]

async function run() {
  for (const template of templates) {
    console.log(`Updating template: ${template.title} (${template.form_key})`)
    const { error } = await supabase
      .from('consulting_pmr_form_templates')
      .upsert(template, { onConflict: 'form_key' })
    
    if (error) {
      console.error(`Error updating ${template.form_key}:`, error.message)
      process.exit(1)
    }
  }
  console.log('Successfully updated all templates.')
}

run().catch(err => {
  console.error('Execution error:', err)
  process.exit(1)
})
