# PRD - Refatoracao Geral MX Performance

**Data da reuniao base:** 2026-05-22  
**Documento fonte:** Google Doc `MX - Evento online - Validacao Google Meet MX - Daniel e Jose`  
**Link fonte:** https://docs.google.com/document/d/1WfCjxbeRM8dmQPzX-eAsjlyEUpMSRUSN19ashRk5nxw/edit?usp=sharing  
**Transcricao analisada:** resumo Gemini + transcricao integral, 01:51:48, 2.520 linhas exportadas  
**Tipo de iniciativa:** Brownfield PRD / grande refatoracao de produto, UX, layout, hierarquia, permissoes e modulos  
**Status:** Base para validacao com Daniel, Jose, Mariane, Pedro e equipe MX

---

## 1. Leitura Correta da Reuniao

A reuniao nao definiu apenas ajustes de tela. Ela redefiniu o posicionamento do sistema.

O MX Performance deve deixar de ser percebido como "mais um sistema" e passar a ser percebido como uma plataforma de decisao, consultoria, gestao e desenvolvimento para lojas de carros.

O ponto central da reuniao foi:

- O cliente quer facilidade.
- O lojista medio nao e analitico.
- Muitos donos nao dominam nem o CRM atual.
- O sistema precisa ser muito clean.
- O sistema precisa ser facil de vender.
- A MX nao deve competir com CRM.
- A MX deve entregar o que o CRM nao entrega: analise, estrategia, direcionamento, risco, decisao e plano de acao.
- O sistema deve ser estruturado por visao de negocio e departamentos, nao por uma pilha de paginas soltas.

Frase-sintese:

> CRM organiza processo. MX Performance orienta decisao e performance.

---

## 2. Validacao das Anotacoes do Gemini

O resumo automatico do Gemini esta correto nos grandes temas, mas esta incompleto para virar PRD direto.

### 2.1 O que o Gemini capturou corretamente

- Interface simples e organizada.
- Quatro abas principais: Consultoria, Departamentos, Treinamento e Falar com o Consultor.
- Sistema como ferramenta de performance e conselho, diferente de CRM.
- Painel visual com cores verde, amarelo e vermelho.
- Comparativo de mercado.
- Agenda automatizada do diretor.
- Plano de acao com status atualizado pela loja.
- Organograma e papeis.
- Visitas por produto: PMR, PMR Plus e PPA.
- Biblioteca com IA e noticias.
- Gestao por departamentos.
- Engajamento do vendedor via beneficios condicionados ao registro de dados.
- Cultura de resultados.
- Marketing multicanal.
- RH com remuneracao, plano de carreira, contratacao, teste comportamental, treinamento e clima.
- Financeiro/DRE como modulo.
- Chat/falar com consultor como suporte consultivo.
- Execucao por stories e validacao continua.
- Objetivo de apresentar/vender ate agosto/setembro.

### 2.2 O que o Gemini resumiu, mas precisa de mais precisao

- Nao e apenas "automacao de marketing"; e reposicionamento de internet/trafego para marketing multicanal.
- Nao e apenas "módulo de RH"; RH e o modulo com maior potencial de ticket e retencao, mas parte dele e fase futura.
- Nao e apenas "gamificacao"; e estrategia para obter dados do vendedor sem parecer mais um sistema.
- Nao e apenas "CRM de suporte"; e canal consultivo que gera base de conhecimento, melhoria de produto e futura IA.
- Nao e apenas "cronograma ate agosto"; o plano e vender/testar mercado, entregar core ate agosto e deixar RH avancado para fase posterior.

### 2.3 Pontos que nao podem ser perdidos

- Nao mostrar os 45 indicadores de uma vez para o dono.
- O dono deve ver primeiro um painel simples, semaforico e explicativo.
- O plano de acao atual foi considerado insuficiente em layout e edicao.
- O plano de acao precisa ser central e tambem segmentado por responsavel.
- O organograma e central para responsabilidade, aprovacao, PDI e plano de carreira.
- O vendedor nao e o cliente pagante, mas e fonte critica de dados.
- Nao vender lancamento diario como ponto/jornada; isso cria risco e antipatia.
- A ideia de "travar CRM" e boa como referencia, mas depende de integracao/API/parceiro.
- WhatsApp pode abastecer dados sem obrigar o vendedor a entrar no sistema.
- Placa FIPE dentro do app e uma ideia de beneficio pratico para vendedor.
- "Cultura de resultado" pertence ao Comercial, nao precisa virar aba principal global.
- PPA tem temas de visita e nove visitas anuais por causa dos tres eventos sem visita.
- Marketing deve ter agenda mes a mes e desempenho por canal.
- RH/contratacao completa e robusta e uma etapa posterior, nao o primeiro bloco para entregar.
- Mariane entra como testadora forte de usuario final.
- A execucao deve ser por stories pequenas, liberadas e testadas uma a uma.

---

## 3. Problema de Produto

O sistema atual ja possui muitas partes importantes: vendedor, gerente, PDI, lancamento diario, treinamentos, consultoria, visitas, agenda, produtos, DRE, parametros, relatorios e configuracoes.

O problema e que a reuniao deixou claro que o sistema precisa mudar de organizacao mental:

- Hoje as funcionalidades parecem modulos separados.
- A nova visao exige uma arquitetura por experiencia, perfil e departamento.
- O dono precisa enxergar valor imediatamente.
- O gerente precisa usar o sistema como ferramenta de gestao.
- O vendedor precisa registrar dados porque recebe algo em troca.
- O consultor precisa ter rastreabilidade, historico e padrao de entrega.
- O sistema precisa virar base comercial para venda e upsell.

Isso e uma refatoracao de produto, nao so de UI.

---

## 4. Objetivos

### 4.1 Objetivos de negocio

- Tornar o MX Performance mais facil de vender.
- Aumentar percepcao de valor do dono.
- Criar base para pre-venda em evento online/presencial.
- Preparar produto para demonstracao forte ate agosto/setembro.
- Permitir upsell por modulos estrategicos: Marketing, RH, Financeiro, Falar com Consultor.
- Diminuir dependencia manual da MX para responder duvidas simples.
- Transformar dados da operacao em decisao e plano de acao.

### 4.2 Objetivos de produto

- Reorganizar o sistema em quatro abas principais para o cliente.
- Separar experiencia por perfil: dono, gerente, vendedor, marketing/administrativo, consultor MX.
- Reestruturar modulos existentes em departamentos.
- Construir painel executivo clean para o dono.
- Melhorar plano de acao com responsaveis, status, evidencias e segmentacao.
- Criar organograma como base de responsabilidades, aprovacao, PDI e carreira.
- Padronizar produtos PMR, PMR Plus e PPA.
- Criar fundacao de biblioteca consultiva.
- Criar fundacao de marketing multicanal.
- Criar fundacao de RH/desenvolvimento.
- Criar base para chat/falar com consultor.

