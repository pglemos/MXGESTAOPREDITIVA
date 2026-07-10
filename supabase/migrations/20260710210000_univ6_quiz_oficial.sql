-- ============================================================================
-- Migration: 20260710210000_univ6_quiz_oficial.sql
-- Origem:    Auditoria Integral 2026-07-10 (UNIV-6 / Sprint Universidade)
--
-- ESCOPO: quiz oficial da Universidade MX. Contrato da auditoria:
--   5–10 questões por aula, nota mínima 70%, tentativas registradas,
--   presença em aula ao vivo, tudo auditável.
--
--   Estrutura:
--   - treinamento_quiz_questoes: catálogo de questões por aula (sem gabarito).
--   - treinamento_quiz_gabarito: resposta correta em tabela separada — RLS
--     permite leitura somente à área interna MX; o vendedor nunca enxerga.
--   - treinamento_quiz_tentativas: append-only, SEM policy de INSERT/UPDATE
--     para o cliente — só o RPC (SECURITY DEFINER) grava, então nota/aprovado
--     não podem ser forjados pelo frontend.
--   - treinamento_presencas: confirmação de presença em aula ao vivo.
--   - RPC submeter_quiz_treinamento: corrige no servidor, exige 5–10 questões
--     ativas, aprova com nota >= 70 e conclui o progresso oficial.
--
--   Sem seed de questões: conteúdo de prova é editorial e será cadastrado
--   pela área interna (Artigo IV, No Invention).
--
--   Aditivo e reversível (bloco DOWN comentado ao final).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Questões (visíveis a qualquer autenticado; escrita só área interna)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.treinamento_quiz_questoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  pergunta text NOT NULL CHECK (length(trim(pergunta)) > 0),
  opcoes jsonb NOT NULL CHECK (jsonb_typeof(opcoes) = 'array' AND jsonb_array_length(opcoes) BETWEEN 2 AND 6),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treinamento_quiz_questoes_training
  ON public.treinamento_quiz_questoes (training_id, ordem);

COMMENT ON TABLE public.treinamento_quiz_questoes IS
  'Questões do quiz oficial por aula da Universidade MX (UNIV-6). Gabarito fica em tabela separada, invisível ao vendedor.';

ALTER TABLE public.treinamento_quiz_questoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS treinamento_quiz_questoes_select ON public.treinamento_quiz_questoes;
CREATE POLICY treinamento_quiz_questoes_select ON public.treinamento_quiz_questoes
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS treinamento_quiz_questoes_write ON public.treinamento_quiz_questoes;
CREATE POLICY treinamento_quiz_questoes_write ON public.treinamento_quiz_questoes
  FOR ALL TO authenticated
  USING (public.eh_area_interna_mx(auth.uid()))
  WITH CHECK (public.eh_area_interna_mx(auth.uid()));

