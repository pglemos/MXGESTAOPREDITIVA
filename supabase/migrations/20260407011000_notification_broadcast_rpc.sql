-- EPIC-12: Sistema de Notificações Broadcast
-- Permite que administradores enviem mensagens para toda a rede ou unidades específicas.

CREATE OR REPLACE FUNCTION public.send_broadcast_notification(
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'system',
    p_priority TEXT DEFAULT 'medium',
    p_store_id UUID DEFAULT NULL,
    p_target_role TEXT DEFAULT 'todos',
    p_link TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_record RECORD;
BEGIN
    -- Selecionar usuários baseados nos filtros
    FOR v_user_record IN 
        SELECT DISTINCT u.id, m.store_id
        FROM public.users u
        LEFT JOIN public.memberships m ON u.id = m.user_id
        WHERE u.active = TRUE
          AND (p_store_id IS NULL OR m.store_id = p_store_id)
          AND (
              p_target_role = 'todos' 
              OR u.role = p_target_role 
              OR (m.role = p_target_role AND m.store_id = p_store_id)
          )
    LOOP
        INSERT INTO public.notifications (
            recipient_id,
            store_id,
            title,
            message,
            type,
            priority,
            link,
            read
        ) VALUES (
            v_user_record.id,
            COALESCE(p_store_id, v_user_record.store_id),
            p_title,
            p_message,
            p_type,
            p_priority,
            p_link,
            FALSE
        );
    END LOOP;
END;
$$;

-- Revogar acesso público e permitir apenas para autenticados
REVOKE ALL ON FUNCTION public.send_broadcast_notification FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_broadcast_notification TO authenticated;

-- Comentário de Auditoria
COMMENT ON FUNCTION public.send_broadcast_notification IS 'Explode uma notificação corporativa para múltiplos usuários baseada em unidade e papel operacional.';
