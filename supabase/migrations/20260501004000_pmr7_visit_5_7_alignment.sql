-- ============================================================
-- PMR 7 visitas - alinhamento das visitas 5, 6 e 7
-- ============================================================
-- O programa PMR 7 tem sequencia propria nas visitas finais:
-- 5 = PDI, 6 = Marketing/Conteudo/Trafego, 7 = Analise trimestral.
-- Nao atualizar pmr_9 aqui, pois ele possui fluxo estendido.

UPDATE public.etapas_modelo_visita_consultoria
SET
  objective = 'Plano de Desenvolvimento Individual (PDI)',
  target = 'Vendedor e Gerente',
  duration = '3 horas',
  evidence_required = 'Todos os PDIs no sistema',
  checklist_template = '[
    "Implementar o PDI da equipe e do Gerente",
    "Enviar relatório da performance nos treinamentos"
  ]'::jsonb
WHERE program_key = 'pmr_7'
  AND visit_number = 5;

UPDATE public.etapas_modelo_visita_consultoria
SET
  objective = 'Posicionamento de Marketing, Estratégia de Conteúdo e Tráfego Pago',
  target = 'Proprietário e Marketing',
  duration = '3 horas',
  evidence_required = 'Foto da apresentação e definição dos responsáveis e datas',
  checklist_template = '[
    "Apresentação do conteúdo",
    "Definição dos responsáveis pela execução",
    "Definição do prazo de início"
  ]'::jsonb
WHERE program_key = 'pmr_7'
  AND visit_number = 6;

UPDATE public.etapas_modelo_visita_consultoria
SET
  objective = 'Análise das Implementações e Plano de Ação Trimestral',
  target = 'Proprietário',
  duration = '3 horas',
  evidence_required = 'Plano de ação atualizado',
  checklist_template = '[
    "Analisar resultado do trimestre",
    "Apresentar os pontos positivos e a melhorar",
    "Solicitar feedback",
    "Criar plano de ação dos próximos 3 meses",
    "Apresentar o modelo de acompanhamento online"
  ]'::jsonb
WHERE program_key = 'pmr_7'
  AND visit_number = 7;
