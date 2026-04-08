# Backlog Operacional Executável — MX Gestão Preditiva
**Versão:** 1.2 — Papéis e Permissões Congelados  
**Base:** Plano Operacional de Produto — MX Gestão Preditiva v1.1  
**Objetivo:** transformar o plano operacional em backlog executável por agentes de IA, com **épicos**, **histórias**, **subtarefas**, **critérios de aceite**, **dependências** e **ordem de execução**.

---

# 1. Regras de execução

## 1.1 Regra principal
Os agentes devem executar este backlog respeitando a metodologia MX, sem transformar o produto em CRM genérico.

## 1.2 Regra de prioridade
Sempre priorizar:
1. regra de negócio
2. dado canônico
3. automação operacional
4. interface

## 1.3 Regra de corte
Nenhuma feature fora do core metodológico pode entrar na navegação principal antes da conclusão do núcleo operacional.

---

# 2. Estrutura de execução por agentes

## Agente A — Product Architect
Responsável por:
- coerência do domínio
- nomenclatura
- alinhamento metodológico
- validação funcional

## Agente B — Backend / Data
Responsável por:
- schema
- persistência
- regras
- motores diários e semanais
- jobs

## Agente C — Frontend / UX
Responsável por:
- navegação
- telas
- formulários
- painéis
- estados e mensagens

## Agente D — Automations / Messaging
Responsável por:
- relatórios
- templates
- e-mails
- WhatsApp
- notificações

## Agente E — QA / Validation
Responsável por:
- testes
- critérios de aceite
- consistência entre motor, dado e tela

---


# 2A. Matriz congelada de papéis

## Admin
- visão global de todas as lojas
- configuração estrutural
- benchmarks
- relatórios globais
- treinamentos
- produtos digitais
- notificações
- reprocessamento
- auditoria de feedback e PDI

## Dono
- visão executiva das suas lojas
- acompanhamento de metas, funil, relatórios e desenvolvimento da equipe
- não opera check-ins por padrão
- não reprocessa base por padrão

## Gerente
- operação da loja
- equipe
- check-ins
- ranking
- metas
- funil
- feedback estruturado
- PDI
- treinamentos

## Vendedor
- check-ins próprios
- histórico
- ranking
- treinamentos
- feedback próprio
- PDI próprio
- notificações

## Regra congelada
- admin governa
- dono acompanha
- gerente opera
- vendedor executa


# 3. Ordem macro de execução

1. **EPIC-00** — Congelamento e limpeza do core  
2. **EPIC-01** — Domínio e dados canônicos  
3. **EPIC-02** — Check-in diário do vendedor  
4. **EPIC-03** — Painel da loja e ranking oficial  
5. **EPIC-04** — Rotina diária do gerente  
6. **EPIC-05** — Relatório matinal oficial  
7. **EPIC-06** — Mensagem padrão de WhatsApp  
8. **EPIC-07** — Feedback semanal oficial  
9. **EPIC-08** — Painel de Feedback Estruturado  
10. **EPIC-09** — Painel de PDI completo  
11. **EPIC-10** — Visão geral multi-loja da consultoria  
12. **EPIC-11** — Reprocessamento e reparo administrativo  
13. **EPIC-12** — Treinamentos e notificações operacionais  
14. **EPIC-13** — Hardening, regressão e aceite final

---

# 4. Backlog por épico

---
# EPIC-00 — Congelamento e limpeza do core

## Objetivo
Separar o núcleo MX do que é legado, parar a dispersão de escopo e alinhar a linguagem do produto.

## Dependências
Nenhuma. Este épico é o ponto de partida.

## Histórias

### STORY-00.1 — Congelar escopo oficial do produto
**Descrição:** documentar e travar oficialmente o que é core e o que não é core.  
**Agente principal:** Product Architect

**Subtarefas**
- listar módulos do sistema atual
- classificar cada módulo em:
  - core
  - legado
  - backlog futuro
- gerar matriz módulo x papel x status
- registrar decisão em documento versionado

**Critérios de aceite**
- existe lista oficial de módulos core
- existe lista oficial de módulos fora do core
- o time/agentes não têm ambiguidade sobre o que pode evoluir agora

**Dependências**
- nenhuma

---

### STORY-00.2 — Mover módulos não-core para área isolada
**Descrição:** tirar módulos fora do núcleo da navegação principal.  
**Agente principal:** Frontend / UX

**Subtarefas**
- identificar rotas e menus de:
  - LeadOps
  - Leads
  - Agenda
  - Tarefas
  - Financeiro
  - Inventory
  - Regras de Incentivo
  - Reports genéricos
  - IA Diagnostics
  - Gamification
  - Activities
  - Communication
- mover para `/legacy` ou feature flag
- remover desses módulos da navegação principal por papel
- validar que continuam acessíveis apenas em área isolada, se necessário