### 4.3 Objetivos de UX

- Reduzir complexidade visual.
- Evitar telas densas para o dono.
- Priorizar semaforos, alertas, gaps e proximas acoes.
- Fazer o dono bater o olho e entender risco, causa e acao.
- Fazer gerente e vendedor enxergarem apenas o que precisam.
- Manter linguagem simples, objetiva e comercialmente forte.

---

## 5. Nao Objetivos

Nao faz parte da primeira entrega:

- Criar um CRM concorrente do AutoCerto.
- Substituir CRM da loja.
- Implementar RH completo com captacao nacional de candidatos.
- Criar sistema juridico de ponto/jornada de trabalho.
- Depender de WhatsApp API para a primeira versao funcionar.
- Depender de API do AutoCerto para a primeira versao funcionar.
- Depender de API oficial da Meta/Instagram para validar o modulo de marketing.
- Mostrar todos os 45 indicadores na primeira tela do dono.
- Construir tudo de uma vez e testar tudo no final.
- Gravar video de todas as reunioes como prioridade.

---

## 6. Personas e Visoes

### 6.1 Dono da loja

E o pagador e principal decisor.

Precisa:

- Ver a saude da empresa rapidamente.
- Entender riscos e gargalos.
- Saber o que fazer.
- Acompanhar equipe sem entrar em detalhes operacionais demais.
- Comparar sua loja com mercado/rede.
- Receber agenda de responsabilidades.
- Ver se areas estao eficientes.
- Ser conduzido para upgrades quando houver modulo bloqueado.

Nao deve:

- Ser obrigado a interpretar dezenas de indicadores.
- Ver uma interface tecnica de CRM.
- Receber excesso de informacao operacional.

### 6.2 Gerente

E o promotor interno da ferramenta.

Precisa:

- Ver resultado, funil, equipe, PDI, feedback e rotina.
- Acompanhar plano de acao dos vendedores.
- Cobrar disciplina e acuracidade.
- Receber orientacao de cultura de resultado.
- Ter clareza de papel, rotina e responsabilidades.

### 6.3 Vendedor

Nao e o cliente pagante, mas e fonte critica de dados.

Precisa:

- Registrar lancamento diario com baixa friccao.
- Ver comparativo com loja/equipe quando preencher.
- Ter beneficio pratico por usar o sistema.
- Acompanhar propria evolucao, PDI, certificados e treinamentos.
- Acessar ferramentas uteis como Placa FIPE, se priorizado.

Nao deve:

- Sentir que e apenas mais uma obrigacao.
- Sentir que o sistema e ponto/jornada formal.

### 6.4 Marketing da loja

Pode existir em lojas mais estruturadas.

Precisa:

- Ver agenda estrategica mensal.
- Acompanhar canais.
- Registrar posicionamento.
- Analisar desempenho de publicacoes/campanhas.
- Receber insights de melhoria.

### 6.5 Administrativo/Financeiro

Precisa:

- Acessar DRE, financeiro, preparacao, pos-venda e rotinas administrativas conforme plano.
- Receber treinamentos especificos.
- Operar partes do sistema sem invadir a visao executiva do dono.

### 6.6 Consultor MX

Precisa:

- Acompanhar clientes, visitas, atas, transcricoes, plano de acao, alertas e chamados.
- Ter padrao de entrega por produto.
- Registrar conversas e solucoes para formar base de conhecimento.
- Validar entregas por stories.

---

## 7. Arquitetura de Informacao Alvo

### 7.1 Quatro abas principais do cliente

1. Consultoria
2. Departamentos
3. Treinamentos
4. Falar com o Consultor

Essa estrutura e a principal decisao de IA da reuniao.

### 7.2 Logica de acesso por perfil

| Perfil | Acesso esperado |
| --- | --- |
| Dono | Acesso a tudo, com visao executiva e bloqueios/upsell onde aplicavel |
| Gerente | Visao do departamento Comercial, equipe, PDI, feedback, rotina, partes de marketing/operacao se autorizado |
| Vendedor | Visao propria: lancamento, desempenho, PDI, feedback, treinamentos, beneficios, ranking |
| Marketing | Departamento Marketing quando loja possuir estrutura/permissao |
| Administrativo | Financeiro/Administrativo/Operacoes conforme permissao |
| Consultor MX | Visao interna de clientes, visitas, entregas, suporte e configuracoes |

---

## 8. Impacto no Sistema Atual

Rotas e modulos atuais precisam ser reposicionados.

| Area atual no codigo | Como deve ser reinterpretada |
| --- | --- |
| `src/pages/DashboardLoja.tsx` | Base para dashboards de dono/gerente, mas precisa virar visao organizada por Consultoria e Departamentos |
| `src/pages/Consultoria.tsx` | Deve evoluir de CRM interno de consultoria para hub de entrega consultiva e tambem alimentar visao do cliente |
| `src/pages/ConsultoriaClientes.tsx` | Continua para gestao interna MX dos clientes |
| `src/pages/ConsultoriaClienteDetalhe.tsx` | Deve concentrar configuracao de produto, visitas, plano, indicadores e historico |
| `src/pages/ConsultoriaVisitaExecucao.tsx` | Base para visitas padronizadas PMR/Plus/PPA com checklist, evidencias e IA |
| `src/pages/AgendaAdmin.tsx` | Deve alimentar agenda do diretor, agenda de visitas e comunicados |
| `src/pages/VendedorHome.tsx` | Deve virar entrada do vendedor dentro do Departamento Comercial |
| `src/pages/Checkin.tsx` | Lancamento diario deve ser preservado, mas integrado a disciplina, acuracidade e plano de acao |
| `src/pages/Ranking.tsx` | Pode alimentar Cultura de Resultado, competicao e Clube dos Campeoes |
| `src/pages/VendedorPDI.tsx` e `src/pages/GerentePDI.tsx` | Devem se conectar com plano de acao, organograma e plano de carreira |
| `src/pages/VendedorFeedback.tsx` e `src/pages/GerenteFeedback.tsx` | Devem entrar no Comercial/Desenvolvimento |
| `src/pages/RotinaGerente.tsx` | Deve compor Comercial e descricoes de cargo/rotina |
| `src/pages/*Treinamentos.tsx` | Devem convergir para aba Treinamentos, biblioteca e trilhas por perfil |
| `src/pages/ProdutosDigitais.tsx` | Deve evoluir para catalogo/configuracao de produtos PMR/PMR Plus/PPA e modulos comerciais |
| `src/pages/Configuracoes.tsx` | Deve manter governanca, mas parte da estrutura de departamentos/organograma pode nascer daqui |
| `src/pages/MorningReport.tsx` | Pode alimentar alertas, agenda e reports executivos |
| `src/pages/SalesPerformance.tsx` e `SellerPerformance.tsx` | Devem entrar em Resultado/Comercial, sem poluir primeira visao do dono |

