-- DOWN — reverte os entrypoints v2 sem apagar dados de clientes ou missões.
BEGIN;

REVOKE EXECUTE ON FUNCTION public.carteira_salvar_cliente_v2(jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.carteira_iniciar_missao_v2(jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.carteira_atualizar_missao_v2(uuid, jsonb) FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.carteira_atualizar_missao_v2(uuid, jsonb);
DROP FUNCTION IF EXISTS public.carteira_iniciar_missao_v2(jsonb, text);
DROP FUNCTION IF EXISTS public.carteira_salvar_cliente_v2(jsonb, text);

GRANT EXECUTE ON FUNCTION public.carteira_salvar_cliente(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.carteira_iniciar_missao(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.carteira_atualizar_missao(uuid, jsonb) TO authenticated;

DROP POLICY IF EXISTS carteira_missao_itens_seller_write ON public.carteira_missao_itens;
DROP POLICY IF EXISTS carteira_missao_itens_read ON public.carteira_missao_itens;
CREATE POLICY carteira_missao_itens_access
  ON public.carteira_missao_itens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.carteira_missoes m
      WHERE m.id = missao_id
        AND (
          m.seller_user_id = auth.uid()
          OR is_manager_of(m.loja_id)
          OR is_owner_of(m.loja_id)
          OR user_has_role(ARRAY['admin_mx'::text, 'master'::text, 'consultant'::text])
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carteira_missoes m
      WHERE m.id = missao_id AND m.seller_user_id = auth.uid()
    )
  );

ALTER TABLE public.carteira_missoes DROP COLUMN IF EXISTS revision;

COMMIT;