**Critérios de aceite**
- usuário principal não vê módulos fora do core no menu principal
- os módulos antigos não competem visualmente com o núcleo MX

**Dependências**
- STORY-00.1

---

### STORY-00.3 — Alinhar linguagem oficial da interface
**Descrição:** remover linguagem SaaS genérica e adotar linguagem da metodologia MX.  
**Agente principal:** Product Architect + Frontend / UX

**Subtarefas**
- mapear termos proibidos:
  - cluster
  - node
  - network health
  - pacing engine
  - broadcast center
- mapear termos oficiais:
  - loja
  - vendedor
  - gerente
  - meta
  - projeção
  - gap
  - sem registro
  - feedback estruturado
  - PDI
- revisar labels, títulos, menus, textos de apoio e headings
- revisar cópias das telas principais

**Critérios de aceite**
- menus e títulos falam a língua da operação MX
- termos genéricos/abstratos não aparecem no core

**Dependências**
- STORY-00.1

---

# EPIC-01 — Domínio e dados canônicos

## Objetivo
Consertar o modelo de dados para refletir a metodologia, sem gambiarras conceituais.

## Dependências
- EPIC-00 concluído

## Histórias

### STORY-01.1 — Definir schema canônico do núcleo operacional
**Descrição:** modelar as entidades mínimas do produto.  
**Agente principal:** Backend / Data + Product Architect

**Subtarefas**
- definir tabela `stores`
- definir tabela `store_sellers`
- definir tabela `daily_checkins`
- definir tabela `store_benchmarks`
- definir tabela `store_meta_rules`
- definir tabela `reprocess_logs`
- revisar relação com `users`, papéis e memberships
- documentar diagrama lógico

**Critérios de aceite**
- diagrama lógico aprovado
- o schema cobre check-in, metas, benchmark, vigência, sem registro e reprocessamento

**Dependências**
- STORY-00.1

---

### STORY-01.2 — Modelar vigência da equipe
**Descrição:** suportar entrada e saída de vendedor por período.  
**Agente principal:** Backend / Data

**Subtarefas**
- adicionar `started_at`
- adicionar `ended_at`
- adicionar `is_active`
- adicionar regra de `closing_month_grace`
- criar query para “quem deveria lançar hoje”
- criar testes de vigência

**Critérios de aceite**
- vendedor ativo no período aparece na operação
- vendedor desligado sai automaticamente do ciclo seguinte
- vendedor desligado pode permanecer no fechamento do mês quando necessário

**Dependências**
- STORY-01.1

---

### STORY-01.3 — Formalizar regra de “SEM REGISTRO”
**Descrição:** marcar corretamente vendedores que não lançaram no prazo.  
**Agente principal:** Backend / Data

**Subtarefas**
- definir regra operacional de atraso
- criar rotina para identificar não lançados
- persistir status derivado ou view operacional
- expor isso para painel, matinal e rotina do gerente

**Critérios de aceite**
- o sistema sabe exatamente quem está “sem registro”
- o status respeita vigência da equipe
- o status é consumido em todos os módulos operacionais

**Dependências**
- STORY-01.2

---

### STORY-01.4 — Formalizar regra de “VENDA LOJA”
**Descrição:** impedir contaminação da meta individual.  
**Agente principal:** Backend / Data + Product Architect

**Subtarefas**
- definir regra no domínio
- garantir inclusão em total da loja
- garantir exclusão em meta individual
- criar testes de cálculo

**Critérios de aceite**
- venda loja soma no consolidado da loja
- venda loja não altera meta individual ou ranking pessoal indevidamente

**Dependências**
- STORY-01.1

---

### STORY-01.5 — Formalizar benchmark por loja
**Descrição:** benchmark configurável com default MX.  
**Agente principal:** Backend / Data

**Subtarefas**
- modelar `store_benchmarks`
- definir default 20/60/33
- criar CRUD de benchmark por loja
- registrar log de alteração

**Critérios de aceite**
- cada loja pode usar benchmark próprio
- benchmark default MX existe
- alterações são auditáveis

**Dependências**
- STORY-01.1

---

### STORY-01.6 — Formalizar destinatários por loja
**Descrição:** cada loja deve ter múltiplos destinatários de relatórios e referência de WhatsApp.  
**Agente principal:** Backend / Data

**Subtarefas**
- modelar campos de destinatários
- aceitar múltiplos e-mails
- aceitar referência de grupo/identificador de WhatsApp
- expor para os motores de automação

**Critérios de aceite**
- matinal e semanal conseguem buscar destinatários corretos da loja
- loja aceita múltiplos destinatários

**Dependências**
- STORY-01.1

---

# EPIC-02 — Check-in diário do vendedor

## Objetivo
Fazer o lançamento diário bater 100% com a metodologia.

## Dependências
- EPIC-01 concluído

## Histórias