---

## 9. Modulo Consultoria

### 9.1 Proposito

Ser a primeira grande experiencia do dono.

Deve responder:

- Como minha empresa esta?
- Onde esta o risco?
- Por que esta em alerta?
- O que devo fazer?
- Como estou comparado ao mercado/rede?
- O que esta pendente?
- Qual e minha agenda como diretor?

### 9.0.1 Especificacao visual da Home do dono

Em 2026-05-26 foi adicionada uma especificacao dedicada para a tela inicial da visao do dono, baseada na imagem de referencia enviada por Pedro e validada contra a transcricao da reuniao.

Arquivo:

- `docs/prd/modulo-visao-dono-cockpit-executivo-2026-05-26.md`

A tela deve ser tratada como cockpit executivo do dono, com:

- KPIs principais.
- Indice de eficiencia.
- Panorama planejado x realizado.
- Alertas importantes.
- Resumo do plano de acao.
- Desempenho por departamento.
- Nova navegacao do dono.
- Entrada para agenda do diretor, comparativo mercado/rede, biblioteca, visitas e falar com consultor.

### 9.2 Subabas propostas

- Painel
- Resultados
- Plano de Acao
- Visitas
- Dashboard Comparativo
- Biblioteca

### 9.3 Painel do dono

Requisitos:

- Exibir semaforo por area/processo: verde, amarelo, vermelho.
- Suportar preenchimento manual no MVP.
- Permitir evolucao para calculo automatico por indicadores.
- Mostrar alertas de pendencia na primeira tela.
- Explicar motivo do alerta.
- Mostrar gap para sair do vermelho/amarelo.
- Permitir tooltip/hover com explicacao.
- Usar linguagem simples.
- Nao exibir os 45 indicadores brutos na primeira visao.

Exemplo:

- Financeiro: amarelo.
- Motivo: meta atingida, mas custo acima da meta.
- Gap: reduzir custo em X ou aumentar margem em Y.
- Acao sugerida: revisar DRE e plano de acao financeiro.

### 9.4 Resultados

Requisitos:

- Mostrar metas.
- Mostrar realizado.
- Mostrar ano anterior.
- Mostrar dados por vendedor/equipe.
- Permitir drill-down para indicadores.
- Reaproveitar planejamento estrategico existente.
- Nao concorrer com o painel inicial.

### 9.5 Plano de Acao 2.0

O plano atual foi considerado insuficiente.

Requisitos:

- Novo layout para bater o olho.
- Status editavel.
- Responsavel atribuido pelo cadastro.
- Segmentacao por loja, gerente, vendedor e outros papeis.
- Plano central geral.
- Planos derivados por responsavel.
- Executor atualiza seu item e isso atualiza o plano central.
- Prazos e cobrancas.
- Evidencias obrigatorias quando aplicavel.
- Atualizacao pelo sistema e futuramente por WhatsApp.
- Acao vencendo hoje deve gerar notificacao.
- Possibilidade de resposta simples: sim/nao/concluido.
- Item pode sair de pendencia, mas ficar aguardando evidencia.

### 9.6 Organograma

O organograma nao e uma tela secundaria. Ele e pilar estrutural.

Requisitos:

- Cargos da loja.
- Pessoas associadas aos cargos.
- Hierarquia.
- Atribuicao de responsaveis.
- Fluxo de aprovacao.
- Relacao com plano de acao.
- Relacao com PDI.
- Relacao com plano de carreira.
- Relacao com plano de remuneracao.
- Relacao com permissoes.

Objetivo:

- Definir claramente o papel do dono, gerente, vendedor, administrativo e demais funcoes.
- Evitar que o dono vire vendedor/administrativo sem controle.
- Dar ao dono a sensacao de "libertacao" pela gestao estruturada.

### 9.7 Descricao de cargo e rotina

Requisitos:

- Descricao de cargo por papel.
- Rotina obrigatoria por cargo.
- Exemplo: gerente com rotina diaria/semanal/mensal.
- Vendedor com responsabilidades claras.
- Administrativo/financeiro com responsabilidades claras.
- Vinculo com plano de acao e treinamento.

### 9.8 Estrategias emergenciais

Ideia levantada:

- Quando resultado esta ruim, acionar estrategia emergencial.
- Pode existir dentro de Consultoria ou Comercial.
- Deve registrar campanha, responsaveis, periodo, meta e resultado.

Nao precisa ser modulo inicial completo, mas deve entrar no backlog.

### 9.9 Visitas

Requisitos:

- Checklist por visita.
- Arquivos vinculados.
- Evidencias.
- Relatorio/ata.
- IA ja integrada deve gerar rascunho/ata a partir do escopo.
- Padronizacao por produto.
- Flexibilidade para acompanhamento geral quando o tema nao fizer sentido naquele cliente.

### 9.10 Produtos e visitas

Produtos discutidos:

- PMR
- PMR Plus
- PPA

Regras:

- PMR online e presencial devem seguir mesma padronizacao; muda apenas perfil da visita presencial.
- Produto deve ser cadastrado na guia de produtos.
- Ao cadastrar cliente, selecionar produto contratado.
- Sistema deve subir templates, visitas, prazos e modulos conforme produto.
- Mariane informou que na Evoluto havia produtos e prazos cadastrados.
- Pode reaproveitar/copiar estrutura da Evoluto.

PPA:

- Cliente normalmente ja passou pelo PMR basico.
- PMR Plus e PPA sao acompanhamento.
- PPA tem visitas com temas.
- Tema 1: modelo de negocio + planejamento estrategico.
- Tema 2: eficiencia em custo.
- Tema 3: receita/maximizacao de receita.
- Sao nove visitas no ano porque existem tres eventos anuais para donos; nos meses de evento nao ha visita.
- Cada tema roda tres vezes no ano.
- Daniel possui apresentacao PPA com estrutura.
- Essa apresentacao deve virar template de visitas/checklists.

### 9.11 Dashboard comparativo

Requisitos:

- Comparar loja com mercado/rede/clientes MX.
- Permitir pesquisa por indicador.
- Exemplo: margem liquida.
- Filtros: volume de estoque, ticket medio de estoque, regiao e outros parametros.
- Se houver menos de cinco lojas na amostra, nao retornar dado granular.
- Alternativa: retornar dado geral.
- Resultado deve ser grafico e clean.
- Cliente so acessa comparativo completo se abastecer dados.

Fontes possiveis:

- Dados manuais coletados pelo suporte MX.
- Relatorios do CRM da loja.
- API AutoCerto.
- Outros CRMs.
- Dados internos MX.

### 9.12 Agenda do diretor

Requisitos:

- Acoes obrigatorias mensais do dono.
- Agenda com horarios e comunicados.
- Disparo por e-mail `gestao@mx`.
- Opcao para o cliente aceitar comunicados.
- Se vincular agenda, assume que quer receber.
- Permitir descadastrar/desvincular.
- Futuro: resumo semanal.

### 9.13 Biblioteca consultiva

Requisitos:

- Material de estudo.
- Videos pertinentes ao lojista.
- Noticias.
- Artigos por tema: consignacao, eletricos, hibridos, remuneracao, CLT/PJ, contratacao, vendas, seminovos etc.
- Data de ultima atualizacao.
- Busca simples.
- Conteudo conectado a popups de ajuda nos modulos.
- Possivel busca diaria por IA meia-noite.
- Curadoria por pautas e portais definidos.
- Deve reduzir dependencia de Daniel/consultores.

---

## 10. Aba Departamentos

### 10.1 Proposito

Departamentos sao a "sacada" da reuniao.

A estrutura por departamento evita que o produto dependa de um unico processo critico, como o vendedor preencher o dia.

Departamentos tambem reforcam que a MX e consultoria de gestao para loja de carros, envolvendo empresa inteira.

### 10.2 Departamentos iniciais

- Comercial
- Marketing
- Produto/Estoque
- RH e Desenvolvimento
- Financeiro/Administrativo
- Operacoes
- Preparacao
- Pos-venda

Nem todos precisam ter a mesma profundidade no MVP.

### 10.3 Dashboard por departamento

Todos os departamentos devem ter:

- Indicadores-chave.
- Indice de eficiencia.
- Semaforo.
- Alertas.
- Regras de boas praticas.
- Desdobramento quando necessario.

Daniel citou que, ao entrar em Preparacao, por exemplo, deveriam aparecer quatro indicadores-chave para bater o olho.

---

## 11. Departamento Comercial

### 11.1 Itens do Comercial

- Resultado.
- Funil.
- Acompanhamento de vendas.
- Feedback.
- PDI.
- Rotina.
- Plano de acao comercial.
- Cultura de resultado.
- Ranking/campanhas.
- Disciplina e acuracidade do vendedor.

### 11.2 Vendedor e dados

O vendedor e critico porque alimenta:

- Funil.
- Agendamentos.
- Lancamento diario.
- Disciplina.
- Acuracidade.
- Indicadores de rotina.

Mas a reuniao deixou claro:

- O vendedor nao e o cliente pagante.
- O sistema nao pode depender 100% dele.
- O sistema deve dar beneficios para ele preencher.
- O sistema precisa ser simples/app-like.

### 11.3 Nao parecer mais um sistema

Foi citada a dor da Piscar/Pipefy:

- Gerente rejeitou mais uma ferramenta.
- O mesmo pode acontecer com o MX.
- Pode ser necessario mudar a narrativa/nome e posicionar como app, plataforma ou consultoria, nao "sistema".

### 11.4 Lançamento diario e captura de dados

Ideias discutidas:

- Popup/trava em CRM antes de acessar leads.
- Integracao com CRM do Rodrigo.
- Integracao com AutoCerto.
- Lancamento via WhatsApp.
- Bot de WhatsApp para abastecer o sistema.
- Beneficios no app para quem preenche.

Decisao/prudencia:

- A melhor ideia ainda nao esta fechada.
- WhatsApp e boa rota para abastecer sem exigir entrada no sistema.
- Popup/trava depende de CRM/parceiro/API.
- Nao chamar de ponto/jornada formal.

### 11.5 Jornada/ponto

Houve debate sobre usar lancamento como ponto.

Requisito negativo:

- Nao vender ou estruturar inicialmente como ponto.
- Risco de antipatia do vendedor.
- Risco trabalhista/operacional.
- Pode ser analisado no futuro, mas nao como proposta central.

### 11.6 Incentivos para vendedor

Ideias:

- Acesso a comparativo de mercado com mais de 80% de disciplina.
- Comparativo com equipe/loja.
- Barra de evolucao.
- Certificado.
- Progresso conectado a PDI/RH.
- Placa FIPE nativo no app.
- Desbloqueio de funcionalidades conforme preenchimento.
- Ranking.
- Bonificacao.
- Clube dos Campeoes MX.
- Eventos com os melhores vendedores.

### 11.7 Cultura de resultado

Nao precisa virar aba principal. Deve ficar dentro do Comercial.

Requisitos:

- Registrar campanhas de retomada.
- Registrar rankings e metas temporarias.
- Dar suporte a acoes emergenciais.
- Permitir repescagem/feedback cultural com vendedores e gerentes.
- Relacionar disciplina, acuracidade e resultado.
- Trabalhar desenvolvimento, nao apenas cobranca.

---

## 12. Departamento Marketing

### 12.1 Mudanca de posicionamento

Daniel deixou claro:

- A MX vai parar de falar apenas de internet.
- A MX vai falar de marketing.
- Marketing sera multicanal.

### 12.2 Canais e areas

O departamento Marketing deve cobrir:

- Branding.
- Indicacao.
- Carteira da empresa.
- Carteira do vendedor.
- Internet.
- Instagram.
- Trafego pago.
- Conteudo.
- Campanhas sazonais.
- Relacionamento com clientes.
- Funil de leads.

### 12.3 Desempenho por canal

Requisitos:

- Dashboard por canal.
- Desempenho de publicacoes.
- Visualizacoes.
- Engajamento.
- Compartilhamentos.
- Custo por lead.
- ROI/CPA/CTA quando houver dados.
- Comparativo com outras lojas/cases.
- Insights automaticos.

### 12.4 Instagram/Meta

Foi sugerido como MVP de marketing por gerar case rapido.

Possibilidades:

- API oficial Meta.
- Conector/agente de IA.
- Usuario/senha fornecido pela loja.
- Analise postagem por postagem.
- Comentarios, visualizacoes, engajamento.

Risco:

- Login por usuario/senha e automacao de conta podem gerar risco operacional/seguranca.
- Deve ser validado tecnicamente antes de virar compromisso comercial.

### 12.5 Qualidade de conteudo

Daniel citou indicador usado em 2024/2025:

- Nota de qualidade do conteudo de 1 a 5.
- Parametros definidos pela MX.
- Loja quer entender por que a nota esta baixa.

Requisitos:

- Nota de conteudo.
- Explicacao objetiva.
- Pontos de melhoria.
- Relacao com rotina de publicacao.
- Comparativo com boas praticas.

