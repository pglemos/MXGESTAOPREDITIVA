-- v1.1: Database Integrity Triggers (Membership Orphanage)
-- Objetivo: Prevenir a existência de vendedores fantasmas após a exclusão de uma unidade.

BEGIN;

-- 1. Função que inativa usuários caso percam todas as suas afiliações operacionais
CREATE OR REPLACE FUNCTION public.check_orphan_users_after_membership_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_user_id uuid;
BEGIN
    -- Identificar qual coluna de ID utilizar baseado na tabela de origem
    IF TG_TABLE_NAME = 'store_sellers' THEN
        v_target_user_id := OLD.seller_user_id;
    ELSIF TG_TABLE_NAME = 'memberships' THEN
        v_target_user_id := OLD.user_id;
    ELSE
        RETURN OLD;
    END IF;

    -- Nunca desativar usuários admin
    IF EXISTS (
        SELECT 1 FROM public.users
        WHERE id = v_target_user_id AND role = 'admin'
    ) THEN
        RETURN OLD;
    END IF;

    -- Se o usuário deletado não tem mais nenhuma outra loja vinculada
    IF NOT EXISTS (
        SELECT 1 
        FROM public.store_sellers 
        WHERE seller_user_id = v_target_user_id 
          AND is_active = true
    ) AND NOT EXISTS (
        SELECT 1 
        FROM public.memberships 
        WHERE user_id = v_target_user_id
    ) THEN
        -- Inativar usuário para evitar contas fantasmas
        UPDATE public.users
        SET active = false,
            updated_at = now()
        WHERE id = v_target_user_id
          AND active = true;
    END IF;

    RETURN OLD;
END;
$$;

COMMENT ON FUNCTION public.check_orphan_users_after_membership_deletion IS 'Verifica e inativa usuários operacionais que perdem todas as conexões com as lojas MX. Admins nunca são desativados.';

-- 2. Associar trigger a tabela store_sellers e memberships
DROP TRIGGER IF EXISTS tr_cleanup_orphans_on_store_seller_delete ON public.store_sellers;
CREATE TRIGGER tr_cleanup_orphans_on_store_seller_delete
AFTER DELETE ON public.store_sellers
FOR EACH ROW EXECUTE FUNCTION public.check_orphan_users_after_membership_deletion();

DROP TRIGGER IF EXISTS tr_cleanup_orphans_on_membership_delete ON public.memberships;
CREATE TRIGGER tr_cleanup_orphans_on_membership_delete
AFTER DELETE ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.check_orphan_users_after_membership_deletion();

COMMIT;
