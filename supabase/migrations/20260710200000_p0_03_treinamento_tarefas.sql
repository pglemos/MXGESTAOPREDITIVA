-- ============================================================================
-- Migration: 20260710200000_p0_03_treinamento_tarefas.sql
-- Origem:    Auditoria Integral 2026-07-10 (P0-03 / Sprint Universidade — fundação)
--
-- ESCOPO: as "tarefas práticas" de cada aula da Universidade MX eram uma
--   constante hardcoded no frontend (CLASS_TASKS, em
--   src/base44-reference/pages/Treinamentos.jsx) e a conclusão de cada
--   tarefa era gravada em localStorage (mx-training-tasks) — não sincroniza
--   entre dispositivos, não é auditável, não pode ser segmentado por aula
--   real (chave era o TÍTULO da aula em texto livre).
--
--   Esta migration cria a estrutura para tarefas práticas oficiais:
--   - treinamento_tarefas: catálogo de tarefas por aula (FK treinamentos).
--   - treinamento_tarefa_respostas: conclusão por vendedor (substitui
--     localStorage), auditável (created_at/updated_at, RLS por dono +
--     gestão da loja, mesmo padrão de progresso_treinamentos).
--
--   Seed: migra o conteúdo TEXTUAL já existente em CLASS_TASKS (não é dado
--   inventado — é o mesmo texto que já está em produção há tempo) para
--   dentro do banco, casando por treinamentos.title. Aulas cujo título não
--   existir na tabela treinamentos real ficam de fora do seed (não inventa
--   um training_id que não existe — Artigo IV, No Invention).
--
--   Aditivo e reversível (bloco DOWN comentado ao final).
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.treinamento_tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treinamento_tarefas_training
  ON public.treinamento_tarefas (training_id, ordem);

COMMENT ON TABLE public.treinamento_tarefas IS
  'Catálogo de tarefas práticas por aula da Universidade MX (P0-03). Substitui a constante CLASS_TASKS hardcoded no frontend.';

ALTER TABLE public.treinamento_tarefas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS treinamento_tarefas_select ON public.treinamento_tarefas;
CREATE POLICY treinamento_tarefas_select ON public.treinamento_tarefas
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS treinamento_tarefas_write ON public.treinamento_tarefas;
CREATE POLICY treinamento_tarefas_write ON public.treinamento_tarefas
  FOR ALL TO authenticated
  USING (public.eh_area_interna_mx(auth.uid()))
  WITH CHECK (public.eh_area_interna_mx(auth.uid()));

CREATE TABLE IF NOT EXISTS public.treinamento_tarefa_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id uuid NOT NULL REFERENCES public.treinamento_tarefas(id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  concluida boolean NOT NULL DEFAULT false,
  concluida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tarefa_id, seller_user_id)
);

CREATE INDEX IF NOT EXISTS idx_treinamento_tarefa_respostas_seller
  ON public.treinamento_tarefa_respostas (seller_user_id);

COMMENT ON TABLE public.treinamento_tarefa_respostas IS
  'Conclusão de tarefas práticas por vendedor (P0-03). Substitui localStorage mx-training-tasks — evidência auditável, sincroniza entre dispositivos.';

ALTER TABLE public.treinamento_tarefa_respostas ENABLE ROW LEVEL SECURITY;

-- Mesmo padrão de progresso_treinamentos (baseline): dono do registro,
-- admin_mx, ou gestão (gerente/dono) da(s) loja(s) do vendedor.
DROP POLICY IF EXISTS treinamento_tarefa_respostas_select ON public.treinamento_tarefa_respostas;
CREATE POLICY treinamento_tarefa_respostas_select ON public.treinamento_tarefa_respostas
  FOR SELECT TO authenticated
  USING (
    seller_user_id = auth.uid()
    OR public.eh_administrador_mx(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.vinculos_loja vl
       WHERE vl.user_id = treinamento_tarefa_respostas.seller_user_id
         AND coalesce(vl.is_active, true)
         AND (public.is_manager_of(vl.store_id) OR public.is_owner_of(vl.store_id))
    )
  );

DROP POLICY IF EXISTS treinamento_tarefa_respostas_upsert ON public.treinamento_tarefa_respostas;
CREATE POLICY treinamento_tarefa_respostas_upsert ON public.treinamento_tarefa_respostas
  FOR INSERT TO authenticated
  WITH CHECK (seller_user_id = auth.uid());

