# Escopo da Reuniao com Daniel - Evolucao do Sistema MX

**Data de registro:** 2026-05-15  
**Fonte:** transcricao da reuniao entre Jose Roberto e Daniel Santos MX  
**Status:** escopo inicial para alinhamento de produto  
**Relacionado a:** `docs/prd/mx-consultoria-crm/`, `docs/stories/story-OPS-20260514-legacy-pmr-visit-completion.md`, `docs/stories/story-CONS-08-strategic-plan-action-plan.md`, `docs/stories/story-pdi-complete-09/spec/spec.md`, `docs/stories/story-training-notifications-12/spec/spec.md`

## 1. Resumo Executivo

A reuniao definiu que o sistema deve evoluir de uma ferramenta operacional interna para uma plataforma que sustenta dois objetivos de negocio:

1. **Consultoria PMR digitalizada:** permitir que o consultor, representado no sistema como admin/admin master MX, execute visitas, registre dados, gere relatorios padronizados e entregue resumo ao cliente em tempo real, reduzindo trabalho fora do sistema.
2. **Produto de entrada baseado em desenvolvimento de pessoas:** oferecer ao lojista uma solucao simples de consumo diario, com rotina, biblioteca de conteudo, trilha de novo colaborador, PDI, feedback estruturado e acompanhamento de engajamento da equipe.

O direcionamento central da reuniao foi: o consultor, gerente, vendedor e dono precisam ficar "presos ao sistema" porque o sistema deve concentrar execucao, informacao, acompanhamento e devolutiva.

## 2. Contexto de Negocio

O nicho de consultoria para lojas de veiculos tem baixo nivel de consciencia: o cliente nao acorda querendo consultoria. Por isso, o produto precisa facilitar o dia a dia do lojista antes de vender a consultoria completa.

O sistema passa a ser visto como possivel **produto de entrada**:

- facil de consumir;
- mais barato e escalavel que consultoria presencial;
- capaz de gerar dados para direcionamento consultivo;
- capaz de preparar o cliente para contratar consultoria mais completa;
- valorizado por resolver dores praticas: treinamento, rotina, controle, feedback, relatorios e visao de performance.

## 3. Objetivos do Escopo

### 3.1 Objetivo Principal

Transformar o sistema MX em uma plataforma operacional e consultiva que permita executar a metodologia PMR, acompanhar lojas diariamente e desenvolver equipes comerciais com menor dependencia de intervencao manual.

### 3.2 Objetivos Secundarios

- Simplificar a experiencia das visitas de consultoria para uso online e presencial.
- Garantir que reunioes sejam conduzidas dentro do sistema, com passo a passo claro.
- Gerar relatorios e resumos padronizados automaticamente ao final das visitas.
- Criar visoes diferentes para consultor/admin MX, dono/lojista, gerente e vendedor.
- Dar ao cliente uma visao de valor imediato, principalmente por acompanhamento diario, rotina e desenvolvimento de vendedores.
- Preparar o sistema para publicacao em app stores, considerando prazos de validacao da Apple e Google.

## 4. Escopo Funcional

### 4.1 Consultoria e Visitas PMR

O fluxo de consultoria deve permitir que o consultor/admin MX abra a agenda, selecione a visita, execute a reuniao e finalize tudo dentro do sistema.

Requisitos:

- Agenda de visitas deve continuar como porta de entrada operacional para a consultoria.
- Cada visita deve ter objetivo visivel e metodologia de execucao clara.
- O painel da visita deve mudar de acordo com o objetivo da visita.
- A tela da visita deve ser mais simples, limpa e orientada por sequencia.
- O sistema deve funcionar bem para reunioes online e presenciais.
- O consultor deve conseguir iniciar a visita a partir da agenda.
- O sistema deve orientar o que levantar na reuniao, como um checklist/guia.
- Deve existir visita adicional de **acompanhamento mensal**, alem das visitas PMR 1 a 7.
- Deve existir modo administrativo para registrar visitas ja realizadas em clientes legados, anexando relatorios existentes.

### 4.2 Relatorio Executivo e Resumo em Tempo Real

O sistema deve gerar entregaveis ao cliente, entendido como lojista/dono, sem trabalho manual posterior.

Requisitos:

- Relatorio executivo deve apresentar guia da reuniao, informacoes a levantar e tarefas.
- Ao final da visita, o sistema deve gerar relatorio padronizado no formato MX.
- A ordem do relatorio final deve seguir a configuracao metodologica, mesmo que a conversa tenha ocorrido em ordem diferente.
- O resumo da reuniao deve ficar disponivel em tempo real para cliente/grupo.
- Relatorio final deve incluir, quando aplicavel:
  - resultado do periodo;
  - resultado do trimestre;
  - pontos positivos;
  - pontos a melhorar;
  - tarefas e proximos passos;
  - anexos/documentos relacionados.
- A transcricao da reuniao deve ser anexada ou incorporada ao fluxo quando disponivel.

### 4.3 Filtros de Periodo e Dados da Visita

O consultor/admin MX precisa selecionar o periodo que sera discutido com o cliente lojista/dono.

Requisitos:

- Tela da visita deve permitir selecionar periodo de analise.
- O periodo selecionado deve alimentar conversa, indicadores e relatorio.
- O sistema deve suportar discussoes como "resultado do mes passado" ou periodo especifico.

### 4.4 Planejamento Estrategico

Foi identificada necessidade de uma tela de planejamento semelhante ao DRE financeiro, mas voltada ao planejado, realizado e comparativos.

Requisitos:

- Criar ou evoluir tela de Planejamento Estrategico com estrutura tabular/analitica semelhante ao DRE financeiro.
- Permitir visualizar:
  - meta planejada;
  - resultado atual/realizado;
  - percentual de realizacao;
  - comparativo com ano anterior;
  - volume de vendas;
  - volume de carros de troca;
  - indicadores metodologicos do planejamento.
- A visao do cliente/dono deve ser bonita, clara e orientada a valor.
- A visao interna da MX pode ser mais operacional e completa.
- Considerar os 45 indicadores mencionados na planilha do Daniel, priorizando os que geram valor imediato.

### 4.5 Visao do Cliente/Dono e Consultor/Admin MX

A reuniao reforcou que a visao do dono ainda nao esta totalmente configurada.

Requisitos:

- Criar visao especifica do dono/cliente, diferente da visao operacional do consultor/admin MX.
- Dono deve enxergar performance da loja, indicadores principais e alertas.
- Consultor/admin MX deve enxergar detalhes operacionais, visitas, pendencias e relatorios.
- Vendedor deve ter acesso apenas ao que orienta sua rotina, seus dados e seu desenvolvimento.
- Gerente deve ter recursos para validar informacoes, cobrar rotina e acompanhar equipe.

### 4.6 Acompanhamento Diario, Matinal e Rotina

O acompanhamento diario foi tratado como um dos principais inputs para toda a orquestracao funcionar.

Requisitos:

- Vendedor deve registrar informacoes diarias de forma simples, preferencialmente via celular/app.
- Sistema deve facilitar a rotina do vendedor, nao apenas cobrar preenchimento.
- Deve existir processo claro de validacao pelo gerente.
- Deve haver notificacoes ou pop-ups em horario configurado para lembrar a puxada/preenchimento diario.
- O sistema deve gerar insights individuais para vendedor, gerente e dono.
- Indicadores devem mostrar se vendedor/loja esta abaixo, dentro ou acima do mercado.
- Deve existir mecanismo de incentivo por disciplina, como estrelas, pontuacao, ranking ou reconhecimento.

### 4.7 Desenvolvimento de Pessoas

A area atual de "Treinamentos" deve evoluir para um conceito mais amplo de desenvolvimento.

Requisitos:

- Renomear ou reposicionar a area como **Desenvolvimento**, **Evolucao** ou **Meu Plano de Carreira**.
- Consolidar em um mesmo ambiente:
  - PDI;
  - devolutivas/feedbacks;
  - biblioteca de conteudo;
  - treinamentos recomendados;
  - trilha de novo colaborador;
  - plano de carreira.
- O posicionamento do produto deve ser "sistema que desenvolve pessoas", nao apenas plataforma de curso.

### 4.8 Biblioteca de Conteudo

A biblioteca foi priorizada como alternativa mais flexivel que uma trilha obrigatoria para todos.

Requisitos:

- Criar biblioteca de conteudo pesquisavel.
- Conteudos devem ser organizados por tema/competencia.
- Usuario deve poder buscar ou filtrar temas como:
  - agendamento de visita;
  - fechamento de venda;
  - apresentacao do carro;
  - financiamento;
  - avaliacao/carro de troca;
  - prospeccao;
  - rotina diaria;
  - atendimento;
  - funil;
  - aquecimento de cliente.
