# Plano Operacional de Produto — MX Gestão Preditiva
**Versão:** 1.3 — Papéis e Permissões Congelados  
**Objetivo:** documento operacional para agentes de IA executarem a evolução completa do produto com base na metodologia MX, no sistema legado, nos prints do sistema atual e nas regras de negócio consolidadas.

---

## 1. Objetivo do plano

Este plano existe para transformar o diagnóstico em execução.  
Ele define, em ordem prática:

- o que deve ser preservado da metodologia
- o que deve ser corrigido no produto atual
- o que deve ser removido do core
- o que cada agente de IA deve construir
- em que ordem executar
- como validar
- quando considerar cada entrega como concluída

Este documento deve ser tratado como **fonte operacional de execução**.

---

## 2. Regra de ouro

O produto **não** pode ser desenhado como um CRM genérico.  
O produto deve ser o **sistema operacional da metodologia MX** para lojas automotivas.

Logo, o sistema precisa reproduzir fielmente estes pilares:

1. lançamento diário estruturado  
2. base oficial padronizada  
3. painel diário da loja com ranking e projeção  
4. relatório matinal diário com envio oficial  
5. mensagem padrão para WhatsApp  
6. feedback semanal automatizado  
7. feedback estruturado gerencial  
8. PDI formal com revisão mensal  
9. visão geral multi-loja da consultoria  
10. reprocessamento/reconstrução da base quando necessário

---

## 3. Fontes de verdade congeladas

Os agentes devem seguir estas fontes em ordem de prioridade:

### Fonte 1 — Metodologia operacional MX / legado
É a verdade da regra de negócio.

### Fonte 2 — Sistema atual funcionando
É a verdade do estado atual implementado.

### Fonte 3 — PRD / plano operacional
É a verdade da evolução do produto.

### Fonte 4 — Concorrentes
Servem apenas como repertório visual e estratégico.  
Nunca como fonte de regra de negócio.

---

## 4. Regras congeladas da metodologia

## 4.1 Lançamento diário
O sistema deve respeitar a lógica abaixo:

- data do preenchimento = dia atual
- leads = referência ao dia anterior
- vendas = referência ao dia anterior
- comparecimento de visitas = referência ao dia anterior
- agendamentos = referência ao dia atual

## 4.2 Horários oficiais
- Relatório diário / matinal: **10:30**
- Feedback semanal: **segunda-feira às 12:30**
- Janela de disciplina do vendedor: até **09:30/09:45**

## 4.3 Benchmark oficial padrão
- Leads → Agendamento = **20%**
- Agendamento → Visita = **60%**
- Visita → Venda = **33%**

## 4.4 Regra “VENDA LOJA”
- conta para resultado da loja
- pode aparecer em ranking/consolidado
- **não** pode contaminar meta individual de vendedor

## 4.5 Campos canônicos da base
Toda consolidação operacional deve partir deste modelo:

- `DATA`
- `LOJA`
- `VENDEDOR`
- `LEADS`
- `VND_PORTA`
- `AGD_CART`
- `VND_CART`
- `AGD_NET`
- `VND_NET`
- `VISITA`

## 4.6 Regra de “SEM REGISTRO”
O sistema deve marcar como **SEM REGISTRO** todo vendedor ativo da loja que:
- esteja vigente na equipe da loja no dia de referência
- não tenha lançado o check-in dentro da janela operacional
- não esteja marcado como afastado/inativo no período

## 4.7 Vigência de vendedores na loja
O sistema deve suportar:
- entrada de vendedor com data de início
- saída de vendedor com data de término
- permanência no fechamento do mês quando necessário
- desaparecimento automático de vendedor encerrado em novo ciclo/período

## 4.8 Destinatários por loja
Cada loja deve suportar:
- um ou mais e-mails destinatários do matinal
- um ou mais e-mails destinatários do semanal
- grupo/identificador de WhatsApp de referência (quando aplicável)

