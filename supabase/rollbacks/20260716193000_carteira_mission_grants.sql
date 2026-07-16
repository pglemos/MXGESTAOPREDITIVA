-- DOWN
-- Remove o acesso direto de leitura concedido ao papel authenticated.
-- As RPCs podem continuar ativas, mas a interface deixa de consultar missões.

REVOKE SELECT ON TABLE public.carteira_missao_itens FROM authenticated;
REVOKE SELECT ON TABLE public.carteira_missoes FROM authenticated;
