-- ============================================================================
-- DB-02: Audit Log Composite Indexing
-- Story: story-DB-02-audit-indexes
-- Author: @data-engineer
-- ============================================================================
-- Objetivo: Criar indices B-TREE compostos para as tabelas de log de auditoria
--           e reprocessamento, reduzindo o tempo de busca historica.
--
-- Contexto: A migration anterior (20260411002000) falhou silenciosamente porque
--           reprocess_logs nao possui a coluna created_at. Todo o bloco
--           BEGIN...COMMIT foi rolled back. Esta migration corrige e amplia.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Adicionar coluna created_at faltante em reprocess_logs
-- ---------------------------------------------------------------------------
-- A coluna created_at nunca existiu nesta tabela (apenas started_at).
-- Adicionamos com DEFAULT now() para que registros existentes recebam o valor
-- de started_at (ou now() se started_at for NULL).

ALTER TABLE public.reprocess_logs
    ADD COLUMN IF NOT EXISTS created_at timestamptz;

-- Backfill: usar started_at como proxy para registros historicos
UPDATE public.reprocess_logs
   SET created_at = COALESCE(started_at, now())
 WHERE created_at IS NULL;

ALTER TABLE public.reprocess_logs
    ALTER COLUMN created_at SET DEFAULT now();

-- ---------------------------------------------------------------------------
-- 2. checkin_audit_logs — Indice composto (usuario + tempo)
-- ---------------------------------------------------------------------------
-- Caso de uso: "Mostrar todas as alteracoes feitas pelo usuario X, das mais
--               recentes para as mais antigas" — aba Ajustes / Historico.
CREATE INDEX IF NOT EXISTS checkin_audit_logs_changed_by_created_idx
    ON public.checkin_audit_logs (changed_by, created_at DESC);

COMMENT ON INDEX public.checkin_audit_logs_changed_by_created_idx IS
    'DB-02: Otimiza busca de auditoria por usuario (changed_by) ordenada por data.';

-- ---------------------------------------------------------------------------
-- 3. checkin_audit_logs — Indice simples em checkin_id
-- ---------------------------------------------------------------------------
-- Caso de uso: "Mostrar historico de alteracoes de um check-in especifico".
CREATE INDEX IF NOT EXISTS checkin_audit_logs_checkin_idx
    ON public.checkin_audit_logs (checkin_id);

COMMENT ON INDEX public.checkin_audit_logs_checkin_idx IS
    'DB-02: Otimiza lookup de auditoria por check-in.';

-- ---------------------------------------------------------------------------
-- 4. checkin_audit_logs — Indice em created_at (range scan temporal)
-- ---------------------------------------------------------------------------
-- Caso de uso: "Listar todas as alteracoes nos ultimos 7 dias" sem filtro
--               de usuario. Permite Index Scan descendente eficiente.
CREATE INDEX IF NOT EXISTS checkin_audit_logs_created_at_idx
    ON public.checkin_audit_logs (created_at DESC);

COMMENT ON INDEX public.checkin_audit_logs_created_at_idx IS
    'DB-02: Otimiza range scans temporais no log de auditoria.';

-- ---------------------------------------------------------------------------
-- 5. checkin_audit_logs — Indice em change_type + created_at
-- ---------------------------------------------------------------------------
-- Caso de uso: "Filtrar apenas correcoes manuais (ou reprocessamentos) por data".
CREATE INDEX IF NOT EXISTS checkin_audit_logs_type_created_idx
    ON public.checkin_audit_logs (change_type, created_at DESC);

COMMENT ON INDEX public.checkin_audit_logs_type_created_idx IS
    'DB-02: Otimiza filtro por tipo de mudanca + ordem cronologica.';

-- ---------------------------------------------------------------------------
-- 6. reprocess_logs — Indice composto (loja + created_at)
-- ---------------------------------------------------------------------------
-- Caso de uso: "Timeline de injecao de dados por unidade, das mais recentes
--               para as mais antigas" — Dashboard de Ingestao.
CREATE INDEX IF NOT EXISTS reprocess_logs_store_created_idx
    ON public.reprocess_logs (store_id, created_at DESC);

COMMENT ON INDEX public.reprocess_logs_store_created_idx IS
    'DB-02: Otimiza busca cronologica de reprocessamentos por loja.';

-- ---------------------------------------------------------------------------
-- 7. reprocess_logs — Indice em status (filtro de jobs pendentes/falhados)
-- ---------------------------------------------------------------------------
-- Caso de uso: "Listar todos os reprocessamentos com status = pending ou failed".
-- Indice parcial para cobrir apenas os estados ativos (alta seletividade).
CREATE INDEX IF NOT EXISTS reprocess_logs_active_status_idx
    ON public.reprocess_logs (status, created_at DESC)
    WHERE status IN ('pending', 'processing', 'failed');

COMMENT ON INDEX public.reprocess_logs_active_status_idx IS
    'DB-02: Indice parcial para jobs ativos/necessitam atencao (pending, processing, failed).';

-- ---------------------------------------------------------------------------
-- 8. reprocess_logs — Indice em triggered_by (auditoria de quem disparou)
-- ---------------------------------------------------------------------------
-- Caso de uso: "Historico de reprocessamentos disparados por um usuario".
CREATE INDEX IF NOT EXISTS reprocess_logs_triggered_by_idx
    ON public.reprocess_logs (triggered_by, created_at DESC)
    WHERE triggered_by IS NOT NULL;

COMMENT ON INDEX public.reprocess_logs_triggered_by_idx IS
    'DB-02: Otimiza busca de reprocessamentos por usuario que disparou.';

COMMIT;
