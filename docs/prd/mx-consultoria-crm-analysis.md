# Analise - CRM de Consultoria MX

Data: 2026-04-13
Workflow: `brownfield-fullstack`
Status: base de descoberta para PRD

## Resumo executivo

Os arquivos analisados apontam para uma mudanca grande no produto atual. O sistema existente `MX PERFORMANCE` nasceu como operacao de performance diaria para lojas automotivas, e o PRD atual declara explicitamente que o produto nao seria um CRM e nao teria financeiro, DRE ou estoque como escopo principal.

O novo pedido muda isso. A necessidade real e criar um CRM interno da MX Consultoria para administrar a carteira de clientes da consultoria, organizar agenda de visitas, padronizar execucao do metodo PMR, dar continuidade entre consultores, centralizar documentos/evidencias, acompanhar indicadores operacionais, financeiro/DRE, PDI, treinamentos, estoque e evolucao por cliente.

Isso deve ser tratado como major enhancement, nao como ajuste pequeno. A entrega precisa passar por PRD, arquitetura e stories antes da implementacao.

## Fontes analisadas

Foram processadas 27 fontes em `output/analysis/mx-feature-20260413/`, incluindo:

- Transcricao em RTF: `/Users/pedroguilherme/Documents/ligação .rtf`
- Planilha/HTML de agenda: `AGENDA.html`, `_CRONOGRAMA 2026 MX ESCOLA DE NEGOCIOS .xlsx`
- Cadastro CRM/base de clientes: `CRM.html`
- Objetivos de visitas: `OBJETIVO_VISITA.html`
- Eventos e aulas: `EVENTOS ONLINE.html`, `EVENTOS PRESENCIAIS.html`, `AULAS.html`
- Relatorios de visitas DNA: `VISITA 6 DNA 11-03.docx`, `VISITA 7 PDI 18-03.docx`, `VISITA 9 09-04.docx`
- Diagnosticos executivos: `DNA - Resumo Executivo...docx`, `Gandini - Resumo Executivo...docx`
- Planejamentos: `PMR - DNA...pptx`, `GANDINI - PMR...pptx`, `DADOS PLANEJAMENTO.pdf`
- Financeiro: `DRE.xlsx`
- Estoque: `ESTOQUE DNA VEICULOS.xlsx`, `ESTOQUE COMPLETO DNA VEICULOS 04-02-2025.pdf`
- PDI: `Antonio - Plano_Desenvolvimento_Individual.xlsx`

Limite da analise: os dois arquivos `.m4a` foram identificados e tiveram metadados extraidos, mas nao foram transcritos diretamente porque o ambiente nao tem `OPENAI_API_KEY`. A analise da ligacao usa o arquivo RTF `ligação .rtf`, que contem texto da conversa.

## O que a ligacao pede

O pedido central e transformar o sistema em um CRM de consultoria para a MX:

- Cadastrar os clientes da MX, hoje citados como 35 clientes, com possibilidade de chegar a 50 ou 80.
- Ter uma visao da consultoria, nao apenas uma visao da loja.
- Gerenciar agenda do cliente e agendar visitas.
- Usar a tabela de visitas 1 a 7, onde cada visita tem objetivo, checklist, evidencia e modelo de relatorio.
- Dar continuidade entre consultores: o cliente nao e de um consultor, e da MX; qualquer consultor deve conseguir ver o historico e continuar a proxima visita.
- Manter integracao funcional com Google Agenda/Meet, incluindo ID do evento e troca automatica quando muda data, consultor ou numero da visita.
- Centralizar dados cadastrais, documentos, checklists, feedbacks, anexos e interacoes do cliente.
- Centralizar dados comerciais, vendas, desempenho, financeiro, administrativo, DRE, despesas e evolucao do cliente.
- Reduzir dependencia de WhatsApp e multiplos sistemas, porque hoje as informacoes ficam espalhadas e a continuidade do atendimento quebra.

## Diagnostico de produto

O sistema atual ja cobre partes importantes:

- Lojas, usuarios, papeis, check-in diario, metas, ranking, funil, feedback, PDI, treinamentos, notificacoes e relatorios recorrentes.
- Visao por papeis: admin, dono, gerente e vendedor.
- Base Supabase com dados operacionais canonicos.

