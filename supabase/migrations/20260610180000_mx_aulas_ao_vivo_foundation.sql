-- ============================================================================
-- Migration: 20260610180000_mx_aulas_ao_vivo_foundation.sql
-- Fundação de Aulas ao Vivo (spec Módulo Vendedor §11):
--   - aulas_ao_vivo: agenda de aulas (loja_id NULL = rede toda)
--   - aula_provas: prova de presença (questões com gabarito — NUNCA exposto
--     ao vendedor; leitura direta restrita à gestão)
--   - aula_presencas: presença validada por prova (>= nota_minima)
--   - RPCs SECURITY DEFINER: get_prova_aula (questões SEM gabarito) e
--     submeter_prova_aula (corrige server-side, registra presença best-of)
-- Reexecutável (IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. aulas_ao_vivo
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aulas_ao_vivo (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id          uuid REFERENCES public.lojas(id) ON DELETE CASCADE,
  titulo           text NOT NULL,
  descricao        text,
  instrutor        text,
  inicio           timestamptz NOT NULL,
  duracao_minutos  integer NOT NULL DEFAULT 60 CHECK (duracao_minutos > 0),
  link_transmissao text,
  gravacao_url     text,
  status           text NOT NULL DEFAULT 'agendada'
                   CHECK (status IN ('agendada', 'ao_vivo', 'encerrada', 'cancelada')),
  created_by       uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.aulas_ao_vivo IS 'Aulas ao vivo dos Treinamentos. loja_id NULL = visível para toda a rede.';

CREATE INDEX IF NOT EXISTS idx_aulas_ao_vivo_inicio ON public.aulas_ao_vivo(inicio);
CREATE INDEX IF NOT EXISTS idx_aulas_ao_vivo_loja   ON public.aulas_ao_vivo(loja_id);

-- ----------------------------------------------------------------------------
-- 2. aula_provas — gabarito fica aqui; vendedor só acessa via RPC sem gabarito
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aula_provas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id      uuid NOT NULL UNIQUE REFERENCES public.aulas_ao_vivo(id) ON DELETE CASCADE,
  questoes     jsonb NOT NULL DEFAULT '[]'::jsonb,
  nota_minima  integer NOT NULL DEFAULT 70 CHECK (nota_minima BETWEEN 0 AND 100),
  pontos_score integer NOT NULL DEFAULT 30 CHECK (pontos_score >= 0),
  created_at   timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.aula_provas IS 'Prova de presença da aula. questoes = [{pergunta, opcoes: text[], correta: int}]. Gabarito nunca exposto ao aluno (usar RPC get_prova_aula).';

-- ----------------------------------------------------------------------------
-- 3. aula_presencas — presença validada por prova
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aula_presencas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id    uuid NOT NULL REFERENCES public.aulas_ao_vivo(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  loja_id    uuid REFERENCES public.lojas(id) ON DELETE CASCADE,
  respostas  jsonb,
  nota       integer CHECK (nota BETWEEN 0 AND 100),
  aprovado   boolean NOT NULL DEFAULT false,
  pontos     integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (aula_id, user_id)
);
COMMENT ON TABLE public.aula_presencas IS 'Presença em aula ao vivo, validada pela prova (nota >= nota_minima). Escrita apenas via RPC submeter_prova_aula.';

CREATE INDEX IF NOT EXISTS idx_aula_presencas_user ON public.aula_presencas(user_id);
CREATE INDEX IF NOT EXISTS idx_aula_presencas_aula ON public.aula_presencas(aula_id);

-- ----------------------------------------------------------------------------
-- 4. RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.aulas_ao_vivo  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aula_provas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aula_presencas ENABLE ROW LEVEL SECURITY;

-- aulas_ao_vivo: membros da loja (ou rede, loja_id NULL) leem; gestão/admin gerencia
DROP POLICY IF EXISTS aulas_ao_vivo_read ON public.aulas_ao_vivo;
CREATE POLICY aulas_ao_vivo_read ON public.aulas_ao_vivo FOR SELECT TO authenticated
  USING (
    loja_id IS NULL
    OR public.is_member_of(loja_id)
    OR public.is_manager_of(loja_id)
    OR public.is_owner_of(loja_id)
    OR public.user_has_role(ARRAY['admin_mx', 'master', 'consultant'])
  );
DROP POLICY IF EXISTS aulas_ao_vivo_manage ON public.aulas_ao_vivo;
CREATE POLICY aulas_ao_vivo_manage ON public.aulas_ao_vivo FOR ALL TO authenticated
  USING (
    (loja_id IS NOT NULL AND (public.is_manager_of(loja_id) OR public.is_owner_of(loja_id)))
    OR public.user_has_role(ARRAY['admin_mx', 'master', 'consultant'])
  )
  WITH CHECK (
    (loja_id IS NOT NULL AND (public.is_manager_of(loja_id) OR public.is_owner_of(loja_id)))
    OR public.user_has_role(ARRAY['admin_mx', 'master', 'consultant'])
  );

-- aula_provas: SOMENTE gestão/admin lê direto (contém gabarito)
DROP POLICY IF EXISTS aula_provas_manage ON public.aula_provas;
CREATE POLICY aula_provas_manage ON public.aula_provas FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.aulas_ao_vivo a
      WHERE a.id = aula_id
        AND ((a.loja_id IS NOT NULL AND (public.is_manager_of(a.loja_id) OR public.is_owner_of(a.loja_id)))
             OR public.user_has_role(ARRAY['admin_mx', 'master', 'consultant']))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.aulas_ao_vivo a
      WHERE a.id = aula_id
        AND ((a.loja_id IS NOT NULL AND (public.is_manager_of(a.loja_id) OR public.is_owner_of(a.loja_id)))
             OR public.user_has_role(ARRAY['admin_mx', 'master', 'consultant']))
    )
  );

