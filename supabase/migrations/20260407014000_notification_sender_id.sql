-- EPIC-12: Adicionar sender_id na tabela de notificações para auditoria de broadcasts

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Atualizar RLS se necessário (já deve estar aberto para autenticados verem as próprias notificações)
-- Mas precisamos garantir que o sistema possa inserir.

COMMENT ON COLUMN public.notifications.sender_id IS 'Usuário que disparou a notificação (ex: Admin em broadcast).';