### STORY-02.1 — Refatorar o modelo temporal do check-in
**Descrição:** separar claramente envio e referência.  
**Agente principal:** Backend / Data

**Subtarefas**
- implementar `submitted_at`
- implementar `reference_date`
- mapear campos do dia anterior
- mapear campos do dia atual
- adaptar queries existentes

**Critérios de aceite**
- o dado diferencia corretamente:
  - produção do dia anterior
  - agenda do dia atual
- não há ambiguidade no banco

**Dependências**
- STORY-01.1

---

### STORY-02.2 — Refazer a tela de check-in com semântica explícita
**Descrição:** reorganizar o formulário para deixar óbvio o que é ontem e hoje.  
**Agente principal:** Frontend / UX

**Subtarefas**
- criar bloco “Referência do registro”
- criar bloco “Produção do dia anterior”
- criar bloco “Agenda do dia atual”
- exibir deadline de preenchimento
- exibir impacto de não lançar
- destacar obrigatoriedade de campos
- melhorar mensagens de validação

**Critérios de aceite**
- qualquer vendedor entende sem dúvida o que preencher
- a tela deixa explícito o que é ontem e o que é hoje

**Dependências**
- STORY-02.1
- STORY-00.3

---

### STORY-02.3 — Implementar validações do lançamento
**Descrição:** proteger integridade mínima do check-in.  
**Agente principal:** Backend / Data + Frontend / UX

**Subtarefas**
- impedir números negativos
- exigir justificativa quando tudo for zero
- impedir submissão inválida
- validar coerência mínima entre campos
- registrar lançamento fora do prazo

**Critérios de aceite**
- o sistema bloqueia envios inválidos
- o sistema registra status dentro/fora do prazo
- zeros totais sem justificativa não são aceitos

**Dependências**
- STORY-02.1
- STORY-02.2

---

### STORY-02.4 — Alimentar downstream após o check-in
**Descrição:** garantir que o lançamento alimente todos os motores necessários.  
**Agente principal:** Backend / Data

**Subtarefas**
- atualizar ranking
- atualizar painel da loja
- atualizar status sem registro
- alimentar matinal
- alimentar semanal

**Critérios de aceite**
- check-in refletido imediatamente ou por refresh controlado em todos os módulos dependentes

**Dependências**
- STORY-02.3

---

# EPIC-03 — Painel da loja e ranking oficial

## Objetivo
Transformar o painel da loja no equivalente funcional do painel legado.

## Dependências
- EPIC-02 concluído

## Histórias

### STORY-03.1 — Ajustar KPIs de topo da loja
**Descrição:** alinhar cards principais com a metodologia.  
**Agente principal:** Frontend / UX + Backend / Data

**Subtarefas**
- revisar card de meta
- revisar card de vendido
- revisar acumulado
- revisar projeção
- revisar % de atingimento
- validar fórmulas

**Critérios de aceite**
- cards de topo refletem os números da metodologia
- projeção e atingimento batem com cálculo oficial

**Dependências**
- STORY-02.4

---

### STORY-03.2 — Implementar grade operacional por vendedor
**Descrição:** mostrar claramente a operação da equipe.  
**Agente principal:** Frontend / UX

**Subtarefas**
- criar grade/lista diária por vendedor
- mostrar status de check-in
- mostrar métricas relevantes por vendedor
- mostrar sem registro

**Critérios de aceite**
- gerente enxerga rapidamente quem lançou, quem não lançou e como está a equipe

**Dependências**
- STORY-02.4
- STORY-01.3

---

### STORY-03.3 — Corrigir ranking oficial
**Descrição:** garantir ranking coerente com a regra da metodologia.  
**Agente principal:** Backend / Data + Frontend / UX

**Subtarefas**
- revisar cálculo do ranking
- revisar % da meta
- tratar VENDA LOJA
- revisar desempates
- testar cenários

**Critérios de aceite**
- ranking bate com regra da loja e da metodologia
- % meta individual não é contaminado

**Dependências**
- STORY-01.4
- STORY-03.1

---

# EPIC-04 — Rotina diária do gerente

## Objetivo
Trazer a rotina real do gerente para dentro do sistema.

## Dependências
- EPIC-03 concluído

## Histórias

### STORY-04.1 — Criar painel “Rotina do Gerente”
**Descrição:** consolidar a rotina da manhã em uma área única.  
**Agente principal:** Frontend / UX

**Subtarefas**
- criar nova rota/tela
- exibir check-ins pendentes
- exibir sem registro
- exibir agendamentos do dia
- exibir resumo do dia anterior
- exibir ranking do momento
- criar atalhos operacionais

**Critérios de aceite**
- gerente consegue operar a manhã em uma única tela

**Dependências**
- STORY-03.2

---

### STORY-04.2 — Registrar execução da rotina diária
**Descrição:** permitir rastreabilidade da rotina gerencial.  
**Agente principal:** Backend / Data

