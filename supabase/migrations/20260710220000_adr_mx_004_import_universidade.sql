-- ============================================================================
-- Migration: 20260710220000_adr_mx_004_import_universidade.sql
-- Origem:    ADR-MX-004 (fonte canônica da Universidade MX) — fases 2 e 3
--
-- ESCOPO: importa o catálogo paralelo universidade_aulas/universidade_trilhas
--   para a fonte canônica treinamentos, de forma idempotente e rastreável.
--
--   - universidade_conteudo_migracao: tabela de proveniência (aula → training),
--     índice único por aula. Reexecutar a migration não duplica nada.
--   - Import: só aulas ativas; título, conteúdo, vídeo e data ao vivo
--     preservados; publico_alvo da trilha vira target_audience; proveniência
--     (tipo original, trilha, aula) vai para curation_notes e para a tabela
--     de mapeamento. type = 'institucional' (não inventa taxonomia comercial
--     para conteúdo que não a declara — Artigo IV).
--   - Certificações NÃO são convertidas (critério do ADR: sem regra de
--     equivalência auditável, ficam históricas).
--   - Conversão de trilhas para trilhas_desenvolvimento fica para a fase
--     seguinte do ADR (exige sequência pedagógica real, não só catálogo).
--   - Nenhuma tabela universidade_* é alterada ou removida.
--
--   Aditivo e reversível (bloco DOWN comentado ao final).
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.universidade_conteudo_migracao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id uuid NOT NULL UNIQUE REFERENCES public.universidade_aulas(id) ON DELETE CASCADE,
  trilha_id uuid REFERENCES public.universidade_trilhas(id) ON DELETE SET NULL,
  training_id uuid NOT NULL REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  origem text NOT NULL DEFAULT 'universidade_aulas',
  versao integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.universidade_conteudo_migracao IS
  'Proveniência do import universidade_* -> treinamentos (ADR-MX-004). Uma linha por aula importada; garante idempotência.';

ALTER TABLE public.universidade_conteudo_migracao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS universidade_conteudo_migracao_interna ON public.universidade_conteudo_migracao;
CREATE POLICY universidade_conteudo_migracao_interna ON public.universidade_conteudo_migracao
  FOR ALL TO authenticated
  USING (public.eh_area_interna_mx(auth.uid()))
  WITH CHECK (public.eh_area_interna_mx(auth.uid()));

-- ----------------------------------------------------------------------------
-- Import idempotente (uma aula por vez, com mapeamento de proveniência)
-- ----------------------------------------------------------------------------
DO $import$
DECLARE
  aula record;
  v_training_id uuid;
  v_audience text;
BEGIN
  FOR aula IN
    SELECT a.id AS aula_id, a.trilha_id, a.titulo, a.tipo, a.conteudo_md,
           a.url_video, a.data_ao_vivo, a.created_at AS aula_created_at,
           t.publico_alvo, t.titulo AS trilha_titulo, t.descricao AS trilha_descricao
      FROM public.universidade_aulas a
      LEFT JOIN public.universidade_trilhas t ON t.id = a.trilha_id
     WHERE a.ativo
       AND NOT EXISTS (
         SELECT 1 FROM public.universidade_conteudo_migracao m WHERE m.aula_id = a.id
       )
     ORDER BY a.created_at
  LOOP
    v_audience := CASE
      WHEN aula.publico_alvo IN ('vendedor', 'gerente', 'dono') THEN aula.publico_alvo
      ELSE 'todos'
    END;

    INSERT INTO public.treinamentos
      (title, description, type, video_url, material_url, target_audience,
       active, source_kind, editorial_status, duration_minutes, xp_reward,
       curation_notes, published_at)
    VALUES (
      aula.titulo,
      coalesce(nullif(trim(aula.conteudo_md), ''), aula.trilha_descricao),
      'institucional',
      coalesce(aula.url_video, ''),
      NULL,
      v_audience,
      true,
      'mx_interno',
      'active',
      15,
      100,
      format('Importado de universidade_aulas (tipo original: %s; trilha: %s) — ADR-MX-004',
             aula.tipo, coalesce(aula.trilha_titulo, 'sem trilha')),
      coalesce(aula.data_ao_vivo, aula.aula_created_at)
    )
    RETURNING id INTO v_training_id;

    INSERT INTO public.universidade_conteudo_migracao (aula_id, trilha_id, training_id)
    VALUES (aula.aula_id, aula.trilha_id, v_training_id);
  END LOOP;
END;
$import$;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- DOWN (rollback emergencial): remove os treinamentos importados e o mapa.
-- ============================================================================
-- BEGIN;
--   DELETE FROM public.treinamentos t
--    USING public.universidade_conteudo_migracao m
--    WHERE t.id = m.training_id;
--   DROP TABLE IF EXISTS public.universidade_conteudo_migracao;
-- COMMIT;
