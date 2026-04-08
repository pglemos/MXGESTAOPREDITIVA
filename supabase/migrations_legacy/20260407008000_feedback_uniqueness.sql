-- STORY-08: Garantir unicidade semanal do feedback por vendedor
-- Impede duplicidade de rituais na mesma semana de referência.

-- 1. Limpeza de possíveis duplicatas antes de aplicar a restrição (mantém o mais recente)
DELETE FROM public.feedbacks f1
WHERE EXISTS (
    SELECT 1 FROM public.feedbacks f2
    WHERE f1.seller_id = f2.seller_id
      AND f1.week_reference = f2.week_reference
      AND f1.created_at < f2.created_at
);

-- 2. Adicionar restrição de unicidade
ALTER TABLE public.feedbacks
    DROP CONSTRAINT IF EXISTS feedbacks_seller_week_unique;

ALTER TABLE public.feedbacks
    ADD CONSTRAINT feedbacks_seller_week_unique UNIQUE (seller_id, week_reference);

-- 3. Comentário de Auditoria
COMMENT ON CONSTRAINT feedbacks_seller_week_unique ON public.feedbacks IS 'Garante que cada vendedor receba apenas um feedback estruturado por semana de referência.';