-- ----------------------------------------------------------------------------
-- Gabarito (leitura e escrita SÓ área interna; correção via RPC definer)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.treinamento_quiz_gabarito (
  questao_id uuid PRIMARY KEY REFERENCES public.treinamento_quiz_questoes(id) ON DELETE CASCADE,
  resposta_correta integer NOT NULL CHECK (resposta_correta >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.treinamento_quiz_gabarito IS
  'Resposta correta de cada questão (UNIV-6). Separado das questões para que RLS impeça o vendedor de ler o gabarito.';

ALTER TABLE public.treinamento_quiz_gabarito ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS treinamento_quiz_gabarito_interna ON public.treinamento_quiz_gabarito;
CREATE POLICY treinamento_quiz_gabarito_interna ON public.treinamento_quiz_gabarito
  FOR ALL TO authenticated
  USING (public.eh_area_interna_mx(auth.uid()))
  WITH CHECK (public.eh_area_interna_mx(auth.uid()));

-- ----------------------------------------------------------------------------
-- Tentativas (append-only; escrita exclusiva do RPC — sem policy de INSERT)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.treinamento_quiz_tentativas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  respostas jsonb NOT NULL,
  acertos integer NOT NULL CHECK (acertos >= 0),
  total_questoes integer NOT NULL CHECK (total_questoes > 0),
  nota numeric(5,2) NOT NULL CHECK (nota BETWEEN 0 AND 100),
  aprovado boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treinamento_quiz_tentativas_seller
  ON public.treinamento_quiz_tentativas (seller_user_id, training_id, created_at DESC);

COMMENT ON TABLE public.treinamento_quiz_tentativas IS
  'Tentativas de quiz (UNIV-6). Append-only: gravadas apenas pelo RPC submeter_quiz_treinamento; nota mínima de aprovação 70%.';

ALTER TABLE public.treinamento_quiz_tentativas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS treinamento_quiz_tentativas_select ON public.treinamento_quiz_tentativas;
CREATE POLICY treinamento_quiz_tentativas_select ON public.treinamento_quiz_tentativas
  FOR SELECT TO authenticated
  USING (
    seller_user_id = auth.uid()
    OR public.eh_administrador_mx(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.vinculos_loja vl
       WHERE vl.user_id = treinamento_quiz_tentativas.seller_user_id
         AND coalesce(vl.is_active, true)
         AND (public.is_manager_of(vl.store_id) OR public.is_owner_of(vl.store_id))
    )
  );

-- ----------------------------------------------------------------------------
-- Presença em aula ao vivo
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.treinamento_presencas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  confirmado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (training_id, seller_user_id)
);

COMMENT ON TABLE public.treinamento_presencas IS
  'Presença confirmada em aula ao vivo da Universidade MX (UNIV-6). Auditável por timestamp; um registro por vendedor/aula.';

ALTER TABLE public.treinamento_presencas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS treinamento_presencas_select ON public.treinamento_presencas;
CREATE POLICY treinamento_presencas_select ON public.treinamento_presencas
  FOR SELECT TO authenticated
  USING (
    seller_user_id = auth.uid()
    OR public.eh_administrador_mx(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.vinculos_loja vl
       WHERE vl.user_id = treinamento_presencas.seller_user_id
         AND coalesce(vl.is_active, true)
         AND (public.is_manager_of(vl.store_id) OR public.is_owner_of(vl.store_id))
    )
  );

DROP POLICY IF EXISTS treinamento_presencas_insert ON public.treinamento_presencas;
CREATE POLICY treinamento_presencas_insert ON public.treinamento_presencas
  FOR INSERT TO authenticated
  WITH CHECK (seller_user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RPC: corrige o quiz no servidor e conclui o progresso quando aprovado
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submeter_quiz_treinamento(
  p_training_id uuid,
  p_respostas jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_total integer;
  v_acertos integer;
  v_nota numeric(5,2);
  v_aprovado boolean;
  v_tentativa_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Sessão inválida.';
  END IF;
  IF p_respostas IS NULL OR jsonb_typeof(p_respostas) <> 'object' THEN
    RAISE EXCEPTION 'Respostas inválidas.';
  END IF;

  SELECT count(*) INTO v_total
    FROM public.treinamento_quiz_questoes q
   WHERE q.training_id = p_training_id AND q.active;

  IF v_total < 5 OR v_total > 10 THEN
    RAISE EXCEPTION 'Quiz não configurado: a aula precisa de 5 a 10 questões ativas (tem %).', v_total;
  END IF;

  SELECT count(*) INTO v_acertos
    FROM public.treinamento_quiz_questoes q
    JOIN public.treinamento_quiz_gabarito g ON g.questao_id = q.id
   WHERE q.training_id = p_training_id
     AND q.active
     AND (p_respostas ->> q.id::text) IS NOT NULL
     AND (p_respostas ->> q.id::text)::integer = g.resposta_correta;

  v_nota := round(v_acertos::numeric / v_total * 100, 2);
  v_aprovado := v_nota >= 70;

  INSERT INTO public.treinamento_quiz_tentativas
    (training_id, seller_user_id, respostas, acertos, total_questoes, nota, aprovado)
  VALUES (p_training_id, v_user, p_respostas, v_acertos, v_total, v_nota, v_aprovado)
  RETURNING id INTO v_tentativa_id;

  IF v_aprovado THEN
    INSERT INTO public.progresso_treinamentos
      (training_id, user_id, status, progress_percent, watched_at, completed_at, source_context)
    VALUES (p_training_id, v_user, 'concluido', 100, now(), now(), 'universidade_mx_quiz')
    ON CONFLICT (training_id, user_id) DO UPDATE
      SET status = 'concluido', progress_percent = 100,
          completed_at = coalesce(progresso_treinamentos.completed_at, now()),
          source_context = 'universidade_mx_quiz';
  END IF;

  RETURN jsonb_build_object(
    'tentativa_id', v_tentativa_id,
    'acertos', v_acertos,
    'total_questoes', v_total,
    'nota', v_nota,
    'aprovado', v_aprovado
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.submeter_quiz_treinamento(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submeter_quiz_treinamento(uuid, jsonb) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- DOWN (rollback emergencial)
-- ============================================================================
-- BEGIN;
--   DROP FUNCTION IF EXISTS public.submeter_quiz_treinamento(uuid, jsonb);
--   DROP TABLE IF EXISTS public.treinamento_presencas;
--   DROP TABLE IF EXISTS public.treinamento_quiz_tentativas;
--   DROP TABLE IF EXISTS public.treinamento_quiz_gabarito;
--   DROP TABLE IF EXISTS public.treinamento_quiz_questoes;
-- COMMIT;
