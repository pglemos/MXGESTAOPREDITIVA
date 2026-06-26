-- ============================================================================
-- Migration: 20260626150000_central_execucao_rotina.sql
-- Feature:   Central de Execução — abas "Hoje" e "Rotina do Dia"
--
-- ESCOPO: só tabelas de apoio à Central de Execução. NÃO toca clientes/
--   oportunidades/agendamentos (a aba "Hoje" deriva dela em client-side,
--   ver src/features/crm/lib/agenda-hoje.ts — sem duplicar cadastro).
--
--   1. central_execucao_aberturas — marca "abriu a Central hoje" (Score da
--      Rotina, critério dos 10 pontos). Owner-only.
--   2. routine_activity_templates — conteúdo do playbook "Rotina do Dia" (7
--      etapas fixas do spec). Leitura para qualquer vendedor autenticado.
--   3. prospecting_schedule — agenda semanal de prospecção (dia da semana /
--      semana do mês). Leitura para qualquer vendedor autenticado.
--   4. story_ideas — roteiros de Stories por dia da semana. Leitura para
--      qualquer vendedor autenticado.
--
--   Sem tela de admin para 2/3/4 nesta entrega (fora do escopo "exclusivamente
--   Central de Execução") — conteúdo editável via SQL direto até existir uma
--   tela dedicada. Isso já atende a exigência do spec de não deixar fixo no
--   código (fica fixo no banco, configurável).
--
--   Aditivo e reversível (bloco DOWN comentado ao final).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. central_execucao_aberturas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.central_execucao_aberturas (
  seller_user_id  uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  data            date NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (seller_user_id, data)
);
COMMENT ON TABLE public.central_execucao_aberturas IS 'Marca que o vendedor abriu a Central de Execução em um dia — usado só pelo critério "abriu a Central hoje" do Score da Rotina.';

ALTER TABLE public.central_execucao_aberturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS central_execucao_aberturas_seller_rw ON public.central_execucao_aberturas;
CREATE POLICY central_execucao_aberturas_seller_rw ON public.central_execucao_aberturas FOR ALL TO authenticated
  USING (seller_user_id = auth.uid())
  WITH CHECK (seller_user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 2. routine_activity_templates
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.routine_activity_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo            text NOT NULL UNIQUE, -- chave estável: mentalidade|organizacao|novos_leads|prospeccao|atendimento|lista_quente|fechamento
  nome            text NOT NULL,
  objetivo        text NOT NULL,
  ordem           smallint NOT NULL,
  duracao_minutos smallint,
  instrucoes      jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta_sugerida   text,
  atalhos         jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{label, type: route|tab|info, target}]
  ativo           boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.routine_activity_templates IS 'Playbook das 7 etapas da aba "Rotina do Dia" da Central de Execução. Conteúdo configurável só via SQL nesta entrega.';

CREATE INDEX IF NOT EXISTS idx_routine_activity_templates_ordem ON public.routine_activity_templates(ordem);

DROP TRIGGER IF EXISTS trg_routine_activity_templates_updated_at ON public.routine_activity_templates;
CREATE TRIGGER trg_routine_activity_templates_updated_at BEFORE UPDATE ON public.routine_activity_templates
  FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

ALTER TABLE public.routine_activity_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS routine_activity_templates_read_all ON public.routine_activity_templates;
CREATE POLICY routine_activity_templates_read_all ON public.routine_activity_templates FOR SELECT TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- 3. prospecting_schedule
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prospecting_schedule (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_semana    smallint NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=domingo ... 6=sábado (Date.getDay())
  semana_mes    smallint CHECK (semana_mes BETWEEN 1 AND 4), -- null = toda semana
  tipo_acao     text NOT NULL,
  periodicidade text,
  quantidade    smallint,
  publico       text,
  objetivo      text,
  instrucoes    jsonb NOT NULL DEFAULT '[]'::jsonb,
  exemplo       jsonb,
  ativo         boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.prospecting_schedule IS 'Agenda semanal de prospecção da aba "Rotina do Dia" (etapa Prospecção). Conteúdo configurável só via SQL nesta entrega.';

CREATE INDEX IF NOT EXISTS idx_prospecting_schedule_dia ON public.prospecting_schedule(dia_semana, semana_mes);

ALTER TABLE public.prospecting_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prospecting_schedule_read_all ON public.prospecting_schedule;
CREATE POLICY prospecting_schedule_read_all ON public.prospecting_schedule FOR SELECT TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- 4. story_ideas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.story_ideas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_semana        smallint NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  titulo            text NOT NULL,
  passos            jsonb NOT NULL DEFAULT '[]'::jsonb,
  chamada_para_acao text,
  ativo             boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.story_ideas IS 'Roteiros de Stories por dia da semana, exibidos no "Ver como fazer" da etapa Prospecção. Conteúdo configurável só via SQL nesta entrega.';

CREATE INDEX IF NOT EXISTS idx_story_ideas_dia ON public.story_ideas(dia_semana);

ALTER TABLE public.story_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS story_ideas_read_all ON public.story_ideas;
CREATE POLICY story_ideas_read_all ON public.story_ideas FOR SELECT TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- Seed: routine_activity_templates (7 etapas, spec §6.1-6.11)
-- ----------------------------------------------------------------------------
INSERT INTO public.routine_activity_templates (tipo, nome, objetivo, ordem, duracao_minutos, instrucoes, meta_sugerida, atalhos)
SELECT * FROM (VALUES
  (
    'mentalidade', 'Momento Motivacional', 'Preparar foco, energia e direção para o dia.', 1, 15,
    '["Revise sua meta do mês","Veja quantas vendas faltam","Defina o principal resultado do dia","Escolha uma negociação prioritária","Conecte-se ao seu objetivo profissional."]'::jsonb,
    NULL,
    '[{"label":"Ver Minha Meta","type":"route","target":"/minha-remuneracao"},{"label":"Ver Meu PDI","type":"route","target":"/pdi"},{"label":"Ver Conteúdo Motivacional","type":"route","target":"/treinamentos"}]'::jsonb
  ),
  (
    'organizacao', 'Organização do Dia', 'Sair da organização sabendo quais clientes e ações devem ser priorizados.', 2, 40,
    '["Confira os agendamentos de hoje","Responda retornos pendentes de ontem","Identifique clientes quentes","Confirme agendamentos","Resolva pendências comerciais","Consulte o estoque atualizado","Defina retornos da manhã, tarde e fim do dia."]'::jsonb,
    NULL,
    '[{"label":"Ver Clientes de Hoje","type":"tab","target":"hoje"},{"label":"Abrir Carteira","type":"route","target":"/carteira-clientes"},{"label":"Ver Clientes Quentes","type":"route","target":"/carteira-clientes"},{"label":"Consultar Estoque","type":"info","target":null}]'::jsonb
  ),
  (
    'novos_leads', 'Contato com Novos Clientes', 'Responder, qualificar e definir a próxima ação.', 3, NULL,
    '["Envie uma mensagem de apresentação","Identifique o veículo procurado","Entenda o prazo de compra","Verifique carro na troca","Verifique necessidade de financiamento","Classifique o cliente","Defina próxima ação e data.","Frio: sem prazo definido ou compra acima de 3 meses — envie conteúdo educativo, comunicação suave e espaçada.","Morno: pretende comprar em até 3 meses — faça abordagem personalizada, envie comparação, prova social ou vídeo.","Quente: pretende comprar dentro do mês — faça contato direto, conduza para visita, proposta ou fechamento."]'::jsonb,
    'Classifique cada cliente como Frio, Morno ou Quente conforme o prazo de compra.',
    '[{"label":"Abrir Carteira","type":"route","target":"/carteira-clientes"},{"label":"Cadastrar Cliente","type":"route","target":"/carteira-clientes"},{"label":"Ver Roteiro de Qualificação","type":"info","target":null}]'::jsonb
  ),
  (
    'prospeccao', 'Prospecção', 'Gerar novas oportunidades para o canal Carteira.', 4, NULL,
    '[]'::jsonb,
    NULL,
    '[]'::jsonb
  ),
  (
    'atendimento', 'Atendimento', 'Atender clientes e avançar negociações.', 5, NULL,
    '["Consulte o veículo de interesse","Verifique carro na troca","Verifique financiamento","Leia observações anteriores","Defina o próximo avanço desejado.","Perguntas orientadoras: orçamento, autoridade de decisão, necessidade e prazo de compra."]'::jsonb,
    NULL,
    '[{"label":"Ver Clientes de Hoje","type":"tab","target":"hoje"},{"label":"Abrir Roteiro de Qualificação","type":"info","target":null},{"label":"Abrir Carteira","type":"route","target":"/carteira-clientes"},{"label":"Registrar Próxima Ação","type":"tab","target":"hoje"}]'::jsonb
  ),
  (
    'lista_quente', 'Lista Quente', 'Retomar negociações com maior chance de fechamento.', 6, NULL,
    '["Preço: reforce valor, mostre garantia e diferenciais, apresente alternativas, evite discutir só desconto.","Avaliação do usado: explique critérios, mostre transparência, destaque benefícios da troca, construa solução.","Financiamento: apresente opções, faça simulação, explique preservação de capital, mostre alternativas.","Boas práticas: nunca contradiga o cliente, reformule a objeção, faça perguntas, apresente dados concretos, ofereça alternativas."]'::jsonb,
    NULL,
    '[{"label":"Ver Clientes Quentes","type":"route","target":"/carteira-clientes"},{"label":"Abrir Carteira","type":"route","target":"/carteira-clientes"},{"label":"Ver Scripts de Objeção","type":"info","target":null}]'::jsonb
  ),
  (
    'fechamento', 'Fechamento do Dia', 'Encerrar o dia com informações organizadas e preparar o próximo.', 7, NULL,
    '["Registre interações relevantes","Atualize clientes que mudaram de etapa","Revise resultados do dia","Defina prioridades D+1","Realize o Fechamento Diário."]'::jsonb,
    NULL,
    '[{"label":"Ir para o Fechamento Diário","type":"route","target":"/vendedor/terminal-mx"}]'::jsonb
  )
) AS seed(tipo, nome, objetivo, ordem, duracao_minutos, instrucoes, meta_sugerida, atalhos)
WHERE NOT EXISTS (SELECT 1 FROM public.routine_activity_templates LIMIT 1);

-- ----------------------------------------------------------------------------
-- Seed: prospecting_schedule (agenda semanal, spec §6.5-6.7)
-- ----------------------------------------------------------------------------
INSERT INTO public.prospecting_schedule (dia_semana, semana_mes, tipo_acao, periodicidade, quantidade, publico, objetivo)
SELECT * FROM (VALUES
  -- Segunda (1)
  (1, NULL::smallint, 'instagram_stories', 'por dia', 5, 'Morno', 'Manter presença diária e gerar engajamento.'),
  (1, NULL::smallint, 'status_whatsapp', 'por dia', 5, 'Morno', 'Manter presença diária e gerar engajamento.'),
  (1, NULL::smallint, 'catalogo_whatsapp', 'por semana', 10, 'Frio e Morno', 'Apresentar veículos disponíveis.'),
  -- Terça (2)
  (2, NULL::smallint, 'instagram_stories', 'por dia', 5, 'Morno', 'Manter presença diária e gerar engajamento.'),
  (2, NULL::smallint, 'status_whatsapp', 'por dia', 5, 'Morno', 'Manter presença diária e gerar engajamento.'),
  (2, NULL::smallint, 'instagram_feed', 'por semana', 2, 'Frio e Morno', 'Aumentar alcance e atrair novos leads.'),
  -- Quarta (3) — fixos
  (3, NULL::smallint, 'instagram_stories', 'por dia', 5, 'Morno', 'Manter presença diária e gerar engajamento.'),
  (3, NULL::smallint, 'status_whatsapp', 'por dia', 5, 'Morno', 'Manter presença diária e gerar engajamento.'),
  (3, NULL::smallint, 'grupo_ofertas', 'por semana', 3, 'Morno e Quente', 'Divulgar ofertas em grupos.'),
  -- Quarta (3) — semana 2 e 4
  (3, 2, 'indicacao_amigos', 'por mês', 10, 'Frio', 'Gerar indicações de amigos de clientes.'),
  (3, 4, 'intermediadores', 'por mês', 5, 'Quente', 'Fortalecer parcerias com intermediadores.'),
  -- Quinta (4)
  (4, NULL::smallint, 'instagram_stories', 'por dia', 5, 'Morno', 'Manter presença diária e gerar engajamento.'),
  (4, NULL::smallint, 'status_whatsapp', 'por dia', 5, 'Morno', 'Manter presença diária e gerar engajamento.'),
  (4, NULL::smallint, 'instagram_reels', 'por semana', 1, 'Frio e Morno', 'Aumentar alcance com conteúdo em vídeo.'),
  -- Sexta (5) — fixos
  (5, NULL::smallint, 'instagram_stories', 'por dia', 5, 'Morno', 'Manter presença diária e gerar engajamento.'),
  (5, NULL::smallint, 'status_whatsapp', 'por dia', 5, 'Morno', 'Manter presença diária e gerar engajamento.'),
  -- Sexta (5) — semanas 1 a 4
  (5, 1, 'marketplace', 'por quinzena', 5, 'Frio', 'Captar leads frios via classificados.'),
  (5, 2, 'indicacao_clientes', 'por mês', 10, 'Frio', 'Gerar indicações de clientes atuais.'),
  (5, 3, 'marketplace', 'por quinzena', 5, 'Frio', 'Captar leads frios via classificados.'),
  (5, 4, 'parceria_consorcio', 'por mês', 5, 'Morno', 'Fortalecer parceria com vendedores de consórcio.'),
  -- Sábado (6)
  (6, NULL::smallint, 'instagram_stories', 'por dia', 5, 'Morno', 'Manter presença diária e gerar engajamento.'),
  (6, NULL::smallint, 'status_whatsapp', 'por dia', 5, 'Morno', 'Manter presença diária e gerar engajamento.'),
  -- Domingo (0)
  (0, NULL::smallint, 'conteudo_humanizacao', 'opcional', NULL::smallint, NULL, 'Humanizar a marca pessoal — conteúdo pessoal, sem compromisso.')
) AS seed(dia_semana, semana_mes, tipo_acao, periodicidade, quantidade, publico, objetivo)
WHERE NOT EXISTS (SELECT 1 FROM public.prospecting_schedule LIMIT 1);

-- ----------------------------------------------------------------------------
-- Seed: story_ideas (roteiros de Stories, spec §6.8)
-- ----------------------------------------------------------------------------
INSERT INTO public.story_ideas (dia_semana, titulo, passos, chamada_para_acao)
SELECT * FROM (VALUES
  (2, 'Caixa de Perguntas', '["Publique uma enquete de engajamento","Publique uma segunda enquete","Abra uma caixa de perguntas","Escolha um tema: dúvidas sobre carros, avaliação ou financiamento","Responda algumas perguntas em vídeo."]'::jsonb, NULL::text),
  (3, 'Story Temático', '["Abra com enquete","Apresente o problema","Pergunte se a pessoa quer uma dica","Grave vídeo curto com orientação."]'::jsonb, NULL::text),
  (4, 'Enquetes e Quiz', '["Crie desafio sobre carros","Faça entre 5 e 7 perguntas","Termine com chamada para Direct."]'::jsonb, 'Chamada para Direct'),
  (5, 'Venda com Chamada para Ação', '["Publique até 8 ofertas","Mostre veículo, condição e diferencial","Termine com link do WhatsApp ou chamada para Direct."]'::jsonb, 'Link do WhatsApp ou chamada para Direct'),
  (6, 'Conteúdo Pessoal', '["Mostre família, hobbies ou preferências pessoais","Evite assuntos polêmicos."]'::jsonb, NULL::text),
  (0, 'Conteúdo Pessoal', '["Mostre família, hobbies ou preferências pessoais","Evite assuntos polêmicos."]'::jsonb, NULL::text)
) AS seed(dia_semana, titulo, passos, chamada_para_acao)
WHERE NOT EXISTS (SELECT 1 FROM public.story_ideas LIMIT 1);

COMMIT;

-- ----------------------------------------------------------------------------
-- DOWN (rollback manual, se necessário):
-- BEGIN;
-- DROP TABLE IF EXISTS public.story_ideas;
-- DROP TABLE IF EXISTS public.prospecting_schedule;
-- DROP TABLE IF EXISTS public.routine_activity_templates;
-- DROP TABLE IF EXISTS public.central_execucao_aberturas;
-- COMMIT;
-- ----------------------------------------------------------------------------