### 12.6 Agenda estrategica

Requisitos:

- Agenda mes a mes.
- Acoes sazonais: Copa do Mundo, Dia dos Namorados etc.
- Ultima dezena/inicio da dezena: reuniao com marketing da loja para definir mes seguinte.
- Agenda visivel para dono e marketing.
- Pode ser modulo premium.

### 12.7 Carteira da empresa

Requisitos futuros:

- Sistema de relacionamento com carteira.
- Cadastro de clientes.
- Fluxo de mensagens.
- Score por interacao.
- Geracao de lead.
- Acompanhamento de disparos.
- Integracao por API com sistema escolhido.

### 12.8 Posicionamento

Requisitos:

- Registrar missao.
- Registrar visao.
- Registrar valores.
- Registrar posicionamento.
- Registrar estrategia de conteudo e cronograma.

### 12.9 Plano comercial

Marketing avancado pode ser bloqueado para upsell:

- Cliente ve que o modulo existe.
- Se nao tem plano, aparece chamada para falar com consultor.
- Plano Plus pode liberar agenda/estrategia multicanal.

---

## 13. Departamento Produto/Estoque

Escopo citado rapidamente, mas deve entrar no PRD:

- Analise estrategica de estoque.
- Oportunidades.
- Ameacas.
- Relacao com informacoes de estoque.
- Comparativo com mercado.
- Possivel uso de dados de CRM/AutoCerto.

Este modulo pode ser fase posterior ao core, mas deve estar previsto na arquitetura de Departamentos.

---

## 14. Departamento RH e Desenvolvimento

### 14.1 Importancia

RH foi tratado como um dos maiores diferenciais futuros.

Frase pratica da reuniao:

- So esse modulo pode justificar o valor do sistema.
- Ele aumenta ticket.
- Ele resolve dor forte de contratacao, treinamento, remuneracao, carreira e clima.

### 14.2 Plano de remuneracao

Requisitos:

- Cadastro de plano de remuneracao por cargo.
- Perguntas de contexto da loja.
- Tamanho da loja.
- Regiao.
- Estoque.
- Meta de venda.
- Perfil do cargo.
- Comparacao com media de mercado.
- Indicacao se esta abaixo, dentro ou acima da media.
- Sugestao de modelo de remuneracao.
- Conteudo auxiliar na biblioteca sobre PJ, CLT, remuneracao etc.

Importante:

- O sistema deve permitir que o dono resolva sem precisar perguntar para o consultor.

### 14.3 Plano de carreira

Requisitos:

- Plano de carreira atrelado ao organograma.
- Cargos e passos de evolucao.
- Exemplo: vendedor -> supervisor -> gerente.
- Requisitos por cargo.
- Competencias e aptidoes.
- Vinculo com PDI.
- Possibilidade de vendedor declarar objetivo de carreira.
- Visao do dono/gerente para orientar desenvolvimento.

### 14.4 Contratacao de vendedor

Fase robusta/futura.

Requisitos alvo:

- Substituir formulario externo.
- Cadastrar vaga dentro do sistema.
- Definir perfil desejado.
- Receber candidatos interessados.
- Enviar teste comportamental.
- Enviar formulario de competencias.
- Registrar entrevista.
- Gerar analise de compatibilidade.
- Apoiar decisao de contratacao.

### 14.5 Teste comportamental e IA

Requisitos:

- Teste comportamental dentro do sistema.
- Base de dados dos vendedores atuais.
- Cruzar perfil com performance.
- Identificar padrao dos top performers.
- Identificar perfil dos vendedores fracos.
- Sugerir perfil ideal para compor equipe.
- Considerar perfil do dono e equipe atual.
- Entregar probabilidade/compatibilidade.

Fonte:

- Jose mencionou base de IA e dados de testes.
- Daniel citou experiencia de pesquisa de 2017 e tentativa manual com IA.

### 14.6 Onboarding e trilha do novo colaborador

Requisitos:

- Ao cadastrar novo vendedor, sistema define nivel.
- Nivel baseado em informacoes como experiencia.
- Habilitar trilha correspondente.
- Treinamento basico com poucas aulas, por exemplo oito aulas.
- Evitar curso longo.
- Foco em conteudo necessario.

### 14.7 Video institucional da loja

Requisitos:

- Permitir video institucional personalizado por loja.
- Apresentar historia, dono, cultura e valores.
- Entrar antes/como parte da trilha do colaborador.
- Pode ser vendido como personalizacao.
- Diego/equipe de marketing podem produzir videos.
- Sistema deve aceitar videos atuais para validar media player antes dos videos novos.

### 14.8 Indice de felicidade / clima

Requisitos:

- Pesquisa de clima estilo NPS.
- Periodicidade mensal ou bimestral.
- Perguntas amplas, nao apenas vendas.
- Resultado como indice final.
- Usar para orientar PDI, engajamento e retencao.
- Deve ser altamente confidencial.
- Nao pode permitir identificacao por departamento pequeno.
- Mesma pesquisa para todos, inclusive dono, quando fizer sentido.
- Deve ter regra minima de anonimato antes de exibir recortes.

Risco:

- Se permitir identificar respondente, piora o clima.
- Relatos da Localiza mostram risco real.

---

## 15. Departamento Financeiro e Administrativo

### 15.1 Financeiro/DRE

Requisitos:

- DRE deve sair de uma posicao solta e entrar no Departamento Financeiro.
- PPA deve ter financeiro habilitado.
- Clientes com sistema sem consultoria podem ter analise mais limitada/manual.
- Analise completa pode depender de consultoria/plano.
- Deve existir logica de upsell.

### 15.2 Gating e upsell

Modelo discutido:

- Cliente tem acesso visual ao sistema inteiro.
- Modulos estrategicos aparecem bloqueados ou limitados.
- Chamada: "Para conhecer mais este servico, fale com o consultor".
- Inspiracao: modelo Disney/Premiere citado na reuniao.

### 15.3 Administrativo

Mariane esta estudando sistema administrativo.

Requisitos:

- Administrativo deve virar parte consultiva.
- Incluir financeiro/administrativo.
- Incluir treinamento para administrativo.
- Preparar modulo futuro de consultoria administrativa.

---

## 16. Departamento Operacoes

Escopo citado:

- Preparacao.
- Pos-venda.
- Fluxogramas.
- Checklists.
- Regras de boas praticas.
- Materiais.
- Dashboard com quatro indicadores-chave ou indice de eficiencia.

Requisitos:

- Cada processo operacional deve ter fluxo.
- Cada fluxo deve ter boas praticas.
- Cada area deve ter dashboard.
- Dono deve ver indice sem precisar entrar em detalhes tecnicos.

---

## 17. Aba Treinamentos

### 17.1 Proposito

