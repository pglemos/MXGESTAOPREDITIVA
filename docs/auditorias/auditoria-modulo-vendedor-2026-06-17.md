# Auditoria Completa — Módulo Vendedor MX Performance

**Data:** 2026-06-17
**Autor:** Orion (AIOX Master)
**Escopo:** Todas as telas, rotas, APIs, botões, estados, permissões, validações, integrações, banco de dados e testes do módulo vendedor.

---

## Sumário Executivo

O módulo vendedor do MX Performance possui **infraestrutura sólida de dados** (todos hooks usam Supabase real, 40+ tabelas com RLS, 22+ hooks conectados). A camada de UI tinha botões stub/mortos em Treinamentos, Feedback e Perfil, rotas inconsistentes e gaps de teste. **PDI foi re-verificado e está 100% funcional** (falso positivo na auditoria inicial — todos modais persistem via Supabase mutations).

### Correções Aplicadas (2026-06-17)

| Fix | Arquivos |
|-----|----------|
| Feedback: botões "Ver histórico"/"Ver PDI" com onClick | VendedorFeedback.tsx |
| Treinamentos: 5 botões mortos corrigidos (X biblioteca, Ver todos, Ver gravações, provas, favoritos) | VendedorTreinamentos.tsx |
| Perfil: 5 toasts melhorados + pretensão salarial readOnly visual + navigate /treinamentos | MeuPerfilVendedor.container.tsx |
| Funil: Error UI com botão retry | FunilVendedor.container.tsx |
| Dead links: 4x `/vendedor/treinamentos` → `/treinamentos` | GerenteTreinamentos.tsx, useTrainings.ts |
| Duplicate export fix | useMeuScore.ts |
| Testes novos: parseCadenciaAgenda (6 tests), BAND_LABEL/NEXT_BAND (4 tests), Funil error state (1 test) | useCadenciaAgenda.test.ts, useMeuScore.test.ts, FunilVendedor.container.test.tsx |
| Test fixes: MemoryRouter wrapper em 2 test files | VendedorFeedback.test.tsx, MeuPerfilVendedor.container.test.tsx |
| Sprint 3/4: aliases `/feedback`, `/funil` e namespace `/vendedor/*` preservando query/hash | App.tsx, routeAccess.ts |
| Sprint 3/4: rota operacional `/vendedor/configuracoes` | VendedorConfiguracoes.tsx, Layout.tsx |
| Sprint 3/4: `seller_product_categories` + `updated_by` auditável | 20260617007000_vendedor_sprint3_4_dados.sql |
| Sprint 3/4: gaps de teste Leads, Ajuda, Perfil clicks, Cadência e RBAC | LeadsVendedor.container.test.tsx, VendedorAjuda.test.tsx, capabilities.test.ts |
| Score RLS: policies temporárias permissivas substituídas por leitura escopada | 20260617008000_score_rls_hardening.sql |

### Correções Aplicadas (2026-06-17 — Continuação: deploy prod + polish)

| Fix | Detalhe |
|-----|---------|
| **DEPLOY PROD:** 17 migrations pendentes aplicadas em produção | método cirúrgico validado (3 migrations PII/revoke out-of-order isoladas em /tmp, `db push --linked`, restauração). Inclui cadência, devolutiva_acoes, execution_actions, seller_product_categories, score RLS hardening, funnel_metrics |
| **M7:** generated types regenerados do schema remoto pós-deploy | `src/types/database.generated.ts` agora casa com prod (10555 linhas, +5 tabelas novas). Typecheck verde |
| **L3:** dep faltante `projectionMode` no useMemo | `useSellerMetrics.ts` — memo não recalculava ao trocar modo de projeção. Corrigido + teste de regressão |
| **M15/L7:** demo feedback não mistura mais com fluxo real | `VendedorFeedback.tsx` — `DEMO_FEEDBACKS` agora é fallback-only (só quando zero feedback real) |
| **M13/L5:** testes de hook reforçados | `useSellerMetrics.test.ts` (4), `useTacticalPrescription.test.ts` (4) |

### Itens documentados como won't-fix / dívida aceita (decisão do usuário)

