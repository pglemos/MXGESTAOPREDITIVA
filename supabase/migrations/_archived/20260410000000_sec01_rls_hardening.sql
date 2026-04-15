-- SEC-01: RLS Protection Hardening for daily_checkins
-- Restringe o SELECT para apenas Admins ou Membros da Loja (Dono, Gerente, Vendedor).
-- Garante isolamento de dados entre unidades de negócio.

BEGIN;

-- 1. daily_checkins: Proteção analítica granular
-- Removemos a política permissiva anterior
DROP POLICY IF EXISTS "daily_checkins_select" ON public.daily_checkins;

-- Criamos a nova política segura
-- ✅ PERFORMANCE: Utilizamos as funções is_admin() e is_member_of(store_id)
-- ✅ SEGURANÇA: Bloqueio de acesso cruzado entre lojas.
CREATE POLICY "daily_checkins_select_secured" ON public.daily_checkins
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_admin()) 
        OR 
        (SELECT public.is_member_of(store_id))
    );

-- 2. store_sellers: Proteção do vínculo de pessoal
DROP POLICY IF EXISTS "store_sellers_select" ON public.store_sellers;

CREATE POLICY "store_sellers_select_secured" ON public.store_sellers
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_admin()) 
        OR 
        (SELECT public.is_member_of(store_id))
    );

COMMENT ON POLICY "daily_checkins_select_secured" ON public.daily_checkins IS 'Restringe acesso a check-ins apenas para administradores ou membros da própria loja.';
COMMENT ON POLICY "store_sellers_select_secured" ON public.store_sellers IS 'Restringe acesso ao quadro de vendedores apenas para administradores ou membros da própria loja.';

COMMIT;
