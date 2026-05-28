# Revisao Completa da Reuniao - Evolucao MX Performance

**Data da reuniao:** 2026-05-22  
**Status:** Revisao integral para produto, PRD, layout e stories  
**Fonte:** transcricao completa da reuniao + documento `SISTEMA MX PERFORMANCE.docx`  
**Objetivo deste documento:** registrar o que realmente foi decidido, proposto, questionado e priorizado na reuniao, sem transformar ideias futuras em requisitos imediatos.

---

## 1. Tese Real da Reuniao

A reuniao nao foi apenas sobre reorganizar abas.

A reuniao definiu uma mudanca de posicionamento do MX Performance: o sistema precisa deixar de ser percebido como "mais um sistema" e passar a ser uma plataforma de decisao, gestao e desenvolvimento para loja de carros.

O ponto central de Daniel foi:

- O cliente nao quer complexidade.
- O cliente nao quer produto velho com embalagem nova.
- O cliente quer facilidade.
- O lojista medio nao e analitico.
- Muitos lojistas nao dominam nem o CRM que ja usam.
- O sistema so escala se for facil de vender e facil de enxergar valor.
- A MX nao deve competir com CRM.
- A MX deve entregar o que o CRM nao entrega: analise, estrategia, conselho, decisao e plano de acao.

Portanto, a evolucao correta nao e "criar um monte de modulos". E construir uma camada de inteligencia e gestao em cima da operacao da loja, organizada de forma simples para o dono e util para gerente, vendedor, marketing, administrativo e consultores.

---

## 2. Contexto Inicial - Transcricao, Conta e Reuniao

Antes do escopo de produto, houve uma discussao operacional sobre Zoom/Google/conta:

- A transcricao da reuniao ja estava sendo gerada.
- Gravar video nao parece essencial, porque a transcricao/ata resolve melhor o uso posterior.
- Video consome espaco em Drive.
- Existe uma dificuldade operacional se todos os consultores precisarem entrar por uma conta compartilhada `gestao@...`.
- O correto e pensar em outro modelo para agendar/registrar reunioes sem obrigar cada consultor a usar a mesma conta.
- O sistema precisa gerar ata/transcricao/escopo da reuniao.

Interpretacao correta:

- O foco nao e "gravar reunioes".
- O foco e registrar conhecimento da reuniao com baixa friccao.
- A ata/transcricao deve alimentar o historico do cliente e reduzir retrabalho.
- O modelo de conta central/consultores precisa ser resolvido operacionalmente.

---

## 3. Fundamento Estrategico Apresentado por Daniel

Daniel abre a reuniao com uma leitura de mercado.

### 3.1 Mudanca de mercado

Ele usa exemplos de educacao digital, escolas e produtos que venderam muito e depois perderam forca. A mensagem principal foi:

- Nao adianta "embalar produto velho".
- Cliente percebe quando o conteudo ou produto e antigo.
- O modelo de curso fechado, com inicio e fim, perdeu forca.
- As pessoas querem estudar o que precisam, quando precisam.
- A logica de biblioteca e conteudo sob demanda faz mais sentido.

Impacto no MX:

- Nao basta trocar layout da plataforma de cursos.
- A biblioteca precisa resolver duvidas reais e imediatas.
- O sistema precisa se adaptar rapido ao mercado.
- A estrutura precisa ser definitiva, mas flexivel.

### 3.2 Produto precisa ser facil de vender

Daniel foi direto: se o produto nao for facil de vender, precisa refazer.

Ele reforca a ideia de:

- Primeiro vender/testar mercado.
- Depois entregar com velocidade.
- Nao se apaixonar pela obra.
- Nao construir algo bonito que ninguem compra.
- Nao tentar competir com gigantes onde nao ha vantagem.

Impacto no plano:

- A primeira entrega precisa ser apresentavel e vendavel.
- O layout e a narrativa comercial sao parte do produto.
- Pre-venda e teste de mercado fazem parte da estrategia.
- O sistema precisa gerar "eu quero isso" no lojista.

---

## 4. Definicao Correta do Produto

Daniel define a diferenca entre CRM e MX.

### 4.1 O que o CRM entrega

Sistemas como AutoCerto entregam:

- Administracao.
- Negociacao.
- Financiamento.
- Fluxo de relacionamento.
- Processo operacional.
- Organizacao de leads, agenda e equipe.

### 4.2 O que o CRM nao entrega

Segundo a reuniao, o CRM nao entrega:

- Analise.
- Estrategia.
- Compilado executivo.
- "O que fazer com isso".
- Melhor decisao.
- Onde a loja esta falhando.
- O que o vendedor precisa melhorar.
- O risco antes de virar problema.

### 4.3 O que o MX deve entregar

O MX deve ser:

- Sistema de performance.
- Sistema de consultoria.
- Sistema de conselho.
- Camada de tomada de decisao.
- Plataforma que diz: "diante de tudo isso, o caminho e esse".

Frase-sintese:

> AutoCerto e sistema de processo. MX Performance e sistema de decisao, consultoria e performance.

---

## 5. Principio de UX da Reuniao

O cliente principal nesta primeira visao e o dono.

Daniel insistiu que a visao do dono precisa ser:

- Clean.
- Simples.
- Rapida.
- Intuitiva.
- Pouco numerica na primeira camada.
- Com leitura visual clara.
- Com explicacao do alerta.
- Com caminho de acao.

Ponto importante:

- Os 45 indicadores existem, mas o dono nao deve ver os 45 como primeira experiencia.
- A primeira tela deve ser painel/semaforo.
- Os numeros ficam no detalhe, em resultado ou drill-down.
- Se o dono precisar interpretar uma planilha, a proposta falhou.

---

## 6. Estrutura Principal de Abas

A visao do cliente/dono deve abrir com quatro abas principais:

1. **Consultoria**
2. **Departamentos**
3. **Treinamentos**
4. **Falar com o Consultor**

Essa e a arquitetura apresentada por Daniel.