| # | Decisão | Rationale |
|---|---------|-----------|
| H11 | **RESOLVIDO (= I4)** | Terminal MX (Checkin) tem fluxo `saveTechnicalAdjustment` que persiste via `saveCheckin(...,'adjustment')`; `onSuccess` refetcha checkins → métricas do vendedor recalculam; dashboards de liderança são leitura live (pull-based). Não há módulo "Painéis" separado por design |
| A1 | **Arquitetura mantida** | Módulo vendedor usa consistentemente o padrão hook-por-domínio como camada de acesso a dados. Camada REST blanket = refactor cross-cutting sem ganho funcional. Chamadas Supabase diretas restantes estão em páginas admin/não-vendedor (fora do escopo) |
| M5 | **Dívida documentada (não renomear)** | Naming misto EN/PT nas tabelas. Renomear exigiria migration de produção com risco de quebrar RLS/hooks/types — custo/risco > benefício |
| M6 | **Aceito** | Hooks novos (funnel/execution) usam types hand-crafted + casts; após regen, generated types cobrem as tabelas. Padrão consistente |
| seller_routine / exam_attempts | **Cobertos por tabelas existentes** | Dados de rotina em `daily_checkins`; tentativas de prova em `aula_provas`. Tabelas dedicadas não necessárias no momento |
| M13 (e2e) | **Fora de escopo** | Suite e2e Playwright exige app + secrets Supabase ausentes no CI. Reforço feito via unit/integração |

### Números-Chave (Revisados após correções)

| Métrica | Valor |
|---------|-------|
| Telas auditadas | 13 (inclui `/vendedor/configuracoes`) |
| Rotas existentes | 15 canônicas + aliases `/vendedor/*` |
| Rotas faltantes | 0 no escopo vendedor auditado |
| Hooks (real data) | 22 |
| Hooks com mock | 0 |
| Tabelas Supabase | 40+ |
| Botões mortos/stub | 0 nos fluxos vendedor implementados |
| Testes existentes | 33 arquivos / ~145 casos |
| Hooks sem teste | 5 (de 7 — useCadenciaAgenda e useMeuScore cobertos) |
| Telas sem teste | 0 (de 2 — LeadsVendedor e VendedorAjuda cobertos) |
| Issues críticas | 0 restantes |
| Issues altas | 2 restantes + H2 parcial (resolvidas: D2, H3, H4, H5, H7, H8, H10, H12; H9 parcial) |
| Issues médias | 5 restantes (resolvidas: M1, M2, M3, M4, M8, M9, M10, M11, M12, M14) |
| Issues baixas | 3 restantes (resolvidas: L1, L2, L4, L6, L8) |

---

## 1. ROTAS

### 1.1 Rotas Existentes

| Rota Atual | Componente | Arquivo |
|------------|-----------|---------|
| `/home` | VendedorHome | `src/pages/VendedorHome.tsx` |
| `/central-execucao` | CentralExecucao | `src/pages/CentralExecucao.tsx` |
| `/meu-funil` | FunilVendedor | `src/pages/FunilVendedor.tsx` |
| `/carteira-clientes` | CarteiraClientes | `src/pages/CarteiraClientes.tsx` |
| `/treinamentos` | VendedorTreinamentos | `src/pages/VendedorTreinamentos.tsx` |
| `/devolutivas` | VendedorFeedback | `src/pages/VendedorFeedback.tsx` |
| `/pdi` | VendedorPDI | `src/pages/VendedorPDI.tsx` |
| `/perfil` | MeuPerfilVendedor | `src/pages/MeuPerfilVendedor.tsx` |
| `/lancamento-diario` | Checkin | `src/pages/Checkin.tsx` |
| `/trilhas` | TrilhasVendedor | `src/features/vendedor-home/TrilhasVendedor` |
| `/leads` | LeadsVendedor | `src/pages/LeadsVendedor.tsx` |
| `/relatorios-vendedor` | RelatoriosVendedor | `src/pages/RelatoriosVendedor.tsx` |
| `/classificacao` | Ranking | `src/pages/Ranking.tsx` |
| `/ajuda` | VendedorAjuda | `src/pages/VendedorAjuda.tsx` |
| `/minha-remuneracao` | MinhaRemuneracao | `src/features/remuneracao/MinhaRemuneracaoPage` |

### 1.2 Rotas Faltantes

