-- Story MX-AUDIT-20260710 / Fase 5
-- Completa Universidade, compartilhamento com Desenvolvimento e perfil profissional.

ALTER TABLE public.treinamentos
  ADD COLUMN IF NOT EXISTS material_url text,
  ADD COLUMN IF NOT EXISTS segmentacao jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.treinamentos.material_url IS 'Material complementar HTTPS da aula.';
COMMENT ON COLUMN public.treinamentos.segmentacao IS 'Filtros opcionais por produto, plano, loja, cargo e perfil.';

ALTER TABLE public.vendedor_perfil
  ADD COLUMN IF NOT EXISTS data_entrada date,
  ADD COLUMN IF NOT EXISTS formacao_academica text,
  ADD COLUMN IF NOT EXISTS experiencias_anteriores text,
  ADD COLUMN IF NOT EXISTS cursos_certificacoes text,
  ADD COLUMN IF NOT EXISTS plano_carreira text,
  ADD COLUMN IF NOT EXISTS produtos_habilitados text[] NOT NULL DEFAULT '{}'::text[];

DROP POLICY IF EXISTS treinamentos_select_scoped ON public.treinamentos;
CREATE POLICY treinamentos_select_scoped ON public.treinamentos
FOR SELECT TO authenticated
USING (
  public.eh_area_interna_mx(auth.uid())
  OR (
    active = true
    AND coalesce(editorial_status, 'active') = 'active'
    AND (
      target_audience = 'todos'
      OR target_audience = coalesce((SELECT role FROM public.usuarios WHERE id = auth.uid()), '')
    )
    AND (store_id IS NULL OR public.tem_papel_loja(store_id, ARRAY['dono','gerente','vendedor'], auth.uid()))
    AND (
      coalesce(segmentacao->'lojas', '[]'::jsonb) = '[]'::jsonb
      OR EXISTS (
        SELECT 1 FROM public.vinculos_loja vl
         WHERE vl.user_id = auth.uid()
           AND coalesce(vl.is_active, true)
           AND segmentacao->'lojas' ? vl.store_id::text
      )
    )
    AND (coalesce(segmentacao->'perfis', '[]'::jsonb) = '[]'::jsonb OR segmentacao->'perfis' ? coalesce((SELECT role FROM public.usuarios WHERE id = auth.uid()), ''))
    AND (coalesce(segmentacao->'cargos', '[]'::jsonb) = '[]'::jsonb OR segmentacao->'cargos' ? coalesce((SELECT cargo_atual FROM public.vendedor_perfil WHERE seller_user_id = auth.uid()), ''))
    AND (coalesce(segmentacao->'planos', '[]'::jsonb) = '[]'::jsonb OR segmentacao->'planos' ? coalesce((SELECT remuneracao_plano_id::text FROM public.vendedor_perfil WHERE seller_user_id = auth.uid()), ''))
    AND (
      coalesce(segmentacao->'produtos', '[]'::jsonb) = '[]'::jsonb
      OR EXISTS (
        SELECT 1 FROM public.vendedor_perfil vp, jsonb_array_elements_text(segmentacao->'produtos') produto
         WHERE vp.seller_user_id = auth.uid() AND produto = ANY(vp.produtos_habilitados)
      )
    )
  )
);

CREATE TABLE IF NOT EXISTS public.vendedor_perfil_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_perfil_id uuid NOT NULL REFERENCES public.vendedor_perfil(id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  old_values jsonb NOT NULL,
  new_values jsonb NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendedor_perfil_historico_seller_changed
  ON public.vendedor_perfil_historico (seller_user_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendedor_perfil_historico_perfil
  ON public.vendedor_perfil_historico (vendedor_perfil_id);

ALTER TABLE public.vendedor_perfil_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vendedor_perfil_historico_read ON public.vendedor_perfil_historico;
CREATE POLICY vendedor_perfil_historico_read ON public.vendedor_perfil_historico
  FOR SELECT TO authenticated
  USING (
    seller_user_id = auth.uid()
    OR public.eh_administrador_mx(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.vendedor_perfil vp
       WHERE vp.id = vendedor_perfil_id
         AND (public.is_manager_of(vp.loja_id) OR public.is_owner_of(vp.loja_id))
    )
  );

-- Campos oficiais não podem ser alterados por uma chamada direta do próprio
-- vendedor. O frontend já os mostra como somente leitura; este trigger torna
-- a regra efetiva também no banco.
CREATE OR REPLACE FUNCTION public.proteger_campos_oficiais_vendedor_perfil()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_self_service boolean := auth.uid() IS NOT NULL
    AND auth.uid() = NEW.seller_user_id
    AND NOT public.eh_administrador_mx(auth.uid())
    AND NOT (NEW.loja_id IS NOT NULL AND (public.is_manager_of(NEW.loja_id) OR public.is_owner_of(NEW.loja_id)));
BEGIN
  IF NOT v_self_service THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT vl.store_id INTO NEW.loja_id
      FROM public.vinculos_loja vl
     WHERE vl.user_id = NEW.seller_user_id
       AND coalesce(vl.is_active, true)
     ORDER BY vl.created_at DESC
     LIMIT 1;
    NEW.data_entrada := NULL;
    NEW.cargo_atual := NULL;
    NEW.remuneracao_plano_id := NULL;
    NEW.produtos_habilitados := '{}'::text[];
    NEW.vinculo_tipo := 'loja';
  ELSE
    NEW.loja_id := OLD.loja_id;
    NEW.data_entrada := OLD.data_entrada;
    NEW.cargo_atual := OLD.cargo_atual;
    NEW.remuneracao_plano_id := OLD.remuneracao_plano_id;
    NEW.produtos_habilitados := OLD.produtos_habilitados;
    NEW.vinculo_tipo := OLD.vinculo_tipo;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_proteger_campos_oficiais_vendedor_perfil ON public.vendedor_perfil;
CREATE TRIGGER trg_proteger_campos_oficiais_vendedor_perfil
BEFORE INSERT OR UPDATE ON public.vendedor_perfil
FOR EACH ROW EXECUTE FUNCTION public.proteger_campos_oficiais_vendedor_perfil();

CREATE OR REPLACE FUNCTION public.audit_vendedor_perfil_profissional()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW) THEN
    INSERT INTO public.vendedor_perfil_historico (
      vendedor_perfil_id, seller_user_id, changed_by, old_values, new_values
    ) VALUES (NEW.id, NEW.seller_user_id, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_audit_vendedor_perfil_profissional ON public.vendedor_perfil;
CREATE TRIGGER trg_audit_vendedor_perfil_profissional
AFTER UPDATE ON public.vendedor_perfil
FOR EACH ROW EXECUTE FUNCTION public.audit_vendedor_perfil_profissional();

REVOKE ALL ON FUNCTION public.proteger_campos_oficiais_vendedor_perfil() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_vendedor_perfil_profissional() FROM PUBLIC;

NOTIFY pgrst, 'reload schema';