Ela nao e apenas menu. Ela reflete o modelo de negocio:

- Consultoria mostra decisao e valor.
- Departamentos mostra que a MX atua na empresa inteira.
- Treinamentos desenvolve pessoas e reduz dependencia da MX.
- Falar com consultor vira produto/servico premium e base de conhecimento.

---

## 7. Aba Consultoria

### 7.1 Painel

Primeira coisa que o dono deve enxergar ao entrar em Consultoria: painel.

O painel deve mostrar eficiencia em cores:

- Verde: eficiente.
- Amarelo: alerta.
- Vermelho: ineficiente.

Daniel deixa claro que no inicio isso pode ser construido manualmente, porque o volume de clientes ainda permite. Depois, o sistema pode automatizar a relacao entre indicadores e status.

Leitura correta:

- O MVP pode aceitar configuracao manual de status.
- A automacao por indicador vem depois.
- O importante agora e a leitura de valor para o dono.

### 7.2 Alertas explicados

Daniel quer que o dono saiba por que algo esta em alerta.

Exemplo:

- Financeiro esta amarelo.
- Motivo: meta atingida, mas custo acima da meta.
- O painel deve explicar isso.

Ideias discutidas:

- Legenda abaixo do painel.
- Tooltip ao passar o mouse.
- Explicacao com quantidade/gap.
- Mostrar o que falta para sair do vermelho/amarelo.

Requisito real:

- Nao basta colorir indicador.
- Cada alerta precisa ter motivo, gap e proximo passo.

### 7.3 Painel nao deve mostrar os 45 indicadores

Foi perguntado se todos os 45 indicadores do planejamento entrariam ali.

Resposta de Daniel:

- Nao na visao do dono.
- A visao do dono tem que ser clean.
- O painel mostra a leitura geral.
- Os indicadores detalhados ficam em Resultado/Planejamento.

### 7.4 Comparativo Loja x Mercado x Boas Praticas

Daniel quer que o painel tenha, se possivel:

- Comparativo da loja com mercado.
- Comparativo com boas praticas.
- Processos de venda.
- Processos de marketing.
- Processos de gestao.
- Processos criticos.

Mas ele tambem diz que isso nao e urgente se atrapalhar o layout.

Classificacao:

- Desejavel no painel.
- Pode entrar como segunda camada se o painel ficar pesado.

### 7.5 Agenda do Diretor

A agenda do diretor e uma das ideias mais importantes da reuniao.

Daniel ja faz isso manualmente: da ao dono algumas acoes obrigatorias ao longo do mes para garantir eficiencia dos processos.

O sistema deve permitir:

- Agenda do dono/diretor.
- Acoes obrigatorias do mes/semana.
- Organizacao do dia do lojista.
- Possivel resumo semanal.
- Envio por email a partir do `gestao@mx`.
- Possivel integracao com agenda.
- Opt-in: cliente pode receber comunicados se vincular a agenda.

Ponto de negocio:

- O lojista frequentemente pergunta: "como organizo meu dia, o que devo fazer?"
- A agenda do diretor vende muito valor porque resolve essa dor.

### 7.6 Subaba Resultados

Dentro de Consultoria deve existir Resultado.

Ela deve mostrar:

- Metas.
- Realizado.
- Ano anterior.
- Dados do vendedor.
- Informacoes da equipe.

Essa e a area onde os numeros aparecem com mais profundidade.

### 7.7 Subaba Plano de Acao

Daniel testou o plano de acao atual e achou insuficiente.

Problemas citados:

- Falta coisa.
- Nao viu opcao clara de alterar.
- Layout precisa melhorar.
- Precisa bater o olho e enxergar:
  - o que esta sendo feito;
  - o que falta ser feito;
  - quem faz;
  - status;
  - eficacia.

Campos citados no documento e reuniao:

- Departamento.
- Indicador.
- Acao.
- Como.
- Responsavel.
- Data.
- Limite.
- Realizado em.
- Status.
- Eficacia.

### 7.8 Plano de Acao Central e Segmentado

Jose/Pedro levantam que o plano de acao precisa ser segmentado:

- Plano da loja.
- Plano do gerente.
- Plano do vendedor.

Daniel concorda:

- Existe plano central.
- Cada responsavel deve ver/atualizar sua parte.
- O responsavel vem do cadastro.
- O executor atualiza seu plano e isso atualiza o plano central.

Requisito real:

- Plano de acao nao e lista estatica.
- E sistema de execucao distribuida.

### 7.9 Atualizacao pela Loja e Evidencia

Daniel quer tornar o sistema mais independente da MX.

Ideia:

- A loja responde se concluiu.
- Talvez por WhatsApp.
- Um clique "sim/nao" tira item da pendencia.
- Mas ainda pode exigir evidencia para completar de verdade.
- Sistema cobra quando acao vence.

Classificacao:

- Requisito de direcao.
- WhatsApp pode ser etapa futura.
- Mas o modelo de status/evidencia precisa ser previsto.

### 7.10 Organograma

Organograma surge como peca central, nao detalhe.

Motivos:

- O dono nao sabe seu papel.
- O gerente nao sabe seu papel.
- O vendedor nao sabe ate onde vai sua responsabilidade.
- A loja mistura papel de dono, vendedor, gerente e administrativo.
- O plano de acao precisa atribuir a pessoa/cargo.
- Algumas aprovacoes dependem de hierarquia.

O organograma deve ajudar a:

- Definir papel de cada cargo.
- Amarrar responsaveis.
- Controlar aprovacoes.
- Guiar PDI.
- Guiar plano de carreira.
- Deixar claro quem deve fazer o que.

### 7.11 Descricao de Cargo e Rotina

Daniel cita que montou:

- Plano de desenvolvimento do gerente.
- Descricao de cargo do gerente.
- Metodologia parecida com a de vendedor.

Ele quer expandir para:

- Descricao de cargo de todos.
- Rotina do gerente.
- Responsabilidades por papel.
- Guia operacional da hierarquia.

