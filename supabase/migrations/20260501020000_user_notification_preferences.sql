-- Adiciona preferências de notificação por usuário (controle granular)
-- Persiste configurações da aba "Notificações" em /configuracoes
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB
  DEFAULT jsonb_build_object(
    'push', true,
    'email', true,
    'matinal', true,
    'weekly', true,
    'monthly', false,
    'gaps', true,
    'pdi', true,
    'rituals', true,
    'broadcasts', true
  );

COMMENT ON COLUMN public.usuarios.notification_preferences IS
  'Preferências granulares de notificação do usuário (push, email, canais). Editável em /configuracoes.';

-- Backfill rows existentes que ficaram NULL após o ALTER TABLE
UPDATE public.usuarios
   SET notification_preferences = jsonb_build_object(
     'push', true,
     'email', true,
     'matinal', true,
     'weekly', true,
     'monthly', false,
     'gaps', true,
     'pdi', true,
     'rituals', true,
     'broadcasts', true
   )
 WHERE notification_preferences IS NULL;

-- Reload do schema PostgREST
NOTIFY pgrst, 'reload schema';
