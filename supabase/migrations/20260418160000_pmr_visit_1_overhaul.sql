-- ============================================================
-- PMR Visita 1 - Header Base e Diagnosticos Completos
-- ============================================================

-- 1. Adicionar colunas de cabecalho base na tabela de visitas
ALTER TABLE public.consulting_visits
ADD COLUMN IF NOT EXISTS meta_mensal text,
ADD COLUMN IF NOT EXISTS projecao text,
ADD COLUMN IF NOT EXISTS leads_mes text,
ADD COLUMN IF NOT EXISTS estoque_disponivel text;

-- 2. Atualizar Templates de Diagnostico com Perguntas Reais (Visita 1)

-- VENDEDOR
INSERT INTO public.consulting_pmr_form_templates (form_key, title, target_role, fields)
VALUES ('vendedor', 'Diagnóstico Comercial – Vendedores', 'vendedor', '[
  {"key": "nome_vendedor", "label": "Nome do vendedor", "type": "text", "required": true},
  {"key": "funcao", "label": "Função atual", "type": "select", "options": ["Vendedor", "Pré-Vendedor", "Marketing", "Outros"], "required": true},
  {"key": "tempo_mercado", "label": "Tempo de mercado (anos)", "type": "number", "required": true},
  {"key": "crm_funnel_usage", "label": "Uso do CRM e Gestão de Funil (1-5)", "type": "scale", "required": true},
  {"key": "online_service", "label": "Qualidade do Atendimento Online (1-5)", "type": "scale", "required": true},
  {"key": "in_person_service", "label": "Qualidade do Atendimento Presencial (1-5)", "type": "scale", "required": true},
  {"key": "lead_to_appointment", "label": "Conversão de Leads em Agendamentos (1-5)", "type": "scale", "required": true},
  {"key": "referral_sales", "label": "Canal de Vendas – Indicação (1-5)", "type": "scale"},
  {"key": "seller_wallet", "label": "Canal de Vendas – Carteira do Vendedor (1-5)", "type": "scale"},
  {"key": "result_culture", "label": "Cultura de Resultado (Comprometimento)", "type": "scale"},
  {"key": "team_climate", "label": "Clima e Motivação da Equipe", "type": "scale"},
  {"key": "compensation_plan", "label": "Satisfação com Plano de Remuneração", "type": "scale"},
  {"key": "main_limitator", "label": "Principal Limitador de Vendas Individual", "type": "textarea"}
]'::jsonb)
ON CONFLICT (form_key) DO UPDATE SET
  title = EXCLUDED.title,
  target_role = EXCLUDED.target_role,
  fields = EXCLUDED.fields;

-- GERENTE
INSERT INTO public.consulting_pmr_form_templates (form_key, title, target_role, fields)
VALUES ('gerente', 'PMR - Diagnóstico Gerencial', 'gerente', '[
  {"key": "nome_gerente", "label": "Nome do Gerente", "type": "text", "required": true},
  {"key": "funcao", "label": "Função atual", "type": "select", "options": ["Gerente Geral", "Gerente de Vendas", "Supervisor de Vendas"], "required": true},
  {"key": "tempo_loja", "label": "Há quanto tempo atua como gerente nesta loja?", "type": "select", "options": ["Menos de 6 meses", "Entre 6 meses e 1 ano", "Entre 1 e 3 anos", "Mais de 3 anos"], "required": true},
  {"key": "lideranca_anterior", "label": "Você já atuou em cargos de liderança antes?", "type": "boolean", "required": true},
  {"key": "vendedor_anterior", "label": "Você já atuou como vendedor antes de assumir a gerência?", "type": "boolean", "required": true},
  {"key": "qtd_vendedores", "label": "Quantos vendedores estão sob sua liderança atualmente?", "type": "number", "required": true},
  {"key": "acumula_funcoes", "label": "Além da gerência de vendas, você acumula outras funções na loja? Quais", "type": "textarea"},
  {"key": "clear_goals", "label": "Metas claras para a equipe (1-5)", "type": "scale", "required": true},
  {"key": "lead_followup", "label": "Acompanhamento de leads (1-5)", "type": "scale", "required": true},
  {"key": "routine", "label": "Rotina gerencial estruturada (1-5)", "type": "scale", "required": true},
  {"key": "manager_autonomy", "label": "Autonomia Gerencial e Flexibilidade de Preço", "type": "scale", "required": true},
  {"key": "daily_tracking_process", "label": "Processo de Acompanhamento Diário de Vendas", "type": "scale", "required": true},
  {"key": "team_training_process", "label": "Processo de Treinamento da Equipe", "type": "scale", "required": true},
  {"key": "team_dev_process", "label": "Processo de Desenvolvimento da Equipe", "type": "scale", "required": true},
  {"key": "manager_team_synergy", "label": "Sinergia entre Equipe e Gerente", "type": "scale", "required": true},
  {"key": "manager_owner_synergy", "label": "Sinergia entre Gerente e Donos", "type": "scale", "required": true},
  {"key": "strategic_communication", "label": "Comunicação Estratégica (1-5)", "type": "scale"},
  {"key": "operational_focus", "label": "Gargalo: Excesso de Foco Operacional (1-5)", "type": "scale"}
]'::jsonb)
ON CONFLICT (form_key) DO UPDATE SET
  title = EXCLUDED.title,
  target_role = EXCLUDED.target_role,
  fields = EXCLUDED.fields;

