-- FIX: Allow all store members (including sellers) to read their store meta rules.

DROP POLICY IF EXISTS role_matrix_store_meta_rules_select ON public.store_meta_rules;
CREATE POLICY role_matrix_store_meta_rules_select ON public.store_meta_rules
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_admin()) 
        OR EXISTS (
            SELECT 1 FROM public.memberships 
            WHERE user_id = auth.uid() 
              AND store_id = public.store_meta_rules.store_id
        )
    );

COMMENT ON POLICY role_matrix_store_meta_rules_select ON public.store_meta_rules IS 'Permite que membros da loja visualizem as regras de meta da sua unidade.';