**Subtarefas**
- definir evento/log de rotina diária
- salvar execução
- salvar observações (opcional)
- expor histórico mínimo

**Critérios de aceite**
- o sistema registra que a rotina foi executada
- consultoria/admin pode auditar aderência gerencial

**Dependências**
- STORY-04.1

---

# EPIC-05 — Relatório matinal oficial

## Objetivo
Implementar o matinal oficial da metodologia.

## Dependências
- EPIC-04 concluído
- EPIC-01 concluído

## Histórias

### STORY-05.1 — Construir engine de geração do matinal
**Descrição:** consolidar dados diários da loja para composição do e-mail.  
**Agente principal:** Backend / Data

**Subtarefas**
- buscar dados da loja
- calcular projeção
- calcular faltantes
- identificar sem registro
- montar bloco resumido por vendedor
- preparar payload do template

**Critérios de aceite**
- a engine gera payload consistente para qualquer loja com dados válidos

**Dependências**
- STORY-03.1
- STORY-01.3
- STORY-01.6

---

### STORY-05.2 — Implementar template HTML do matinal
**Descrição:** criar o e-mail oficial do matinal.  
**Agente principal:** Automation / Messaging + Frontend / UX

**Subtarefas**
- estruturar cabeçalho
- estruturar bloco falta pouco / meta
- estruturar cards por vendedor
- estruturar bloco final de meta/projeção/atingimento
- incluir CTA de WhatsApp
- validar versão mobile do e-mail

**Critérios de aceite**
- o e-mail está visualmente correto
- segue a lógica oficial da metodologia

**Dependências**
- STORY-05.1

---

### STORY-05.3 — Agendar envio às 10:30
**Descrição:** automatizar disparo oficial.  
**Agente principal:** Automation / Messaging

**Subtarefas**
- criar job/agendamento
- vincular destinatários da loja
- registrar sucesso/falha
- tratar reenvio manual se necessário

**Critérios de aceite**
- envio ocorre às 10:30
- logs de disparo ficam salvos

**Dependências**
- STORY-05.2

---

### STORY-05.4 — Gerar anexo exportável do matinal
**Descrição:** anexar visão exportável ao e-mail.  
**Agente principal:** Automation / Messaging + Backend / Data

**Subtarefas**
- definir formato do anexo
- montar exportação
- anexar no e-mail
- validar consistência com painel da loja

**Critérios de aceite**
- anexo acompanha o matinal
- conteúdo do anexo bate com o consolidado da loja

**Dependências**
- STORY-05.1

---

# EPIC-06 — Mensagem padrão de WhatsApp

## Objetivo
Automatizar a mensagem oficial do grupo da loja.

## Dependências
- EPIC-05 concluído

## Histórias

### STORY-06.1 — Gerar texto padrão de WhatsApp a partir do matinal
**Descrição:** transformar o matinal em mensagem pronta.  
**Agente principal:** Automation / Messaging

**Subtarefas**
- estruturar template da mensagem
- incluir referência da data
- incluir resumo do mês
- incluir projeção
- incluir registros do dia
- incluir ranking
- incluir sem registro

**Critérios de aceite**
- texto gerado é legível, útil e pronto para envio
- conteúdo bate com o matinal

**Dependências**
- STORY-05.1

---

### STORY-06.2 — Criar CTA de compartilhamento
**Descrição:** permitir ao gerente compartilhar rapidamente a mensagem.  
**Agente principal:** Frontend / UX + Automation / Messaging

**Subtarefas**
- criar botão/call-to-action
- abrir fluxo de compartilhamento
- validar experiência em mobile
- registrar evento de uso

**Critérios de aceite**
- gerente consegue compartilhar sem editar o texto
- fluxo funciona em mobile e desktop quando aplicável

**Dependências**
- STORY-06.1

---

# EPIC-07 — Feedback semanal oficial

## Objetivo
Implementar o motor semanal automatizado da metodologia.

## Dependências
- EPIC-05 concluído
- EPIC-01 concluído

## Histórias

### STORY-07.1 — Construir consolidado semanal por loja e vendedor
**Descrição:** fechar semana anterior automaticamente.  
**Agente principal:** Backend / Data

**Subtarefas**
- definir janela semanal
- consolidar leads, agendamentos, visitas e vendas
- calcular médias da loja
- calcular meta semanal aproximada
- tratar vigência da equipe

**Critérios de aceite**
- consolidado semanal por vendedor e loja é consistente
- média da equipe está correta

**Dependências**
- STORY-01.2
- STORY-02.4

---

### STORY-07.2 — Implementar motor de diagnóstico semanal
**Descrição:** gerar leitura do gargalo e da ação recomendada.  
**Agente principal:** Backend / Data + Product Architect