Isso e visto como "plano de libertacao do dono", porque estrutura a gestao que ele nao consegue fazer.

### 7.12 Estrategias Emergenciais

Daniel cita uma ideia importante:

- Quando resultado esta ruim, o sistema pode disparar uma estrategia emergencial.
- Exemplo: campanha de retomada, cultura de resultado, acao comercial.

Isso nasceu do exemplo da LM, onde uma acao emergencial elevou vendas rapidamente.

Classificacao:

- Ideia de produto para Comercial/Consultoria.
- Pode virar subarea de Cultura de Resultado ou Plano de Acao Emergencial.

### 7.13 Subaba Visitas

Objetivo da visita, segundo Daniel:

- Checklist.
- Arquivos.
- Evidencias.
- Relatorio.

O sistema nao precisa inventar muito alem disso no primeiro momento.

Pedro informa que a IA ja foi integrada:

- Faz escopo da visita.
- Gera arquivo/ata.

Daniel quer padronizar:

- Habilitar de acordo com produto do cliente.
- PMR.
- PMR Plus.
- PPA.

### 7.14 Produtos PMR, PMR Plus e PPA

Essa parte foi mais especifica do que o plano anterior refletiu.

Decisoes/entendimentos:

- PMR online e presencial serao igualados.
- A diferenca sera mais no perfil da visita presencial, nao no sistema.
- Produtos precisam estar cadastrados na guia de produtos.
- Ao vender para uma loja, o sistema deve subir o padrao do produto.
- PMR Plus e PPA sao para quem ja passou pelo PMR basico.
- PMR Plus e PPA sao mais acompanhamento.
- PPA tem visitas com tema.
- PMR Plus parece seguir acompanhamento parecido, mas precisa de definicao final.

PPA:

- Visita 1: modelo de negocio + planejamento estrategico.
- Visita 2: eficiencia em custo.
- Visita 3: receita.
- Esses tres temas rodam durante o ano.
- Sao 9 visitas porque existem 3 eventos no ano para donos, e nos meses de evento nao ha visita.
- Toda visita tem acompanhamento geral, mas tambem tem tema central.

Pendencia clara:

- Daniel tem apresentacao do PPA com isso estruturado.
- Ele deve enviar no grupo.
- Esse material deve alimentar template de produto/visita.

### 7.15 Dashboard Comparativo

Depois das visitas, Daniel fala do dashboard dentro de Consultoria.

Objetivo:

- Comparar com mercado e rede.
- Fazer o lojista entrar para se comparar.
- Dar algo que ele realmente queira consultar.

Funcionalidade sugerida:

- Escolher indicador.
- Exemplo: margem liquida.
- Filtrar por:
  - volume de estoque;
  - ticket medio de estoque;
  - regiao.
- Se nao tiver mais de 5 lojas, nao retorna resultado granular.
- Pode retornar resultado geral.
- Resultado deve vir grafico e clean.

Condicao:

- Cliente so acessa comparativo se abastecer informacao.

Problema:

- Como abastecer?

Solucoes discutidas:

- Suporte MX captar informacao mensal.
- Cliente enviar relatorio do CRM.
- AutoCerto API, se existir/for viavel.
- Relatorio do CRM pode resolver no curto prazo.

### 7.16 Biblioteca da Consultoria

Biblioteca aqui nao e so treinamento.

Ela deve conter:

- Material de estudo.
- Videos.
- Noticias.
- Temas que lojistas perguntam para Daniel.
- Exemplos: consignacao, preco de eletricos, hibridos, seminovos, eventos, mercado.
- Data da ultima atualizacao.

Objetivo:

- Tirar o cliente da dependencia da MX.
- Fazer ele encontrar resposta dentro do sistema.

Pedro cita caso P1:

- Busca diaria meia-noite.
- IA coleta noticias em fontes definidas.
- Formata como blog.

Daniel valida:

- Desde que sejam pautas e portais definidos.
- Pode incluir feiras/eventos do setor.

---

## 8. Aba Departamentos

Daniel diz que "aqui esta a sacada".

Ele nao quer organizar apenas por gerente/vendedor. Quer perspectiva de departamento.

Motivo:

- MX deve ser consultoria de gestao para loja de carros.
- Precisa atuar em todos os departamentos.
- Isso evita o sistema depender de um unico processo critico, como vendedor preencher rotina.
- Tambem mostra para o dono que a MX estrutura a empresa inteira.

### 8.1 Regra de acesso por papel

Entendimento da reuniao:

- Dono tem acesso a tudo.
- Gerente tem visao do seu modulo/departamento.
- Vendedor tem sua visao.
- Marketing/administrativo podem ter acesso quando a loja tiver esses papeis.
- Loja pequena pode ter pessoas acumulando papeis.

### 8.2 Departamento Comercial

Dentro do Comercial:

Gerente:

- Resultado/funil.
- Comparativo com rede e mercado.
- Acompanhamento diario de vendas.
- Feedback.
- PDI.
- Rotina.

Vendedor:

- Resultado/funil.
- Comparativo com rede e mercado, condicionado.
- Acompanhamento diario.
- Feedback.
- PDI.

Regra proposta:

- Vendedor com mais de 80% de disciplina tem acesso ao comparativo de mercado.

### 8.3 Por que o vendedor e critico

Daniel deixa claro:

- Vendedor nao e o cliente pagante.
- Mas e fonte fundamental de dados.
- A informacao diaria dele cria funil.
- Esse funil gera insight para a consultoria.

Ao mesmo tempo:

- Essa informacao e muito importante, mas nao pode ser a unica base do produto.
- O produto nao pode morrer se o vendedor nao preencher.
- Por isso departamentos sao importantes.

### 8.4 Problema "mais um sistema"

Na Piscar, gerente reclamou de mais um sistema para entrar.

Daniel percebeu o risco:

- Vendedor ja usa CRM.
- Gerente ja usa CRM.
- Se MX parecer mais um sistema, gera resistencia.

