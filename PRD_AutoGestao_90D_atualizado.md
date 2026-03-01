# PRD — AutoGestão 90D (Consultoria de Performance para Lojistas Automotivos)

**Versão:** 3.0 — 28/02/2026  
**Produto:** AutoGestão 90D  
**Modelo:** Sistema de Consultoria e Gestão de Performance (não-CRM) para **donos de lojas/agências automotivas**, **gerentes** e **vendedores**  
**Plataformas:** Web (Admin/Consultor) + App Web-Mobile (PWA) (Gerente/Vendedor)  
**Base conceitual:** sistema antigo de consultoria (planilha + formulário + automações) descrito em `auditoria_sistema_comercial`  
**IMPORTANTE (escopo):** **não** seguir modelo de CRM (lead→contato→mensagem→ligação→financeiro). O foco é **produção diária**, **funil por indicadores**, **metas**, **ranking**, **feedback/PDI**, **treinamentos** e **comunicação**.

---

## 0) Sumário Executivo

O AutoGestão 90D é um sistema operacional de performance para operação de loja automotiva.  
Ele substitui o “sistema antigo” (Google Sheets + Form + Apps Script) por um produto com:

- **Check-in diário do vendedor** (Leads, Agendamentos, Visitas, Vendas) com validações e anti-duplicidade  
- **Dashboards por papel** (Dono/Consultor, Gerente, Vendedor)  
- **Metas mensais + ritmo** (projeção e “falta X carros”)  
- **Funil** calculado a partir dos indicadores (Leads → Agendamentos → Visitas → Vendas) com benchmarks configuráveis por loja  
- **Ranking** de lojas e vendedores  
- **Feedback semanal automatizado** (baseado nos últimos 7 dias)  
- **Relatório matinal automatizado** (diário)  
- **Treinamentos** (cadastro e consumo)  
- **Notificações** segmentadas por loja (e opcionalmente por papel)  
- **Feedback & PDI** do gerente para o vendedor

---

## 1) Objetivo do Produto

### 1.1 Objetivo principal
Entregar um sistema simples e obrigatório de uso diário, que transforme dados de produção em **gestão** (meta, ritmo, ranking, gargalos e plano de ação).

### 1.2 Objetivos secundários
- Padronizar coleta de dados diária (sem planilhas manuais)
- Reduzir manipulação/erros (data manual, duplicidade, inconsistências)
- Automatizar comunicação de performance (diária e semanal)
- Criar rotina de coaching (feedback e PDI) baseada em evidência

---

## 2) Não-Objetivos (explicitamente fora do escopo)

- CRM de relacionamento (mensagens, ligações, automações de WhatsApp, pipeline detalhado, financeiro)
- Gestão financeira (recebíveis, despesas, DRE)
- Estoque de veículos (catalogação, fotos, anúncios)
- Pós-venda/atendimento de suporte

> Pode existir no futuro, mas **não** entra na V1.

---

## 3) KPIs de Sucesso do Produto

- **Adoção diária:** % de vendedores que registram check-in no dia (meta: ≥ 85%)
- **Qualidade de dados:** % de check-ins válidos (sem inconsistências) (meta: ≥ 95%)
- **Cobertura:** % de lojas com dados em ≥ 5 dias/semana
- **Ação gerencial:** nº de feedbacks/PDI criados por semana por loja
- **Impacto:** evolução de Vendas vs Meta no ciclo 90D (por loja)

---

## 4) Personas e Permissões

### 4.1 Dono / Consultor (WEB)
**Visão:** global (todas as lojas)  
**Pode:**
- Ver ranking de lojas e vendedores
- Ver dashboards consolidados (dia/semana/mês/90D)
- Cadastrar/editar Treinamentos
- Cadastrar/editar Produtos Digitais
- Enviar Notificações (todas as lojas ou loja específica)
- Gerenciar lojas (criar, ativar/desativar) e gerentes (convidar/remover)
- Configurar benchmarks padrões (global) e limites (governança)

### 4.2 Gerente (APP Web-Mobile)
**Visão:** somente sua loja  
**Pode:**
- Ver dashboard da loja (dia/semana/mês/90D)
- Ver ranking interno de vendedores
- Configurar meta mensal da loja e (opcional) metas por vendedor
- Validar/coletar dados (visão de check-ins e alertas)
- Criar Feedback e PDI por vendedor
- Ver e atribuir treinamentos (v1: só visualizar; v1.1: atribuir)

### 4.3 Vendedor (APP Web-Mobile) — FOCO PRINCIPAL
**Visão:** somente seus dados  
**Pode:**
- Registrar check-in diário (Leads, Agendamentos, Visitas, Vendas + observação)
- Ver sua performance (mês/semana/90D), ritmo e ranking
- Ver treinamentos e consumir conteúdo
- Ver feedbacks e PDI recebidos (e confirmar leitura)