DROP POLICY IF EXISTS treinamento_tarefa_respostas_update ON public.treinamento_tarefa_respostas;
CREATE POLICY treinamento_tarefa_respostas_update ON public.treinamento_tarefa_respostas
  FOR UPDATE TO authenticated
  USING (seller_user_id = auth.uid())
  WITH CHECK (seller_user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Seed: migra o texto de CLASS_TASKS (src/base44-reference/pages/Treinamentos.jsx)
-- casando por título exato com treinamentos.title já existente em produção.
-- ----------------------------------------------------------------------------
INSERT INTO public.treinamento_tarefas (training_id, descricao, ordem)
SELECT t.id, x.descricao, x.ordem
  FROM public.treinamentos t
  JOIN (VALUES
    ('Aula 1 – Seja bem vindo', 'Aprender sobre a história e cultura da loja', 0),
    ('Aula 1 – Seja bem vindo', 'Perguntar ao gestor qual o padrão de atendimento inegociável', 1),
    ('Aula 1 – Seja bem vindo', 'Observar a loja por 30 minutos e anotar 3 pontos de confiança', 2),
    ('Aula 3 – Diagnóstico', 'Criar uma lista de perguntas para identificar a necessidade real do cliente', 0),
    ('Aula 3 – Diagnóstico', 'Treinar a escuta ativa no próximo atendimento', 1),
    ('Aula 3 – Diagnóstico', 'Descobrir o real motivo da troca do carro no próximo cliente', 2),
    ('Aula 4 – Planejamento Estratégico', 'Escrever a meta de vendas desejada para o mês', 0),
    ('Aula 4 – Planejamento Estratégico', 'Dividir a meta mensal em objetivos semanais e diários', 1),
    ('Aula 4 – Planejamento Estratégico', 'Calcular quantos atendimentos diários são necessários para bater a meta', 2),
    ('Aula 5 – Vendas em Multicanais', 'Identificar qual canal de vendas você depende mais hoje', 0),
    ('Aula 5 – Vendas em Multicanais', 'Listar 10 ações possíveis para trabalhar fora do fluxo de porta', 1),
    ('Aula 5 – Vendas em Multicanais', 'Dedicar 1 hora do dia exclusivamente para prospecção ativa', 2),
    ('Aula 6 – Processos de Vendas', 'Mapear as etapas do funil de vendas dos seus clientes ativos', 0),
    ('Aula 6 – Processos de Vendas', 'Identificar em qual etapa do processo a maioria das vendas está travando', 1),
    ('Aula 6 – Processos de Vendas', 'Definir uma ação para destravar os clientes mornos no funil', 2),
    ('Aula 7 – Critérios de Contratação', 'Entender o perfil ideal de vendedor para a equipe', 0),
    ('Aula 7 – Critérios de Contratação', 'Definir os critérios técnicos e comportamentais inegociáveis', 1),
    ('Aula 7 – Critérios de Contratação', 'Alinhar com o gerente o script de entrevista inicial', 2),
    ('Aula 8 – Captação de Vendedores', 'Divulgar a vaga em pelo menos dois canais de captação ativos', 0),
    ('Aula 8 – Captação de Vendedores', 'Abordar 3 potenciais candidatos no LinkedIn ou indicação', 1),
    ('Aula 8 – Captação de Vendedores', 'Triar e selecionar os 5 melhores currículos recebidos', 2),
    ('Aula 9 – Curso de Contratação', 'Estruturar o cronograma do primeiro dia (onboarding) do novo vendedor', 0),
    ('Aula 9 – Curso de Contratação', 'Preparar o kit de boas-vindas com acessos e manuais da loja', 1),
    ('Aula 9 – Curso de Contratação', 'Definir a meta de aprendizado para a primeira semana do novato', 2),
    ('Aula 10 – Check Lista de Contratação', 'Aplicar o checklist de contratação no próximo processo seletivo', 0),
    ('Aula 10 – Check Lista de Contratação', 'Validar referências profissionais de candidatos finalistas', 1),
    ('Aula 10 – Check Lista de Contratação', 'Revisar a documentação padrão e termos de contratação', 2),
    ('Aula 11 – Introdução ao Nível de Maturidade', 'Identificar em qual nível de maturidade (N1 a N4) você se encontra hoje', 0),
    ('Aula 11 – Introdução ao Nível de Maturidade', 'Listar duas competências técnicas que precisa desenvolver para subir de nível', 1),
    ('Aula 11 – Introdução ao Nível de Maturidade', 'Revisar com o gestor os indicadores de performance do seu nível', 2),
    ('Aula 12 – Reunião de Boas Vindas', 'Realizar um rito de integração com o novo vendedor no pátio', 0),
    ('Aula 12 – Reunião de Boas Vindas', 'Explicar a dinâmica de comissionamento e metas de forma transparente', 1),
    ('Aula 12 – Reunião de Boas Vindas', 'Apresentar o novo integrante para toda a equipe comercial', 2),
    ('Aula 13 – Cronograma de Treinamento', 'Montar a agenda de estudos do vendedor para os próximos 15 dias', 0),
    ('Aula 13 – Cronograma de Treinamento', 'Agendar os horários de validação prática (roleplay) na semana', 1),
    ('Aula 13 – Cronograma de Treinamento', 'Definir os indicadores de acompanhamento do cronograma', 2),
    ('Aula 14 – Plano de Treinamento Trimestral', 'Estruturar as prioridades de treinamento para o próximo trimestre', 0),
    ('Aula 14 – Plano de Treinamento Trimestral', 'Definir o cronograma de workshops e dinâmicas de grupo da loja', 1),
    ('Aula 14 – Plano de Treinamento Trimestral', 'Estabelecer as metas de evolução de score da equipe', 2),
    ('Aula 15 – Check List de Treinamento', 'Preencher a planilha de controle de presença das dinâmicas', 0),
    ('Aula 15 – Check List de Treinamento', 'Avaliar a evolução de conversão de cada vendedor após o treino', 1),
    ('Aula 15 – Check List de Treinamento', 'Aplicar avaliação de reação das aulas gravadas com a equipe', 2)
  ) AS x(title, descricao, ordem)
    ON t.title = x.title
 WHERE NOT EXISTS (
    SELECT 1 FROM public.treinamento_tarefas existing
     WHERE existing.training_id = t.id AND existing.descricao = x.descricao
 );

COMMIT;

-- ============================================================================
-- DOWN (rollback emergencial)
-- ============================================================================
-- BEGIN;
--   DROP TABLE IF EXISTS public.treinamento_tarefa_respostas;
--   DROP TABLE IF EXISTS public.treinamento_tarefas;
-- COMMIT;