**Subtarefas**
- aplicar benchmark 20/60/33
- calcular real x ideal
- identificar principal gargalo
- gerar diagnóstico
- gerar orientação de ação
- gerar explicação do critério

**Critérios de aceite**
- diagnóstico semanal respeita a lógica da metodologia
- texto de ação é coerente com o gargalo

**Dependências**
- STORY-07.1
- STORY-01.5

---

### STORY-07.3 — Implementar e-mail semanal com relatório completo
**Descrição:** criar e disparar o semanal oficial.  
**Agente principal:** Automation / Messaging

**Subtarefas**
- montar template do e-mail
- incluir link para relatório completo
- incluir sugestões de mensagem
- disparar para destinatários da loja
- registrar logs
- agendar para segunda às 12:30

**Critérios de aceite**
- e-mail semanal é disparado automaticamente
- conteúdo corresponde ao consolidado semanal

**Dependências**
- STORY-07.2
- STORY-01.6

---

# EPIC-08 — Painel de Feedback Estruturado

## Objetivo
Transformar a reunião semanal do gerente em rotina gerencial de verdade.

## Dependências
- EPIC-07 concluído

## Histórias

### STORY-08.1 — Criar painel de feedback estruturado por vendedor
**Descrição:** painel analítico e operacional para a reunião semanal.  
**Agente principal:** Frontend / UX

**Subtarefas**
- criar cabeçalho do vendedor
- exibir números da semana
- exibir análise de aproveitamento
- exibir comparativo com equipe
- exibir diagnóstico
- exibir orientação de ação

**Critérios de aceite**
- gerente enxerga todos os dados necessários em uma única tela

**Dependências**
- STORY-07.2

---

### STORY-08.2 — Implementar formulário gerencial obrigatório
**Descrição:** registrar o feedback com campos obrigatórios.  
**Agente principal:** Frontend / UX + Backend / Data

**Subtarefas**
- criar campo de meta compromisso
- criar campo de pontos positivos
- criar campo de pontos de atenção
- criar campo de orientação da semana
- salvar histórico semanal

**Critérios de aceite**
- gerente não consegue concluir sem preencher os campos obrigatórios
- histórico semanal fica salvo por vendedor

**Dependências**
- STORY-08.1

---

### STORY-08.3 — Implementar lógica da meta compromisso
**Descrição:** permitir cálculo baseado em estatística dos últimos 15 dias.  
**Agente principal:** Backend / Data

**Subtarefas**
- definir cálculo base
- puxar histórico dos 15 dias
- sugerir meta compromisso automática
- permitir ajuste manual do gerente
- salvar valor final escolhido

**Critérios de aceite**
- gerente vê sugestão coerente
- meta compromisso pode ser explicada e auditada

**Dependências**
- STORY-08.2

---

### STORY-08.4 — Implementar leitura do vendedor
**Descrição:** o vendedor deve conseguir visualizar e confirmar o feedback.  
**Agente principal:** Frontend / UX + Backend / Data

**Subtarefas**
- criar visão do vendedor
- mostrar feedback recebido
- registrar confirmação de leitura
- mostrar histórico

**Critérios de aceite**
- vendedor consegue ler e confirmar
- gerente sabe quem leu e quem não leu

**Dependências**
- STORY-08.2

---

# EPIC-09 — Painel de PDI completo

## Objetivo
Trazer o PDI completo da metodologia para dentro do produto.

## Dependências
- EPIC-08 concluído

## Histórias

### STORY-09.1 — Expandir estrutura do PDI
**Descrição:** sair do PDI resumido atual para o PDI metodológico.  
**Agente principal:** Product Architect + Backend / Data

**Subtarefas**
- modelar metas 6 meses
- modelar metas 12 meses
- modelar metas 24 meses
- modelar capacidades
- modelar ações de desenvolvimento
- modelar revisão mensal

**Critérios de aceite**
- schema do PDI suporta o método completo

**Dependências**
- STORY-01.1

---

### STORY-09.2 — Criar tela de aplicação inicial do PDI
**Descrição:** permitir aplicação completa em reunião individual.  
**Agente principal:** Frontend / UX

**Subtarefas**
- criar bloco de identificação
- criar blocos de metas por horizonte
- criar bloco de capacidade atual
- criar bloco de ações
- criar bloco de compromisso

**Critérios de aceite**
- gerente consegue conduzir a aplicação inicial no sistema

**Dependências**
- STORY-09.1

---

### STORY-09.3 — Implementar revisão mensal do PDI
**Descrição:** acompanhar evolução sem o PDI virar documento morto.  
**Agente principal:** Frontend / UX + Backend / Data

**Subtarefas**
- criar timeline de revisões
- criar campos de evolução
- criar campos de dificuldade
- criar ajuste de ações
- registrar próxima revisão

**Critérios de aceite**
- histórico mensal do PDI fica salvo e navegável

**Dependências**
- STORY-09.2

---