Treinamentos deixam de ser apenas cursos e passam a compor desenvolvimento e suporte consultivo.

Requisitos:

- Agenda de treinamentos ao vivo.
- Biblioteca de conteudo.
- Trilhas por perfil.
- Trilhas por nivel.
- Conteudos conectados a PDI.
- Conteudos conectados a onboarding.
- Conteudos conectados a duvidas nos modulos.

### 17.2 Midias

Requisitos:

- Validar media player.
- Permitir trocar videos facilmente.
- Usar videos existentes para teste tecnico.
- Preparar para videos novos.
- Evitar depender apenas do Daniel gravando tudo.
- IA pode ajudar a melhorar voz/formato.

### 17.3 Controle de progresso

Foi discutido nao permitir pular video, mas Daniel reagiu com cautela.

Requisito prudente:

- Registrar progresso de aula.
- Avaliar obrigatoriedade por tipo de trilha.
- Nao aplicar bloqueios agressivos sem validacao.

---

## 18. Aba Falar com o Consultor

### 18.1 Proposito

Criar suporte consultivo premium.

Nao e so chat. E uma fonte de:

- Atendimento.
- Retencao.
- Upsell.
- Base de conhecimento.
- Identificacao de demandas recorrentes.
- Treinamento futuro da IA.

### 18.2 Requisitos

- Botao/chat no app.
- Cliente chama consultor.
- Consultor designado recebe notificacao.
- Consultores online devem ser priorizados.
- Se nao responder em 30 minutos, encaminhar para outro.
- Tratar chamado como lead de atendimento.
- Registrar conversa.
- Classificar assunto.
- Marcar se virou melhoria, duvida recorrente, bug, oportunidade comercial ou necessidade de conteudo.

### 18.3 WhatsApp x chat interno

Debate:

- WhatsApp e rapido, mas tem custo.
- Chat interno da mais controle.
- API WhatsApp permite gerenciador de conversa no futuro.

Recomendacao:

- MVP: chat interno simples ou chamado consultivo.
- Fase 2: WhatsApp/API.
- Fase 3: IA responde com base nas conversas registradas.

---

## 19. Reunioes, Atas e Transcricoes

Ponto operacional inicial:

- Transcricao e mais util que video.
- Video consome Drive.
- Conta compartilhada `gestao@...` causa friccao para consultores.
- Precisa resolver modelo de agenda/ata sem obrigar todos a logar na mesma conta.

Requisitos:

- Registrar ata/transcricao no historico do cliente.
- Associar ata a visita/reuniao.
- Permitir usar Google Meet/Zoom conforme disponibilidade.
- Definir conta operacional ou integracao por permissao.
- Evitar dependência de login compartilhado no longo prazo.

---

## 20. Integracoes

### 20.1 Google Calendar / agenda

Ja existe parte ativa segundo a reuniao.

Requisitos:

- Interligar agenda do dono.
- Disparar e-mail.
- Permitir opt-in/out.
- Futuro: resumo semanal.

### 20.2 WhatsApp

Status:

- API ainda nao finalizada.
- Precisa ajuda do Joao.

Usos:

- Atualizar plano de acao.
- Receber lancamento diario.
- Enviar parcial/comparativo ao vendedor.
- Chat/suporte no futuro.

### 20.3 AutoCerto / CRM

Objetivo:

- Puxar dados de estoque, ticket, volume, indicadores.
- Reduzir preenchimento manual.
- Permitir comparativo de mercado.

Risco:

- Depende de acesso/API/parceria.

### 20.4 Instagram/Meta

Objetivo:

- Capturar metricas de conteudo.
- Gerar nota e insights.

Risco:

- Definir rota tecnica segura.

### 20.5 IA

Usos:

- Gerar ata de visita.
- Biblioteca/noticias diarias.
- Insights de marketing.
- Teste comportamental.
- Compatibilidade de candidatos.
- Futuras respostas consultivas.

---

## 21. Requisitos Funcionais

### RF-001 - Navegacao principal do cliente

O sistema deve exibir quatro abas principais para o cliente: Consultoria, Departamentos, Treinamentos e Falar com o Consultor.

### RF-002 - Visao do dono

O dono deve ter uma visao executiva limpa com painel semaforico, alertas, agenda e atalhos para decisao.

### RF-003 - Painel semaforico

O sistema deve exibir status verde/amarelo/vermelho por area/processo, com motivo e gap.

### RF-004 - Indicadores detalhados fora da primeira tela

Os 45 indicadores podem existir em Resultado/drill-down, mas nao devem ser despejados na primeira tela do dono.

### RF-005 - Alertas explicados

Todo alerta deve explicar causa, impacto e proxima acao.

### RF-006 - Agenda do diretor

O dono deve ter agenda de acoes obrigatorias e opcao de receber comunicados.

### RF-007 - Resultados

O sistema deve mostrar meta, realizado, ano anterior e dados por equipe/vendedor.

### RF-008 - Plano de acao central

O sistema deve manter plano de acao geral da loja.

### RF-009 - Plano de acao por responsavel

Cada responsavel deve ter visao propria dos itens sob sua execucao.

### RF-010 - Evidencias

Itens concluidos podem exigir evidencia antes de serem encerrados de fato.

### RF-011 - Atualizacao pela loja

A loja deve conseguir atualizar status sem depender de consultor MX.

### RF-012 - Organograma

O sistema deve representar cargos, pessoas, hierarquia, aprovacao e responsabilidade.

### RF-013 - Descricao de cargo

Cada cargo deve poder ter descricao, rotina e responsabilidades.

### RF-014 - Produtos de consultoria

O sistema deve configurar PMR, PMR Plus e PPA como produtos.

### RF-015 - Templates de visita

Cada produto deve poder carregar visitas, prazos, checklists e arquivos padrao.

### RF-016 - PPA tematico

PPA deve suportar visitas tematicas recorrentes: modelo/planejamento, custo e receita.

### RF-017 - Dashboard comparativo

O sistema deve permitir comparacao de indicadores com mercado/rede respeitando regra de amostra minima.

### RF-018 - Biblioteca consultiva

O sistema deve oferecer biblioteca pesquisavel com estudos, videos, noticias e data de atualizacao.

### RF-019 - Departamentos

O sistema deve organizar funcoes por departamentos, nao apenas por pessoa.

### RF-020 - Comercial

O departamento Comercial deve reunir resultado, funil, acompanhamento, feedback, PDI, rotina e cultura de resultado.

### RF-021 - Disciplina do vendedor

O sistema deve medir disciplina/acuracidade do preenchimento do vendedor.

### RF-022 - Incentivos do vendedor

O sistema deve permitir beneficios condicionados ao preenchimento, como comparativos, progresso ou ferramentas.