## 4.9 Formato oficial dos artefatos
Fica congelado para o produto:
- matinal: e-mail HTML + anexo exportável (`.xlsx`) + CTA WhatsApp
- semanal: e-mail HTML + link para relatório completo + exportável por vendedor/loja
- PDI: exportação oficial em PDF

## 4.10 Estratégia de fonte de verdade / cutover
Durante a transição, o produto deve suportar explicitamente:
- modo legado (Forms/planilha/CRM como insumo operacional)
- modo nativo (check-in realizado no próprio sistema)
- modo híbrido controlado por loja

Toda loja deve possuir um `source_mode` configurável:
- `legacy_forms`
- `native_app`
- `hybrid`

Nenhum agente pode assumir migração total sem plano de cutover.

---


## 4.11 Regras congeladas de acesso
- **admin**: visão global e operação estrutural total
- **dono**: somente lojas vinculadas como owner/executivo
- **gerente**: somente loja vinculada como manager
- **vendedor**: somente registros próprios e leituras permitidas

## 4.12 Regra de hierarquia operacional
- dono acompanha
- gerente opera
- vendedor executa
- admin governa e audita

O sistema não deve permitir que o dono substitua o gerente na rotina operacional por padrão.


## 5. Diagnóstico congelado do produto atual

## 5.1 Implementado de verdade
- autenticação e papéis
- gestão de lojas
- painel consultor/admin
- dashboard da loja
- ranking
- metas
- funil
- histórico
- treinamentos
- produtos digitais
- notificações
- feedback
- PDI
- configurações

## 5.2 Parcial
- check-in diário
- relatório matinal
- feedback estruturado
- PDI metodológico
- visão geral multi-loja
- notificações operacionais
- treinamentos como motor de correção

## 5.3 Faltando para 100%
- modelo temporal correto do check-in
- motor oficial do matinal
- motor oficial do feedback semanal
- feedback estruturado completo
- PDI completo
- reprocessamento da base
- tratamento formal de “VENDA LOJA”
- fluxo gerencial ponta a ponta
- vigência de vendedores
- regra operacional de “sem registro”

## 5.4 Desvios da metodologia
- linguagem muito SaaS/genérica
- matinal com cara editorial
- feedback genérico demais
- PDI resumido demais
- navegação com módulos demais fora do núcleo
- excesso de herança de módulos não centrais

## 5.5 Riscos técnicos ainda não congelados
- ausência de plano explícito de migração/backfill
- ausência de política de idempotência para jobs diários/semanais
- ausência de escopo explícito de permissões/RLS para os novos módulos

---

## 6. Escopo oficial do core

O core oficial do produto passa a ser:

### Consultoria / Admin
- Painel Geral
- Lojas
- Equipes
- Metas
- Visão Geral
- Relatório Matinal
- Feedback Semanal
- Treinamentos
- Notificações
- Configurações
- Reprocessamento da Base

### Gerente
- Painel da Loja
- Equipe
- Check-ins
- Ranking
- Feedback Estruturado
- PDI
- Treinamentos
- Notificações
- Rotina Diária

### Vendedor
- Home
- Lançamento Diário
- Histórico
- Ranking
- Feedback
- PDI
- Treinamentos
- Notificações

---


## 6.1 Matriz oficial de papéis e permissões

### Admin
**Escopo:** todas as lojas

**Pode ver**
- lojas
- donos
- gerentes
- vendedores
- performance
- metas
- benchmarks
- funil
- treinamentos
- produtos digitais
- notificações
- relatórios
- reprocessamento
- PDI
- feedback

**Pode fazer**
- criar, editar e desativar lojas
- vincular donos, gerentes e vendedores
- configurar metas e benchmarks
- cadastrar treinamentos e produtos digitais
- enviar notificações
- executar reprocessamento
- ver relatórios globais
- auditar feedbacks e PDIs

**Regra**
- possui governança total, com trilha de auditoria obrigatória em ações sensíveis

### Dono
**Escopo:** suas lojas

**Pode ver**
- suas lojas
- gerentes
- vendedores
- performance da loja
- metas
- funil
- relatórios
- feedbacks e PDIs da equipe

