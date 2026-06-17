-- MX Vendedor - Feedback autonomo gerado pelo sistema
-- PRD EV-6.5 / EV-12.1: vendedor autonomo recebe devolutiva sistemica
-- sem gerente humano, mantendo a mesma UX e a mesma acao rastreavel da Central.

ALTER TABLE public.devolutivas
  ALTER COLUMN manager_id DROP NOT NULL;

COMMENT ON COLUMN public.devolutivas.manager_id IS
  'Gerente responsavel pela devolutiva; NULL para devolutivas sistemicas geradas para vendedor autonomo.';

ALTER TABLE public.devolutiva_acoes
  ALTER COLUMN manager_id DROP NOT NULL;

COMMENT ON COLUMN public.devolutiva_acoes.manager_id IS
  'Gerente responsavel pela acao; NULL quando a acao nasceu de feedback sistemico para vendedor autonomo.';

DROP POLICY IF EXISTS devolutivas_insert_system_autonomo ON public.devolutivas;
CREATE POLICY devolutivas_insert_system_autonomo
  ON public.devolutivas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id = auth.uid()
    AND manager_id IS NULL
    AND diagnostic_json ->> 'origem' = 'sistema'
    AND diagnostic_json ->> 'rule_id' = 'cadencia_gargalo_principal'
    AND EXISTS (
      SELECT 1
      FROM public.vendedor_perfil perfil
      WHERE perfil.seller_user_id = auth.uid()
        AND perfil.vinculo_tipo = 'autonomo'
    )
  );

DROP POLICY IF EXISTS devolutiva_acoes_insert_system_autonomo ON public.devolutiva_acoes;
CREATE POLICY devolutiva_acoes_insert_system_autonomo
  ON public.devolutiva_acoes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id = auth.uid()
    AND manager_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.devolutivas devolutiva
      WHERE devolutiva.id = devolutiva_id
        AND devolutiva.seller_id = auth.uid()
        AND devolutiva.manager_id IS NULL
        AND devolutiva.diagnostic_json ->> 'origem' = 'sistema'
    )
  );

-- Rollback manual:
-- DROP POLICY IF EXISTS devolutiva_acoes_insert_system_autonomo ON public.devolutiva_acoes;
-- DROP POLICY IF EXISTS devolutivas_insert_system_autonomo ON public.devolutivas;
-- UPDATE public.devolutiva_acoes SET manager_id = seller_id WHERE manager_id IS NULL;
-- ALTER TABLE public.devolutiva_acoes ALTER COLUMN manager_id SET NOT NULL;
-- UPDATE public.devolutivas SET manager_id = seller_id WHERE manager_id IS NULL;
-- ALTER TABLE public.devolutivas ALTER COLUMN manager_id SET NOT NULL;