-- aula_presencas: aluno lê as próprias; gestão da loja lê; escrita só via RPC
DROP POLICY IF EXISTS aula_presencas_own_read ON public.aula_presencas;
CREATE POLICY aula_presencas_own_read ON public.aula_presencas FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS aula_presencas_store_read ON public.aula_presencas;
CREATE POLICY aula_presencas_store_read ON public.aula_presencas FOR SELECT TO authenticated
  USING (
    (loja_id IS NOT NULL AND (public.is_manager_of(loja_id) OR public.is_owner_of(loja_id)))
    OR public.user_has_role(ARRAY['admin_mx', 'master', 'consultant'])
  );

-- ----------------------------------------------------------------------------
-- 5. RPCs — prova sem gabarito + correção server-side
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_prova_aula(p_aula_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'nota_minima', p.nota_minima,
    'pontos_score', p.pontos_score,
    'questoes', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('pergunta', q->>'pergunta', 'opcoes', q->'opcoes') ORDER BY idx)
       FROM jsonb_array_elements(p.questoes) WITH ORDINALITY AS t(q, idx)),
      '[]'::jsonb
    )
  )
  FROM public.aula_provas p
  WHERE p.aula_id = p_aula_id
    AND EXISTS (
      SELECT 1 FROM public.aulas_ao_vivo a
      WHERE a.id = p_aula_id
        AND (a.loja_id IS NULL
             OR public.is_member_of(a.loja_id)
             OR public.is_manager_of(a.loja_id)
             OR public.is_owner_of(a.loja_id)
             OR public.user_has_role(ARRAY['admin_mx', 'master', 'consultant']))
    );
$$;

CREATE OR REPLACE FUNCTION public.submeter_prova_aula(p_aula_id uuid, p_respostas integer[])
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prova   public.aula_provas%ROWTYPE;
  v_loja    uuid;
  v_total   integer;
  v_acertos integer := 0;
  v_nota    integer;
  v_aprovado boolean;
  v_pontos  integer;
  v_q       jsonb;
  v_i       integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sessão inválida.';
  END IF;

  SELECT loja_id INTO v_loja
  FROM public.aulas_ao_vivo a
  WHERE a.id = p_aula_id
    AND (a.loja_id IS NULL
         OR public.is_member_of(a.loja_id)
         OR public.is_manager_of(a.loja_id)
         OR public.is_owner_of(a.loja_id)
         OR public.user_has_role(ARRAY['admin_mx', 'master', 'consultant']));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aula não encontrada.';
  END IF;

  SELECT * INTO v_prova FROM public.aula_provas WHERE aula_id = p_aula_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Esta aula ainda não tem prova de presença.';
  END IF;

  v_total := jsonb_array_length(v_prova.questoes);
  IF v_total = 0 THEN
    RAISE EXCEPTION 'A prova desta aula não tem questões.';
  END IF;
  IF p_respostas IS NULL OR array_length(p_respostas, 1) IS DISTINCT FROM v_total THEN
    RAISE EXCEPTION 'Responda todas as % questões.', v_total;
  END IF;

  FOR v_q IN SELECT * FROM jsonb_array_elements(v_prova.questoes) LOOP
    v_i := v_i + 1;
    IF (v_q->>'correta')::integer = p_respostas[v_i] THEN
      v_acertos := v_acertos + 1;
    END IF;
  END LOOP;

  v_nota := round(100.0 * v_acertos / v_total);
  v_aprovado := v_nota >= v_prova.nota_minima;
  v_pontos := CASE WHEN v_aprovado THEN v_prova.pontos_score ELSE 0 END;

  -- Best-of: manter a melhor tentativa do aluno
  INSERT INTO public.aula_presencas (aula_id, user_id, loja_id, respostas, nota, aprovado, pontos)
  VALUES (p_aula_id, auth.uid(), v_loja, to_jsonb(p_respostas), v_nota, v_aprovado, v_pontos)
  ON CONFLICT (aula_id, user_id) DO UPDATE SET
    respostas = CASE WHEN EXCLUDED.nota >= public.aula_presencas.nota THEN EXCLUDED.respostas ELSE public.aula_presencas.respostas END,
    nota      = GREATEST(public.aula_presencas.nota, EXCLUDED.nota),
    aprovado  = public.aula_presencas.aprovado OR EXCLUDED.aprovado,
    pontos    = GREATEST(public.aula_presencas.pontos, EXCLUDED.pontos);

  RETURN jsonb_build_object('nota', v_nota, 'aprovado', v_aprovado, 'pontos', v_pontos);
END;
$$;

REVOKE ALL ON FUNCTION public.get_prova_aula(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.submeter_prova_aula(uuid, integer[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_prova_aula(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submeter_prova_aula(uuid, integer[]) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- DOWN
-- Reversao manual controlada:
-- 1. Revogar EXECUTE das RPCs public.get_prova_aula(uuid) e public.submeter_prova_aula(uuid, integer[]).
-- 2. DROP FUNCTION IF EXISTS public.submeter_prova_aula(uuid, integer[]);
-- 3. DROP FUNCTION IF EXISTS public.get_prova_aula(uuid);
-- 4. DROP TABLE IF EXISTS public.aula_presencas;
-- 5. DROP TABLE IF EXISTS public.aula_provas;
-- 6. DROP TABLE IF EXISTS public.aulas_ao_vivo;
-- 7. NOTIFY pgrst, 'reload schema';