**Pode fazer**
- acompanhar operação
- acompanhar evolução da equipe
- acompanhar metas e desempenho por loja, gerente e vendedor
- aprovar ou consultar decisões gerenciais, se a política da operação exigir

**Não opera por padrão**
- check-ins
- reprocessamento
- benchmark técnico
- rotina diária do gerente
- edição de feedback/PDI, salvo política explícita

**Regra**
- papel executivo de acompanhamento, não papel operacional primário

### Gerente
**Escopo:** sua loja

**Pode ver**
- sua loja
- sua equipe
- check-ins
- ranking
- metas
- funil
- feedbacks
- PDIs
- treinamentos

**Pode fazer**
- acompanhar check-ins da equipe
- configurar meta da loja
- configurar metas dos vendedores
- conduzir rotina diária
- conduzir feedback estruturado
- criar e revisar PDI
- acompanhar consumo de treinamentos

**Não pode**
- ver outra loja
- alterar benchmark global
- executar reprocessamento global
- alterar configuração estrutural de outras lojas

**Regra**
- papel operacional central da loja

### Vendedor
**Escopo:** seus próprios dados

**Pode ver**
- seus check-ins
- seu histórico
- seu ranking
- seus treinamentos
- seus feedbacks
- seu PDI
- suas notificações

**Pode fazer**
- lançar check-in
- editar check-in dentro da regra permitida
- marcar treinamentos como vistos
- marcar feedback como lido
- marcar PDI como lido
- atualizar andamento do PDI, se a política permitir

**Não pode**
- ver dados de outros vendedores
- editar meta
- editar benchmark
- criar feedback
- criar PDI
- reprocessar base

**Regra**
- papel de execução individual e leitura do próprio desenvolvimento


## 7. O que sai do core imediatamente

Os módulos abaixo devem ser retirados da navegação principal do produto, indo para:
- `/legacy`
- feature flag
- ou backlog separado

### Módulos fora do core metodológico
- LeadOps
- Leads
- Agenda
- Tarefas
- Financeiro
- Inventory / Estoque
- Regras de Incentivo
- Reports genéricos
- IA Diagnostics
- Gamification
- Activities
- Communication

**Importante:** isso não significa apagar agora.  
Significa **não deixar esses módulos competirem com o núcleo MX**.

---

# 8. Plano de execução por fases

## Fase 0 — Congelamento e preparação
### Objetivo
Parar a bagunça antes de construir.

### Entregas
1. congelar escopo oficial do core
2. mover módulos legacy para área separada
3. revisar navegação por papel
4. alinhar naming do produto para MX Gestão Preditiva
5. atualizar documentação interna

### Critério de aceite
- o sistema abre sem confundir usuário com módulos que não pertencem ao núcleo
- a navegação principal reflete a metodologia MX
- a linguagem principal do sistema usa:
  - loja
  - vendedor
  - gerente
  - projeção
  - meta
  - gap
  - sem registro
  - feedback estruturado
  - PDI

---

## Fase 1 — Domínio e dados canônicos
### Objetivo
Corrigir o modelo de dados operacional para refletir a metodologia.

### Entregas
1. modelar `submitted_at`
2. modelar `reference_date`
3. consolidar base canônica dos indicadores
4. formalizar regra `VENDA LOJA`
5. formalizar benchmark por loja com default MX
6. criar log de reprocessamento/importação
7. modelar vigência da equipe
8. modelar destinatários por loja
9. modelar regra de sem registro

### Modelo obrigatório mínimo
#### Tabela: `stores`
- id
- name
- active
- created_at
- updated_at

#### Tabela: `store_sellers`
- id
- store_id
- seller_user_id
- started_at
- ended_at nullable
- is_active
- closing_month_grace
- created_at
- updated_at

> `store_sellers` é a camada operacional de vigência da equipe comercial da loja.  
> A relação de autenticação/papel global continua em `users`/`memberships`.  
> Não substituir `memberships`; complementar com vigência operacional.

