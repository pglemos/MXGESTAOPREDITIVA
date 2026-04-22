-- ============================================================
-- PMR Visita - Campos de Assinatura e Auditoria Final
-- ============================================================

ALTER TABLE public.consulting_visits
ADD COLUMN IF NOT EXISTS consultant_name_manual text,
ADD COLUMN IF NOT EXISTS effective_visit_date date DEFAULT now(),
ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz,
ADD COLUMN IF NOT EXISTS acknowledged_by uuid REFERENCES public.users(id);

-- Comentários para documentação do schema
COMMENT ON COLUMN public.consulting_visits.consultant_name_manual IS 'Nome do consultor preenchido manualmente para o relatório';
COMMENT ON COLUMN public.consulting_visits.effective_visit_date IS 'Data real em que a visita foi realizada';
COMMENT ON COLUMN public.consulting_visits.acknowledged_at IS 'Data/hora em que o gestor deu ciente no relatório';
COMMENT ON COLUMN public.consulting_visits.acknowledged_by IS 'ID do usuário (gestor) que assinou o relatório';