### RF-023 - Marketing multicanal

O departamento Marketing deve suportar canais, agenda estrategica, posicionamento e desempenho.

### RF-024 - Nota de conteudo

O sistema deve permitir indicador de qualidade de conteudo com explicacao.

### RF-025 - RH remuneracao

O sistema deve permitir cadastrar/analisar plano de remuneracao por contexto de loja.

### RF-026 - RH carreira

O sistema deve relacionar plano de carreira, organograma e PDI.

### RF-027 - RH contratacao

O sistema deve prever fluxo de vaga, candidatos, testes, entrevistas e compatibilidade.

### RF-028 - Teste comportamental

O sistema deve prever testes comportamentais e analise por IA.

### RF-029 - Onboarding

Ao cadastrar colaborador, sistema deve indicar nivel e trilha de treinamento.

### RF-030 - Video institucional

O sistema deve permitir video institucional por loja em trilhas de onboarding.

### RF-031 - Indice de felicidade

O sistema deve aplicar pesquisa confidencial de clima e gerar indice.

### RF-032 - Financeiro/DRE

O sistema deve posicionar DRE dentro do Departamento Financeiro.

### RF-033 - Upsell de modulos

Modulos estrategicos devem poder ficar visiveis, porem bloqueados/limitados por plano.

### RF-034 - Operacoes

Operacoes deve conter preparacao, pos-venda, fluxos, checklists e boas praticas.

### RF-035 - Treinamentos

Treinamentos deve conter agenda ao vivo, biblioteca e trilhas.

### RF-036 - Falar com consultor

O sistema deve permitir abertura de chamado/chat com consultor designado.

### RF-037 - SLA do consultor

Se o consultor nao responder em tempo definido, o chamado deve poder escalar.

### RF-038 - Base de conhecimento

Conversas com consultor devem alimentar base de demandas, solucoes e futura IA.

### RF-039 - Atas/transcricoes

Reunioes e visitas devem poder gerar/associar transcricao e ata ao cliente.

### RF-040 - Desenvolvimento por stories

Cada entrega deve ser particionada em stories pequenas e validaveis.

---

## 22. Requisitos Nao Funcionais e UX

- Interface clean.
- Linguagem simples.
- Primeira tela do dono deve ser objetiva.
- Cores de status devem ser consistentes.
- Alertas devem ser explicativos.
- Dados densos devem ficar em drill-down.
- Mobile/app deve ser considerado para vendedor.
- Sistema deve evitar sobrecarga cognitiva.
- Fluxos devem ser permissivos por perfil.
- Integracoes externas nao podem bloquear MVP.
- Auditoria de alteracao de status e evidencias deve existir onde houver plano de acao.
- Privacidade forte para pesquisa de clima.
- Performance suficiente para dashboards rapidos.
- Layout deve suportar demonstracao comercial.

---

## 23. Modelo de Dados Conceitual

Entidades novas ou reforcadas:

- `company_department`
- `department_dashboard`
- `department_indicator`
- `executive_panel_status`
- `executive_alert`
- `director_agenda_item`
- `action_plan`
- `action_plan_item`
- `action_plan_evidence`
- `organization_chart`
- `organization_role`
- `role_description`
- `approval_flow`
- `consulting_product`
- `consulting_product_visit_template`
- `consulting_visit_theme`
- `market_benchmark_query`
- `content_library_item`
- `seller_discipline_score`
- `seller_benefit_unlock`
- `commercial_campaign`
- `marketing_channel`
- `marketing_strategy_calendar`
- `content_quality_score`
- `compensation_plan`
- `career_path`
- `job_opening`
- `candidate`
- `behavioral_test`
- `candidate_compatibility_report`
- `onboarding_track`
- `store_institutional_video`
- `happiness_survey`
- `happiness_survey_response`
- `support_chat`
- `support_chat_message`
- `support_knowledge_item`
- `meeting_transcript`

---

## 24. Roadmap Proposto

### Fase 0 - Alinhamento e Layout

Prazo: imediato.

Entregas:

- Daniel envia layout.
- Pedro transforma em PRD/stories.
- Validar quatro abas.
- Validar painel do dono.
- Validar estrutura de departamentos.
- Mariane entra no grupo e valida fluxo.

### Fase 1 - Refatoracao de IA e experiencia principal

Objetivo: ter algo demonstravel e vendavel.

Entregas:

- Nova navegacao.
- Painel do dono.
- Resultados.
- Plano de acao 2.0.
- Organograma minimo.
- Produtos PMR/PMR Plus/PPA.
- Visitas padronizadas.
- Biblioteca inicial.

### Fase 2 - Departamentos MVP

Objetivo: mostrar que o sistema estrutura a empresa inteira.

Entregas:

- Comercial reorganizado.
- Marketing inicial.
- Financeiro/DRE reposicionado.
- Operacoes com preparacao/pos-venda basico.
- Dashboards de eficiencia por departamento.

### Fase 3 - Engajamento e integracoes leves

Objetivo: aumentar dados e uso.

Entregas:

- Disciplina/acuracidade do vendedor.
- Incentivos.
- Comparativo parcial.
- Agenda do diretor.
- WhatsApp para notificacoes/status, se API estiver pronta.
- Biblioteca com IA/noticias.

### Fase 4 - RH avancado

Objetivo: grande diferencial comercial.

Entregas:

- Remuneracao inteligente.
- Plano de carreira.
- Contratacao.
- Teste comportamental.
- Onboarding.
- Video institucional.
- Indice de felicidade.

### Fase 5 - Suporte consultivo e IA

Objetivo: produto premium e base de conhecimento.

Entregas:

- Falar com consultor.
- Chat/chamados.
- SLA.
- Base de solucoes.
- IA treinada por recorrencia.

---

## 25. Epicos

### Epic 1 - Nova Arquitetura do Cliente

Objetivo:

- Reorganizar sistema em Consultoria, Departamentos, Treinamentos e Falar com Consultor.

Stories:

- Criar shell de navegacao do cliente.
- Criar regras de visibilidade por perfil.
- Mapear rotas atuais para nova IA.
- Criar breadcrumbs/abas internas.
- Validar responsividade.

Aceite:

- Dono enxerga quatro abas.
- Gerente/vendedor ve apenas o que faz sentido.
- Rotas antigas nao somem sem redirecionamento.

### Epic 2 - Painel Executivo de Consultoria

Stories:

- Criar painel semaforico manual.
- Criar alertas com causa/gap.
- Criar agenda do diretor.
- Criar entrada de resultados.
- Criar drill-down para indicadores.

Aceite:

- Dono entende situacao em menos de um minuto.
- Nenhuma tela inicial mostra 45 indicadores brutos.