- O sistema deve medir consumo de aulas/conteudos.
- Conteudos devem permitir avaliacao por estrelas.
- Conteudos mal avaliados devem ser candidatos a substituicao.
- Cliente/usuario deve poder sugerir conteudos dentro do sistema.
- A MX pode usar especialistas convidados e fornecedores para gravar conteudos.

### 4.9 Trilha de Novo Colaborador

Para novos vendedores, deve haver uma trilha basica e obrigatoria.

Requisitos:

- Ao cadastrar novo vendedor, gestor deve poder acionar trilha de entrada.
- Novo colaborador deve seguir uma trilha inicial antes de ser liberado para venda.
- A trilha deve orientar dono/gerente quando o colaborador concluir etapas.
- Ao concluir treinamento inicial, sistema deve notificar gestor com orientacao de feedback e liberacao.
- Trilha pode ter progressao por meses, com etapas futuras bloqueadas.
- Trilha inicial deve incluir apresentacao de mercado, funcao, rotina e fundamentos.

### 4.10 Personalizacao por Loja

A reuniao identificou oportunidade de personalizacao como produto adicional.

Requisitos:

- Permitir que a trilha de entrada inclua conteudo institucional da loja.
- Conteudo institucional pode cobrir:
  - historia da empresa;
  - valores;
  - cultura;
  - processos administrativos;
  - preparacao de veiculos;
  - avaliacao de carros;
  - processo documental;
  - rotina especifica da loja.
- Essa personalizacao pode ser vendida como produto ou pacote adicional.

### 4.11 Feedback Estruturado e PDI

Feedback estruturado e PDI devem conectar lacunas de desempenho a conteudos recomendados.

Requisitos:

- Gerente deve registrar feedback estruturado.
- Feedback deve identificar competencias/lacunas.
- Sistema deve recomendar conteudos conforme lacunas.
- PDI deve estar integrado ao historico do vendedor.
- PDI deve ser revisavel e acompanhado por gerente/dono.
- Deve haver relacao entre feedback, treinamento, rotina e desempenho.

### 4.12 Engajamento e Gamificacao

Daniel reforcou que o vendedor precisa entender por que deve preencher dados e estudar.

Requisitos:

- Criar incentivos visuais por disciplina e evolucao.
- Mostrar progresso individual.
- Premiar consistencia no preenchimento diario.
- Mostrar relacao entre uso do sistema, melhoria de desempenho e dinheiro no bolso.
- Considerar ranking, estrelas, badges ou alertas, desde que simples.

### 4.13 App Mobile e Publicacao

O app foi citado como facilitador importante, especialmente para vendedor.

Requisitos:

- Priorizar versao mobile/celular para rotinas do vendedor.
- Garantir que campos principais de consultoria e rotina estejam prontos antes de envio para validacao.
- Considerar prazos mencionados:
  - Apple: cerca de 1 mes para primeira validacao;
  - Google: cerca de 2 semanas para primeira validacao.
- O sistema deve estar "no ponto de agulha" antes de submissao.

## 5. Priorizacao Proposta

### Fase 1 - Fechar Consultoria e App Base

Objetivo: deixar a parte de consultoria pronta para uso, teste com clientes atuais e submissao do app.

Inclui:

- agenda de visitas funcionando;
- visita 8/acompanhamento mensal;
- conclusao legada de visitas ja realizadas;
- anexos e relatorios por cliente;
- relatorio executivo e resumo automatico;
- filtros de periodo;
- ajustes de UX para visita mais limpa;
- visoes consultor/cliente/dono basicas;
- correcao de acesso/senha e rotas criticas.

### Fase 2 - Acompanhamento Diario e Visao de Performance

Objetivo: gerar valor diario para loja e alimentar consultoria com dados.

Inclui:

- preenchimento diario do vendedor;
- validacao pelo gerente;
- notificacoes/pop-ups;
- insights por vendedor e loja;
- comparativos mercado/loja/vendedor;
- BI/visao geral do dono;
- rotina sugerida do vendedor.

### Fase 3 - Desenvolvimento de Pessoas

Objetivo: criar produto de entrada escalavel e percebido como sistema de desenvolvimento.

Inclui:

- biblioteca de conteudo;
- avaliacao de aulas por estrelas;
- sugestao de conteudos;
- trilha de novo colaborador;
- feedback estruturado conectado a aulas;
- PDI conectado a desempenho;
- plano de carreira/evolucao.

### Fase 4 - Personalizacao e Conteudo Premium

Objetivo: diferenciar a oferta e aumentar valor percebido.

Inclui:

- trilhas institucionais por loja;
- conteudos com especialistas convidados;
- fornecedores e parceiros em temas especificos;
- gravacao em estudio;
- pacotes personalizados por cliente.

## 6. Fora de Escopo Imediato

Para manter foco, estes itens nao devem bloquear as fases iniciais:

- automatizacao completa de IA para todas as recomendacoes;
- trilhas complexas para todos os vendedores antigos;
- personalizacao institucional obrigatoria para todos os clientes;
- marketplace completo de cursos;
- regras avancadas de contratacao/recrutamento;
- modelo robusto de gamificacao antes da rotina diaria estar validada;
- BI completo com todos os 45 indicadores antes dos indicadores prioritarios.

## 7. Riscos e Pontos de Atencao

- **Adocao do vendedor:** se o preenchimento diario parecer burocratico, a adesao cai.
- **Engajamento do dono/gerente:** o sistema so muda rotina se lideranca cobrar e enxergar valor.
- **Complexidade de tela:** a visita precisa ser limpa e obvia para consultores novos.
- **Modelo hibrido:** online e presencial precisam funcionar igualmente bem.
- **Dependencia de conteudo:** biblioteca ganha valor quando houver material bom, curto e pratico.
- **Dados incompletos de clientes legados:** migracao deve aceitar anexos e conclusao administrativa.
- **Promessa de IA:** relatorio automatico deve ser padronizado e confiavel antes de ser vendido como diferencial.

## 8. Indicadores de Sucesso

- Percentual de visitas iniciadas e finalizadas dentro do sistema.
- Tempo medio entre fim da reuniao e envio do resumo/relatorio ao cliente.
- Percentual de vendedores com preenchimento diario concluido.
- Percentual de preenchimentos validados pelo gerente.
- Consumo de conteudo por vendedor.
- Avaliacao media dos conteudos.
- Quantidade de PDIs ativos/revisados.
- Evolucao de indicadores comerciais apos uso de rotina e treinamento.
- Numero de clientes usando o sistema como produto de entrada.
- Conversao de produto de entrada para consultoria completa.

## 9. Decisoes Capturadas

- A parte de consultoria deve ser finalizada primeiro.
- O sistema deve suportar uso online e presencial.
- A tela de visita precisa ficar mais simples e sequencial.
- A entrega ao cliente deve ser em tempo real ou imediatamente apos a reuniao.
- O sistema deve virar um produto de entrada, nao apenas ferramenta interna.
- Desenvolvimento de pessoas e rotina diaria sao os grandes diferenciais percebidos.
- Biblioteca de conteudo deve existir alem da trilha de novo colaborador.
- Trilha obrigatoria deve ser focada principalmente em novos colaboradores.
- PDI, feedback e conteudo devem se conectar.
- App/mobile e notificacoes sao essenciais para rotina do vendedor.

## 10. Questoes em Aberto

- Quais indicadores entram no primeiro recorte dos 45 indicadores do planejamento?
- Qual nome final da area: Desenvolvimento, Evolucao ou Meu Plano de Carreira?
- Quem define conteudos recomendados por lacuna: gerente manualmente ou regra automatica inicial?
- Quais conteudos entram na primeira biblioteca para MVP?
- Como sera o modelo comercial da personalizacao institucional por loja?
- Quais informacoes diarias do vendedor sao obrigatorias no primeiro MVP?
- Qual sera o mecanismo inicial de incentivo: estrelas, ranking, pontuacao ou outro?
- Qual padrao final do relatorio executivo enviado ao cliente?

## 11. Backlog Inicial Derivado

1. Ajustar UX da tela de visita para fluxo sequencial e mais limpo.
2. Adicionar visita 8 de acompanhamento mensal.
3. Implementar filtro de periodo nas visitas/relatorios.
4. Consolidar relatorio executivo automatico por visita.
5. Criar visao do dono/cliente para performance e planejamento.
6. Evoluir Planejamento Estrategico com planejado, realizado e comparativos.
7. Definir campos do preenchimento diario do vendedor.
8. Criar validacao diaria pelo gerente.
9. Adicionar notificacoes/pop-ups de rotina.
10. Reposicionar Treinamentos como Desenvolvimento/Evolucao.
11. Criar biblioteca de conteudo por tema.
12. Adicionar avaliacao por estrelas e sugestao de conteudo.
13. Criar trilha de novo colaborador.
14. Integrar feedback estruturado a recomendacao de aulas.
15. Integrar PDI, conteudo e performance.
16. Mapear primeira leva de conteudos para gravacao.