#### Tabela: `daily_checkins`
- id
- store_id
- seller_user_id
- submitted_at
- reference_date
- leads_prev_day
- vnd_porta_prev_day
- agd_cart_today
- vnd_cart_prev_day
- agd_net_today
- vnd_net_prev_day
- visit_prev_day
- zero_reason
- created_by
- updated_at

#### Tabela: `store_benchmarks`
- store_id
- lead_to_agend
- agend_to_visit
- visit_to_sale
- updated_by
- updated_at

#### Tabela: `store_delivery_rules`
- store_id
- matinal_recipients
- weekly_recipients
- whatsapp_group_ref
- timezone
- active
- updated_by
- updated_at

#### Tabela: `store_meta_rules`
- store_id
- monthly_goal
- individual_goal_mode
- include_venda_loja_in_store_total
- include_venda_loja_in_individual_goal = false
- updated_by
- updated_at

#### Tabela: `reprocess_logs`
- id
- store_id nullable
- source_type
- triggered_by
- status
- rows_processed
- warnings
- errors
- started_at
- finished_at

### Critério de aceite
- o sistema diferencia dado do dia atual e do dia anterior
- o backend consolida corretamente a base oficial
- a regra “VENDA LOJA” está implementada no domínio
- benchmark pode ser configurado por loja
- o sistema sabe quem deveria ter lançado no dia
- a loja pode ter múltiplos destinatários de relatórios

---

## Fase 2 — Check-in diário do vendedor
### Objetivo
Fazer o lançamento diário bater 100% com a metodologia.

### Entregas
1. refazer tela de lançamento com semântica explícita
2. separar visualmente:
   - números de ontem
   - agenda de hoje
3. exibir deadline de preenchimento
4. mostrar impacto do não preenchimento
5. validar zero total com justificativa
6. impedir números negativos
7. alimentar painéis e motores automáticos após salvar

### Estrutura obrigatória da interface
#### Bloco A — Referência do registro
- Data de referência
- Loja
- Vendedor
- Deadline operacional

#### Bloco B — Produção do dia anterior
- Leads novos recebidos no dia anterior
- Vendas porta (ontem)
- Vendas carteira vendedor (ontem)
- Vendas internet (ontem)
- Comparecimento de visitas (ontem)

#### Bloco C — Agenda do dia atual
- Agendamentos carteira (hoje)
- Agendamentos internet (hoje)

#### Bloco D — Estado do envio
- enviado dentro do prazo
- enviado fora do prazo
- sem registro

### Critério de aceite
- vendedor entende sem dúvida o que é “ontem” e o que é “hoje”
- dados gravados alimentam corretamente ranking, loja, matinal e semanal
- o não preenchimento gera status “sem registro”

---

## Fase 3 — Painel da loja e ranking oficial
### Objetivo
Fazer o painel da loja refletir o painel operacional da metodologia.

### Entregas
1. revisar cards de topo
2. garantir leitura por:
   - meta
   - vendido
   - acumulado
   - projeção
   - % atingimento
3. garantir grade de vendedores
4. garantir ranking com % meta correto
5. garantir tratamento correto de `VENDA LOJA`
6. permitir filtro por loja, vendedor, período

### Blocos obrigatórios
- Meta do mês
- Vendido hoje / ref
- Acumulado
- Projeção
- % Atingimento
- Ranking mensal
- Total da loja
- Painel diário por vendedor
- Sem registro hoje

### Critério de aceite
- gerente consegue usar o painel como substituto funcional do painel legado
- ranking da loja e % meta batem com as regras originais

---

## Fase 4 — Rotina diária do gerente
### Objetivo
Trazer a rotina real do gerente para dentro do sistema.

### Entregas
1. criar painel “Rotina do Gerente”
2. exibir check-ins pendentes
3. exibir agendamentos do dia
4. exibir fechamento do dia anterior
5. exibir quem está abaixo do ritmo
6. permitir disparo rápido do matinal / grupo
7. registrar execução da rotina diária