### Epic 3 - Plano de Acao, Organograma e Responsabilidades

Stories:

- Refatorar plano de acao.
- Criar responsaveis.
- Criar status editavel.
- Criar evidencias.
- Criar visao por responsavel.
- Criar organograma minimo.
- Criar descricao de cargo.

Aceite:

- Um item atribuido a vendedor aparece para ele e tambem no plano central.
- Atualizacao do executor atualiza a visao do dono/gerente.

### Epic 4 - Produtos e Visitas

Stories:

- Criar configuracao PMR/PMR Plus/PPA.
- Criar templates de visita.
- Criar PPA tematico.
- Integrar IA de ata.
- Criar checklist/evidencias/arquivos.

Aceite:

- Ao cadastrar cliente com produto, o sistema cria agenda/visitas padrao.

### Epic 5 - Biblioteca Consultiva

Stories:

- Criar biblioteca pesquisavel.
- Criar categorias.
- Criar data de atualizacao.
- Criar ingestao manual.
- Preparar ingestao IA/noticias.

Aceite:

- Usuario consegue buscar tema e encontrar conteudo sem acionar consultor.

### Epic 6 - Departamento Comercial e Engajamento

Stories:

- Reorganizar vendedor/gerente dentro do Comercial.
- Criar disciplina/acuracidade.
- Criar cultura de resultado.
- Criar beneficios condicionais.
- Avaliar Placa FIPE.
- Conectar PDI/plano de acao.

Aceite:

- Vendedor entende o que ganha ao preencher.
- Gerente consegue acompanhar rotina, funil, PDI e feedback.

### Epic 7 - Marketing Multicanal

Stories:

- Criar departamento Marketing.
- Criar canais.
- Criar agenda estrategica.
- Criar posicionamento.
- Criar nota de conteudo.
- Criar dashboard inicial.
- Mapear futura integracao Instagram/Meta.

Aceite:

- Dono consegue abrir Marketing e entender o que esta parado/ruim.

### Epic 8 - RH e Desenvolvimento

Stories:

- Criar plano de remuneracao.
- Criar plano de carreira.
- Conectar carreira ao organograma.
- Criar base de contratacao.
- Criar teste comportamental.
- Criar onboarding por nivel.
- Criar video institucional.
- Criar pesquisa de clima.

Aceite:

- Sistema consegue mostrar ao dono uma recomendacao/diagnostico de remuneracao ou desenvolvimento com base no contexto.

### Epic 9 - Financeiro, Administrativo e Operacoes

Stories:

- Reposicionar DRE.
- Criar gating por plano.
- Criar administrativo.
- Criar preparacao.
- Criar pos-venda.
- Criar dashboards de eficiencia.

Aceite:

- Dono ve eficiencia por departamento.
- Modulos premium aparecem com chamada de upgrade.

### Epic 10 - Falar com Consultor

Stories:

- Criar botao/chat.
- Criar chamados.
- Criar consultor designado.
- Criar SLA/escala.
- Registrar historico.
- Classificar demanda.

Aceite:

- Cliente envia pergunta e consultor certo recebe notificacao.

### Epic 11 - Rollout, QA e Validacao

Stories:

- Criar checklist de validacao por story.
- Criar ambiente de teste por perfil.
- Mariane valida como usuario final.
- Daniel/Jose validam negocio.
- Pedro valida tecnica.

Aceite:

- Nada grande e liberado sem teste incremental.

---

## 26. Priorizacao MVP

### Must Have

- Quatro abas principais.
- Painel do dono.
- Alertas explicados.
- Resultados.
- Plano de acao 2.0.
- Responsavel/status/evidencia.
- Organograma minimo.
- Produtos PMR/PMR Plus/PPA.
- Visitas padronizadas.
- Comercial reorganizado.
- Treinamentos/biblioteca inicial.
- Processo de stories e QA.

### Should Have

- Agenda do diretor.
- Dashboard comparativo inicial.
- Biblioteca com noticias/IA.
- Marketing multicanal inicial.
- Financeiro/DRE reposicionado.
- Dashboards por departamento.
- Disciplina/acuracidade do vendedor.

### Could Have

- WhatsApp para status/plano de acao.
- Placa FIPE.
- Clube dos Campeoes.
- Nota de conteudo via IA.
- Chat interno simples.
- Video institucional por loja.

### Later

- RH completo de contratacao.
- Teste comportamental com IA robusta.
- Captacao de candidatos.
- Integracao AutoCerto profunda.
- Integracao Meta/Instagram automatizada.
- IA respondendo consultoria.

---

## 27. Questoes em Aberto

1. Qual sera o nome comercial final para evitar "mais um sistema"?
2. Quais modulos ficam no plano base?
3. Quais modulos ficam no Plano Plus?
4. PPA tera exatamente quais templates por visita?
5. Daniel enviara apresentacao PPA quando?
6. Quais indicadores compoem o semaforo inicial manual?
7. Qual regra de cor para cada area?
8. Agenda do diretor tera quais acoes iniciais?
9. Organograma minimo tera quais cargos padrao?
10. Plano de acao segmentado tera quais status oficiais?
11. WhatsApp entra no MVP ou fica fase 2?
12. Placa FIPE entra agora?
13. Marketing usa API oficial Meta, conector ou processo manual primeiro?
14. Qual sistema sera usado para carteira de clientes?
15. DRE entra para PMR com limitacao ou apenas PPA/Plus?
16. Falar com consultor comeca por chat interno ou WhatsApp?
17. Qual cliente piloto para cada modulo?
18. Qual data exata do evento online/presencial?

---

## 28. Plano Imediato de Trabalho

1. Validar este PRD com Daniel/Jose.
2. Receber layout do Daniel.
3. Separar a refatoracao em stories pequenas.
4. Comecar pela nova IA e painel do dono.
5. Refatorar plano de acao antes de criar modulos complexos.
6. Implementar organograma minimo cedo.
7. Amarrar produtos/visitas para PMR/Plus/PPA.
8. Reorganizar Comercial com o que ja existe.
9. Criar biblioteca inicial.
10. Deixar Marketing e RH avancados como modulos em fases, com espaco visual e gating.

---

## 29. Criterio de Sucesso da Refatoracao

A refatoracao sera bem sucedida quando:

- O dono abrir o sistema e entender valor sem explicacao longa.
- O produto puder ser demonstrado em evento como consultoria de decisao.
- Gerente e vendedor enxergarem utilidade, nao so obrigacao.
- O plano de acao mostrar claramente o que esta feito, pendente e bloqueado.
- A loja conseguir atualizar status sem depender da MX.
- O sistema estiver pronto para upsell por modulos.
- A equipe conseguir entregar por stories testaveis.
- Mariane conseguir validar como usuaria final antes de cliente.
