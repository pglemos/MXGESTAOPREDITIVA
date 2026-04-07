-- EPIC-12: Rastreamento de Notificações Enviadas
-- Adiciona campos para identificar o remetente e agrupar envios em massa.

ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS broadcast_id UUID;

CREATE INDEX IF NOT EXISTS notifications_sender_id_idx ON public.notifications(sender_id);
CREATE INDEX IF NOT EXISTS notifications_broadcast_id_idx ON public.notifications(broadcast_id);

-- Atualizar a RPC para preencher esses campos
CREATE OR REPLACE FUNCTION public.send_broadcast_notification(
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'system',
    p_priority TEXT DEFAULT 'medium',
    p_store_id UUID DEFAULT NULL,
    p_target_role TEXT DEFAULT 'todos',
    p_link TEXT DEFAULT NULL,
    p_sender_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_record RECORD;
    v_broadcast_id UUID := gen_random_uuid();
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
            sender_id,
            broadcast_id,
            title,
            message,
            type,
            priority,
            link,
            read
        ) VALUES (
            v_user_record.id,
            COALESCE(p_store_id, v_user_record.store_id),
            p_sender_id,
            v_broadcast_id,
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