| Rota Esperada | Status | Observação |
|---------------|--------|------------|
| `/vendedor/terminal-mx` | **RESOLVIDA** | Terminal MX renderiza o componente de check-in com Registro Diário e Ajuste Técnico |
| `/vendedor/configuracoes` | **RESOLVIDA** | Rota operacional criada para atalhos do vendedor, sem abrir `/configuracoes` administrativa |

### 1.3 Issues de Rotas

| # | Severidade | Issue |
|---|-----------|-------|
| R1 | ALTO | **PARCIALMENTE RESOLVIDO:** aliases `/vendedor/*` criados; rotas canônicas flat mantidas por compatibilidade |
| R2 | ALTO | **RESOLVIDO:** `/vendedor/terminal-mx` expõe Terminal MX e `/lancamento-diario` fica como legado |
| R3 | MÉDIO | **RESOLVIDO:** aliases `/feedback`, `/funil`, `/vendedor/feedback`, `/vendedor/funil` preservam URLs antigas |
| R4 | MÉDIO | **RESOLVIDO:** dead links de treinamentos corrigidos |
| R5 | BAIXO | **RESOLVIDO:** redirects preservam `search` e `hash`, incluindo `?tab=provas` |

---

## 2. APIs E DADOS

### 2.1 Arquitetura de Dados

**Sem camada de API REST.** Todo acesso a dados é via Supabase JS client direto. Hooks chamam Supabase diretamente.

### 2.2 Hooks — Todos com Dados Reais

| Hook | Tabelas Supabase | Módulo |
|------|-----------------|--------|
| useOportunidades | oportunidades | CRM/Funil |
| useClientes | clientes | Carteira |
| useAtendimentos | atendimentos | Central |
| useAgendamentos | agendamentos | Central/Carteira |
| useVendedorPerfil | vendedor_perfil | Perfil |
| useMeuScore | score_calculations + RPC | Score |
| useFeedbackActions | devolutiva_acoes | Feedback |
| useCadenciaAnalytics | cadencia_estado_cliente | Cadência |
| useCadenciaAgenda | RPC listar_acoes_cadencia_vendedor | Central |
| useCadenciaFluxos | cadencia_fluxos | Cadência |
| useCheckins | lancamentos_diarios + RPCs | Terminal/Home |
| useGoals | regras_metas_loja, benchmarks_loja | Funil |
| useRanking | lancamentos_diarios, vendedores_loja | Home |
| useTrainings | treinamentos, progresso_treinamentos | Treinamentos |
| useFeedbacks | devolutivas, devolutiva_acoes + RPC | Feedback |
| usePDI_MX | pdi_sessoes, pdi_metas + RPCs | PDI |
| useAulasAoVivo | aulas_ao_vivo, aula_presencas + RPCs | Treinamentos |
| useNotifications | notificacoes + RPC | Global |
| useSellerMetrics | DERIVADO (computação pura) | Home |
| useTacticalPrescription | DERIVADO (computação pura) | Home |
| useVendedorHomePage | AGREGADOR (10+ hooks) | Home |
| useRemuneracaoEstimadaVendedor | remuneracao_planos, regras, benchmark | Remuneração |

### 2.3 Issues de API/Dados

| # | Severidade | Issue |
|---|-----------|-------|
| A1 | MÉDIO | Sem camada API REST — Supabase client direto em todos hooks |
| A2 | MÉDIO | Sem cache layer centralizado — cada hook gerencia próprio cache |
| A3 | BAIXO | useSellerMetrics e useTacticalPrescription são computação pura, poderiam ser memoizados |

---

## 3. BOTÕES E AÇÕES

### 3.1 Botões Mortos — Resolvidos em 2026-06-17

| Tela | Itens auditados | Status atual |
|------|-----------------|--------------|
| VendedorPDI | salvar ação, editar ação, concluir, justificar, vincular conteúdo, enviar para Central | ✅ Persistência e integração com Central via `execution_actions` |
| VendedorTreinamentos | favoritos, fechar aviso, ver todos, ver gravações, iniciar/refazer/ver resultado | ✅ Handlers adicionados para ações internas, calendário, provas e favoritos |
| MeuPerfilVendedor | histórico, editar dados, histórico completo, gerar perfil profissional, ver treinamentos/PDI | ✅ Navegação, scroll interno, print e ações concretas |
| VendedorFeedback | "Ver histórico" e "Ver PDI" no estado vazio | ✅ Handlers adicionados |
| Pretensão salarial | input read-only sem visual de disabled | ✅ Estado read-only/disabled representado visualmente |

