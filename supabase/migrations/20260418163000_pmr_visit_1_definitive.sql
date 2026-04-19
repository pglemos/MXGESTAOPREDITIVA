-- ============================================================
-- PMR Visita 1 - Templates Definitivos (Replicação Google Forms)
-- ============================================================

-- VENDEDOR
INSERT INTO public.consulting_pmr_form_templates (form_key, title, target_role, fields)
VALUES ('vendedor', 'Diagnóstico Comercial – Vendedores', 'vendedor', '[
  {"key": "nome_vendedor", "label": "Nome do vendedor", "type": "text", "required": true},
  {"key": "funcao", "label": "Qual sua função atual?", "type": "select", "options": ["Vendedor", "Pré-vendedor / Lead manager", "Marketing", "Outro"], "required": true},
  {"key": "tempo_mercado", "label": "Qual seu tempo de mercado (anos)?", "type": "number", "required": true},
  {"key": "limitador", "label": "Qual seu principal limitador hoje para você vender mais?", "type": "textarea", "required": true},
  {"key": "crm_funnel_usage", "label": "Uso do CRM e Gestão de Funil (1-5)", "type": "scale", "required": true},
  {"key": "online_service", "label": "Qualidade do Atendimento Online (1-5)", "type": "scale", "required": true},
  {"key": "in_person_service", "label": "Qualidade do Atendimento Presencial (1-5)", "type": "scale", "required": true},
  {"key": "lead_to_appointment", "label": "Conversão de Leads em Agendamentos (1-5)", "type": "scale", "required": true},
  {"key": "referral_sales", "label": "Canal de Vendas – Indicação (1-5)", "type": "scale", "required": true},
  {"key": "seller_wallet", "label": "Canal de Vendas – Carteira do Vendedor (1-5)", "type": "scale", "required": true},
  {"key": "result_culture", "label": "Cultura de Resultado - Comprometimento (1-5)", "type": "scale", "required": true},
  {"key": "team_climate", "label": "Clima e Motivação da Equipe (1-5)", "type": "scale", "required": true},
  {"key": "compensation_plan", "label": "Satisfação com Plano de Remuneração (1-5)", "type": "scale", "required": true},
  {"key": "resumo_entrevista", "label": "Resumo da Entrevista (Observações do Consultor)", "type": "textarea"}
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
  {"key": "acumula_funcoes", "label": "Além da gerência de vendas, você acumula outras funções na loja? Quais?", "type": "textarea"},
  {"key": "clear_goals", "label": "Metas claras para a equipe (1-5)", "type": "scale", "required": true},
  {"key": "lead_followup", "label": "Acompanhamento de leads (1-5)", "type": "scale", "required": true},
  {"key": "routine", "label": "Rotina gerencial estruturada (1-5)", "type": "scale", "required": true},
  {"key": "manager_autonomy", "label": "Autonomia Gerencial e Flexibilidade de Preço (1-5)", "type": "scale", "required": true},
  {"key": "daily_tracking_process", "label": "Processo de Acompanhamento Diário de Vendas (1-5)", "type": "scale", "required": true},
  {"key": "team_training_process", "label": "Processo de Treinamento da Equipe (1-5)", "type": "scale", "required": true},
  {"key": "team_dev_process", "label": "Processo de Desenvolvimento da Equipe (1-5)", "type": "scale", "required": true},
  {"key": "manager_team_synergy", "label": "Sinergia entre Equipe e Gerente (1-5)", "type": "scale", "required": true},
  {"key": "manager_owner_synergy", "label": "Sinergia entre Gerente e Donos (1-5)", "type": "scale", "required": true},
  {"key": "recruitment_process", "label": "Processo de Contratação de Vendedores (1-5)", "type": "scale", "required": true},
  {"key": "feedback_routine", "label": "Rotina de Feedback Individual (1-5)", "type": "scale", "required": true},
  {"key": "resumo_entrevista", "label": "Resumo da Entrevista (Observações do Consultor)", "type": "textarea"}
]'::jsonb)
ON CONFLICT (form_key) DO UPDATE SET
  title = EXCLUDED.title,
  target_role = EXCLUDED.target_role,
  fields = EXCLUDED.fields;