-- DONO / SOCIO
INSERT INTO public.consulting_pmr_form_templates (form_key, title, target_role, fields)
VALUES ('dono', 'Diagnóstico Estratégico – Dono da Loja', 'proprietario', '[
  {"key": "nome_dono", "label": "Nome do dono / sócio entrevistado", "type": "text", "required": true},
  {"key": "tempo_operacao_loja", "label": "Tempo de operação da loja", "type": "text", "required": true},
  {"key": "tempo_mercado", "label": "Tempo de operação no mercado", "type": "text", "required": true},
  {"key": "macro_vision", "label": "Visão Macro e Potencial", "type": "textarea", "required": true},
  {"key": "monthly_meta_goal", "label": "Meta Mensal Desejada (Vendas)", "type": "number", "required": true},
  {"key": "owner_dependency", "label": "Dependência do Dono (1-5)", "type": "scale", "required": true},
  {"key": "partner_alignment", "label": "Alinhamento e Sinergia Societária (1-5)", "type": "scale", "required": true},
  {"key": "business_stage", "label": "Estágio Atual do Negócio", "type": "select", "options": ["Sobrevivência", "Intermediário", "Boa Prática"], "required": true},
  {"key": "strategic_clarity", "label": "Clareza Estratégica (1-5)", "type": "scale"},
  {"key": "long_term_vision", "label": "Visão de Longo Prazo (1-5)", "type": "scale"},
  {"key": "investment_traps", "label": "Principais Travas de Investimento/Decisão", "type": "textarea"}
]'::jsonb)
ON CONFLICT (form_key) DO UPDATE SET
  title = EXCLUDED.title,
  target_role = EXCLUDED.target_role,
  fields = EXCLUDED.fields;

-- PROCESSOS
INSERT INTO public.consulting_pmr_form_templates (form_key, title, target_role, fields)
VALUES ('processo', 'Diagnóstico de Processos Críticos', 'processo', '[
  {"key": "traffic_leads_strategy", "label": "Estratégia de Tráfego Pago e Leads", "type": "scale", "required": true},
  {"key": "instagram_innovation", "label": "Instagram: Frequência, Qualidade e Inovação", "type": "scale", "required": true},
  {"key": "branding_investment", "label": "Investimento em Branding", "type": "scale"},
  {"key": "ad_photo_quality", "label": "Qualidade das Fotos dos Anúncios", "type": "scale"},
  {"key": "lead_distribution_system", "label": "Sistema de Distribuição de Leads", "type": "scale"},
  {"key": "vehicle_preparation", "label": "Processo de Preparação de Veículos", "type": "scale", "required": true},
  {"key": "post_sale_process", "label": "Processo de Pós-Venda", "type": "scale", "required": true},
  {"key": "trade_in_evaluation", "label": "Processo de Avaliação de Usado na Troca", "type": "scale", "required": true},
  {"key": "inventory_90_days", "label": "Gestão de Veículos +90 dias no Estoque", "type": "scale"},
  {"key": "pricing_autonomy_process", "label": "Processo de Precificação e Margem", "type": "scale"},
  {"key": "information_control", "label": "Controle da Informação da Origem das Vendas", "type": "scale"}
]'::jsonb)
ON CONFLICT (form_key) DO UPDATE SET
  title = EXCLUDED.title,
  target_role = EXCLUDED.target_role,
  fields = EXCLUDED.fields;
