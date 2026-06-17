-- EV-5.5: allow funnel/cadence bottlenecks as a persisted development recommendation source.
-- The table already stores feedback, PDI, manual and routine recommendations; this only widens
-- the source_type contract for future persisted funnel recommendations.

ALTER TABLE public.recomendacoes_desenvolvimento
  DROP CONSTRAINT IF EXISTS recomendacoes_desenvolvimento_source_type_check;

ALTER TABLE public.recomendacoes_desenvolvimento
  ADD CONSTRAINT recomendacoes_desenvolvimento_source_type_check
  CHECK (source_type = ANY (ARRAY['feedback', 'pdi', 'funil', 'manual', 'rotina']));

COMMENT ON CONSTRAINT recomendacoes_desenvolvimento_source_type_check ON public.recomendacoes_desenvolvimento
  IS 'Allowed recommendation origins for development content, including EV-5.5 funnel bottlenecks.';

-- Manual rollback:
-- ALTER TABLE public.recomendacoes_desenvolvimento
--   DROP CONSTRAINT IF EXISTS recomendacoes_desenvolvimento_source_type_check;
-- ALTER TABLE public.recomendacoes_desenvolvimento
--   ADD CONSTRAINT recomendacoes_desenvolvimento_source_type_check
--   CHECK (source_type = ANY (ARRAY['feedback', 'pdi', 'manual', 'rotina']));