-- SOCIOS
INSERT INTO public.consulting_pmr_form_templates (form_key, title, target_role, fields)
VALUES ('dono', 'Diagnóstico Estratégico – Dono da Loja', 'proprietario', '[
  {"key": "nome_dono", "label": "Nome do dono / sócio entrevistado", "type": "text", "required": true},
  {"key": "nome_loja", "label": "Nome da loja / unidade", "type": "text", "required": true},
  {"key": "tempo_operacao_loja", "label": "Tempo de operação da loja", "type": "text", "required": true},
  {"key": "tempo_mercado", "label": "Tempo de operação no mercado", "type": "text", "required": true},
  {"key": "macro_vision", "label": "Visão Macro e Potencial do Negócio", "type": "textarea", "required": true},
  {"key": "monthly_meta_goal", "label": "Meta Mensal Desejada (Vendas)", "type": "number", "required": true},
  {"key": "business_stage", "label": "Em qual fase você enxerga a empresa hoje?", "type": "select", "options": ["Sobrevivência", "Intermediário / Crescimento", "Escala / Boa Prática"], "required": true},
  {"key": "desired_culture", "label": "Qual a cultura que você deseja para sua empresa?", "type": "textarea", "required": true},
  {"key": "all_negotiations_owner", "label": "Todas as negociações passam pelo dono (ainda que por telefone)?", "type": "boolean", "required": true},
  {"key": "periodic_meetings", "label": "Existem reuniões periódicas com o time?", "type": "boolean", "required": true},
  {"key": "owner_dependency", "label": "Dependência do Dono (1-5)", "type": "scale", "required": true},
  {"key": "partner_alignment", "label": "Alinhamento e Sinergia Societária (1-5)", "type": "scale", "required": true},
  {"key": "strategic_clarity", "label": "Clareza Estratégica (1-5)", "type": "scale", "required": true},
  {"key": "long_term_vision", "label": "Visão de Longo Prazo (1-5)", "type": "scale", "required": true},
  {"key": "investment_traps", "label": "Principais Travas de Investimento / Decisão", "type": "textarea"},
  {"key": "resumo_entrevista", "label": "Resumo da Entrevista (Observações do Consultor)", "type": "textarea"}
]'::jsonb)
ON CONFLICT (form_key) DO UPDATE SET
  title = EXCLUDED.title,
  target_role = EXCLUDED.target_role,
  fields = EXCLUDED.fields;

-- PROCESSOS
INSERT INTO public.consulting_pmr_form_templates (form_key, title, target_role, fields)
VALUES ('processo', 'Diagnóstico de Processos Críticos', 'processo', '[
  {"key": "trade_in_avg_time", "label": "Avaliação de Usado: Tempo médio real (minutos)", "type": "number", "required": true},
  {"key": "seller_negotiates_trade", "label": "Vendedor negocia a troca diretamente com o cliente?", "type": "boolean", "required": true},
  {"key": "manager_autonomy_value", "label": "Política de Preço: Qual o limite de desconto do gerente (R$)?", "type": "text", "required": true},
  {"key": "prep_defects", "label": "Veículos são liberados com lâmpadas queimadas ou itens básicos faltando?", "type": "boolean", "required": true},
  {"key": "post_sale_responsible", "label": "Existe um responsável único pelo Pós-venda?", "type": "boolean", "required": true},
  {"key": "crm_inbox_only", "label": "O CRM funciona apenas como caixa de entrada (sem agendamento real)?", "type": "boolean", "required": true},
  {"key": "traffic_leads_strategy", "label": "Estratégia de Tráfego Pago e Leads (1-5)", "type": "scale", "required": true},
  {"key": "instagram_quality", "label": "Instagram: Frequência, Qualidade e Inovação (1-5)", "type": "scale", "required": true},
  {"key": "branding_investment", "label": "Investimento em Branding (1-5)", "type": "scale", "required": true},
  {"key": "ad_photo_quality", "label": "Qualidade das Fotos dos Anúncios (1-5)", "type": "scale", "required": true},
  {"key": "lead_distribution", "label": "Sistema de Distribuição de Leads (1-5)", "type": "scale", "required": true},
  {"key": "vehicle_preparation", "label": "Processo de Preparação de Veículos (1-5)", "type": "scale", "required": true},
  {"key": "post_sale_process", "label": "Processo de Pós-Venda (1-5)", "type": "scale", "required": true},
  {"key": "trade_in_evaluation", "label": "Processo de Avaliação de Usado na Troca (1-5)", "type": "scale", "required": true},
  {"key": "inventory_90_days", "label": "Gestão de Veículos +90 dias no Estoque (1-5)", "type": "scale", "required": true},
  {"key": "pricing_process", "label": "Processo de Precificação e Margem (1-5)", "type": "scale", "required": true},
  {"key": "info_control", "label": "Controle da Informação da Origem das Vendas (1-5)", "type": "scale", "required": true},
  {"key": "resumo_analise", "label": "Resumo da Análise (Observações do Consultor)", "type": "textarea"}
]'::jsonb)
ON CONFLICT (form_key) DO UPDATE SET
  title = EXCLUDED.title,
  target_role = EXCLUDED.target_role,
  fields = EXCLUDED.fields;