---

## 5) Jornada por Papel (alto nível)

### Dono/Consultor
1) Entra no Web → vê ranking/saúde do sistema  
2) Confere lojas com baixa aderência (sem check-ins)  
3) Envia notificação (cobrança/ajuste/treinamento)  
4) Atualiza treinamentos e benchmarks

### Gerente
1) Entra no app → vê status do dia (quem lançou)  
2) Confere indicadores e gargalos do funil  
3) Ajusta rota: feedbacks e PDIs  
4) Prepara a semana: metas, foco e treinamento

### Vendedor
1) Entra no app → **faz check-in diário** (rápido)  
2) Vê ritmo vs meta e posição no ranking  
3) Consome treinamentos (quando pendente)  
4) Lê feedback/PDI e confirma execução

---

# 6) Requisitos Funcionais por Módulo

## 6.1 Autenticação e Onboarding (Web + App)

### Telas
- Login (Google / email-senha)
- Recuperar senha
- Seleção de papel (se aplicável)
- Vinculação à loja (Gerente/Vendedor)

### Regras
- **Vendedor não cria loja.**
- **Gerente** só entra se estiver vinculado a uma loja (criar com permissão do consultor ou via fluxo controlado).
- Vinculação recomendada via **convite** (link/código) para evitar vendedores entrando em loja errada.

---

## 6.2 Estrutura de Lojas e Equipe

### Entidades
- Loja
- Gerente
- Vendedores

### Telas e ações (Consultor)
- Criar loja
- Ativar/desativar loja
- Convidar gerente
- Convidar vendedor (ou permitir gerente convidar)

### Regras
- Cada vendedor pertence a **uma loja** (V1).
- Um gerente gerencia **uma loja** (V1).

---

## 6.3 Metas e Ritmo

### Definições
- **Meta mensal (loja)**: número de vendas/carros no mês
- (Opcional V1) **Meta mensal por vendedor**

### Cálculos (regras do sistema antigo)
- **% Atingimento** = Vendas_Mês / Meta_Mensal × 100
- **Falta X** = max(Meta_Mensal - Vendas_Mês, 0)
- **Projeção** (V1):
  - Padrão: dias corridos (compatível com antigo)
  - Melhor prática (config): dias úteis (v1.1)
- **Ritmo diário** = Meta_Mensal / dias do período (corridos ou úteis)

### Telas
- Configurar metas (Gerente)
- Visão de meta e ritmo (Gerente/Vendedor)
- Visão consolidada (Consultor)

---

## 6.4 Indicadores Diários (core)

Indicadores oficiais da V1 (espelhando o sistema antigo e o funil auditado):
- **Leads**
- **Agendamentos**
- **Visitas**
- **Vendas**

> “Agendamento” e “Visita” são separados porque o funil usa conversões entre etapas.

---

## 6.5 Funil (não-CRM)

### Modelo V1 (conforme auditoria)
- Leads → Agendamentos → Visitas → Vendas

### Benchmarks (default V1)
- Leads → Agendamento: **20%**
- Agendamento → Visita: **60%**
- Visita → Venda: **33%**

### Requisito crítico
Benchmarks devem ser **configuráveis por loja** (aba CONFIG no legado).  
No produto: **Configurações → Benchmarks do Funil** por loja (Gerente/Consultor).

### Telas
- Funil da loja (Gerente)
- Funil do vendedor (Vendedor, opcional V1)
- Funil global (Consultor)

### Saídas (diagnóstico)
- Identificar gargalo (qual etapa está abaixo do benchmark)
- Recomendar foco (texto)
- (V1) Sugestões podem ser padrão, mas:
  - devem ser parametrizadas, não hardcoded
  - precisam citar o gargalo detectado

---

## 6.6 Ranking

### Ranking de vendedores (por loja e global)
- Base: Vendas no mês (principal)
- Desempate: Vendas na semana → Visitas → Agendamentos → Leads (opcional)

### Ranking de lojas
- Base: Vendas no mês vs meta (% atingimento)
- Desempate: ritmo/projeção

### Telas
- Ranking (Consultor: global)
- Ranking (Gerente: loja)
- Ranking pessoal (Vendedor: posição)

---

## 6.7 Treinamentos

### Cadastro (Consultor)
Campos:
- Título (obrigatório)
- Descrição (obrigatório)
- Tipo: Prospecção | Fechamento | Atendimento (obrigatório)
- URL (Drive/YouTube) (obrigatório)
- Status: Ativo/Inativo

### Consumo (Gerente/Vendedor)
- Lista filtrada por tipo
- Abrir vídeo (in-app ou external)
- Marcar como visto (V1 recomendado)