### 3.2 Botões Funcionais

| Botão | Tela | Status |
|-------|------|--------|
| "Nova Atividade" | Home | ✅ Link para /central-execucao |
| "Fechar meu dia" | Home | ✅ Link para /lancamento-diario |
| "Li e compreendi" | Feedback | ✅ API call + toast |
| "Comentar" | Feedback | ✅ Modal + API |
| "Justificar" | Feedback | ✅ Modal + API |
| "Marcar como feito" | Feedback | ✅ markActionDone |
| "Ver na Central" | Feedback | ✅ Navegação |
| "Gerar ações na Central" | Funil | ✅ Link com params |
| "Criar ações" | Funil | ✅ Link |
| "Sugerir conteúdo" | Treinamentos | ✅ API call real |
| "Adicionar à agenda" | Treinamentos | ✅ Google Calendar URL |
| Refresh | Treinamentos | ✅ refetch |
| Salvar (rotina/objetivos/mix/carreira) | Perfil | ✅ savePerfil API + toast |
| "Nova ação" | PDI | ✅ Abre overlay e persiste |
| "Editar conquistas" | PDI | ✅ Abre overlay e persiste |

### 3.3 Botões Direcionais

| Botão | Tela | Status |
|-------|------|--------|
| "Li e compreendi" | Home | Direciona para /devolutivas para confirmação no módulo correto |
| "Confirmar presença" | Treinamentos | Direciona para aba Aulas ao Vivo |
| "Responder prova" | Treinamentos | Direciona para aula/prova e exibe feedback ao usuário |

### 3.4 Botões Esperados — Não Encontrados

| Botão | Tela Esperada | Status |
|-------|--------------|--------|
| "Salvar rascunho" | Terminal MX | ✅ Implementado no formulário de Registro Diário |
| "Finalizar fechamento" | Terminal MX | ✅ Implementado via submit do Registro Diário |
| "Novo cliente" (Terminal MX) | Terminal MX | ✅ Implementado na seção CRM do check-in |
| "Cancelar ajuste" | Terminal MX | ✅ Implementado na aba Ajuste Técnico |
| "Salvar Ajustes Técnicos" | Terminal MX | ✅ Implementado na aba Ajuste Técnico |

---

## 4. ESTADOS DE TELA

| Tela | Loading | Error | Empty | Qualidade |
|------|---------|-------|-------|-----------|
| VendedorHome | ✅ | ✅ ErrorBoundary | ✅ Fallback data | BOA |
| VendedorFeedback | ✅ Skeleton | ✅ useFeedbacks | ✅ "Tudo confirmado!" | BOA |
| VendedorPDI | ✅ | ✅ usePDI error | ✅ Fallback | BOA |
| VendedorTreinamentos | ✅ Skeleton | ✅ useTrainings | ✅ Per-tab | BOA |
| FunilVendedor | ✅ | ✅ Error UI + retry | ✅ useMemo fallback | BOA |
| MeuPerfilVendedor | ✅ | ✅ Toast save error | ✅ Defaults | BOA |
| CentralExecucao | ✅ | ✅ | ✅ | BOA |
| CarteiraClientes | ✅ | ✅ | ✅ | BOA |
| Terminal MX | ✅ | ✅ | ✅ | BOA |

### Issues de Estados

| # | Severidade | Issue |
|---|-----------|-------|
| E1 | ALTO | **RESOLVIDO:** FunilVendedor com error UI dedicada e retry |
| E2 | ALTO | **RESOLVIDO:** Terminal MX disponível em `/vendedor/terminal-mx` |
| E3 | MÉDIO | **RESOLVIDO:** estados vazios em Feedback com handlers para "Ver histórico" e "Ver PDI" |

---

## 5. BANCO DE DADOS

### 5.1 Tabelas Existentes (40+)

