-- EPIC-11: Reprocessamento e Reparo Administrativo
-- Metodologia MX

-- Função RPC (Remote Procedure Call) para invocar o motor de reprocessamento
-- Ela não recalcula tudo síncronamente (evitando timeouts), mas marca um lote de checkins 
-- como pendente ou registra o comando na tabela 'reprocess_logs' para ser consumido por um job assíncrono.

CREATE OR REPLACE FUNCTION public.request_reprocess(
    p_store_id UUID,
    p_source_type TEXT,
    p_triggered_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    -- 1. Insere o log de intenção de reprocessamento (STORY-11.1)
    INSERT INTO public.reprocess_logs (
        store_id,
        source_type,
        triggered_by,
        status,
        started_at
    ) VALUES (
        p_store_id,
        p_source_type,
        p_triggered_by,
        'pending',
        NOW()
    ) RETURNING id INTO v_log_id;

    -- Aqui acionaria um trigger via pg_net (webhook) para uma Edge Function de processamento pesado,
    -- mas para fins do MVP operacional, marcamos como 'pending' para consumo de um CRON.
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
