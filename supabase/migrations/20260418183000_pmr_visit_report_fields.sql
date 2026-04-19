-- ============================================================
-- PMR Visita - Extensão de Colunas para Relatório
-- ============================================================

ALTER TABLE public.consulting_visits
ADD COLUMN IF NOT EXISTS consultant_name_manual text,
ADD COLUMN IF NOT EXISTS effective_visit_date date DEFAULT now();