### Estrutura obrigatória
- check-ins pendentes
- sem registro
- agendamentos do dia
- resumo do dia anterior
- ranking do momento
- atalho para feedback estruturado
- atalho para enviar mensagem da loja

### Critério de aceite
- gerente consegue executar a rotina da manhã em uma única área do sistema
- o sistema reduz dependência de processo externo/manual

---

## Fase 5 — Relatório matinal oficial
### Objetivo
Implementar o matinal oficial da metodologia, não uma homepage editorial.

### Entregas
1. criar engine de geração do matinal
2. gerar e-mail HTML oficial
3. incluir:
   - projeção
   - vendas do mês
   - meta
   - atingimento
   - alerta de sem registro
   - ranking resumido
4. gerar anexo exportável
5. gerar CTA de WhatsApp
6. agendar envio às 10:30

### Estrutura obrigatória do e-mail
- cabeçalho da loja
- falta pouco / meta batida
- projeção atual
- sem registro hoje
- cards por vendedor:
  - leads
  - agd hoje
  - vnd ontem
  - total mês
- bloco final:
  - vendas
  - meta
  - projeção
  - atingimento
- botão “Enviar no WhatsApp”

### Critério de aceite
- e-mail enviado às 10:30
- texto do WhatsApp é gerado corretamente
- alerta de sem registro aparece corretamente
- anexo exportável acompanha o e-mail

---

## Fase 6 — Mensagem padrão de WhatsApp
### Objetivo
Automatizar a mensagem oficial de grupo.

### Entregas
1. gerar mensagem pronta a partir do matinal
2. incluir:
   - resumo do mês
   - projeção
   - ranking
   - registros do dia
3. abrir CTA de compartilhamento

### Estrutura obrigatória
- bom dia + referência da data
- falta pouco / meta
- resumo geral do mês
- registros de hoje
- ranking acumulado do mês
- sem registro
- assinatura do sistema

### Critério de aceite
- gerente clica e consegue compartilhar sem editar nada
- ranking e percentuais batem com o painel

---

## Fase 7 — Feedback semanal oficial
### Objetivo
Implementar o motor semanal oficial.

### Entregas
1. fechar automaticamente a semana anterior
2. consolidar por loja e vendedor
3. aplicar benchmark 20/60/33
4. calcular meta semanal aproximada
5. gerar comparativo com média da equipe
6. gerar diagnóstico
7. gerar orientação de ação
8. disparar segunda às 12:30
9. gerar e-mail com link do relatório completo

### Estrutura obrigatória por vendedor
- período
- vendas fechadas
- leads recebidos
- agendamentos
- visitas
- análise de oportunidade
- comparativo com equipe
- diagnóstico e ação
- entenda o critério

### Critério de aceite
- o relatório semanal bate com a metodologia e com o script legado
- o gerente consegue usar isso diretamente na reunião semanal

---

## Fase 8 — Painel de Feedback Estruturado
### Objetivo
Transformar o feedback em rotina gerencial de verdade.

### Entregas
1. criar painel próprio “Feedback Estruturado”
2. puxar dados da semana automaticamente
3. mostrar real x ideal
4. mostrar comparativo com equipe
5. obrigar preenchimento de:
   - meta compromisso
   - pontos positivos
   - pontos de atenção
   - orientação da semana
6. salvar histórico semanal por vendedor

### Estrutura obrigatória
- cabeçalho do vendedor
- seus números da semana
- análise de aproveitamento
- comparativo com a equipe
- diagnóstico da semana
- orientação de ação
- meta compromisso
- pontos positivos
- pontos de atenção
- leitura do vendedor

### Regra obrigatória
A **meta compromisso** deve poder ser calculada com base na estatística dos últimos 15 dias, conforme metodologia do gerente.

### Critério de aceite
- gerente consegue conduzir a reunião semanal em uma única tela
- histórico fica salvo por semana e por vendedor

---