### STORY-09.4 — Implementar exportação em PDF
**Descrição:** gerar documento final do PDI.  
**Agente principal:** Automation / Messaging + Frontend / UX

**Subtarefas**
- definir template de PDF
- montar exportação
- validar impressão
- validar integridade dos dados

**Critérios de aceite**
- sistema gera PDF completo do PDI
- PDF pode ser entregue ao vendedor

**Dependências**
- STORY-09.2

---

# EPIC-10 — Visão geral multi-loja da consultoria

## Objetivo
Dar à consultoria MX o painel real da rede.

## Dependências
- EPIC-07 concluído
- EPIC-03 concluído

## Histórias

### STORY-10.1 — Implementar consolidado multi-loja da metodologia
**Descrição:** construir visão geral por loja com leitura objetiva.  
**Agente principal:** Backend / Data

**Subtarefas**
- consolidar leads por loja
- consolidar agendamentos por loja
- consolidar visitas por loja
- consolidar vendas por loja
- consolidar meta, gap e projeção
- consolidar status atual

**Critérios de aceite**
- o backend retorna visão geral multi-loja completa

**Dependências**
- STORY-03.1
- STORY-07.1

---

### STORY-10.2 — Criar tela de visão geral multi-loja
**Descrição:** painel operacional da consultoria, sem linguagem abstrata.  
**Agente principal:** Frontend / UX

**Subtarefas**
- criar tabela/lista de lojas
- aplicar semáforo por pacing
- mostrar disciplina por loja
- permitir filtros
- permitir ordenação
- ajustar densidade visual

**Critérios de aceite**
- consultor/admin consegue identificar rapidamente:
  - lojas em risco
  - lojas com baixa disciplina
  - lojas acima da meta

**Dependências**
- STORY-10.1
- STORY-00.3

---

# EPIC-11 — Reprocessamento e reparo administrativo

## Objetivo
Evitar quebra operacional por mudanças de input e reduzir dependência de script externo.

## Dependências
- EPIC-01 concluído

## Histórias

### STORY-11.1 — Criar engine de reprocessamento da base
**Descrição:** reconstruir base oficial a partir de inputs.  
**Agente principal:** Backend / Data

**Subtarefas**
- implementar reprocessamento
- validar estrutura
- aplicar fallback controlado
- gerar warnings
- gerar logs

**Critérios de aceite**
- base pode ser reconstruída sem intervenção manual no banco

**Dependências**
- STORY-01.1
- STORY-01.6

---

### STORY-11.2 — Criar tela administrativa de reparo
**Descrição:** expor reprocessamento ao admin com segurança.  
**Agente principal:** Frontend / UX

**Subtarefas**
- criar interface de reprocessamento
- mostrar status
- mostrar warnings
- mostrar volume de linhas
- mostrar histórico de execuções

**Critérios de aceite**
- admin consegue reprocessar e auditar resultados sem ferramenta externa

**Dependências**
- STORY-11.1

---

# EPIC-12 — Treinamentos e notificações operacionais

## Objetivo
Transformar módulos mornos em módulos de correção real.

## Dependências
- EPIC-08 concluído
- EPIC-09 concluído

## Histórias

### STORY-12.1 — Vincular treinamento a gargalo
**Descrição:** transformar treinamento em ferramenta de correção.  
**Agente principal:** Product Architect + Backend / Data

**Subtarefas**
- mapear gargalos possíveis
- mapear categorias de treinamento
- definir regra de recomendação
- persistir vínculo

**Critérios de aceite**
- sistema consegue recomendar treinamento a partir de gargalo

**Dependências**
- STORY-07.2

---

### STORY-12.2 — Exibir pendência de treinamento por vendedor
**Descrição:** acompanhar correção de desempenho via consumo de conteúdo.  
**Agente principal:** Frontend / UX

**Subtarefas**
- mostrar treinamento pendente
- mostrar treinamento recomendado
- mostrar status de consumo
- mostrar pendência na visão do gerente

**Critérios de aceite**
- gerente e vendedor sabem o que foi prescrito e o que foi consumido

**Dependências**
- STORY-12.1

---

### STORY-12.3 — Implementar notificações operacionais reais
**Descrição:** tornar notificações parte da rotina.  
**Agente principal:** Automation / Messaging + Backend / Data

**Subtarefas**
- notificação de sem registro
- notificação de atraso no check-in
- notificação de feedback pendente
- notificação de revisão de PDI pendente
- segmentação por loja e papel

**Critérios de aceite**
- notificações acompanham operação real
- notificações são segmentadas corretamente

**Dependências**
- STORY-01.3
- STORY-08.4
- STORY-09.3

---

# EPIC-13 — Hardening, regressão e aceite final

## Objetivo
Garantir que tudo funcione junto, sem regressão e sem fantasia operacional.

## Dependências
- todos os épicos anteriores concluídos

## Histórias

