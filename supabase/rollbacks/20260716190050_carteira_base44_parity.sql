-- DOWN
-- Rollback manual da persistência da Carteira Base44 1:1.
-- ATENÇÃO: executar somente após exportar carteira_missoes e carteira_missao_itens,
-- pois a remoção das tabelas elimina o progresso persistido das missões.

REVOKE EXECUTE ON FUNCTION public.carteira_salvar_cliente(jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.carteira_iniciar_missao(jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.carteira_atualizar_missao(uuid, jsonb) FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.carteira_atualizar_missao(uuid, jsonb);
DROP FUNCTION IF EXISTS public.carteira_iniciar_missao(jsonb, text);
DROP FUNCTION IF EXISTS public.carteira_salvar_cliente(jsonb, text);

DROP TABLE IF EXISTS public.carteira_missao_itens;
DROP TABLE IF EXISTS public.carteira_missoes;

DROP INDEX IF EXISTS public.eventos_comerciais_idempotency_key_uidx;

ALTER TABLE public.eventos_comerciais
  DROP COLUMN IF EXISTS metadata;

ALTER TABLE public.clientes
  DROP COLUMN IF EXISTS reactivation_at,
  DROP COLUMN IF EXISTS do_not_contact_reason,
  DROP COLUMN IF EXISTS do_not_contact_at,
  DROP COLUMN IF EXISTS do_not_contact;
