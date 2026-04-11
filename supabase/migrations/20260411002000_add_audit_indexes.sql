-- v1.1: Índices de Performance para Auditoria e Reprocessamento
-- Objetivo: Otimizar buscas históricas por loja e data, garantindo fluidez no cockpit gerencial.

BEGIN;

-- 1. Índice composto para logs de auditoria de check-in
-- Melhora a performance da aba "Ajustes" e histórico de mudanças.
CREATE INDEX IF NOT EXISTS checkin_audit_logs_store_created_idx 
ON public.checkin_audit_logs (changed_by, created_at DESC);

-- Nota: Como a tabela checkin_audit_logs não tem store_id direto (apenas checkin_id),
-- o índice por changed_by ou checkin_id é o mais eficiente para auditoria individual.
CREATE INDEX IF NOT EXISTS checkin_audit_logs_checkin_idx 
ON public.checkin_audit_logs (checkin_id);

-- 2. Índice composto para logs de reprocessamento
-- Melhora a performance da Timeline de Ingestão.
CREATE INDEX IF NOT EXISTS reprocess_logs_store_created_idx 
ON public.reprocess_logs (store_id, created_at DESC);

COMMENT ON INDEX public.reprocess_logs_store_created_idx IS 'Otimiza a busca cronológica de injeções de dados por unidade.';

COMMIT;