### STORY-13.1 — Criar suíte de QA por fase
**Descrição:** validar cada fase com critérios objetivos.  
**Agente principal:** QA / Validation

**Subtarefas**
- criar checklist por épico
- criar casos de teste de regra
- criar casos de cálculo
- criar casos de automação
- criar casos de UX crítica

**Critérios de aceite**
- cada épico tem QA próprio
- regressão é rastreável

**Dependências**
- todos os épicos anteriores

---

### STORY-13.2 — Validar aderência final à metodologia MX
**Descrição:** garantir que o sistema final é método digitalizado, não SaaS genérico.  
**Agente principal:** Product Architect + QA

**Subtarefas**
- validar semântica do check-in
- validar matinal
- validar semanal
- validar feedback estruturado
- validar PDI
- validar visão geral multi-loja
- validar sem registro
- validar regra VENDA LOJA

**Critérios de aceite**
- todos os 12 critérios de pronto global do plano v1.1 estão satisfeitos

**Dependências**
- STORY-13.1

---

# 5. Matriz resumida de dependências

## Caminho crítico
EPIC-00 → EPIC-01 → EPIC-02 → EPIC-03 → EPIC-04 → EPIC-05 → EPIC-06 → EPIC-07 → EPIC-08 → EPIC-09 → EPIC-10 → EPIC-11 → EPIC-12 → EPIC-13

## Dependências transversais
- EPIC-01 alimenta quase tudo
- EPIC-07 depende de EPIC-01, EPIC-02 e EPIC-05
- EPIC-08 depende de EPIC-07
- EPIC-09 depende de EPIC-08
- EPIC-10 depende de EPIC-03 e EPIC-07
- EPIC-12 depende de EPIC-08 e EPIC-09

---

# 6. Definição de pronto

Cada história só pode ser considerada pronta quando:
1. regra de negócio foi implementada
2. dado foi persistido corretamente
3. interface consome corretamente
4. automações envolvidas funcionam
5. logs/auditoria existem quando necessário
6. QA aprovou
7. não existe desvio metodológico

---

# 7. Instrução final para agentes

Ao executar qualquer história, os agentes devem registrar:

- hipótese de implementação
- regra de negócio aplicada
- dependências usadas
- impacto em dados
- impacto em automações
- risco de regressão
- evidência de aceite

Se a história não puder provar aderência metodológica, ela não está pronta.

---

**Fim do backlog executável.**


---
# 8. Ajustes validados nesta versão 1.1

## Ajustes obrigatórios incorporados
1. Fonte única da meta mensal deve ficar em `store_meta_rules`, e não duplicada em `stores`.
2. `store_sellers` deve ser tratada como camada operacional de vigência, complementar a `memberships`.
3. Toda loja precisa ter `source_mode` explícito:
   - `legacy_forms`
   - `native_app`
   - `hybrid`
4. Jobs do matinal, semanal e reprocessamento precisam ser **idempotentes**.
5. O backlog deve contemplar migração/backfill e permissões/RLS.

---
# EPIC-01A — Configuração operacional por loja

## Objetivo
Dar superfície operacional para aquilo que no plano já foi modelado em dados.

## Dependências
- STORY-01.1 concluída

## Histórias

### STORY-01A.1 — CRUD de destinatários e canal de entrega por loja
**Descrição:** permitir configurar e-mails e referência de grupo por loja.  
**Agente principal:** Frontend / UX + Backend / Data

**Subtarefas**
- criar tela/aba de configuração operacional da loja
- editar destinatários do matinal
- editar destinatários do semanal
- editar referência de WhatsApp
- validar múltiplos destinatários

**Critérios de aceite**
- admin consegue configurar canais de entrega por loja sem editar banco

**Dependências**
- STORY-01.6

### STORY-01A.2 — CRUD de benchmark por loja
**Descrição:** permitir gestão operacional do benchmark.  
**Agente principal:** Frontend / UX + Backend / Data

**Subtarefas**
- criar interface de benchmark
- carregar default MX
- permitir override por loja
- exibir histórico de alteração

**Critérios de aceite**
- benchmark é configurável via interface e auditável

**Dependências**
- STORY-01.5

### STORY-01A.3 — CRUD de vigência da equipe comercial
**Descrição:** permitir controlar entrada/saída/afastamento sem processo externo.  
**Agente principal:** Frontend / UX + Backend / Data

**Subtarefas**
- criar gestão da equipe da loja
- definir data de início
- definir data de término
- definir afastamento/inatividade
- aplicar regra de fechamento do mês

**Critérios de aceite**
- admin/gerente autorizado consegue manter a vigência da equipe sem planilha

**Dependências**
- STORY-01.2

---
# EPIC-01B — Migração, cutover e convivência legado/nativo

## Objetivo
Garantir transição controlada entre formulário/planilha/CRM e app nativo.

## Dependências
- EPIC-01 concluído