Ideias discutidas:

- Talvez mudar ate a palavra "sistema".
- Aplicativo ajuda a mudar percepcao.
- Integrar com CRM seria ideal.
- Pop-up/trava no CRM antes de acessar leads seria excelente, mas depende de parceiro.

### 8.5 Ideia do CRM do Rodrigo

Daniel conta sobre Rodrigo em Sao Paulo:

- Ele tem um CRM bom.
- Daniel sugeriu que ao abrir o CRM apareca pop-up travando a tela.
- Antes de acessar leads, vendedor precisa registrar acompanhamento diario/agendamento.
- Se MX conseguir API desse sistema, resolve parte do problema.

Leitura correta:

- Nao e para MX virar CRM.
- E para MX capturar informacao dentro do fluxo que o vendedor ja usa.

### 8.6 WhatsApp como caminho de abastecimento

Foi sugerido:

- Vendedor preencher pelo WhatsApp.
- Bot conversa com ele.
- Sistema fica abastecido sem o vendedor entrar no app.

Daniel concorda com a logica:

- O que importa e abastecer o sistema.
- Depois o sistema leva o vendedor para dentro de outras formas.

### 8.7 Ponto/jornada de trabalho

Foi debatido usar o lancamento como ponto/jornada.

Daniel alerta:

- Formalizar ponto pode criar antipatia.
- Pode gerar problema trabalhista.
- Poucos clientes tem ponto formal.

Entendimento:

- Nao vender como ponto.
- Se houver ideia, tratar como "inicio de rotina/lancamento", nao controle trabalhista.

### 8.8 Incentivos para vendedor

Ideias discutidas:

- Comparativo com a propria loja.
- Comparativo com mercado.
- Barra de desenvolvimento.
- Certificado.
- Progresso.
- Placa FIPE dentro do app.
- Desbloqueio de beneficios por preenchimento.
- Competicao.
- Clube dos Campeoes MX.
- Evento com melhores vendedores.
- Cultura de Resultado.

Pedro/Jose citam que no sistema anterior vendedores preenchiam bem quando recebiam parcial pelo WhatsApp e comparativo com a propria loja.

Conclusao:

- O vendedor preenche melhor quando recebe algo de volta.
- A recompensa pode ser informacao, status, ferramenta, reconhecimento ou carreira.

### 8.9 Cultura de Resultado

Daniel identifica uma lacuna do mercado:

- Falta cultura de resultado.
- Lojas nao sabem agir proativamente em cenario ruim.
- Lider nao pode demonstrar fraqueza, mas precisa de acao.

Exemplo LM:

- Loja com 4 vendas.
- Acao emergencial/campanha.
- Em uma semana venderam 11 carros.

Produto:

- Cultura de Resultado pode ser registrada dentro do Comercial.
- Pode conter campanha, acao emergencial, live, repescagem, feed cultural.
- Pode ser usada com vendedores/gerentes que nao preenchem ou nao engajam.

### 8.10 Disciplina e Acuracidade

Barra de evolucao do vendedor pode considerar:

- Disciplina: frequencia de preenchimento.
- Acuracidade: se o que declarou bate com realidade.
- Precisao dos dados.
- Consistencia.

---

## 9. Departamento Marketing

Daniel reposiciona marketing:

- Nao falar mais so de internet.
- Falar de marketing.
- Trabalhar multicanal.

### 9.1 O que entra em Marketing

Subareas citadas:

- Desempenho por canal.
- Agenda estrategica de acao.
- Posicionamento.
- Produto.
- Analise de estoque.
- Oportunidades e ameacas.

### 9.2 Marketing como visao da empresa

Nao e apenas visao interna MX.

E visao da empresa/loja:

- Dono pode ver.
- Gerente pode ver.
- Profissional de marketing da loja pode ter acesso.
- Em loja pequena, vendedor pode ter acesso.

### 9.3 Agenda estrategica mensal

Daniel diz que sua equipe de marketing vai passar a:

- Fazer estrategia mensal.
- Reunir na ultima dezena do mes ou inicio da dezena.
- Definir estrategias do mes seguinte.
- Trabalhar multicanal.

O sistema deve registrar:

- Agenda estrategica por mes.
- Exemplo: junho, Dia dos Namorados, Copa do Mundo etc.
- O que fazer em cada canal.

### 9.4 Canais de marketing citados

Daniel quer incluir:

- Branding.
- Indicacao.
- Carteira da empresa.
- Carteira do vendedor.
- Internet.
- Trafego pago.
- Sistema de relacionamento com carteira.
- Campanhas para carteira de clientes.
- Acoes para gerar lead por score/interacao.

### 9.5 Desempenho por canal e indicadores

Pedro/Jose trazem metricas:

- Visualizacao.
- Engajamento.
- Compartilhamento.
- Comentarios.
- ROI.
- CPA.
- CTA.
- Custo por lead.
- Performance por postagem.

Daniel concorda, mas reforca que quer insights:

- Por que a nota esta baixa?
- O que a loja deixou de fazer?
- O que precisa seguir de rotina?
- O que outras lojas estao fazendo melhor?

### 9.6 Instagram/Meta

Pedro sugere Instagram como MVP:

- E um dos principais canais.
- Pode gerar case rapido.
- Agente poderia analisar post a post.

Atencao:

- Foi citado uso de usuario/senha e agentes entrando em plataforma.
- Isso precisa de validacao tecnica/seguranca.
- Caminho ideal deve ser API/OAuth oficial quando possivel.

### 9.7 Modulo premium de marketing

Daniel sugere:

- Algumas partes so habilitam se cliente comprar produto superior.
- Agenda estrategica multicanal pode ser modulo superior.
- Cliente ve o modulo e CTA para contratar.

---

## 10. Departamento RH

RH foi tratado como um dos maiores diferenciais futuros.

Daniel diz que "so esse modulo ja e o valor do sistema" se bem feito.

### 10.1 Plano de Remuneracao

Objetivo:

- Lojista cadastra plano de remuneracao.
- Sistema analisa se esta abaixo, na media ou acima do mercado.
- Sistema sugere caminhos com base no contexto.

Contexto necessario:

- Regiao.
- Cidade/estado.
- Tamanho da loja.
- Estoque.
- Meta de venda.
- Ticket.
- Dados da propria loja.
- Dados de outras lojas.
- Cargo: vendedor, gerente, outros.

Importante:

- Nao existe plano unico para todo mundo.
- Nao e copiar plano de A para B.
- O sistema precisa perguntar e considerar contexto.

Biblioteca conectada:

- CLT.
- PJ.
- Comissao.
- Plano de remuneracao.
- Conteudos explicativos.

### 10.2 Cadastro do Plano de Remuneracao

Daniel quer criar a necessidade do cliente manter cadastro atualizado:

- "Cadastre no sistema seu plano."
- "Com o cadastro certo, voce sabe se paga dentro da media."
- Isso gera dependencia positiva do modulo de RH.

### 10.3 Plano de Carreira

Jose puxa a relacao com organograma.

Plano de carreira deve mostrar:

- Cargo atual.
- Proximos cargos.
- Passos para evoluir.
- Competencias necessarias.
- Aptidoes.
- Requisitos.
- Remuneracao por nivel/cargo.
- Ligacao com PDI.

Exemplo:

- Vendedor quer virar gerente.
- Sistema mostra caminho e constrói PDI para isso.

### 10.4 Contratacao

Daniel quer que sistema aponte para contratacao.

Funil desejado:

- Banco de curriculos.
- Formulario externo.
- Loja registra vaga.
- Candidatos se interessam.
- Enviar teste comportamental.
- Enviar formulario de competencias.
- Registrar entrevista.
- Anexar curriculo.
- IA analisa compatibilidade.
- Sistema apoia decisao de contratar ou nao.

### 10.5 Teste Comportamental

Essa parte foi central.

Ideias:

- Teste comportamental dentro do sistema.
- Usar IA.
- Aproveitar bases existentes de testes.
- Criar banco de dados.
- Relacionar resultados de testes com top performers.
- Descobrir padrao dos que vendem mais e dos que vendem menos.
- Definir perfil ideal para completar elenco.

Exemplo:

- Loja pequena com 3 vendedores + dono.
- Testes mostram que precisa de um vendedor com certo perfil.
- Sistema orienta qual perfil contratar.

Isso aumenta ticket do sistema.

### 10.6 Cadastro do Novo Profissional

Daniel quer tirar carga do lojista:

- Lojista nao precisa saber entrevistar.
- Nao precisa saber treinar.
- Nao precisa imprimir papel.
- Ele cadastra o profissional.
- Sistema faz o resto.

Depois de cadastrar:

- Sistema identifica nivel por informacoes/experiencia.
- Habilita treinamento correspondente.
- Exemplo: nivel 2, treinamento basico com 8 aulas.
- Depois segue trilha.

### 10.7 Video Institucional da Loja

Ideia comercial:

- Vender video institucional personalizado.
- Colocar na trilha de entrada.
- Vendedor novo conhece historia, cultura, dono e valores da loja.

Exemplos:

- Gandini.
- Lial.
- Modelo Localiza/historia do Fusca.

Acao:

- Marketing deve produzir/fornecer material.
- Sistema precisa estar pronto para receber esse video.

### 10.8 Indice de Felicidade

Daniel inclui indice de felicidade/clima.

Motivo:

- Lojas perdem bons vendedores sem perceber.
- Donos acham equipe satisfeita e nao sabem do problema.
- Clima ruim impacta resultado.

Formato:

- Pesquisa mensal ou bimestral.
- Mede engajamento/felicidade.
- Pode orientar PDI e acoes de engajamento.

Regra absoluta:

- Tem que ser confidencial.
- Ninguem pode saber quem respondeu.
- Nao pode quebrar anonimato por departamento pequeno.
- Pesquisa nao pode ser segmentada de forma que identifique uma pessoa.
- Todos respondem, inclusive dono.

---

## 11. Departamento Financeiro/Administrativo

Daniel move DRE para departamento financeiro.

### 11.1 DRE e Analise de DRE

Discussao:

- PMR teria ou nao teria visao financeira?
- PPA teria financeiro habilitado.
- Ideia evolui para: cliente pode ter acesso a tudo, mas modulos estrategicos podem ser bloqueados/upsell.

Modelo sugerido:

- Cliente ve areas.
- Se nao tem modulo, aparece aviso/CTA.
- Exemplo Disney/Premiere: o usuario ve que existe e quer contratar.

Interpretacao:

- DRE pode estar visivel como departamento.
- Analise profunda ou modulo completo pode ser plano superior.
- Precisa definir por produto.

### 11.2 Administrativo

Mariane esta estudando sistema administrativo.

Daniel diz que o administrativo fica aqui:

- Financeiro.
- Administrativo.
- Treinamento para administrativo.
- Modulo de consultoria tambem.

---

## 12. Departamento Operacoes

Operacoes inclui:

- Preparacao.
- Pos-venda.

Para cada um:

- Fluxograma.
- Materiais.
- Regras.
- Boas praticas.
- Checklist.

Regra transversal:

- Todos os departamentos precisam ter dashboard com indice de eficiencia.
- Ao entrar em preparacao, por exemplo, deve haver 4 indicadores-chave para bater o olho.
- Depois vem desdobramento.

---

## 13. Aba Treinamentos

Daniel fecha depois dos departamentos:

- Agenda para treinamento ao vivo.
- Biblioteca para consulta de conteudo.

Mas a conversa final detalha mais:

- Videos serao gravados novos.
- Conteudos existentes podem ser usados para validar player/configuracao.
- Pedro precisa validar media player, bloqueios, progresso, configuracao de midia.
- Foi discutido se vendedor pode pular video; Daniel reagiu contra bloquear de forma ruim.
- Biblioteca ja tem muito conteudo.
- Daniel quer olhar essa parte com carinho.
- Talvez IA ajude a melhorar conteudos.
- Nao precisa ser sempre rosto/voz do Daniel.