O novo escopo exige uma camada acima:

- `consultoria`: gestao interna da MX.
- `cliente de consultoria`: empresa/loja atendida pela MX, com produto contratado, fase, responsaveis e historico.
- `agenda de consultoria`: visitas, eventos, aulas e bloqueios, integrados ao Google Agenda.
- `execucao PMR`: objetivos, checklists, evidencias, formularios e relatorios por visita.
- `inteligencia de cliente`: financeiro/DRE, estoque, leads, vendas, PDI, treinamentos e evolucao.

Isso nao substitui totalmente o CRM comercial da loja. A proposta e um CRM da MX sobre os clientes da consultoria, abastecendo a MX com dados, historico, provas e proximas acoes.

## Requisitos funcionais necessarios

### 1. Cadastro de clientes da consultoria

Cada cliente precisa ter:

- Nome da loja/empresa.
- Produto ou consultoria contratada, por exemplo PPA, PMR presencial, PMR online, PMR renovacao, mentoria.
- Dados cadastrais, incluindo e-mail, CNPJ e contatos principais.
- Unidade, quando existir mais de uma loja, como DNA Portal e DNA Shopping do Aviao.
- Dono, gerente, vendedores e contatos administrativos.
- Status do cliente no cronograma.
- Consultor responsavel e consultor auxiliar.
- Historico de visitas, documentos, evidencias, feedbacks e anexos.

### 2. Permissoes e continuidade entre consultores

Regras de acesso:

- A visao master da MX deve ver todos os clientes.
- Consultores devem ver os clientes que atendem e o historico necessario para continuidade.
- O sistema nao deve tratar o cliente como propriedade individual do consultor.
- Quando um consultor assume a proxima visita, ele precisa enxergar o que foi feito na visita anterior, quais evidencias foram anexadas, quais pendencias ficaram e qual e o proximo objetivo.

### 3. Agenda de consultoria

A agenda precisa suportar:

- Visitas de clientes.
- Eventos online.
- Eventos presenciais.
- Aulas e formacoes.
- Bloqueios de agenda.
- Consultor responsavel e consultor auxiliar.
- Data, hora, duracao, modalidade, alvo e motivo da visita.
- ID do evento do Google Agenda.
- Link do Google Meet para eventos online quando aplicavel.

Regras obrigatorias:

- Alterar data deve atualizar o evento correspondente.
- Alterar consultor deve remover o evento da agenda antiga e criar/atualizar na agenda correta.
- Alterar numero da visita deve atualizar objetivo, checklist e descricao do evento.
- Deve existir acao manual para sincronizar a agenda.
- Deve existir mecanismo de limpeza ou prevencao de duplicidade de eventos.

### 4. Motor de visitas PMR

O sistema precisa transformar a aba `OBJETIVO_VISITA` em fluxo operacional.

Visitas identificadas no material:

- Visita 1: Diagnostico e Treinamento Metodo Vendedor Profissional - Fase 1.
- Visita 2: Planejamento Estrategico, Metodologia de Vendas por Multicanal, Acompanhamento Diario de Vendas, Gestao a Vista e Treinamento MVP - Fase 2.
- Visita 3: Rotina do Gerente e do Vendedor, Feedback Estruturado.
- Visita 4: Cultura de Resultado e Treinamento MVP - Fase 3.
- Visita 5: Plano de Desenvolvimento Individual - PDI.
- Visita 6: Posicionamento de Marketing, Estrategia de Conteudo e Trafego Pago.
- Visita 7: Analise das Implementacoes e Plano de Acao Trimestral.

Cada visita precisa ter:

- Objetivo.
- Tempo estimado.
- Publico alvo.
- Checklist.
- Evidencias obrigatorias.
- Modelo de relatorio.
- Momento de venda, quando aplicavel.
- Campos de observacao e pendencias.
- Anexos por etapa.
- Status de cumprimento.

### 5. Relatorios e formularios de visita

O material mostra que hoje ha relatorios em Word, formularios externos e modelos de visitas. O sistema precisa:

- Abrir a tela correta da visita quando o consultor acessa o cliente agendado.
- Permitir preenchimento online do formulario da visita.
- Gerar ou alimentar relatorio padrao da visita.
- Exigir evidencias quando uma etapa depende de foto, print, formulario preenchido ou documento assinado.
- Registrar feedback do cliente.
- Manter anexos e documentos por cliente e por visita.

### 6. Modulo financeiro e DRE

O financeiro e um ponto central do pedido. O sistema precisa modelar pelo menos:

- Margem bruta de vendas.
- Deducoes de impostos e comissoes.
- Preparacao.
- Margem liquida.
- Retorno de financiamento.
- Outras receitas.
- Folha de pagamento.
- Pro-labore.
- Despesas fixas.
- Marketing.
- Sistemas de terceiros.
- Lucro liquido.
- Volume de vendas.
- Ticket medio.
- Margem por carro.
- Custo de preparacao por carro.
- Custo de pos-venda por carro.
- Capital proprio.
- Rentabilidade sobre capital.

Ponto tecnico observado: `DRE.xlsx` contem `#VALUE!` na primeira linha. A importacao precisa validar formulas e erros antes de usar os dados como fonte confiavel.

### 7. BI e evolucao do cliente

Dashboards necessarios:

- Evolucao de vendas por cliente.
- Evolucao financeira, lucro, despesas e rentabilidade.
- Leads, agendamentos, visitas, vendas e conversoes.
- Ranking por vendedor.
- Projecao vs meta.
- Gargalos de financiamento, oficina, preparacao, pos-venda e CRM.
- Evolucao do cronograma PMR por cliente.
- Pendencias por visita.
- Evidencias entregues vs faltantes.

### 8. Estoque

Os arquivos de estoque mostram necessidade de governanca:

- Separar estoque de venda, repasse, uso pessoal e preparacao.
- Identificar veiculos vendidos que continuam aparecendo em estoque por falha de baixa.
- Sinalizar veiculos acima de 90 dias.
- Exibir tempo medio de estoque.
- Permitir importacao de relatorios de estoque.
- Cruzar estoque travado com pauta de visita e plano de acao.

Exemplo observado: na DNA havia estoque total de 127 veiculos, com 20 de repasse/uso pessoal e 40 em preparacao. O relatorio tambem mostra carros com mais de 90, 120, 200 dias em estoque.

### 9. Leads e auditoria de atendimento

Os documentos indicam necessidade de:

- Importar ou registrar leads por midia.
- Controlar recebidos, pendentes, em andamento, agendados, finalizados, sucesso e insucesso.
- Auditar lead sem contato ou atendimento fora do CRM.
- Bloquear ou sinalizar lead quando nao houver atendimento correto, conforme citado no caso Bruno.
- Medir SLA de primeiro contato e follow-up.
- Apoiar o gerente na auditoria diaria.

### 10. PDI

O PDI precisa ficar conectado ao metodo PMR:

- Criar PDI para vendedor e gerente.
- Registrar metas de curto, medio e longo prazo.
- Relacionar meta pessoal com meta da loja.
- Registrar responsaveis e prazos.
- Exigir documento fechado/assinado quando a etapa pedir.
- Acompanhar performance de treinamento.
- Permitir impressao ou exportacao quando necessario.

### 11. Treinamentos, aulas e eventos

O material inclui agenda de aulas, eventos online e presenciais. O sistema precisa:

- Cadastrar eventos e aulas com data, hora, carga horaria, publico alvo, responsavel e ID do evento.
- Vincular treinamentos a clientes, vendedores, gerentes ou donos.
- Acompanhar consumo ou pendencia de treinamento.
- Gerar Meet para eventos online quando aplicavel.
- Manter relacao com os gargalos da consultoria, por exemplo treinamento de financiamento, atendimento, rotina do gerente e metodo vendedor profissional.

### 12. Importacao e migracao dos arquivos atuais

Para deixar funcionando, precisa existir um caminho controlado de importacao:

- Importar agenda da planilha `_CRONOGRAMA 2026 MX ESCOLA DE NEGOCIOS`.
- Importar base de clientes do `CRM.html`.
- Importar objetivos/checklists do `OBJETIVO_VISITA.html`.
- Importar aulas e eventos.
- Importar DRE por cliente.
- Importar dados de leads.
- Importar estoque.
- Importar relatorios de visita, diagnosticos e PMRs como documentos anexados ao cliente.

Essa importacao deve ser validada antes de gravar no banco, porque alguns arquivos sao exportacoes HTML/planilha e um deles, `estoque.xls`, e apenas uma pagina com frames sem dados uteis.

## Regras de negocio extraidas

- O cliente e da MX Consultoria, nao de um consultor individual.
- O consultor precisa abrir o cliente e saber exatamente o que fazer na visita atual.
- A proxima visita deve continuar a anterior, mesmo quando muda o consultor.
- Agenda e Google Agenda precisam continuar sincronizados.
- Dados financeiros e administrativos sao parte do escopo novo.
- DRE e relatorios financeiros devem estar prontos antes de visitas que dependem de analise financeira.
- Evidencia valida execucao; texto solto nao deve ser suficiente quando o processo exige foto, print, formulario ou assinatura.
- O sistema precisa reduzir dependencia de WhatsApp e documentos espalhados.
- O sistema deve suportar entrada gradual dos clientes, sem exigir migrar todos de uma vez.

## Lacunas e riscos

- Falta transcricao direta dos dois audios `.m4a`; ha somente metadados. A transcricao em RTF foi usada como fonte principal da ligacao.
- O PRD atual contradiz o novo pedido, pois define o produto como nao-CRM e deixa financeiro, DRE e estoque fora do escopo.
- Nao ha ainda PRD aprovado para o novo modulo.
- Nao ha arquitetura definida para Google Agenda/Meet, anexos, importacao de planilhas e modelo financeiro.
- O volume de dados do PDI e relatorios e alto; precisa de modelo de anexos e armazenamento antes de codar.
- A importacao de planilhas pode trazer formulas, valores quebrados e campos inconsistentes.

## Epicos recomendados

1. CRM interno da MX: clientes, produtos, unidades, consultores, historico e permissoes.
2. Agenda de consultoria: visitas, eventos, aulas, Google Agenda/Meet e deduplicacao.
3. Motor PMR de visitas: objetivos, checklists, evidencias, relatorios e continuidade entre consultores.
4. Area do cliente e prestacao de contas: uploads, dados comerciais, feedbacks e documentos.
5. Financeiro/DRE: lancamentos, importacao, validacao, indicadores e dashboards.
6. Estoque e lead audit: importacao, aging, categorias, SLA, bloqueios/sinais e auditoria.
7. PDI e treinamentos: PDI por pessoa, metas 6/12/24 meses, assinaturas/evidencias e consumo de aulas.
8. BI executivo: evolucao do cliente, cronograma, vendas, lucro, despesas, estoque, leads e pendencias.
9. Migracao dos arquivos atuais: scripts e validadores para agenda, CRM, objetivos, eventos, DRE, estoque e documentos.

## Ordem pragmatica para entregar funcionando

1. PRD do novo CRM de consultoria, resolvendo o conflito com o PRD atual.
2. Analise tecnica do sistema existente e arquitetura do modulo.
3. Modelo de dados Supabase para clientes, agenda, visitas, evidencias, DRE, estoque, leads e anexos.
4. Importador inicial da agenda, CRM, objetivos de visita e eventos.
5. Tela administrativa da MX para cliente, agenda e visita.
6. Fluxo de execucao de visita com checklist e evidencia.
7. Sincronizacao Google Agenda/Meet.
8. Importacao/entrada do DRE, leads e estoque.
9. Dashboards e BI.
10. Testes, RLS, auditoria, seed/migracao e validacao ponta a ponta.

## Proxima decisao do workflow

A documentacao de negocio esta suficiente para criar um PRD, mas a documentacao tecnica ainda e insuficiente para sair implementando com seguranca. O proximo passo recomendado no workflow `brownfield-fullstack` e executar a analise do projeto atual, produzir uma arquitetura brownfield do impacto e entao criar o PRD novo.
