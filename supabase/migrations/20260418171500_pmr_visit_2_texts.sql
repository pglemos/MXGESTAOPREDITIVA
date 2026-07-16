-- ============================================================
-- PMR Visita 2 - Checklist e Textos Oficiais
-- ============================================================

UPDATE public.consulting_visit_template_steps
SET 
  objective = 'Planejamento Estratégico e Metodologia Multicanal',
  evidence_required = '1. Validação do Planejamento no Sistema; 2. Foto do treinamento e vendedores cadastrados no sistema',
  checklist_template = '[
    "Apresentação do Planejamento",
    "Implementação da Metodologia Multicanal",
    "Treinamento Método Vendedor Profissional",
    "Acompanhamento Diário de Vendas",
    "Gestão á Vista",
    "Reforçar área do cliente no sistema",
    "Reforçar ações de contratação e treinamento de novos vendedores"
  ]'::jsonb
WHERE visit_number = 2 AND program_key IN ('pmr_7', 'pmr_9');

UPDATE public.consulting_methodology_steps
SET
  objective = 'Planejamento Estratégico e Metodologia Multicanal',
  evidence_required = '1. Validação do Planejamento no Sistema; 2. Foto do treinamento e vendedores cadastrados no sistema'
WHERE visit_number = 2;

-- ============================================================
-- DOWN
-- ============================================================
-- Only change here: removed a reference to checklist_template, a column
-- that doesn't exist on consulting_methodology_steps (copy-paste from the
-- consulting_visit_template_steps statement above), which blocked this
-- migration entirely on a from-scratch replay. No schema or data change to
-- undo — objective/evidence_required were always written as shown above.