## Fase 9 — Painel de PDI completo
### Objetivo
Trazer o PDI real da metodologia para dentro do produto.

### Entregas
1. expandir o PDI atual
2. incluir metas:
   - 6 meses
   - 12 meses
   - 24 meses
3. incluir avaliação de capacidades
4. incluir 5 ações de desenvolvimento
5. incluir revisão mensal
6. incluir histórico
7. incluir exportação em PDF

### Estrutura obrigatória
#### Bloco 1 — Identificação
- loja
- vendedor
- gerente
- data
- status

#### Bloco 2 — Metas
- 3 metas em 6 meses
- 3 metas em 12 meses
- 3 metas em 24 meses

#### Bloco 3 — Capacidade atual
- critérios com nota de 6 a 10

#### Bloco 4 — Ações de desenvolvimento
- ação
- motivo
- prazo
- prioridade
- status

#### Bloco 5 — Revisão mensal
- evolução
- dificuldades
- ajustes
- próxima revisão

### Regra obrigatória
O PDI precisa suportar:
- aplicação inicial de até 45 minutos
- revisão mensal
- histórico de evolução

### Critério de aceite
- gerente consegue aplicar o PDI como na metodologia
- o sistema exporta PDF final do PDI

---

## Fase 10 — Visão geral multi-loja da consultoria
### Objetivo
Dar à MX o painel operacional real da rede.

### Entregas
1. criar visão geral multi-loja orientada à metodologia
2. abandonar linguagem abstrata de cluster
3. mostrar:
   - loja
   - leads
   - agendamentos
   - visitas
   - vendas
   - meta
   - gap
   - projeção
   - status atual
4. semáforo por pacing
5. disciplina por loja
6. filtros e ordenação

### Critério de aceite
- consultor/admin consegue usar a visão geral como equivalente funcional da visão geral do legado
- leitura multi-loja é objetiva, rápida e acionável

---

## Fase 11 — Reprocessamento e reparo administrativo
### Objetivo
Evitar dependência de scripts de planilha e gambiarras manuais.

### Entregas
1. tela de reprocessamento de base
2. validação de estrutura de importação
3. reconstrução da base oficial
4. logs completos
5. warning para campos não encontrados
6. fallback controlado
7. auditoria do que foi reprocessado

### Critério de aceite
- admin consegue reconstruir a base sem acesso técnico ao banco
- todas as ações ficam logadas

---

## Fase 12 — Treinamentos e notificações operacionais
### Objetivo
Tirar treinamentos e notificações do estado “bonitos porém mornos”.

### Treinamentos
Entregas:
1. transformar biblioteca em motor de correção
2. vincular treinamento a gargalo
3. marcar consumo real
4. mostrar pendência por vendedor

### Notificações
Entregas:
1. vendedor sem registro
2. atraso no check-in
3. feedback pendente
4. revisão de PDI pendente
5. notificação por loja e por papel

### Critério de aceite
- treinamentos ajudam correção de desempenho
- notificações refletem a operação real

---

# 9. Plano de agentes de IA

## Agente 1 — Product Architect
### Responsabilidade
- manter coerência do domínio
- travar nomenclatura
- revisar regras de negócio
- aprovar contratos de dados

### Entregas
- modelo de domínio final
- glossário canônico
- mapa de telas
- matriz papel x ação

---

## Agente 2 — Backend / Data Architect
### Responsabilidade
- modelar schema
- implementar regras de consolidação
- implementar benchmark e reprocessamento
- alimentar motores diários e semanais

### Entregas
- migrations
- seeds
- jobs
- logs
- APIs/queries

---

## Agente 3 — Frontend / UX Execution
### Responsabilidade
- refazer navegação
- corrigir check-in
- implementar painéis
- alinhar linguagem e interface

### Entregas
- novas telas
- fluxos por papel
- componentes
- estados vazios e alertas

---

## Agente 4 — Automation / Messaging
### Responsabilidade
- matinal
- semanal
- WhatsApp
- notificações

