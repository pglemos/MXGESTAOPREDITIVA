-- ============================================================================
-- Migration: 20260715124852_listar_responsaveis_tratativa_loja.sql
-- Story: MX-22.4 — Formulários Garantia & Qualificado (Fechamento Diário)
--
-- PROBLEMA: o combo "Responsável pela Tratativa" (NovoRegistroModal.tsx,
-- formulário de Garantia) busca colegas de loja via
-- vinculos_loja/usuarios direto no client. A RLS de vinculos_loja_select
-- e usuarios_select (20260430190000) so libera SELECT de outra pessoa
-- para: area interna MX, a propria linha, ou dono/gerente da loja
-- (tem_papel_loja avalia o papel de quem CONSULTA, nao de quem e lido).
-- Um vendedor comum -- o unico persona real que abre este formulario --
-- recebe de volta so a propria linha. O combo fica vazio/so-o-proprio-
-- usuario em producao, apesar do codigo de UI estar correto.
--
-- Mesmo diagnostico ja resolvido para um caso irmao em
-- 20260701120000_contar_vendedores_ativos_loja.sql (rateio de meta).
-- Esta migration segue o mesmo padrao de defesa em profundidade: RPC
-- SECURITY DEFINER, gated por "chamador precisa ser membro ativo da
-- propria loja", retornando apenas id/name/role -- nunca dados sensiveis
-- adicionais, nunca abrindo a tabela crua a qualquer usuario autenticado.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.listar_responsaveis_tratativa_loja(p_store_id uuid)
RETURNS TABLE (id uuid, name text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT u.id, u.name, u.role
  FROM public.vinculos_loja v
  JOIN public.usuarios u ON u.id = v.user_id
  WHERE v.store_id = p_store_id
    AND v.is_active = true
    AND v.role IN ('vendedor', 'gerente', 'dono')
    AND coalesce(u.active, true) <> false
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.vinculos_loja self
      WHERE self.store_id = p_store_id
        AND self.user_id = auth.uid()
        AND self.is_active = true
    )
  ORDER BY u.name;
$$;

GRANT EXECUTE ON FUNCTION public.listar_responsaveis_tratativa_loja(uuid) TO authenticated;

COMMIT;