**Core:** users, store_sellers, memberships, stores, roles, user_roles, vendedor_perfil
**CRM:** clientes, oportunidades, agendamentos, atendimentos, cadencia_fluxos, cadencia_estado_cliente
**Performance:** daily_checkins (lancamentos_diarios), checkin_correction_requests, checkin_audit_logs, goals, goal_logs, store_meta_rules, store_benchmarks
**Feedback:** feedbacks (devolutivas), weekly_feedback_reports, feedback_action_catalog (devolutiva_acoes)
**PDI:** pdis, pdi_sessoes, pdi_competencias, pdi_avaliacoes_competencia, pdi_metas, pdi_plano_acao, pdi_reviews, pdi_acoes_sugeridas, pdi_objetivos_pessoais, pdi_descritores_escala, pdi_frases_inspiracionais, pdi_niveis_cargo
**Treinamentos:** trainings (treinamentos), training_progress (progresso_treinamentos), aulas_ao_vivo, aula_presencas, aula_provas, trilhas_desenvolvimento, etapas_trilha_desenvolvimento, atribuicoes_trilha_desenvolvimento
**Score:** score_inputs, score_calculations, score_observations, score_history
**Compensação:** remuneracao_regras, remuneracao_planos, remuneracao_benchmark
**Infra:** audit_logs, notifications (notificacoes), notification_reads

### 5.2 Tabelas/Conceitos Faltantes

| Esperado | Status | Alternativa |
|----------|--------|-------------|
| seller_routine | FALTANTE | Dados parciais em daily_checkins |
| seller_product_categories | **CRIADA** | Migration `20260617007000_vendedor_sprint3_4_dados.sql` com RLS por vendedor/liderança |
| execution_actions | **CRIADA** | Migration `20260617006000_pdi_vendedor_execucao_actions.sql` integra PDI e Central |
| funnel_metrics | **CRIADA** | Migration `20260617009000_funnel_metrics_snapshot.sql` com RLS, RPC `upsert_funnel_metrics_snapshot` e card no Funil |
| exam_attempts | FALTANTE | aula_provas armazena tentativas diretamente |

### 5.3 Issues de Banco

| # | Severidade | Issue |
|---|-----------|-------|
| D1 | ALTO | **RESOLVIDO:** `execution_actions` criada para persistência própria da Central |
| D2 | ALTO | **RESOLVIDO:** `funnel_metrics` criada com snapshot historico por periodo, RLS escopado e RPC idempotente |
| D3 | MÉDIO | Naming inconsistente: mix EN/PT (daily_checkins vs clientes, oportunidades vs score_inputs) |
| D4 | MÉDIO | CRM tables sem TS interfaces hand-crafted (usam database.generated.ts) |
| D5 | MÉDIO | Generated types possivelmente desatualizados (post 2026-06-09) |
| D6 | MÉDIO | **RESOLVIDO:** Score engine com RLS escopado por migration de hardening |
| D7 | MÉDIO | **RESOLVIDO PARCIAL:** migration adiciona `updated_by`/trigger nas tabelas operacionais existentes |
| D8 | BAIXO | **RESOLVIDO:** `seller_product_categories` criada com RLS |

---

## 6. PERMISSÕES (RLS)

### 6.1 Status Atual

- ✅ RLS habilitado em **todas** tabelas seller-related (40+)
- ✅ Policies usam helpers: `user_has_role()`, `is_manager_of()`, `is_owner_of()`
- ✅ Vendedor vê próprios dados; gestor/admin vê dados da loja
- ✅ CRM tables com `seller_user_id = auth.uid()` policy

### 6.2 Issues de Permissão

| # | Severidade | Issue |
|---|-----------|-------|
| P1 | ALTO | **RESOLVIDO:** Score engine com policies escopadas por usuário, loja e perfis internos |
| P2 | MÉDIO | **RESOLVIDO:** `routeAccess`/capabilities validam rotas e ações sensíveis no frontend |
| P3 | BAIXO | **RESOLVIDO:** RBAC granular testado para ações e rotas sensíveis |

---

## 7. TESTES

### 7.1 Cobertura Atual