---

## 6.8 Produtos Digitais

### Cadastro (Consultor)
- Nome, descrição, link

### Consumo (Gerente/Vendedor)
- Lista
- Abrir link

---

## 6.9 Notificações

### Envio (Consultor)
- Título
- Mensagem
- Destino: todas as lojas ou loja específica

### Recebimento (Gerente/Vendedor)
- Caixa de notificações
- Marcar como lida (opcional)

---

## 6.10 Feedback & PDI (Gerente → Vendedor)

### Feedback
Campos:
- Vendedor (obrigatório)
- Pontos positivos (obrigatório)
- Pontos de atenção (obrigatório)
- Ação prática (obrigatório)
- Data automática
- (Opcional) Anexo/observação

### PDI
Campos:
- Vendedor (obrigatório)
- Objetivo do PDI (obrigatório)
- Ação prática (obrigatório)
- Prazo (recomendado)
- Status (recomendado): Aberto | Em andamento | Concluído
- Comentários de acompanhamento (v1.1)

---

# 7) FLUXO DO VENDEDOR (APP Web-Mobile) — PASSO A PASSO (V1)

> Este é o módulo principal. Sem isso, o sistema não tem dados.

## 7.1 Menu do Vendedor
1) Home  
2) **Check-in do Dia**  
3) Meu Histórico  
4) Ranking  
5) Treinamentos  
6) Feedback & PDI  
7) Notificações  
8) Perfil

---

## 7.2 Tela 1 — Home (Vendedor)

### Objetivo
Mostrar “o que importa hoje” e forçar check-in.

### Componentes
- Meta mensal (se existir)
- Vendas no mês
- Vendas na semana
- Ritmo: “faltam X vendas” + projeção
- Posição no ranking (loja)
- CTA fixo: **Fazer Check-in de Hoje**

### Estados
- Se check-in do dia não feito: banner obrigatório “Check-in pendente”

---

## 7.3 Tela 2 — Check-in do Dia (Vendedor) (ESSENCIAL)

### Objetivo
Coleta diária dos indicadores (Leads, Agendamentos, Visitas, Vendas) com qualidade.

### Campos (V1)
- Data: automática (não editável)
- Leads (número inteiro ≥ 0)
- Agendamentos (número inteiro ≥ 0)
- Visitas (número inteiro ≥ 0)
- Vendas (número inteiro ≥ 0)
- Observação do dia (texto curto, opcional)

### Validações obrigatórias (anti-bagunça do legado)
- Não permitir valores negativos
- **Vendas ≤ Visitas**
- **Visitas ≤ Agendamentos** (configurável: pode permitir exceção com justificativa)
- Check-in único por dia por vendedor (anti-duplicidade)
  - Se tentar enviar de novo: sistema entra em modo **Editar check-in do dia**
- Se todos os campos numéricos = 0: exigir motivo (dropdown simples + texto curto)

### Ações
- Salvar
- Editar (mesmo dia)
- Ver resumo do dia após salvar

### Saída (efeitos)
Ao salvar:
- Atualizar dashboard do gerente
- Atualizar funil da loja (agregado)
- Atualizar ranking (mês/semana)
- Registrar auditoria (log)

---

## 7.4 Tela 3 — Meu Histórico (Vendedor)

### Objetivo
Dar feedback visual e permitir correções controladas.

### Conteúdo
- Lista por dia (últimos 30/60/90 dias)
- Para cada dia: Leads, Agend., Visitas, Vendas

### Regras de edição
- Edição permitida:
  - mesmo dia: livre
  - dias anteriores: somente com **solicitação ao gerente** (V1.1)  
  - (V1 simples) permitir até D+1, com log

---

## 7.5 Tela 4 — Ranking (Vendedor)

### Conteúdo
- Ranking da loja (top N)
- Posição do vendedor destacada
- Filtros: mês / semana

---

## 7.6 Tela 5 — Treinamentos (Vendedor)

### Conteúdo
- Lista de treinamentos (por tipo)
- Botão “Assistir”
- Marcar como visto (V1 recomendado)
- Histórico de vistos (v1.1)

---

## 7.7 Tela 6 — Feedback & PDI (Vendedor)

### Conteúdo
- Lista de feedbacks recebidos
- Lista de PDIs recebidos
- Detalhe do PDI: objetivo, ação, prazo, status

### Ações (V1)
- “Confirmar leitura” (obrigatório)  
- (v1.1) atualizar status do PDI e registrar evidência

---

## 7.8 Tela 7 — Notificações (Vendedor)

### Conteúdo
- Lista: título, mensagem, data/hora, loja (se aplicável)
- Marcar como lida

---

# 8) Dashboards (por papel)

