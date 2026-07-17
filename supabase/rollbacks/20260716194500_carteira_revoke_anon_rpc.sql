-- DOWN
-- Restaura os privilégios anteriores das RPCs. Não recomendado em produção,
-- pois volta a permitir descoberta/execução pelo papel anon/PUBLIC.

GRANT EXECUTE ON FUNCTION public.carteira_salvar_cliente(jsonb, text) TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.carteira_iniciar_missao(jsonb, text) TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.carteira_atualizar_missao(uuid, jsonb) TO PUBLIC, anon;