| Arquivo | Testes | Expects | Clicks | Qualidade |
|---------|--------|---------|--------|-----------|
| VendedorFeedback.test.tsx | 5 | 50 | 7 | BOA |
| VendedorPDI.test.tsx | 5 | 34 | 0 | MÉDIA |
| VendedorTreinamentos.test.tsx | 10 | 172 | 3 | BOA |
| CentralExecucao.container.test | 4 | 24 | 4 | BOA |
| FunilVendedor.container.test | 2 | 23 | 0 | MÉDIA |
| MeuPerfilVendedor.container.test | 2 | 21 | 0 | MÉDIA |
| CarteiraClientes.container.test | 2 | 7 | 4 | MÉDIA |
| RelatoriosVendedor.container.test | 1 | 7 | 0 | FRACA |
| VendedorHome.container.test | 2 | 20 | 2 | MÉDIA |
| CRM libs (4 arquivos) | 19 | ~60 | N/A | BOA (lógica pura) |

**Total: 33+ arquivos, suite completa local passando em `npm test`**

### 7.2 Gaps de Teste

| # | Severidade | Gap |
|---|-----------|-----|
| T1 | ALTO | **RESOLVIDO:** VendedorPDI com click tests para ações persistidas |
| T2 | ALTO | **PARCIALMENTE RESOLVIDO:** Cadência e Score cobertos; demais hooks seguem monitorados |
| T3 | ALTO | **RESOLVIDO:** FunilVendedor com testes de erro/click |
| T4 | MÉDIO | **RESOLVIDO:** LeadsVendedor.container coberto |
| T5 | MÉDIO | **RESOLVIDO:** VendedorAjuda coberto |
| T6 | MÉDIO | **RESOLVIDO:** MeuPerfilVendedor com click tests |
| T7 | MÉDIO | Sem testes de integração/e2e |
| T8 | BAIXO | Loading skeleton testado apenas em CentralExecucao e CarteiraClientes |

---

## 8. INTEGRAÇÕES ENTRE MÓDULOS

### 8.1 Integrações Funcionais

| De | Para | Via | Status |
|----|------|-----|--------|
| Perfil | Funil | mix_canal_*_pct em vendedor_perfil | ✅ |
| Perfil | Central | useVendedorPerfil em CentralExecucao.container | ✅ |
| Feedback | Central | useFeedbackActions em CentralExecucao.container | ✅ |
| Carteira | Central | useClientes + useAgendamentos compartilhados | ✅ |
| Funil | Central | Links com params para /central-execucao | ✅ |
| Checkin | Home | useCheckins em useVendedorHomePage | ✅ |
| Treinamentos | PDI | useDevelopmentRecommendations | ✅ |
| Aulas | Provas | aula_provas valida presença | ✅ |

### 8.2 Integrações Quebradas ou Faltantes

| # | Severidade | Integração |
|---|-----------|------------|
| I1 | CRÍTICO | **RESOLVIDO:** PDI → Central persiste ações em `execution_actions` |
| I2 | CRÍTICO | **RESOLVIDO:** PDI persiste modais/formulários via mutations reais |
| I3 | ALTO | **RESOLVIDO:** Feedback → PDI navega pelo estado vazio |
| I4 | ALTO | **RESOLVIDO:** Terminal MX existe como módulo vendedor; ajuste técnico usa fluxo de correção do check-in |
| I5 | ALTO | **RESOLVIDO:** Treinamentos → Provas tem handlers para iniciar/refazer/ver resultado |
| I6 | MÉDIO | **RESOLVIDO:** Feedback → Central mantém ações rastreáveis reais |
| I7 | MÉDIO | **RESOLVIDO:** Perfil → PDI navega para `/pdi` |

---

## 9. CONSOLIDAÇÃO DE ISSUES POR SEVERIDADE

### CRÍTICO (6 issues)

| # | Área | Descrição |
|---|------|-----------|
| C1 | PDI | **RESOLVIDO:** modais persistem via mutations reais |
| C2 | PDI | **RESOLVIDO:** PDI → Central persiste ações em `execution_actions` |
| C3 | Terminal MX | **RESOLVIDO:** rota, página e componente disponíveis em `/vendedor/terminal-mx` |
| C4 | Treinamentos | **RESOLVIDO:** ações de provas têm handlers |
| C5 | Score | **RESOLVIDO:** RLS permissivo temporário substituído por hardening escopado |
| C6 | Dados | **RESOLVIDO:** `execution_actions` criada para persistência própria |

