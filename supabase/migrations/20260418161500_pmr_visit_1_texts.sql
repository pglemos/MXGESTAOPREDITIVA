-- ============================================================
-- PMR Visita 1 - Checklist e Textos Oficiais
-- ============================================================

-- Atualizar Checklist da Visita 1 para PMR_7 e PMR_9
UPDATE public.consulting_visit_template_steps
SET 
  objective = 'Diagnóstico',
  evidence_required = '1 e 2. Formulários preenchidos; 3. Dados enviados',
  checklist_template = '["Entrevista Vendedores, Gerentes e Sócios", "Análise de Processos", "Levantamento de dados"]'::jsonb
WHERE visit_number = 1 AND program_key IN ('pmr_7', 'pmr_9');

-- Se por algum motivo não houver steps no template, atualizar a tabela base também
UPDATE public.consulting_methodology_steps
SET
  objective = 'Diagnóstico',
  evidence_required = '1 e 2. Formulários preenchidos; 3. Dados enviados'
WHERE visit_number = 1;

-- ============================================================
-- DOWN
-- ============================================================
-- Only change here: removed a reference to checklist_template, a column
-- that doesn't exist on consulting_methodology_steps (copy-paste from the
-- consulting_visit_template_steps statement above), which blocked this
-- migration entirely on a from-scratch replay. No schema or data change to
-- undo — objective/evidence_required were always written as shown above.