Interpretacao:

- Treinamento e importante, mas nao pode virar produto velho repaginado.
- Deve ser biblioteca/trilha conectada ao RH, PDI, plano de carreira e onboarding.

---

## 14. Aba Falar com o Consultor

Daniel colocou como item final e futuro, mas com potencial de ticket.

### 14.1 Ideia original

- Link para um CRM.
- Distribui para consultor designado.
- Registra conversas.
- Gera banco de dados de solucoes.

### 14.2 Discussao

Perguntaram:

- Consultor de que?
- Padrinho?
- Suporte?
- WhatsApp?
- CRM?

Daniel esclarece:

- Pensa em plano onde cliente tem acesso a consultor.
- Consultor vira suporte consultivo.
- Cliente pergunta quando o sistema nao resolve.
- Palavra "consultor" agrega valor.

### 14.3 Forma possivel

Pode ser:

- Chat in-app.
- WhatsApp.
- CRM de atendimento.
- Balaozinho no app.
- Notificacao para consultor designado.
- Se nao responder em meia hora, passa para outro.
- Mostrar consultores online.
- Tratar chamado como lead.

### 14.4 Por que registrar

Registrar conversas serve para:

- Saber pedidos recorrentes.
- Identificar melhorias.
- Criar FAQ/base de solucoes.
- Treinar IA futura.
- Gerar contexto do sistema.

---

## 15. Modelo Comercial

Essa reuniao e principalmente sobre venda.

### 15.1 Produto precisa ser vendavel

Daniel quer testar mercado:

- Apresentar sistema.
- Ver quem compra.
- Fazer evento online e presencial.
- Pre-venda.
- Segurar cliente por um mes apos venda se necessario.
- Ajustar se mercado nao comprar.

### 15.2 Modulos como upsell

Modelo discutido:

- Cliente ve tudo.
- Modulos estrategicos aparecem bloqueados.
- Exemplo: marketing completo, RH, DRE/analise.
- Mensagem: fale com consultor para conhecer.
- Isso gera desejo e recorrencia.

### 15.3 Produtos citados

- PMR.
- PMR Plus.
- PPA.
- Plano Plus.
- Modulo Marketing.
- Modulo RH.
- Modulo Financeiro.
- Falar com Consultor.
- Personalizacao/trilha institucional.
- Futuro sistema de contratacao.

### 15.4 Horizonte

Daniel fala:

- Semana seguinte livre para acelerar.
- Layout sera enviado ate o dia seguinte.
- Quer poder marcar evento fim de junho/julho/agosto.
- Se vender, tem um mes para entregar.
- Agosto/setembro seria bom para ir para sistema de contratacao/RH.
- Fechar ano com RH pronto seria muito forte.

Pedro avalia:

- Escopo mostrado e factivel ate agosto, tirando analise comportamental/contratacao, que e mais robusta.
- Muita coisa ja existe; e mais refatorar, design, layout, escopo, hierarquia e departamento.

---

## 16. Execucao e Processo de Trabalho

### 16.1 Daniel entrega layout

Daniel vai escrever e mandar ideia de layout para Pedro.

Papel de Pedro:

- Transformar em PRD/stories.
- Desenvolver cada tela/aba.
- Usar o que ja existe.
- Reorganizar visao de cada papel.

### 16.2 Trabalho por stories

Pedro deixa claro:

- Nao sobe tudo de uma vez.
- Cria um grande escopo e pequenas stories.
- Cada atualizacao e testada.
- Correcao fica especifica.
- Nao faz sentido testar tudo de uma vez.

Isso bate com regra AIOX:

- Trabalhar por stories.
- Validar modulo a modulo.

### 16.3 Mariane como QA

Mariane entra para:

- Testar.
- Dar demandas.
- Ver erros que o desenvolvedor nao ve.
- Testar como usuario final.

Daniel reconhece que Mariane testa melhor que ele.

### 16.4 Semana seguinte

Com agenda mais livre, a equipe pretende acelerar:

- Validar informacoes.
- Fechar layout.
- Testar ambientes.
- Subir atualizacoes por modulo.
- Daniel/Jose/Mariane testam e aprovam.

---

## 17. O Que Nao Deve Ser Interpretado Errado

### 17.1 Nao e para jogar os 45 indicadores na cara do dono

O dono ve painel.
Detalhe fica em Resultado/Planejamento.

### 17.2 Nao e para virar CRM

MX nao compete com AutoCerto.
MX usa dados do CRM para analise e decisao.

### 17.3 Nao e para depender so do vendedor preencher

O preenchimento e importante, mas Daniel estruturou por departamentos justamente para nao depender de um unico processo.

### 17.4 Nao e para transformar lancamento em ponto trabalhista

Foi discutido e tratado como risco de antipatia/problema.

### 17.5 Nao e para fazer RH inteiro agora

RH e uma pedrada comercial, mas contratacao/teste comportamental e robusto.
Pode vir depois do sistema base.

### 17.6 Nao e para gravar tudo em video como prioridade

Transcricao/ata tem mais valor operacional que video.

### 17.7 Nao e para entregar tudo em uma release

Pedro insistiu em stories pequenas e teste continuo.

---

## 18. Requisitos Diretos Extraidos da Reuniao

### R1 - Visao do dono

O dono deve abrir o sistema e ver:

- Consultoria.
- Departamentos.
- Treinamentos.
- Falar com consultor.

Na aba Consultoria, primeiro ve:

- Painel de eficiencia.
- Status verde/amarelo/vermelho.
- Explicacao do alerta.
- Comparativo de mercado/boas praticas quando disponivel.
- Agenda do diretor.

### R2 - Painel clean

O painel nao deve mostrar 45 indicadores de uma vez.
Deve resumir a leitura para decisao.

### R3 - Resultado detalhado

Subaba Resultado mostra:

- Metas.
- Realizado.
- Ano anterior.
- Dados do vendedor.
- Equipe.

### R4 - Plano de acao 2.0

Plano de acao precisa:

- Melhor layout.
- Ser editavel.
- Mostrar feito/falta.
- Ter responsavel.
- Ser segmentado por loja, gerente, vendedor.
- Atualizar plano central.
- Poder exigir evidencia.
- Permitir resposta da loja.

### R5 - Organograma

Organograma deve:

- Definir cargos.
- Responsabilidades.
- Aprovacoes.
- Plano de carreira.
- Relacao com PDI.
- Atribuicao de acoes.

### R6 - Visitas por produto

Sistema deve:

- Ter produtos PMR/PMR Plus/PPA cadastrados.
- Subir padrao de visitas conforme produto.
- Manter PMR online/presencial padronizado.
- PPA com 9 visitas e temas.
- Permitir flexibilidade por cliente.

### R7 - Dashboard comparativo

Sistema deve:

- Permitir pesquisa por indicador.
- Filtrar por volume estoque, ticket estoque, regiao.
- Bloquear granularidade se tiver menos de 5 lojas.
- Exigir dados abastecidos.

### R8 - Biblioteca viva

Biblioteca deve:

- Ter estudos.
- Videos.
- Noticias.
- Atualizacao por tema.
- Data da ultima atualizacao.
- Reduzir dependencia da MX.

### R9 - Departamentos

Departamentos devem estruturar:

- Comercial.
- Marketing.
- RH.
- Financeiro/Administrativo.
- Operacoes.

Cada departamento deve ter dashboard de eficiencia.

### R10 - Comercial

Comercial deve incluir:

- Gerente: resultado, funil, acompanhamento diario, feedback, PDI, rotina.
- Vendedor: resultado, funil, acompanhamento diario, feedback, PDI.
- Cultura de Resultado.
- Disciplina/acuracidade.
- Incentivos.

### R11 - Marketing

Marketing deve incluir:

- Desempenho por canal.
- Agenda estrategica mensal.
- Posicionamento.
- Produto.
- Estoque.
- Oportunidades/ameacas.
- Estrategia multicanal.
- Possivel Instagram/Meta como MVP.

### R12 - RH

RH deve incluir:

- Plano de remuneracao inteligente.
- Cadastro de plano.
- Comparativo com mercado.
- Plano de carreira.
- Contratacao.
- Teste comportamental.
- Banco de curriculos.
- Formulario de competencias.
- Entrevista.
- Compatibilidade IA.
- Novo profissional com trilha por nivel.
- Video institucional.
- Indice de felicidade anonimo.

### R13 - Financeiro/Admin

Financeiro deve incluir:

- DRE.
- Analise de DRE.
- Modulos com gating/upsell por plano.

Administrativo deve evoluir com treinamento e processos.

### R14 - Operacoes

Operacoes deve incluir:

- Preparacao.
- Pos-venda.
- Fluxograma.
- Materiais.
- Regras e boas praticas.

### R15 - Treinamentos

Treinamentos deve incluir:

- Agenda ao vivo.
- Biblioteca.
- Player validado.
- Trilhas.
- Conteudos novos.
- Conteudo institucional por loja.

### R16 - Falar com consultor

Deve existir caminho futuro para:

- Chat/CRM/WhatsApp.
- Consultor designado ou online.
- SLA.
- Registro de conversas.
- Base de solucoes.
- IA futura alimentada por historico.

---

## 19. Prioridade Correta

### Fase 1 - Refatorar experiencia e layout do que ja existe

Objetivo:

- Deixar o sistema apresentavel para venda/teste de mercado.

Inclui:

- Quatro abas principais.
- Painel do dono.
- Resultado.
- Plano de acao melhorado.
- Visitas padronizadas.
- Departamentos base.
- Modulos bloqueados/upsell.

### Fase 2 - Comercial e Marketing como valor visivel

Objetivo:

- Mostrar que o sistema atua no dia a dia da loja.

Inclui:

- Comercial por gerente/vendedor.
- Cultura de Resultado.
- Disciplina/acuracidade.
- Marketing multicanal MVP.
- Agenda estrategica de marketing.

### Fase 3 - RH/Desenvolvimento com alto valor

Objetivo:

- Aumentar ticket e diferencial.

Inclui:

- Remuneracao.
- Plano de carreira.
- Teste comportamental.
- Contratacao.
- Novo profissional.
- Indice de felicidade.

### Fase 4 - Integracoes e escala

Objetivo:

- Reduzir alimentacao manual.

Inclui:

- WhatsApp.
- AutoCerto/CRM.
- Instagram/Meta.
- Noticias automatizadas.
- Chat consultor com base de solucoes.

---

## 20. Epicos Recomendados

### Epic 1 - Arquitetura de Informacao e Navegacao Comercial

Entregar:

- Quatro abas.
- Reorganizacao por visao do dono.
- Rotas atuais preservadas.
- Modulos bloqueados com CTA.
- Labels de produto.

### Epic 2 - Painel do Dono e Agenda do Diretor

Entregar:

- Painel semaforo.
- Motivos dos alertas.
- Gap para verde/amarelo.
- Comparativo quando disponivel.
- Agenda do diretor.

### Epic 3 - Plano de Acao, Organograma e Responsaveis

Entregar:

- Plano de acao 2.0.
- Responsavel real.
- Segmentacao loja/gerente/vendedor.
- Evidencias.
- Organograma.
- Descricao de cargos.

### Epic 4 - Produtos e Visitas PMR/PMR Plus/PPA

Entregar:

- Produtos cadastraveis.
- Templates de visita.
- PPA com temas.
- PMR online/presencial padronizado.
- Subida automatica por cliente/produto.

### Epic 5 - Departamentos MVP

Entregar:

- Comercial.
- Marketing MVP.
- Financeiro com DRE/gating.
- Operacoes com fluxos.
- Dashboards de eficiencia.