### ALTO (12 issues)

| # | Área | Descrição |
|---|------|-----------|
| H1 | Rotas | **RESOLVIDO:** Terminal MX exposto em `/vendedor/terminal-mx` com legado `/lancamento-diario` |
| H2 | Rotas | **PARCIALMENTE RESOLVIDO:** aliases `/vendedor/*` criados, mantendo rotas canônicas |
| H3 | Feedback | **RESOLVIDO:** "Ver histórico" e "Ver PDI" com handlers |
| H4 | Funil | **RESOLVIDO:** error UI dedicada |
| H5 | Perfil | **RESOLVIDO:** botões executam navegação, scroll, print ou ação concreta |
| H6 | Dados | **RESOLVIDO:** `funnel_metrics` + RPC `upsert_funnel_metrics_snapshot` criada e aplicada em prod; Funil mostra snapshot histórico |
| H7 | Dados | **RESOLVIDO:** `execution_actions` criada |
| H8 | Testes | **RESOLVIDO:** VendedorPDI com click tests |
| H9 | Testes | **PARCIALMENTE RESOLVIDO:** gaps críticos cobertos, incluindo Cadência e Score |
| H10 | Testes | **RESOLVIDO:** FunilVendedor ganhou testes de erro/click |
| H11 | Integração | **RESOLVIDO (= I4):** ajuste técnico do Checkin refetcha checkins → métricas recalculam; dashboards de liderança leem live. Sem módulo Painéis separado por design |
| H12 | Integração | **RESOLVIDO:** ações de provas/aulas em Treinamentos agora têm handlers |

### MÉDIO (15 issues)

| # | Área | Descrição |
|---|------|-----------|
| M1 | Rotas | **RESOLVIDO:** aliases padronizados para `/feedback`, `/funil` e `/vendedor/*` |
| M2 | Rotas | **RESOLVIDO:** dead link em useTrainings.ts corrigido |
| M3 | Treinamentos | **RESOLVIDO:** botões restantes com handlers |
| M4 | Perfil | **RESOLVIDO:** pretensão salarial read-only com estado visual correto |
| M5 | Dados | Naming mix EN/PT nas tabelas |
| M6 | Dados | CRM tables sem TS interfaces hand-crafted |
| M7 | Dados | Generated types possivelmente stale |
| M8 | Dados | **RESOLVIDO PARCIAL:** `updated_by` adicionado nas tabelas operacionais existentes |
| M9 | Permissão | **RESOLVIDO:** matriz `routeAccess`/capabilities cobre rotas e ações sensíveis |
| M10 | Testes | **RESOLVIDO:** LeadsVendedor.container coberto |
| M11 | Testes | **RESOLVIDO:** VendedorAjuda coberto |
| M12 | Testes | **RESOLVIDO:** MeuPerfilVendedor com click tests |
| M13 | Testes | Sem integração/e2e tests |
| M14 | Integração | **RESOLVIDO:** Perfil → PDI navega para `/pdi` |
| M15 | Feedback | Demo data (DEMO_FEEDBACKS) misturado com fluxo real |

### BAIXO (8 issues)

| # | Área | Descrição |
|---|------|-----------|
| L1 | Rotas | **RESOLVIDO:** aliases preservam deep links por query/hash |
| L2 | Dados | **RESOLVIDO:** `seller_product_categories` criada |
| L3 | Dados | useSellerMetrics/useTacticalPrescription poderiam ser mais memoizados |
| L4 | Permissão | **RESOLVIDO:** capabilities granulares testadas |
| L5 | Testes | Loading skeleton testado só em 2 telas |
| L6 | Treinamentos | **RESOLVIDO:** aviso da biblioteca pode ser fechado |
| L7 | UI | Feedback mixes demo data low priority |
| L8 | Rotas | **RESOLVIDO:** `/vendedor/configuracoes` criada |

---

## 10. PLANO DE CORREÇÃO POR PRIORIDADE

### Sprint 1 — CRÍTICO (estimativa: 1 sprint)

1. **PDI: Conectar modais a APIs reais**
   - Implementar handlers para todos 7 botões mortos
   - Conectar formulários a `usePDI_MX` mutations
   - Arquivos: `src/pages/VendedorPDI.tsx`

