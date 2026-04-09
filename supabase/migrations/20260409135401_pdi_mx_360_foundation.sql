-- Migration: PDI MX 360 Foundation
-- Created by @architect & @data-engineer

-- 1. Catálogos Fixos

CREATE TABLE public.pdi_niveis_cargo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nivel INTEGER NOT NULL,
    nome VARCHAR(255) NOT NULL,
    nota_min INTEGER NOT NULL,
    nota_max INTEGER NOT NULL
);

CREATE TABLE public.pdi_descritores_escala (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nivel_cargo_id UUID NOT NULL REFERENCES public.pdi_niveis_cargo(id) ON DELETE CASCADE,
    nota INTEGER NOT NULL,
    descritor VARCHAR(255) NOT NULL,
    ordem INTEGER NOT NULL
);

CREATE TABLE public.pdi_competencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('tecnica', 'comportamental')),
    descricao_completa TEXT NOT NULL,
    indicador VARCHAR(255) NOT NULL,
    ordem INTEGER NOT NULL
);

CREATE TABLE public.pdi_acoes_sugeridas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competencia_id UUID NOT NULL REFERENCES public.pdi_competencias(id) ON DELETE CASCADE,
    descricao_acao TEXT NOT NULL
);

CREATE TABLE public.pdi_frases_inspiracionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    texto TEXT NOT NULL
);

-- 2. Tabelas Transacionais

CREATE TABLE public.pdi_sessoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID NOT NULL REFERENCES auth.users(id),
    gerente_id UUID NOT NULL REFERENCES auth.users(id),
    loja_id UUID, -- Referência à loja se existir
    data_realizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    proxima_revisao_data TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'concluido')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.pdi_metas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sessao_id UUID NOT NULL REFERENCES public.pdi_sessoes(id) ON DELETE CASCADE,
    prazo VARCHAR(50) NOT NULL CHECK (prazo IN ('6_meses', '12_meses', '24_meses')),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('pessoal', 'profissional')),
    descricao TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.pdi_avaliacoes_competencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sessao_id UUID NOT NULL REFERENCES public.pdi_sessoes(id) ON DELETE CASCADE,
    competencia_id UUID NOT NULL REFERENCES public.pdi_competencias(id),
    nota_atribuida INTEGER NOT NULL,
    alvo INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.pdi_plano_acao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sessao_id UUID NOT NULL REFERENCES public.pdi_sessoes(id) ON DELETE CASCADE,
    competencia_id UUID NOT NULL REFERENCES public.pdi_competencias(id),
    descricao_acao TEXT NOT NULL,
    data_conclusao DATE NOT NULL,
    impacto VARCHAR(50) NOT NULL CHECK (impacto IN ('baixo', 'medio', 'alto')),
    custo VARCHAR(50) NOT NULL CHECK (custo IN ('baixo', 'medio', 'alto')),
    status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
    evidencia_url TEXT,
    aprovado_por UUID REFERENCES auth.users(id),
    data_aprovacao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.pdi_objetivos_pessoais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sessao_id UUID NOT NULL REFERENCES public.pdi_sessoes(id) ON DELETE CASCADE,
    caracteristica VARCHAR(255) NOT NULL,
    itens_desenvolver TEXT NOT NULL,
    acao TEXT NOT NULL,
    data_conclusao DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
    evidencia_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.pdi_niveis_cargo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_descritores_escala ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_competencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_acoes_sugeridas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_frases_inspiracionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_avaliacoes_competencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_plano_acao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_objetivos_pessoais ENABLE ROW LEVEL SECURITY;

-- Read access to catalogs for authenticated users
CREATE POLICY "Leitura de catálogos para usuários autenticados" ON public.pdi_niveis_cargo FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leitura de catálogos para usuários autenticados" ON public.pdi_descritores_escala FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leitura de catálogos para usuários autenticados" ON public.pdi_competencias FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leitura de catálogos para usuários autenticados" ON public.pdi_acoes_sugeridas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leitura de catálogos para usuários autenticados" ON public.pdi_frases_inspiracionais FOR SELECT USING (auth.role() = 'authenticated');

-- Sessions RLS: Vendedores vêem as suas, gerentes as que criaram ou da sua loja
CREATE POLICY "Vendedor ve suas sessoes" ON public.pdi_sessoes FOR SELECT USING (colaborador_id = auth.uid());
CREATE POLICY "Gerente ve sessoes que criou" ON public.pdi_sessoes FOR ALL USING (gerente_id = auth.uid());

-- Child tables follow session access via sessao_id
CREATE POLICY "Acesso as metas via sessao" ON public.pdi_metas FOR ALL USING (
    sessao_id IN (SELECT id FROM public.pdi_sessoes WHERE colaborador_id = auth.uid() OR gerente_id = auth.uid())
);
CREATE POLICY "Acesso as avaliacoes via sessao" ON public.pdi_avaliacoes_competencia FOR ALL USING (
    sessao_id IN (SELECT id FROM public.pdi_sessoes WHERE colaborador_id = auth.uid() OR gerente_id = auth.uid())
);
CREATE POLICY "Acesso ao plano via sessao" ON public.pdi_plano_acao FOR ALL USING (
    sessao_id IN (SELECT id FROM public.pdi_sessoes WHERE colaborador_id = auth.uid() OR gerente_id = auth.uid())
);
CREATE POLICY "Acesso aos obj pessoais via sessao" ON public.pdi_objetivos_pessoais FOR ALL USING (
    sessao_id IN (SELECT id FROM public.pdi_sessoes WHERE colaborador_id = auth.uid() OR gerente_id = auth.uid())
);