## 8.1 Dashboard do Gerente (Loja)
### Cards (V1, conforme apresentação)
- Vendas no mês
- Vendas na semana
- Vendedores (quantidade + ranking)
- Agendamentos (dia e/ou semana)
- Leads (dia e/ou semana)
- Meta mensal + % atingimento + falta X + projeção

### Seções
- Funil da loja (Leads→Agend→Visitas→Vendas)
- Status de check-in do dia (quem não lançou)
- Evolução 90D (gráfico)

## 8.2 Dashboard do Consultor (Global)
- Ranking de lojas
- Ranking de vendedores
- Saúde do sistema (lojas com baixo preenchimento)
- Consolidado por período (dia/semana/mês/90D)

---

# 9) Automações (Relatórios por E-mail)

## 9.1 Relatório Matinal (diário)
**Destinatários:** Dono/Consultor e/ou gestores configurados  
**Conteúdo mínimo (espelhando auditoria):**
- Leads por vendedor (dia)
- Agendamentos do dia
- Vendas de ontem
- Total do mês
- Meta da loja
- Projeção
- % Atingimento
- Falta X

**Melhorias permitidas (sem virar CRM):**
- Incluir taxa de conversão do funil (agregado)
- Comparativo com média da semana (tendência)

## 9.2 Feedback Semanal (últimos 7 dias)
**Destinatários:** Dono/Consultor e/ou gerente  
**Conteúdo mínimo:**
- Sumário por vendedor (últimos 7 dias): Leads, Agend., Visitas, Vendas
- Funil e gargalo vs benchmark
- Sugestões de foco baseadas no gargalo (não hardcoded)

---

# 10) Requisitos Não-Funcionais (qualidade e segurança)

## 10.1 Confiabilidade (lições do legado)
- Não pode existir “dashboard estático por script”: dashboards devem ser **dados + queries**, não conteúdo hardcoded.
- Backups e histórico (evitar “BASE_OFICIAL esvaziada”).
- Monitoramento de saúde: alertar se check-ins zeraram por trigger/erro.

## 10.2 Auditoria e Logs
Registrar:
- criação/edição de check-in
- alteração de metas
- criação de feedback/PDI
- envios de notificação

## 10.3 Multi-loja / isolamento
- Gerente e vendedor só acessam dados da sua loja
- Consultor acessa tudo

---

# 11) Modelo de Dados (alto nível)

Entidades mínimas:
- `users` (id, nome, email, papel)
- `stores` (id, nome, status)
- `memberships` (user_id, store_id, role)
- `goals` (store_id, month, goal_value, user_id opcional)
- `daily_checkins` (store_id, user_id, date, leads, appointments, visits, sales, note, created_at, updated_at)
- `benchmarks` (store_id, lead_to_appt, appt_to_visit, visit_to_sale)
- `trainings` (title, desc, type, url, active)
- `training_progress` (user_id, training_id, watched_at)
- `notifications` (title, message, target_store_id nullable, created_at)
- `notification_reads` (notification_id, user_id, read_at)
- `feedbacks` (store_id, manager_id, seller_id, positives, attention, action, created_at)
- `pdis` (store_id, manager_id, seller_id, objective, action, due_date, status, created_at)

---

# 12) Critérios de Aceite (QA) — V1

## Vendedor
- Consegue fazer login e entrar como vendedor na loja correta
- Consegue registrar check-in do dia (≤ 60s)
- Sistema bloqueia duplicidade (vira editar)
- Sistema valida inconsistência (vendas>visitas etc.)
- Dashboard do gerente reflete os dados após salvar
- Ranking atualiza corretamente
- Treinamentos abrem e podem ser marcados como vistos
- Feedback/PDI aparecem e vendedor confirma leitura

## Gerente
- Configura meta mensal
- Vê status de check-in do dia por vendedor
- Vê funil preenchido após check-ins
- Cria feedback e PDI

## Consultor
- Vê ranking global de lojas e vendedores
- Cadastra treinamento e ele aparece no app
- Envia notificação para loja específica e ela chega no app
- Recebe relatório matinal e semanal (ou consegue disparar manualmente)

---

## 13) Backlog sugerido (sem inventar módulos)

### V1 (MVP funcional)
- Check-in diário + validações + anti-duplicidade
- Dashboards por papel (cards essenciais)
- Metas mensais + projeção + falta X + % atingimento
- Funil com benchmarks configuráveis por loja
- Ranking (loja + global)
- Treinamentos (cadastro e consumo)
- Notificações por loja
- Feedback & PDI
- Relatório matinal + semanal

### V1.1 (qualidade operacional)
- Dias úteis na projeção (config)
- Solicitação de correção de check-in (retroativo)
- Progresso de treinamentos por vendedor (visão gerente)
- Histórico de notificações e leitura

---

**Fim do PRD.**
