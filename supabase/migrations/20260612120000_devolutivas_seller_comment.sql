-- ============================================================================
-- Migration: 20260612120000_devolutivas_seller_comment.sql
-- Spec Módulo Vendedor §12 (Feedback): campo opcional "Meu comentário" do
-- vendedor ao confirmar a leitura da devolutiva. O update usa a mesma
-- permissão já existente do acknowledge (vendedor atualiza a própria linha).
-- Reexecutável.
-- ============================================================================

BEGIN;

ALTER TABLE public.devolutivas
  ADD COLUMN IF NOT EXISTS seller_comment text,
  ADD COLUMN IF NOT EXISTS seller_comment_at timestamptz;

COMMENT ON COLUMN public.devolutivas.seller_comment IS 'Comentário opcional do vendedor ao confirmar a leitura (spec §12).';
COMMENT ON COLUMN public.devolutivas.seller_comment_at IS 'Quando o vendedor registrou o comentário.';

NOTIFY pgrst, 'reload schema';

COMMIT;