2. **Treinamentos: Implementar fluxo de provas**
   - Conectar "Iniciar"/"Refazer"/"Ver resultado" a `useAulasAoVivo` RPCs
   - Arquivo: `src/pages/VendedorTreinamentos.tsx`

3. **Score Engine: Corrigir RLS**
- Concluído: policies permissivas substituídas por leitura escopada e escrita restrita
- Migration: `20260617008000_score_rls_hardening.sql`

4. **Terminal MX: Criar módulo**
   - Criar rota, página, componente com abas (Registro Diário + Ajuste Técnico)
   - Conectar a `useCheckins` + `checkin_correction_requests`
   - Ou consolidar `/lancamento-diario` como Terminal MX com aba de ajuste

### Sprint 2 — ALTO (estimativa: 1 sprint)

5. **Feedback: Corrigir botões mortos**
   - Adicionar handlers para "Ver histórico" e "Ver PDI" no estado vazio
   
6. **Funil: Adicionar error UI**
   - Implementar error boundary ou error rendering

7. **Perfil: Resolver botões antigos sem ação concreta**
- Concluído: botões executam navegação, scroll interno, print ou ação concreta

8. **DB: Criar tabela execution_actions**
- Concluído: Central de Execução possui persistência própria via `execution_actions`

9. **DB: Criar tabela funnel_metrics (ou snapshot periódico)**

10. **Testes: Cobertura crítica**
    - Click tests para VendedorPDI, FunilVendedor
    - Testes para 7 hooks CRM faltantes

### Sprint 3 — MÉDIO (estimativa: 1 sprint) — CONCLUÍDO

11. **Rotas: Padronizar naming** — aliases adicionados sem quebrar URLs existentes
12. **Rotas: Corrigir dead link useTrainings.ts** — concluído
13. **Treinamentos: Resolver botões mortos restantes** — concluído
14. **DB: Gerar TS types atualizados** — tentado; não mantido porque Supabase linked ainda está atrás das migrations locais
15. **DB: Adicionar updated_by onde falta** — concluído para tabelas operacionais existentes
16. **Testes: Completar gaps restantes** — concluído para Leads, Ajuda, Perfil clicks, Cadência, RBAC e contracts

### Sprint 4 — BAIXO (estimativa: parcial) — CONCLUÍDO

17. **Deep links por aba** — redirects preservam `search` e `hash`
18. **seller_product_categories** — migration criada com RLS
19. **RBAC granular frontend** — capabilities e routeAccess testados
20. **Rota /configuracoes** — `/vendedor/configuracoes` criada sem abrir `/configuracoes` administrativa

---

## 11. PONTOS POSITIVOS

O módulo vendedor tem fundação técnica forte:

1. **Zero mocks nos hooks** — todos 22 hooks usam Supabase real
2. **RLS completo** — 40+ tabelas com row-level security
3. **Agregador bem arquitetado** — useVendedorHomePage compõe 10+ hooks elegantemente
4. **Estados de loading/error** — presentes na maioria das telas
5. **Feedback com API real** — "Li e compreendi", "Comentar", "Justificar" funcionam
6. **Integrações cross-module** — Perfil→Funil, Feedback→Central, Carteira→Central funcionais
7. **CRM libs bem testadas** — cadencia, funil, vinculo com testes de lógica pura
8. **Score engine robusto** — RPCs computam score com dados reais

---

## 12. RESUMO FINAL

O MX Performance já é mais que "telas bonitas" — tem infraestrutura de dados real e integrações funcionais. Após as correções de 2026-06-17, PDI, Provas, Feedback, Funil, Perfil, Treinamentos, rotas alternativas, RBAC frontend e dados operacionais dos Sprints 3/4 ficaram cobertos por handlers, migrations e testes locais.

Pendências restantes fora do corte fechado:

1. **DB types gerados** — `npm run gen:db-types` depende de aplicar migrations locais no Supabase linked antes de manter o arquivo gerado.

---

*Gerado por Orion (AIOX Master) — Auditoria automatizada com 5 agentes paralelos*
*Fontes: audit-routes-seller, audit-hooks-apis-seller, audit-components-buttons-seller, audit-db-models-seller, audit-tests-seller*