## Histórias

### STORY-01B.1 — Definir `source_mode` por loja
**Descrição:** congelar a fonte de verdade operacional por loja.  
**Agente principal:** Product Architect + Backend / Data

**Subtarefas**
- modelar `source_mode`
- permitir valores `legacy_forms`, `native_app`, `hybrid`
- aplicar no motor de consolidação

**Critérios de aceite**
- cada loja possui modo de operação explícito
- motores leem a fonte correta

**Dependências**
- STORY-01.1

### STORY-01B.2 — Implementar backfill/migração inicial
**Descrição:** migrar dados atuais para o modelo canônico sem perda operacional.  
**Agente principal:** Backend / Data

**Subtarefas**
- mapear fontes atuais
- definir estratégia de backfill
- criar rotina de migração
- validar consistência pós-migração
- registrar logs

**Critérios de aceite**
- dados históricos essenciais existem no modelo novo
- migração deixa trilha auditável

**Dependências**
- STORY-01B.1

### STORY-01B.3 — Validar convivência em modo híbrido
**Descrição:** impedir duplicidade e conflito entre app e legado.  
**Agente principal:** Backend / Data + QA

**Subtarefas**
- definir prioridade de fonte
- deduplicar registros
- impedir dupla contagem
- criar testes de coexistência

**Critérios de aceite**
- loja híbrida opera sem duplicar painel, ranking, matinal ou semanal

**Dependências**
- STORY-01B.1
- STORY-01B.2

---
# EPIC-05A — Idempotência e confiabilidade das automações

## Objetivo
Garantir que matinal, semanal e reprocessamento não disparem duplicado nem gerem inconsistência.

## Dependências
- EPIC-05, EPIC-07 e EPIC-11 em andamento

## Histórias

### STORY-05A.1 — Idempotência do matinal
**Descrição:** evitar duplicidade no disparo diário.  
**Agente principal:** Automation / Messaging + Backend / Data

**Subtarefas**
- gerar chave idempotente por loja/data
- bloquear envio duplicado
- registrar tentativa duplicada
- criar reenvio manual controlado

**Critérios de aceite**
- não existem matinais duplicados para mesma loja/data salvo reenvio explícito

**Dependências**
- STORY-05.3

### STORY-05A.2 — Idempotência do semanal
**Descrição:** evitar duplicidade no disparo semanal.  
**Agente principal:** Automation / Messaging + Backend / Data

**Subtarefas**
- gerar chave idempotente por loja/período
- bloquear duplicatas
- registrar reprocessos/reenvios
- criar testes

**Critérios de aceite**
- não existem semanais duplicados para mesma loja/período salvo reenvio explícito

**Dependências**
- STORY-07.3

### STORY-05A.3 — Idempotência do reprocessamento
**Descrição:** garantir reparo administrativo sem corromper a base.  
**Agente principal:** Backend / Data

**Subtarefas**
- definir política de replay
- evitar reprocessar duas vezes o mesmo lote sem intenção explícita
- registrar hash/lote/origem
- criar rollback lógico quando necessário

**Critérios de aceite**
- reprocessamentos são repetíveis e auditáveis sem corromper consolidado

**Dependências**
- STORY-11.1

---
# EPIC-13A — Permissões, RLS e auditoria operacional

## Objetivo
Fechar segurança funcional do núcleo novo.

## Dependências
- EPIC-01 concluído

## Histórias

### STORY-13A.1 — Matriz de permissões do núcleo
**Descrição:** explicitar quem vê e quem edita cada módulo e dado.  
**Agente principal:** Product Architect + Backend / Data

**Subtarefas**
- definir matriz por papel
- definir escopo por loja
- definir permissões de exportação
- definir leitura de feedback e PDI

**Critérios de aceite**
- matriz oficial aprovada e usada na implementação

**Dependências**
- STORY-00.1
- STORY-01.1

### STORY-13A.2 — Implementar políticas de acesso / RLS
**Descrição:** garantir isolamento e segurança dos novos módulos.  
**Agente principal:** Backend / Data

**Subtarefas**
- aplicar políticas por loja
- aplicar políticas por papel
- restringir feedback/PDI
- restringir exportações
- criar testes de violação

**Critérios de aceite**
- usuário não acessa dados fora da loja/escopo permitido
- feedback e PDI respeitam o papel correto

**Dependências**
- STORY-13A.1

### STORY-13A.3 — Auditoria de ações sensíveis
**Descrição:** registrar o que precisa ser rastreável.  
**Agente principal:** Backend / Data + QA

**Subtarefas**
- logar mudanças de benchmark
- logar reprocessamento
- logar envio manual/reenvio
- logar alteração de vigência
- logar leitura/assinatura de feedback e PDI

**Critérios de aceite**
- ações sensíveis deixam trilha auditável

**Dependências**
- STORY-13A.2
