-- ============================================================
-- PMR Comprehensive Diagnostics - Todas as perguntas extraidas
-- dos documentos estrategicos e planilhas de campo.
-- ============================================================

-- Update owner template
INSERT INTO public.consulting_pmr_form_templates (form_key, title, target_role, fields)
VALUES ('dono', 'Diagnóstico - Dono/Sócio', 'proprietario', '[
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
  fields = EXCLUDED.fields,
  active = true;

-- Update manager template
INSERT INTO public.consulting_pmr_form_templates (form_key, title, target_role, fields)
VALUES ('gerente', 'Diagnóstico - Gerente', 'gerente', '[
  {"key": "clear_goals", "label": "Metas claras para a equipe (1-5)", "type": "scale", "required": true},
  {"key": "lead_followup", "label": "Acompanhamento de leads (1-5)", "type": "scale", "required": true},
  {"key": "routine", "label": "Rotina gerencial estruturada (1-5)", "type": "scale", "required": true},
  {"key": "manager_autonomy", "label": "Autonomia Gerencial e Flexibilidade de Preço", "type": "scale", "required": true},
  {"key": "daily_tracking_process", "label": "Processo de Acompanhamento Diário de Vendas", "type": "scale", "required": true},
  {"key": "team_training_process", "label": "Processo de Treinamento da Equipe", "type": "scale", "required": true},
  {"key": "team_dev_process", "label": "Processo de Desenvolvimento da Equipe", "type": "scale", "required": true},
  {"key": "manager_team_synergy", "label": "Sinergia entre Equipe e Gerente", "type": "scale", "required": true},
  {"key": "manager_owner_synergy", "label": "Sinergia entre Gerente e Donos", "type": "scale", "required": true},
  {"key": "recruitment_process", "label": "Processo de Contratação de Vendedores", "type": "scale"},
  {"key": "feedback_routine", "label": "Rotina de Feedback Individual", "type": "scale"},
  {"key": "strategic_communication", "label": "Comunicação Estratégica (1-5)", "type": "scale"},
  {"key": "operational_focus", "label": "Gargalo: Excesso de Foco Operacional (1-5)", "type": "scale"}
]'::jsonb)
ON CONFLICT (form_key) DO UPDATE SET
  title = EXCLUDED.title,
  target_role = EXCLUDED.target_role,
  fields = EXCLUDED.fields,
  active = true;

-- Update seller template
INSERT INTO public.consulting_pmr_form_templates (form_key, title, target_role, fields)
VALUES ('vendedor', 'Diagnóstico - Vendedor', 'vendedor', '[
  {"key": "crm_funnel_usage", "label": "Uso do CRM e Gestão de Funil", "type": "scale", "required": true},
  {"key": "online_service", "label": "Qualidade do Atendimento Online", "type": "scale", "required": true},
  {"key": "in_person_service", "label": "Qualidade do Atendimento Presencial", "type": "scale", "required": true},
  {"key": "lead_to_appointment", "label": "Conversão de Leads em Agendamentos", "type": "scale", "required": true},
  {"key": "referral_sales", "label": "Canal de Vendas – Indicação", "type": "scale"},
  {"key": "seller_wallet", "label": "Canal de Vendas – Carteira do Vendedor", "type": "scale"},
  {"key": "result_culture", "label": "Cultura de Resultado (Comprometimento)", "type": "scale"},
  {"key": "team_climate", "label": "Clima e Motivação da Equipe", "type": "scale"},
  {"key": "compensation_plan", "label": "Satisfação com Plano de Remuneração", "type": "scale"},
  {"key": "routine_vendedor", "label": "Rotina da Equipe de Vendas", "type": "scale"},
  {"key": "vendedor_capacity", "label": "Capacidade dos Vendedores (Técnica)", "type": "scale"},
  {"key": "main_limitator", "label": "Principal Limitador de Vendas Individual", "type": "textarea"}
]'::jsonb)
ON CONFLICT (form_key) DO UPDATE SET
  title = EXCLUDED.title,
  target_role = EXCLUDED.target_role,
  fields = EXCLUDED.fields,
  active = true;

-- Update process template
INSERT INTO public.consulting_pmr_form_templates (form_key, title, target_role, fields)
VALUES ('processo', 'Diagnóstico - Processos', 'processo', '[
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
  fields = EXCLUDED.fields,
  active = true;
