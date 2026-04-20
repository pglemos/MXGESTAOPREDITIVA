import { PmrFormField } from '@/lib/schemas/consulting-client.schema'

export const PMR_FULL_QUESTIONS: Record<string, PmrFormField[]> = {
  vendedor: [
    { key: 'name', label: 'Nome do vendedor', type: 'text', required: true },
    { key: 'unit', label: 'Loja / Unidade', type: 'text', required: true },
    { key: 'role', label: 'Função atual', type: 'select', options: ['Vendedor', 'Pré-Vendedor', 'Marketing', 'Outros'], required: true },
    { key: 'experience_years', label: 'Tempo de mercado (anos)', type: 'number', required: true },
    { key: 'consultant', label: 'Avaliador / Consultor responsável', type: 'select', options: ['Daniel Santos', 'Gedson Freire', 'José Roberto'], required: true },
    
    // 2. Plano de Remuneração
    { key: 'comp_clarity', label: 'Você entende claramente como sua comissão é calculada?', type: 'select', options: ['Sim, totalmente', 'Parcialmente', 'Não entendo'], required: true },
    { key: 'comp_stimulus', label: 'O plano de remuneração:', type: 'select', options: ['Estimula a vender com qualidade', 'Estimula apenas volume', 'Não estimula desempenho'], required: true },
    { key: 'comp_target_knowledge', label: 'Você sabe quanto precisa vender para ganhar acima de R$ 8.000/mês?', type: 'select', options: ['Sim', 'Não'], required: true },
    
    // 3. Rotina
    { key: 'routine_defined', label: 'Existe uma rotina diária definida pela empresa?', type: 'select', options: ['Sim, clara e cobrada', 'Existe, mas não é cobrada', 'Não existe'], required: true },
    { key: 'routine_organization', label: 'Sua rotina diária é:', type: 'select', options: ['Organizada', 'Parcialmente organizada', 'Desorganizada'], required: true },
    { key: 'sales_dedication_hours', label: 'Quantas horas por dia você realmente dedica à venda?', type: 'select', options: ['Menos de 3h', '3 a 5h', 'Mais de 5h'], required: true },
    { key: 'focus_distraction', label: 'O que mais tira seu foco da venda?', type: 'select', options: ['Pós-venda', 'Tarefas administrativas', 'Movimentação de veículos', 'Falta de leads', 'Falta de organização', 'Outro'], required: true },
    
    // 4. Capacidade
    { key: 'sales_capacity', label: 'Quantos carros você acredita ser capaz de vender por mês?', type: 'select', options: ['Até 6', '7 a 10', '11 a 15', 'Acima de 15'], required: true },
    { key: 'sales_current_status', label: 'Hoje, você sente que vende:', type: 'select', options: ['Abaixo da sua capacidade', 'Dentro da sua capacidade', 'No limite máximo'], required: true },
    { key: 'performance_limitator', label: 'O principal fator que limita seu desempenho é:', type: 'select', options: ['Falta de leads', 'Falta de processo', 'Falta de apoio da gestão', 'Falta de estoque adequado', 'Falta de treinamento', 'Outro'], required: true },
    
    // 5. Atendimento Lead
    { key: 'lead_origin', label: 'Todos os leads chegam via:', type: 'select', options: ['CRM', 'WhatsApp pessoal', 'O dono/gerente encaminha', 'Um pré-venda encaminha', 'De forma desorganizada', 'Outro'], required: true },
    { key: 'lead_sla', label: 'Existe um prazo padrão para o primeiro contato com o lead?', type: 'select', options: ['Até 5 minutos', 'Até 30 minutos', 'Até 60 minutos', 'Não existe'], required: true },
    { key: 'lead_followup', label: 'Você costuma acompanhar os clientes que não fecham na hora?', type: 'select', options: ['Sim', 'Não'], required: true },
    { key: 'lead_contacts_avg', label: 'Em média, quantos contatos são feitos por lead?', type: 'select', options: ['1', '2 a 3', '4 ou mais', 'Não existe padrão'], required: true },
    
    // 6. Presencial
    { key: 'in_person_standard', label: 'Existe um padrão de atendimento presencial definido?', type: 'select', options: ['Sim', 'Não'], required: true },
    { key: 'in_person_steps', label: 'Você conduz o cliente por etapas (abordagem, necessidade, apresentação...)?', type: 'select', options: ['Sempre', 'Às vezes', 'Não sigo um padrão'], required: true },
    { key: 'negotiation_closer', label: 'A negociação é fechada na maioria das vezes pelo:', type: 'select', options: ['Vendedor', 'Gerente', 'Ambos', 'Não existe padrão'], required: true },
    
    // 7. Carteira
    { key: 'wallet_sales', label: 'Você costuma vender todo mês para sua carteira de clientes?', type: 'select', options: ['Sim', 'Não'], required: true },
    { key: 'wallet_strategy', label: 'Qual estratégia te gera mais clientes na sua carteira?', type: 'select', options: ['Instagram', 'Marketplace', 'Indicação', 'Parcerias', 'Status WhatsApp', 'Outro'], required: true },
    
    // 8. Cultura
    { key: 'goals_clarity', label: 'As metas são claras para você?', type: 'select', options: ['Sim', 'Parcialmente', 'Não'], required: true },
    { key: 'results_tracking', label: 'O resultado é acompanhado pelo gerente/dono?', type: 'select', options: ['Diariamente', 'Semanalmente', 'Apenas no fechamento'], required: true },
    { key: 'accountability_feeling', label: 'Você sente cobrança por resultado?', type: 'select', options: ['Saudável', 'Excessiva', 'Não existe'], required: true },
    { key: 'team_climate', label: 'O clima da equipe é:', type: 'select', options: ['Muito bom', 'Bom', 'Regular', 'Ruim'], required: true },
    { key: 'observations', label: 'Observações do Consultor', type: 'textarea' }
  ],
  gerente: [
    { key: 'name', label: 'Nome do Gerente', type: 'text', required: true },
    { key: 'unit', label: 'Loja / Unidade', type: 'text', required: true },
    { key: 'role', label: 'Função atual', type: 'select', options: ['Gerente Geral', 'Gerente de Vendas', 'Supervisor de Vendas'], required: true },
    { key: 'tenure', label: 'Há quanto tempo atua como gerente nesta loja?', type: 'select', options: ['Menos de 6 meses', 'Entre 6 meses e 1 ano', 'Entre 1 e 3 anos', 'Mais de 3 anos'], required: true },
    { key: 'previous_leadership', label: 'Você já atuou em cargos de liderança antes?', type: 'select', options: ['Sim', 'Não'], required: true },
    { key: 'previous_sales', label: 'Você já atuou como vendedor antes de assumir a gerência?', type: 'select', options: ['Sim', 'Não'], required: true },
    { key: 'team_size', label: 'Quantos vendedores estão sob sua liderança?', type: 'number', required: true },
    { key: 'other_functions', label: 'Além da gerência, você acumula outras funções?', type: 'textarea' },
    
    // Routine & Process
    { key: 'daily_routine', label: 'Você possui uma rotina gerencial clara (Matinal, SGAP, Feedback)?', type: 'select', options: ['Sim, completa', 'Parcialmente', 'Não possuo'], required: true },
    { key: 'leads_distribution', label: 'Como é feita a distribuição de leads?', type: 'select', options: ['Automática pelo CRM', 'Manual por mim', 'Manual pelo dono', 'Livre (quem pegar pegou)'], required: true },
    { key: 'crm_audit', label: 'Você audita o CRM diariamente?', type: 'select', options: ['Sim', 'Às vezes', 'Raramente/Não'], required: true },
    { key: 'team_training', label: 'Qual a frequência de treinamentos com a equipe?', type: 'select', options: ['Semanal', 'Quinzenal', 'Mensal', 'Não temos rotina'], required: true },
    
    // Indicators
    { key: 'conversion_knowledge', label: 'Você sabe qual a taxa de conversão atual da sua loja?', type: 'select', options: ['Sim, de cor', 'Tenho que olhar no sistema', 'Não tenho certeza'], required: true },
    { key: 'bottleneck_perception', label: 'Qual o maior gargalo da loja hoje?', type: 'select', options: ['Falta de leads', 'Falta de estoque', 'Equipe desmotivada', 'Falta de processo', 'Preço/Margem'], required: true },
    { key: 'observations', label: 'Parecer Técnico do Consultor', type: 'textarea' }
  ],
  dono: [
    { key: 'name', label: 'Nome do Sócio/Dono', type: 'text', required: true },
    { key: 'macro_vision', label: 'Qual sua visão sobre o potencial da loja para este ano?', type: 'textarea', required: true },
    { key: 'monthly_meta', label: 'Qual a meta de vendas mensal desejada?', type: 'number', required: true },
    { key: 'owner_dependency', label: 'A loja roda sem sua presença física?', type: 'select', options: ['Sim, totalmente', 'Em partes (decisões finais)', 'Não, sou o principal motor'], required: true },
    { key: 'business_stage', label: 'Como você define o estágio atual da loja?', type: 'select', options: ['Sobrevivência', 'Crescimento Acelerado', 'Maturidade/Escalabilidade'], required: true },
    { key: 'investment_traps', label: 'Quais as principais travas para investir mais hoje?', type: 'textarea' },
    { key: 'partner_alignment', label: 'Existe alinhamento total entre os sócios?', type: 'select', options: ['Sim, total', 'Parcial', 'Temos divergências', 'Sou sócio único'], required: true },
    { key: 'observations', label: 'Observações do Consultor', type: 'textarea' }
  ],
  processo: [
    { key: 'traffic_strategy', label: 'Estratégia de Tráfego Pago', type: 'select', options: ['Profissional (Agência/Especialista)', 'Eu/Dono fazemos', 'Amador', 'Não fazemos'], required: true },
    { key: 'instagram_quality', label: 'Qualidade do Instagram (Fotos/Vídeos)', type: 'select', options: ['Padrão concessionária', 'Bom', 'Pode melhorar muito', 'Amador'], required: true },
    { key: 'vehicle_prep', label: 'Processo de Preparação (Estética/Mecânica)', type: 'select', options: ['Rápido e padrão', 'Demorado (>7 dias)', 'Sem padrão definido'], required: true },
    { key: 'post_sale', label: 'Existe rotina de Pós-Venda?', type: 'select', options: ['Sim, estruturada', 'Apenas quando dá problema', 'Não existe'], required: true },
    { key: 'trade_in_eval', label: 'Processo de Avaliação de Usado na Troca', type: 'select', options: ['Ficha padrão e avaliação técnica', 'Olhômetro do gerente', 'Sem critério definido'], required: true },
    { key: 'stock_90_days', label: 'Gestão de veículos com mais de 90 dias', type: 'select', options: ['Ações de repasse/promoção agressivas', 'Ficam no pátio esperando', 'Não controlamos'], required: true },
    { key: 'evidence_trade_in', label: 'Anexar evidência do processo de troca (Ficha/Checklist)', type: 'file' },
    { key: 'evidence_prep', label: 'Anexar evidência do checklist de preparação', type: 'file' },
    { key: 'observations', label: 'Notas sobre processos críticos', type: 'textarea' }
  ]
}