### Entregas
- jobs agendados
- templates HTML
- templates de mensagem
- auditoria de disparo

---

## Agente 5 — QA / Validation
### Responsabilidade
- validar regras
- validar cálculo
- validar consistência entre telas e motores
- aprovar com checklists

### Entregas
- casos de teste
- regressão
- aceite por fase
- lista de bugs e desvios

---

# 10. Ordem exata de execução

## Sprint 0
- congelar escopo
- remover legacy do core
- alinhar linguagem
- atualizar documentação

## Sprint 1
- schema canônico
- benchmark por loja
- regra VENDA LOJA
- vigência da equipe
- destinatários por loja
- submitted_at / reference_date

## Sprint 2
- check-in novo
- dashboard da loja
- ranking corrigido
- sem registro

## Sprint 3
- rotina do gerente
- motor matinal
- e-mail HTML
- CTA WhatsApp
- anexo

## Sprint 4
- motor semanal
- relatório semanal
- comparativo com equipe

## Sprint 5
- painel Feedback Estruturado
- histórico semanal
- meta compromisso

## Sprint 6
- painel PDI completo
- revisão mensal
- PDF

## Sprint 7
- visão geral multi-loja
- reprocessamento
- notificações operacionais
- treinamentos orientados a gargalo

---

# 11. Critério de pronto global

O produto só pode ser considerado aderente à metodologia MX quando:

1. o vendedor lança corretamente com semântica de ontem/hoje  
2. o gerente recebe o matinal oficial às 10:30  
3. o WhatsApp é disparável com texto pronto  
4. o feedback semanal sai segunda às 12:30 com benchmark oficial  
5. o gerente conduz Feedback Estruturado dentro do sistema  
6. o PDI completo existe com revisão mensal e PDF  
7. o admin enxerga a rede multi-loja na lógica da metodologia  
8. a base pode ser reprocessada com log  
9. “VENDA LOJA” está tratada corretamente  
10. a interface fala a língua da operação MX  
11. a regra de sem registro funciona por vigência de equipe  
12. a rotina diária do gerente pode ser executada dentro do sistema

---

# 12. Proibições para os agentes

Os agentes **não podem**:

- transformar o produto em CRM genérico
- inventar termos abstratos fora da linguagem da operação
- esconder a semântica de ontem/hoje no check-in
- simplificar o PDI para checklist raso
- resumir o feedback estruturado a formulário livre
- manter legacy competindo com o core
- usar concorrente como fonte de regra de negócio

---

# 13. Entregável final esperado

Ao fim da execução, o sistema deve ser:

## Para o vendedor
um painel simples, claro e disciplinador

## Para o gerente
um sistema de cobrança, previsão, feedback e desenvolvimento

## Para a consultoria MX
um console multi-loja com leitura brutalmente objetiva da operação

## Para a metodologia
uma digitalização fiel, auditável e escalável

---

# 14. Instrução final para agentes

Antes de implementar qualquer tela, motor ou automação, os agentes devem perguntar internamente:

1. isso respeita a metodologia original?
2. isso melhora a execução sem distorcer a regra?
3. isso ajuda loja, gerente ou vendedor a decidir melhor?
4. isso parece MX ou parece SaaS genérico?
5. isso pode ser auditado e repetido sem depender de planilha?

Se qualquer resposta for “não”, a implementação deve ser revista antes de seguir.

---

**Fim do plano operacional revisado.**


---
## Ajustes obrigatórios validados nesta versão 1.2

1. **Meta mensal** passa a ter **fonte única** em `store_meta_rules`.
2. `store_sellers` foi explicitada como **camada operacional de vigência**, não substituta de `memberships`.
3. Foi congelada a **estratégia de cutover** entre legado, modo nativo e híbrido.
4. Foi congelado o **formato oficial de exportáveis**:
   - matinal em HTML + `.xlsx`
   - semanal com link/exportável
   - PDI em PDF
5. O plano exige inclusão de:
   - migração/backfill
   - permissões/RLS
   - idempotência de jobs e reprocessamentos
