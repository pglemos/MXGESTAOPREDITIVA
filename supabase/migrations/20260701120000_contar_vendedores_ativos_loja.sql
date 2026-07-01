-- ============================================================================
-- Migration: 20260701120000_contar_vendedores_ativos_loja.sql
-- Epic:      EPIC-MX-CRM-VENDEDOR — rateio de meta individual (individual_goal_mode)
--
-- PROBLEMA: regras_metas_loja.individual_goal_mode existe ('even' | 'custom'
--   | 'proportional') mas nunca foi consumido em lugar nenhum do sistema -
--   src/hooks/useGoals.ts tem sellerGoals hardcoded como [] e o Funil de
--   Vendas usa monthly_goal da loja INTEIRA como se fosse meta do vendedor.
--   Corrigir o modo 'even' (rateio igualitario) exige saber quantos
--   vendedores ativos a loja tem - mas a RLS de vinculos_loja restringe
--   SELECT a: area interna MX, a propria linha do usuario, ou dono/gerente
--   da loja (20260430190000). Um vendedor comum NAO consegue contar os
--   colegas para fazer esse calculo no cliente.
--
-- ESCOPO: RPC minima, SECURITY DEFINER, que devolve so a CONTAGEM (nunca
--   nomes/dados de outros vendedores) de vendedores ativos de uma loja,
--   e apenas para quem ja e membro ativo dela (defesa em profundidade -
--   nao abre a contagem para qualquer usuario autenticado).
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.contar_vendedores_ativos_loja(p_store_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(DISTINCT v.user_id)::integer
  FROM public.vinculos_loja v
  WHERE v.store_id = p_store_id
    AND v.is_active = true
    AND v.role = 'vendedor'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vinculos_loja self
      WHERE self.store_id = p_store_id
        AND self.user_id = auth.uid()
        AND self.is_active = true
    );
$$;

COMMENT ON FUNCTION public.contar_vendedores_ativos_loja(uuid) IS
  'Conta vendedores ativos de uma loja para rateio de meta individual (individual_goal_mode=even). So retorna contagem, nunca identidade; exige que o chamador seja membro ativo da propria loja.';

GRANT EXECUTE ON FUNCTION public.contar_vendedores_ativos_loja(uuid) TO authenticated;

COMMIT;

-- ============================================================================
-- DOWN (reversao manual)
-- ============================================================================
-- BEGIN;
--   DROP FUNCTION IF EXISTS public.contar_vendedores_ativos_loja(uuid);
-- COMMIT;
