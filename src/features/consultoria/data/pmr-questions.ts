import { PmrFormField } from '@/lib/schemas/consulting-client.schema'

export const PMR_FULL_QUESTIONS: Record<string, PmrFormField[]> = {
  vendedor: [
    { key: 'name', label: 'Nome do vendedor', type: 'text', required: true },
    { key: 'unit', label: 'Loja / Unidade', type: 'text', required: true },
    { key: 'role', label: 'Função atual', type: 'select', options: ['Vendedor', 'Pré-Vendedor', 'Marketing', 'Outros'], required: true },
    { key: 'experience', label: 'Tempo de mercado (anos)', type: 'number', required: true },
    { key: 'consultant', label: 'Avaliador / Consultor responsável', type: 'select', options: ['Daniel Santos', 'Gedson Freire', 'José Roberto'], required: true },
    
    // 2. Plano de Remuneração
    { key: 'comp_clarity', label: 'Você entende claramente como sua comissão é calculada?', type: 'select', options: ['Sim, totalmente', 'Parcialmente', 'Não entendo'], required: true },
    { key: 'comp_stimulus', label: 'O plano de remuneração estimula vendas de qualidade?', type: 'select', options: ['Sim', 'Não, apenas volume'], required: true },
    { key: 'comp_target', label: 'Sabe quanto precisa vender para ganhar > R$ 8.000/mês?', type: 'select', options: ['Sim', 'Não'], required: true },
    
    // 3. Rotina
    { key: 'routine_defined', label: 'Existe rotina diária definida e cobrada?', type: 'select', options: ['Sim', 'Existe mas não é cobrada', 'Não existe'], required: true },
    { key: 'routine_org', label: 'Sua rotina diária é:', type: 'select', options: ['Organizada', 'Parcialmente', 'Desorganizada'], required: true },
    { key: 'sales_hours', label: 'Horas diárias dedicadas à venda?', type: 'select', options: ['< 3h', '3-5h', '> 5h'], required: true },
    { key: 'distractions', label: 'Principais tira-focos?', type: 'select', options: ['Pós-venda', 'Administrativo', 'Movimentação carros', 'Falta leads', 'Falta organização', 'Outro'], required: true },
    
    // 4. Capacidade
    { key: 'sales_cap', label: 'Capacidade de vendas mensal (qualidade)?', type: 'select', options: ['Até 6', '7-10', '11-15', '> 15'], required: true },
    { key: 'sales_performance', label: 'Vende abaixo, dentro ou no limite da capacidade?', type: 'select', options: ['Abaixo', 'Dentro', 'Limite'], required: true },
    { key: 'limitator', label: 'Principal fator que limita seu desempenho?', type: 'select', options: ['Leads', 'Processo', 'Gestão', 'Estoque', 'Treinamento', 'Outro'], required: true },
    
    // 5. Atendimento Lead
    { key: 'lead_origin', label: 'Origem principal dos leads?', type: 'select', options: ['CRM', 'WhatsApp Pessoal', 'Dono/Gerente', 'Pré-venda', 'Desorganizado'], required: true },
    { key: 'lead_sla', label: 'SLA de primeiro contato?', type: 'select', options: ['< 5min', '< 30min', '< 60min', 'Não existe'], required: true },
    { key: 'lead_followup', label: 'Acompanha clientes que não fecham na hora?', type: 'select', options: ['Sim', 'Não'], required: true },
    { key: 'lead_contacts', label: 'Contatos médios por lead?', type: 'select', options: ['1', '2-3', '4+', 'Não existe'], required: true },
    { key: 'lead_evidence', label: 'Anexar evidência de funil/print CRM', type: 'file' },

    // 6. Presencial
    { key: 'in_person_std', label: 'Existe padrão de atendimento presencial?', type: 'select', options: ['Sim', 'Não'], required: true },
    { key: 'in_person_steps', label: 'Conduz cliente por etapas (abordagem/necessidade...)?', type: 'select', options: ['Sempre', 'Às vezes', 'Não'], required: true },
    { key: 'negotiation_closer', label: 'Quem fecha a negociação?', type: 'select', options: ['Vendedor', 'Gerente', 'Ambos', 'Não existe'], required: true },
    
    // 7. Carteira
    { key: 'wallet_sales', label: 'Vende mensalmente para a própria carteira?', type: 'select', options: ['Sim', 'Não'], required: true },
    { key: 'wallet_strategy', label: 'Estratégia principal de carteira?', type: 'select', options: ['Instagram', 'FB', 'Indicação', 'Parcerias', 'Status WA', 'Outro'], required: true },
    
    // 8. Cultura
    { key: 'goals_clarity', label: 'Metas são claras?', type: 'select', options: ['Sim', 'Parcialmente', 'Não'], required: true },
    { key: 'results_tracking', label: 'Resultado acompanhado (Diário/Semanal)?', type: 'select', options: ['Diário', 'Semanal', 'Fechamento'], required: true },
    { key: 'accountability', label: 'Sente cobrança por resultado?', type: 'select', options: ['Saudável', 'Excessiva', 'Não existe'], required: true },
    { key: 'team_climate', label: 'Clima da equipe?', type: 'select', options: ['Muito bom', 'Bom', 'Regular', 'Ruim'], required: true },
    { key: 'observations', label: 'Observações do Consultor', type: 'textarea' }
  ],
  gerente: [
    { key: 'name', label: 'Nome do Gerente', type: 'text', required: true },
    { key: 'unit', label: 'Loja / Unidade', type: 'text', required: true },
    { key: 'time_as_manager', label: 'Tempo como gerente nesta loja?', type: 'select', options: ['< 6m', '6m-1a', '1-3a', '> 3a'], required: true },
    { key: 'leadership_exp', label: 'Liderança anterior?', type: 'select', options: ['Sim', 'Não'], required: true },
    { key: 'sales_exp', label: 'Vendedor antes de assumir?', type: 'select', options: ['Sim', 'Não'], required: true },
    { key: 'team_size', label: 'Quantidade de vendedores sob gestão?', type: 'number', required: true },
    { key: 'other_tasks', label: 'Acumula outras funções? Quais?', type: 'textarea' },
    
    { key: 'manager_routine', label: 'Possui rotina clara (Matinal/SGAP/Feedback)?', type: 'select', options: ['Completa', 'Parcial', 'Não'], required: true },
    { key: 'evidence_routine', label: 'Anexar evidência da rotina (foto/print)', type: 'file' },
    { key: 'lead_distribution', label: 'Como distribui leads?', type: 'select', options: ['CRM', 'Manual', 'Dono', 'Livre'], required: true },
    { key: 'crm_audit', label: 'Audita CRM diariamente?', type: 'select', options: ['Sim', 'Às vezes', 'Não'], required: true },
    { key: 'training_freq', label: 'Frequência de treinamento?', type: 'select', options: ['Semanal', 'Quinzenal', 'Mensal', 'Não tem'], required: true },
    
    { key: 'conversion_check', label: 'Sabe a taxa de conversão da loja de cor?', type: 'select', options: ['Sim', 'Sistema', 'Não'], required: true },
    { key: 'bottleneck', label: 'Maior gargalo da loja?', type: 'select', options: ['Leads', 'Estoque', 'Equipe', 'Processo', 'Preço'], required: true },
    { key: 'observations', label: 'Parecer Técnico', type: 'textarea' }
  ],
  dono: [
    { key: 'name', label: 'Nome do Sócio/Dono', type: 'text', required: true },
    { key: 'macro_vision', label: 'Visão sobre o potencial da loja?', type: 'textarea', required: true },
    { key: 'meta_mensal', label: 'Meta de vendas mensal?', type: 'number', required: true },
    { key: 'owner_dependency', label: 'Loja roda sem sua presença?', type: 'select', options: ['Sim', 'Parcial', 'Não'], required: true },
    { key: 'business_stage', label: 'Estágio do negócio?', type: 'select', options: ['Sobrevivência', 'Crescimento', 'Maturidade'], required: true },
    { key: 'traps', label: 'Travas para investir?', type: 'textarea' },
    { key: 'alignment', label: 'Alinhamento dos sócios?', type: 'select', options: ['Sim', 'Parcial', 'Divergências', 'Sócio único'], required: true },
    { key: 'evidence_pe', label: 'Anexar evidência do Planejamento Estratégico', type: 'file' },
    { key: 'observations', label: 'Observações do Consultor', type: 'textarea' }
  ],
  processo: [
    { key: 'traffic_strategy', label: 'Estratégia de Tráfego Pago', type: 'select', options: ['Agência/Especialista', 'Eu/Dono', 'Amador', 'Não faz'], required: true },
    { key: 'ig_quality', label: 'Qualidade do Instagram', type: 'select', options: ['Concessionária', 'Bom', 'Melhorável', 'Amador'], required: true },
    { key: 'prep_process', label: 'Processo de Preparação (Estética/Mecânica)', type: 'select', options: ['Rápido', 'Lento (>7d)', 'Sem padrão'], required: true },
    { key: 'pos_venda', label: 'Rotina de Pós-Venda?', type: 'select', options: ['Sim, estruturada', 'Eventual', 'Não existe'], required: true },
    { key: 'trade_in_process', label: 'Avaliação de Usado (Troca)', type: 'select', options: ['Ficha padrão', 'Olhômetro', 'Sem critério'], required: true },
    { key: 'evidence_trade_in', label: 'Anexar evidência do processo de troca (Ficha/Checklist)', type: 'file' },
    { key: 'evidence_prep', label: 'Anexar evidência do checklist de preparação', type: 'file' },
    { key: 'stock_90d', label: 'Gestão de veículos +90 dias?', type: 'select', options: ['Repasse agressivo', 'Esperando', 'Não controla'], required: true },
    { key: 'observations', label: 'Notas sobre processos críticos', type: 'textarea' }
  ]
}
