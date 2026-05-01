ALTER TABLE public.visitas_consultoria
  ADD COLUMN IF NOT EXISTS visit_reason text,
  ADD COLUMN IF NOT EXISTS target_audience text,
  ADD COLUMN IF NOT EXISTS product_name text;

ALTER TABLE public.eventos_agenda_consultoria
  ADD COLUMN IF NOT EXISTS visit_reason text,
  ADD COLUMN IF NOT EXISTS product_name text;

NOTIFY pgrst, 'reload schema';