### Epic 6 - Desenvolvimento, Treinamentos e Biblioteca Viva

Entregar:

- Biblioteca consultiva.
- Noticias/estudos/videos.
- Agenda ao vivo.
- Player/trilha.
- Conteudo institucional.

### Epic 7 - RH Estrategico

Entregar:

- Remuneracao.
- Plano de carreira.
- Contratacao.
- Teste comportamental.
- Novo profissional.
- Indice de felicidade.

### Epic 8 - Falar com Consultor e Base de Solucoes

Entregar:

- Chat/chamado.
- Consultor designado.
- Notificacao.
- SLA.
- Historico.
- Base de solucoes.

### Epic 9 - Integracoes

Entregar:

- WhatsApp.
- AutoCerto/CRM.
- Meta/Instagram.
- Noticias automatizadas.
- Regras de seguranca e feature flags.

---

## 21. Deltas Contra o Sistema Atual

| Tema da reuniao | Situacao atual provavel | Delta correto |
|---|---|---|
| Consultoria | Ja existe modulo e cliente detalhe | Reorganizar para visao do dono e quatro abas |
| Painel semaforo | Ha indicadores/planejamento | Criar primeira camada clean, manual primeiro se preciso |
| 45 indicadores | Ja existem/foram trabalhados | Nao mostrar tudo no painel; usar em Resultado/drill-down |
| Agenda diretor | Agenda existe parcialmente | Criar agenda de acoes do dono, comunicados e opt-in |
| Plano de acao | Existe base | Melhorar layout, responsavel, segmentacao e evidencia |
| Organograma | Nao esta completo | Criar hierarquia/cargos/aprovacoes/carreira |
| PMR/Plus/PPA | PMR existe | Produto deve configurar escopo/visitas |
| Dashboard mercado | Parcial em indicadores | Criar pesquisa por filtros e regra >5 lojas |
| Biblioteca | Treinamentos existem | Biblioteca consultiva com noticias e estudos |
| Comercial | Rotina/funil/PDI existem | Reorganizar por departamento e engajamento |
| Marketing | Parcial/metodologia | Criar modulo multicanal, agenda e insights |
| RH | PDI/trilhas existem | Criar remuneracao, contratacao, teste, clima |
| Financeiro | DRE existe | Mover para departamento e aplicar gating |
| Operacoes | Fragmentado | Criar preparacao/pos-venda com boas praticas |
| Falar consultor | Nao existe completo | Criar chat/chamado/base de solucoes |
| Processo de entrega | Stories existem | Continuar incremental, com Mariane testando |

---

## 22. Questoes em Aberto Reais

1. Nome comercial final: ainda sera chamado de "sistema" ou deve virar outro nome/app?
2. Quais modulos entram no produto base?
3. Quais modulos entram no Plus?
4. PMR Plus tem quais visitas/temas exatamente?
5. Daniel vai enviar apresentacao PPA para extrair templates?
6. Quais indicadores entram no painel semaforo manual inicial?
7. Qual modelo de agenda do diretor sera usado primeiro?
8. Qual formato final do plano de acao segmentado?
9. Como sera o organograma minimo?
10. Qual incentivo do vendedor entra no MVP?
11. Placa FIPE entra agora ou depois?
12. Instagram/Meta sera via API oficial, conector ou manual?
13. Qual sistema de relacionamento de carteira sera usado pelo marketing?
14. RH entra em agosto/setembro ou fica para depois do primeiro evento?
15. Indice de felicidade precisa de regra minima de respostas?
16. Falar com consultor comeca por chat in-app ou WhatsApp?
17. Qual cliente piloto valida cada modulo?
18. Qual data real do evento online/presencial de venda?

---

## 23. Proxima Acao Correta

Antes de qualquer codigo novo:

1. Daniel entrega layout.
2. Pedro transforma em stories pequenas.
3. A equipe valida a arquitetura de abas.
4. Comecar pelo que ja existe e precisa ser reorganizado.
5. Nao iniciar RH completo antes de fechar visao principal e plano de acao.
6. Nao depender de WhatsApp/API externa para entregar a primeira versao vendavel.
7. Mariane valida cada entrega como usuaria antes de cliente final.

Sequencia recomendada imediata:

1. Story: Nova navegacao do cliente com quatro abas.
2. Story: Painel do dono com semaforo manual e alertas explicados.
3. Story: Resultado dentro de Consultoria reaproveitando planejamento atual.
4. Story: Plano de acao 2.0 com responsavel e status editavel.
5. Story: Organograma minimo e descricao de cargos.
6. Story: Produtos PMR/PMR Plus/PPA com templates.
7. Story: Departamentos MVP com Comercial, Marketing, Financeiro e Operacoes.
8. Story: Biblioteca consultiva com estudos/videos/noticias.

---

## 24. Resumo Executivo para Alinhamento com Daniel

Daniel, o que a reuniao definiu foi:

- O MX nao e CRM; e tomada de decisao.
- A primeira tela do dono tem que ser simples, visual e vendavel.
- A estrutura comercial do produto sao quatro abas: Consultoria, Departamentos, Treinamentos e Falar com Consultor.
- Consultoria entrega painel, resultado, plano de acao, visitas, dashboard comparativo e biblioteca.
- Departamentos mostram que a MX estrutura a empresa inteira, nao so vendedor.
- Comercial precisa engajar vendedor sem depender so dele.
- Marketing precisa virar multicanal, nao internet/trafego.
- RH e o modulo de maior potencial, principalmente remuneracao, contratacao, teste comportamental, plano de carreira e clima.
- Financeiro/DRE entra como departamento e tambem como upsell.
- Operacoes precisa ter preparacao e pos-venda com fluxo e boas praticas.
- Falar com consultor e um produto futuro de suporte consultivo, base de solucoes e IA.
- A execucao deve ser por stories, validando uma entrega por vez.
- O objetivo de curto prazo e ter algo apresentavel para testar mercado e vender, nao terminar o sistema perfeito.

