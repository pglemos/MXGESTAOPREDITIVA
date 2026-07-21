-- DOWN: remove somente o entrypoint de simulação. As RPCs normais da Carteira
-- não são alteradas por esta migration.

BEGIN;

DROP FUNCTION IF EXISTS public.carteira_salvar_cliente_simulado_v1(jsonb, text);

COMMIT;
