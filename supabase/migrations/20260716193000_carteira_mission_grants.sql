-- A interface consulta missões e itens diretamente sob RLS; gravações continuam
-- restritas às RPCs SECURITY DEFINER para preservar transação e idempotência.
GRANT SELECT ON TABLE public.carteira_missoes TO authenticated;
GRANT SELECT ON TABLE public.carteira_missao_itens TO authenticated;
