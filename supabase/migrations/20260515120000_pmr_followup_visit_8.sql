-- ============================================================
-- PMR follow-up visit 8
-- ============================================================
-- The core PMR cycle remains visits 1 to 7. Visit 8 is an active
-- monthly follow-up step under pmr_7 and must not reactivate pmr_9.

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
VALUES (
  'pmr_7',
  8,
  'Acompanhamento Mensal',
  'Proprietario e Gerente',
  '3 horas',
  'Resumo executivo do periodo, pendencias revisadas e proximas acoes registradas',
  '[
    "Revisar indicadores do periodo selecionado",
    "Revisar pendencias do plano de acao",
    "Registrar pontos positivos do mes",
    "Registrar pontos a melhorar",
    "Definir proximas acoes e responsaveis",
    "Confirmar proxima data de acompanhamento"
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

UPDATE public.programas_visita_consultoria
SET name = 'PMR - 7 Visitas + Acompanhamento Mensal',
    total_visits = 7,
    active = true,
    updated_at = now()
WHERE program_key = 'pmr_7';

UPDATE public.programas_visita_consultoria
SET active = false,
    updated_at = now()
WHERE program_key = 'pmr_9';

UPDATE public.etapas_modelo_visita_consultoria
SET active = false,
    updated_at = now()
WHERE program_key = 'pmr_9';