-- INSERTS: SEED DE DADOS (100% fiel à Metodologia MX)
-- 1. Níveis
INSERT INTO public.pdi_niveis_cargo (id, nivel, nome, nota_min, nota_max) VALUES
('11111111-1111-1111-1111-111111111111', 1, 'Higienizador, Auxiliar de Serviços Gerais, Pré-vendedor', 1, 5),
('22222222-2222-2222-2222-222222222222', 2, 'Consultor de Vendas, Administrativo', 6, 10),
('33333333-3333-3333-3333-333333333333', 3, 'Gerente Comercial', 11, 15),
('44444444-4444-4444-4444-444444444444', 4, 'Diretor Comercial', 16, 20),
('55555555-5555-5555-5555-555555555555', 5, 'CEO', 21, 25);

-- 2. Competências
INSERT INTO public.pdi_competencias (id, nome, tipo, descricao_completa, indicador, ordem) VALUES
-- Técnicas
('aaaa0001-0000-0000-0000-000000000000', 'Planejamento', 'tecnica', 'O vendedor deve ser capaz de chegar na loja e organizar o dia, cumprindo uma rotina de contatos, prospecção e agendamentos.', 'Qualitativo', 1),
('aaaa0002-0000-0000-0000-000000000000', 'Atendimento ao Cliente', 'tecnica', 'O vendedor deve ser capaz de gerar conexão com o cliente (empatia), levantar informações sobre a necessidade do cliente, demonstrar o produto e realizar escuta ativa.', '1) Conversão de atendimento em venda / 2) Volume de indicações', 2),
('aaaa0003-0000-0000-0000-000000000000', 'Agendamento de Visitas', 'tecnica', 'O vendedor deve ser capaz de agendar diariamente com os clientes.', 'Conversão de leads em visitas', 3),
('aaaa0004-0000-0000-0000-000000000000', 'Fechamento de Venda', 'tecnica', 'O vendedor deve realizar a leitura do cliente, observando a linguagem corporal, conduzí-lo ao fechamento da negociação e quebrando as objeções.', 'Conversão de atendimento em venda', 4),
('aaaa0005-0000-0000-0000-000000000000', 'Carteira de Clientes', 'tecnica', 'O vendedor deve vender com consistência por meio de sua carteira de clientes.', 'Volume de vendas na carteira', 5),
('aaaa0006-0000-0000-0000-000000000000', 'Mídias Sociais', 'tecnica', 'O vendedor deve explorar as redes sociais para gerar negócios com consistência.', 'Volume de vendas na carteira', 6),
('aaaa0007-0000-0000-0000-000000000000', 'Prospecção', 'tecnica', 'O vendedor deve cumprir a rotina diária de prospecção, seja por meio de contato ativo, publicações nas redes sociais e/ou qualquer outra ação que traga novos clientes.', 'Volume de vendas na carteira', 7),
('aaaa0008-0000-0000-0000-000000000000', 'Avaliação de Carro', 'tecnica', 'O vendedor deve ser capaz de analisar um veículo, verificar as condições de mercado e realizar a negociação baseada em fatos e dados.', 'Qualitativo', 8),
('aaaa0009-0000-0000-0000-000000000000', 'Financiamentos', 'tecnica', 'O vendedor deve compreender as regras de cada agente financiador, utilizando dados do mercado para persuadir o cliente, sendo capaz de analisar a melhor condição para a empresa e cliente.', 'Qualitativo', 9),
('aaaa0010-0000-0000-0000-000000000000', 'Processos', 'tecnica', 'O vendedor deve cumprir os processos da empresa com margem de erro mínima.', 'Quantidade de erros', 10),
-- Comportamentais
('bbbb0001-0000-0000-0000-000000000000', 'Pontualidade', 'comportamental', 'O vendedor deve cumprir seu horário de chegada na empresa.', 'Qualitativo', 11),
('bbbb0002-0000-0000-0000-000000000000', 'Senso de Urgência', 'comportamental', 'O vendedor deve entregar a meta no menor tempo possível', 'Qualitativo', 12),
('bbbb0003-0000-0000-0000-000000000000', 'Iniciativa', 'comportamental', 'O vendedor deve ser proativo e cumprir suas obrigações sem a necessidade de ser orientado.', 'Qualitativo', 13),
('bbbb0004-0000-0000-0000-000000000000', 'Organização', 'comportamental', 'O vendedor deve demonstrar organização suficiente para cumprir a rotina da empresa.', 'Qualitativo', 14),
('bbbb0005-0000-0000-0000-000000000000', 'Liderança', 'comportamental', 'O vendedor deve promover um ambiente agregador na equipe e contribuir em atividades fora da sua função por iniciativa.', 'Qualitativo', 15),
('bbbb0006-0000-0000-0000-000000000000', 'Relacionamento Interpessoal', 'comportamental', 'O vendedor deve ser capaz de trabalhar em equipe.', 'Qualitativo', 16),
('bbbb0007-0000-0000-0000-000000000000', 'Persistência', 'comportamental', 'O vendedor deve demonstrar claramente que não desiste facilmente dos clientes.', 'Qualitativo', 17),
('bbbb0008-0000-0000-0000-000000000000', 'Resiliência', 'comportamental', 'O vendedor deve demonstrar capacidade de superação.', 'Qualitativo', 18);

