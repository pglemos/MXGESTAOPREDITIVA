-- ============================================================
-- PMR 7 visitas - fluxo canonico final
-- ============================================================
-- O PMR operacional passa a trabalhar somente com visitas 1 a 7.
-- As antigas visitas 8 e 9 ficam preservadas como historico quando
-- ja existirem em visitas_consultoria, mas nao permanecem ativas como
-- metodologia, agenda nova ou programa selecionavel.

UPDATE public.clientes_consultoria
SET program_template_key = 'pmr_7'
WHERE program_template_key = 'pmr_9';

INSERT INTO public.programas_visita_consultoria (program_key, name, total_visits, active)
VALUES ('pmr_7', 'PMR - 7 Visitas', 7, true)
ON CONFLICT (program_key) DO UPDATE SET
  name = EXCLUDED.name,
  total_visits = EXCLUDED.total_visits,
  active = true,
  updated_at = now();

UPDATE public.programas_visita_consultoria
SET active = false,
    updated_at = now()
WHERE program_key = 'pmr_9';

UPDATE public.etapas_modelo_visita_consultoria
SET active = false,
    updated_at = now()
WHERE program_key = 'pmr_9';

DELETE FROM public.etapas_modelo_visita_consultoria
WHERE program_key = 'pmr_7'
  AND visit_number > 7;

INSERT INTO public.etapas_modelo_visita_consultoria (
  program_key,
  visit_number,
  objective,
  target,
  duration,
  evidence_required,
  checklist_template,
  active
)
VALUES
  (
    'pmr_7',
    1,
    'Diagnóstico',
    'Todos',
    '1 dia',
    'Formulários de dono, gerente, vendedor e processos preenchidos; dados enviados',
    '[
      "Entrevista Vendedores, Gerentes e Sócios",
      "Análise de Processos",
      "Levantamento de dados e indicadores base",
      "Anexar evidências do diagnóstico"
    ]'::jsonb,
    true
  ),
  (
    'pmr_7',
    2,
    'Planejamento Estratégico, Metodologia Multicanal e Gestão à Vista',
    'Todos',
    '1 dia',
    'Validação do planejamento no sistema; foto do treinamento e vendedores cadastrados',
    '[
      "Apresentação do Planejamento",
      "Implementação da Metodologia Multicanal",
      "Treinamento Método Vendedor Profissional",
      "Acompanhamento Diário de Vendas",
      "Gestão à Vista",
      "Reforçar área do cliente no sistema",
      "Reforçar ações de contratação e treinamento de novos vendedores"
    ]'::jsonb,
    true
  ),
  (
    'pmr_7',
    3,
    'Rotina do Gerente e Rotina do Vendedor',
    'Gerente e Vendedores',
    '3 horas',
    'Foto da rotina impressa e fixada em local visível; foto do treinamento',
    '[
      "Implementar a Rotina do Gerente",
      "Implementar a Rotina do Vendedor",
      "Verificar se o novo plano de remuneração foi avaliado"
    ]'::jsonb,
    true
  ),
  (
    'pmr_7',
    4,
    'Feedback Estruturado e Cultura de Resultado',
    'Proprietário e Gerente',
    '3 horas',
    'Relatório de feedback por vendedor; print do ranking e da gestão à vista no grupo da empresa',
    '[
      "Implementar o Feedback Estruturado",
      "Implementar Cultura de Resultados",
      "Avaliar se novos vendedores foram contratados e se o processo foi seguido"
    ]'::jsonb,
    true
  ),
  (
    'pmr_7',
    5,
    'Plano de Desenvolvimento Individual (PDI)',
    'Vendedor e Gerente',
    '3 horas',
    'Todos os PDIs no sistema',
    '[
      "Implementar o PDI da equipe e do Gerente",
      "Enviar relatório da performance nos treinamentos",
      "Registrar termo de compromisso e ação inicial por pessoa"
    ]'::jsonb,
    true
  ),
  (
    'pmr_7',
    6,
    'Posicionamento de Marketing, Estratégia de Conteúdo e Tráfego Pago',
    'Proprietário e Marketing',
    '3 horas',
    'Foto da apresentação e definição dos responsáveis e datas',
    '[
      "Apresentação do conteúdo",
      "Definição dos responsáveis pela execução",
      "Definição do prazo de início",
      "Validar canais, criativos, verba e métricas de tráfego pago"
    ]'::jsonb,
    true
  ),
  (
    'pmr_7',
    7,
    'Análise das Implementações e Plano de Ação Trimestral',
    'Proprietário',
    '3 horas',
    'Plano de ação atualizado',
    '[
      "Analisar resultado do trimestre",
      "Apresentar os pontos positivos e a melhorar",
      "Solicitar feedback",
      "Revisar processos críticos implementados",
      "Criar plano de ação dos próximos 3 meses",
      "Apresentar o modelo de acompanhamento online"
    ]'::jsonb,
    true
  )
ON CONFLICT (program_key, visit_number) DO UPDATE SET
  objective = EXCLUDED.objective,
  target = EXCLUDED.target,
  duration = EXCLUDED.duration,
  evidence_required = EXCLUDED.evidence_required,
  checklist_template = EXCLUDED.checklist_template,
  active = true,
  updated_at = now();
