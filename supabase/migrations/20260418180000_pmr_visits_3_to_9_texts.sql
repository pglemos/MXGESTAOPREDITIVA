-- ============================================================
-- PMR Visita 3 a 9 - Checklists e Textos Oficiais
-- ============================================================

-- VISITA 3
UPDATE public.consulting_visit_template_steps
SET 
  objective = 'Rotina do Gerente e Rotina do Vendedor',
  evidence_required = '1. Foto da Rotina impressa e fixada em local visível; 2. Foto do treinamento e foto da Rotina impressa e fixada em local visível',
  checklist_template = '["Implementar a Rotina do Gerente", "Implementar a Rotina do Vendedor", "Verificar se o novo plano de remuneração foi avaliado"]'::jsonb
WHERE visit_number = 3 AND program_key IN ('pmr_7', 'pmr_9');

-- VISITA 4
UPDATE public.consulting_visit_template_steps
SET 
  objective = 'Feedback Estruturado e Cultura de Resultado',
  evidence_required = '1. Relatório de Feedback por vendedor; 2. Print do ranking no grupo da empresa; 3. Print do Gestão à vista no grupo da empresa',
  checklist_template = '["Implementar o Feedback Estruturado", "Implementar Cultura de Resultados", "Avaliar se foi contratado novos vendedores e se o processo foi seguido"]'::jsonb
WHERE visit_number = 4 AND program_key IN ('pmr_7', 'pmr_9');

-- VISITA 5
UPDATE public.consulting_visit_template_steps
SET 
  objective = 'Marketing, Conteúdo e Tráfego Pago',
  evidence_required = '1. Foto da Apresentação; 2 e 3. Definição dos responsáveis e datas',
  checklist_template = '["Apresentação do conteúdo", "Definição dos responsáveis pela execução", "Definição do prazo de início"]'::jsonb
WHERE visit_number = 5 AND program_key IN ('pmr_7', 'pmr_9');

-- VISITA 6
UPDATE public.consulting_visit_template_steps
SET 
  objective = 'Revisão dos Processos Críticos',
  evidence_required = '1. Sistema atualizado; 2. Relatório dos processos críticos e ação do consultor; 3. Atualização do Plano de Ação',
  checklist_template = '["Acessar o sistema com o proprietário e rever todos os processos implementados", "Pontuar quais processos precisarão de intervenção", "Reavaliar o Plano de Ação construído no P.E.", "Direcionar os processos críticos"]'::jsonb
WHERE visit_number = 6 AND program_key IN ('pmr_7', 'pmr_9');

-- VISITA 7
UPDATE public.consulting_visit_template_steps
SET 
  objective = 'Plano de Desenvolvimento Individual (PDI)',
  evidence_required = '1. Todos os PDIs no sistema',
  checklist_template = '["Implementar o PDI da equipe e do Gerente", "Enviar relatório da performance nos treinamentos"]'::jsonb
WHERE visit_number = 7 AND program_key IN ('pmr_7', 'pmr_9');

-- VISITA 8
UPDATE public.consulting_visit_template_steps
SET 
  objective = 'Avaliação Individual nos Treinamentos',
  evidence_required = '1. Foto da apresentação; 2. Assinatura do Termo de compromisso do PDI; 3 e 4. Relatório de Feedback para a equipe',
  checklist_template = '["Apresentação de Entrega dos PDIs", "Entrega do PDI", "Reforçar o treinamento para quem não atingiu a meta", "Avaliar as vendas por canal e dar direcionamento a equipe"]'::jsonb
WHERE visit_number = 8 AND program_key IN ('pmr_7', 'pmr_9');

-- VISITA 9
UPDATE public.consulting_visit_template_steps
SET 
  objective = 'Análise das Implementações e Plano de Ação Trimestral',
  evidence_required = '1. Plano de ação atualizado; 2. Apresentar modelo de acompanhamento presencial/Renovação',
  checklist_template = '["Analisar resultado do trimestre", "Apresentar os pontos positivos e a melhorar", "Solicitar Feedback", "Criar plano de ação dos próximos 3 meses", "Apresentar o modelo de acompanhamento online"]'::jsonb
WHERE visit_number = 9 AND program_key IN ('pmr_7', 'pmr_9');

-- Sincronizar tabela base também
UPDATE public.consulting_methodology_steps SET objective = 'Rotina do Gerente e Rotina do Vendedor', checklist_template = '["Implementar a Rotina do Gerente", "Implementar a Rotina do Vendedor", "Verificar se o novo plano de remuneração foi avaliado"]'::jsonb WHERE visit_number = 3;
UPDATE public.consulting_methodology_steps SET objective = 'Feedback Estruturado e Cultura de Resultado', checklist_template = '["Implementar o Feedback Estruturado", "Implementar Cultura de Resultados", "Avaliar se foi contratado novos vendedores e se o processo foi seguido"]'::jsonb WHERE visit_number = 4;
UPDATE public.consulting_methodology_steps SET objective = 'Marketing, Conteúdo e Tráfego Pago', checklist_template = '["Apresentação do conteúdo", "Definição dos responsáveis pela execução", "Definição do prazo de início"]'::jsonb WHERE visit_number = 5;
UPDATE public.consulting_methodology_steps SET objective = 'Revisão dos Processos Críticos', checklist_template = '["Acessar o sistema com o proprietário e rever todos os processos implementados", "Pontuar quais processos precisarão de intervenção", "Reavaliar o Plano de Ação construído no P.E.", "Direcionar os processos críticos"]'::jsonb WHERE visit_number = 6;
UPDATE public.consulting_methodology_steps SET objective = 'Plano de Desenvolvimento Individual (PDI)', checklist_template = '["Implementar o PDI da equipe e do Gerente", "Enviar relatório da performance nos treinamentos"]'::jsonb WHERE visit_number = 7;
UPDATE public.consulting_methodology_steps SET objective = 'Avaliação Individual nos Treinamentos', checklist_template = '["Apresentação de Entrega dos PDIs", "Entrega do PDI", "Reforçar o treinamento para quem não atingiu a meta", "Avaliar as vendas por canal e dar direcionamento a equipe"]'::jsonb WHERE visit_number = 8;
UPDATE public.consulting_methodology_steps SET objective = 'Análise das Implementações e Plano de Ação Trimestral', checklist_template = '["Analisar resultado do trimestre", "Apresentar os pontos positivos e a melhorar", "Solicitar Feedback", "Criar plano de ação dos próximos 3 meses", "Apresentar o modelo de acompanhamento online"]'::jsonb WHERE visit_number = 9;
