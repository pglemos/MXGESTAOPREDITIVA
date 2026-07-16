-- DOWN — remove a assinatura idempotente nova e restaura o wrapper v2 anterior.
BEGIN;

REVOKE ALL ON FUNCTION public.carteira_atualizar_missao_v2(uuid, jsonb, text)
  FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.carteira_atualizar_missao_v2(uuid, jsonb, text);

GRANT EXECUTE ON FUNCTION public.carteira_atualizar_missao_v2(uuid, jsonb)
  TO authenticated;

ALTER TABLE public.carteira_missoes
  DROP COLUMN IF EXISTS last_mutation_result,
  DROP COLUMN IF EXISTS last_mutation_key;

ALTER TABLE public.veiculos_estoque
  DROP CONSTRAINT IF EXISTS veiculos_estoque_created_by_idempotency_key_key,
  DROP COLUMN IF EXISTS idempotency_key;

COMMIT;