-- 3. Ações Sugeridas (Amamostra das obrigatórias)
INSERT INTO public.pdi_acoes_sugeridas (competencia_id, descricao_acao) VALUES
('aaaa0001-0000-0000-0000-000000000000', 'Anotar diariamente 5 ações essenciais, que não poderão deixar de serem realizadas no dia e apresentar ao gestor. Ao final do dia, conferir se foram ou não realizadas.'),
('aaaa0002-0000-0000-0000-000000000000', 'Assistir o módulo 6 "Técnicas de Negociação para Fechamento de Vendas" do curso Vendedor de Carros Digital e apresentar ao gestor um pequeno resumo das dicas mais importantes;'),
('aaaa0002-0000-0000-0000-000000000000', 'Solicitar ao gestor para acompanhar um atendimento do início ao fim, para que seja pontuado em qual momento surge a maior dificuldade do vendedor.'),
('aaaa0003-0000-0000-0000-000000000000', 'Revisar o treinamento vendedor completo, aula 2 e aula 5 do módulo 2.'),
('aaaa0004-0000-0000-0000-000000000000', 'Ler o livro "A Bíblia de Vendas".'),
('aaaa0005-0000-0000-0000-000000000000', 'Aplicar agenda de prospecção da aula 2, módulo 3 do curso vendedor completo.'),
('aaaa0006-0000-0000-0000-000000000000', 'Criar Instagram Profissional;'),
('aaaa0006-0000-0000-0000-000000000000', 'Aplicar rotina de Stories da aula 2 do módulo 3 do curso vendedor completo.'),
('aaaa0007-0000-0000-0000-000000000000', 'Aplicar agenda de prospecção da aula 2, módulo 3 do curso vendedor completo.'),
('aaaa0008-0000-0000-0000-000000000000', 'Preencher formulário de avaliação (mínimo 20) e o gestor deverá pontuar os erros e acertos.'),
('aaaa0009-0000-0000-0000-000000000000', 'Realizar um curso básico de matemática financeira.'),
('aaaa0010-0000-0000-0000-000000000000', 'Anotar de maneira organizada em um caderno o passo a passo dos processos da loja;'),
('bbbb0001-0000-0000-0000-000000000000', 'Definir horário de dormir que não comprometa a disposição de acordar no dia seguinte;'),
('bbbb0001-0000-0000-0000-000000000000', 'Desabilitar o modo soneca do despertador. Acordar e levantar da cama na primeira chamada;'),
('bbbb0002-0000-0000-0000-000000000000', 'Definir metas curtas, exemplo: 2 vendas por semana;'),
('bbbb0003-0000-0000-0000-000000000000', 'Solicitar feedback ao gestor sobre ações que podem ser executadas que agregariam no ambiente de trabalho;'),
('bbbb0004-0000-0000-0000-000000000000', 'Pontuar em uma lista 5 impactos negativos da desorganização em seu resultado;'),
('bbbb0005-0000-0000-0000-000000000000', 'Assumir responsabilidades na loja, além da função, como abrir ou fechar, ajudar os colegas, treinar os novatos, etc.'),
('bbbb0006-0000-0000-0000-000000000000', 'Elogiar os colegas por ações diferenciadas;'),
('bbbb0007-0000-0000-0000-000000000000', 'Definir um processo de contato com os clientes que não fecharam;'),
('bbbb0008-0000-0000-0000-000000000000', 'Assistir o filme "A procura da Felicidade" e se colocar no lugar do ator principal, refletindo como você agiria naquela situação.');

-- 4. Frases
INSERT INTO public.pdi_frases_inspiracionais (texto) VALUES
('Comprometa-se com suas metas e encare os obstáculos como etapas para atingir o objetivo final.'),
('Quanto maior for a crença em seus objetivos, mais depressa você os conquistará.'),
('Desistir dos sonhos é abrir mão da felicidade, porque quem não persegue seus objetivos está condenado a fracassar 100% das vezes.'),
('Sem sonhos, a vida não tem brilho. Sem metas, os sonhos não têm alicerces. Sem prioridades, os sonhos não se tornam reais.'),
('Todo bom desempenho começa com objetivos claros.'),
('Disciplina é a ponte entre metas e realizações.'),
('Você só chega na grande meta a longo prazo se executar diariamente as pequenas metas diárias.');
