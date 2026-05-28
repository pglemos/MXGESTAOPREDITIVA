# Roadmap de Fechamento do Gap — MX Performance

**Data:** 2026-05-28
**Owner:** @aiox-master (Orion) com delegações
**Branch alvo:** `main` (deploy contínuo Vercel + Supabase prod `fbhcmzzgwjdgkctlfvbo`)
**Fontes consolidadas:**
- `MX PERFORMANCE - DESENVOLVIMENTO.docx` (PRD-mestre)
- Transcrição reunião Daniel × José 2026-05-22 (Gemini)
- QA Gate Wave 3 (`docs/reports/qa-gate-mx-wave3-stories-20260528.md`)

> **Article IV:** Todo item rastreia a `.docx`, ata, ou story existente. Sem invenção.

---

## 0. Honest Math — por que 100% em 48h é inviável

### Inventário do trabalho restante (estimativa @architect)

| Categoria | Itens | Horas-engenheiro estimadas |
|---|---|---|
| 8 telas novas (Central MX hub, Planejamento Estratégico, Plano de Ação MX, Benchmarking, Agenda Executiva, Consultor IA chat, Universidade MX, Departamentos) | 8 | 80–120h |
| 5 UI shells InProgress finalizadas (MX-03/04/05/06/12) | 5 | 40–60h |
| 5 engines rules-based (alertas, score auto, consultor IA, atraso plano, benchmarking) | 5 | 50–80h |
| 4 integrações (Google Calendar sync, Outlook, WhatsApp Meta API, Push) | 4 | 50–100h |
| 3 epics novos da ata (MX-19 Remuneração, MX-20 Organograma, MX-21 Teste Comportamental) | 3 | 40–60h |
| 15 deltas da ata (N1–N15) | 15 | 30–50h |
| QA gates, testes E2E, lint cleanup, docs | — | 30–50h |
| **TOTAL** | — | **320–520h** |

**Convertendo:** ~8–13 semanas para 1 engineer dedicado. Em **48h corridos** caberia o equivalente a ~8–16h de execução produtiva (sleep + revisão + testes). Logo, ~3-5% do total.

### Conclusão honesta

| Cenário | Realista? |
|---|---|
| 100% em 48h sem regressão | ❌ Não |
| 100% em 48h com qualidade negociada (sem testes E2E, com warnings, com bugs) | 🟡 Possível mas inseguro para produção |
| 30-40% em 48h, focado em quick-wins de alto impacto | ✅ Sim |
| 100% em 4-6 semanas com time de 2-3 engineers | ✅ Sim |

**Recomendação:** executar o **BLITZ 48h** abaixo + manter o `roadmap completo` como backlog ordenado de 4 sprints.

---

## 1. BLITZ 48h — o que cabe com qualidade

### Premissas
- 2 sessões de ~8h cada (dia 1 + dia 2)
- Sem novas integrações externas (WhatsApp/Outlook ficam fora)
- Foco em telas de leitura + rules-engine simples + finalizar InProgress
- Cada entrega → commit + push + Vercel auto-deploy + smoke test

### Dia 1 — 8h
**Manhã (3h)**
- [ ] **00:00–00:30** — Ratificar QA Gate Wave 3 (@po): mover MX-08/09/10/11/13 → `Done`
- [ ] **00:30–02:00** — Limpar 56 warnings de lint (story OPS-20260528-lint-warnings-cleanup) — @dev
- [ ] **02:00–03:00** — Finalizar MX-03 (Home Dono executivo) — completar shell InProgress — @dev

**Tarde (3h)**
- [ ] **03:00–04:30** — Finalizar MX-04 (Home Gerente Comercial) — completar shell InProgress — @dev
- [ ] **04:30–06:00** — Finalizar MX-05 (Home Vendedor "Meu Dia") + **N3 trava operacional** (sem lançamento ≠ sem leads) — @dev

**Noite (2h)**
- [ ] **06:00–07:00** — Finalizar MX-06 (Central MX shell) + MX-12 (Dashboard Executivo shell) — @dev
- [ ] **07:00–08:00** — Sessão @qa: rodar lint+typecheck+tests+build+smoke em produção
- [ ] Commit + push + Vercel deploy → validar https://mxperformance.vercel.app

**Entregáveis do dia 1:**
- 5 shells InProgress → `Done`
- 5 stories Ready-for-Review → `Done`
- Lint zero warnings
- Trava operacional do vendedor implementada

### Dia 2 — 8h
**Manhã (4h)**
- [ ] **00:00–01:30** — Tela `Plano de Ação MX` nativa (read-only, lê tabela `planos_acao`) — @dev
  - Lista com filtros (origem/status/responsável/loja)
  - Card de detalhe
  - Botão "Marcar concluído" (write único)
- [ ] **01:30–03:00** — Tela `Alertas Inteligentes` (read-only, lê tabela `alerts`) — @dev
  - Lista com tipos Crítico/Atenção/Positivo/Consultivo
  - `AlertCard` do Design System
  - Status transitions (aberto → visto → resolvido)
- [ ] **03:00–04:00** — Engine SQL rules-based de alertas v1 (RPC `gerar_alertas_loja`) — @data-engineer
  - 4 regras canônicas: score abaixo limiar, meta abaixo realizado, plano-ação atrasado, sem lançamento 3 dias

**Tarde (3h)**
- [ ] **04:00–05:30** — Tela `Benchmarking` (interativa com regra <5 lojas) — @dev
  - Seletor de indicador + região + porte
  - Gráfico clean (recharts ou já instalado)
  - Mensagem fallback "menos de 5 lojas no recorte"
- [ ] **05:30–07:00** — Tela `Agenda Executiva` (leitura + sync Google Calendar read-only existente) — @dev
  - Lista de eventos `eventos_agenda_executiva`
  - Card de ação obrigatória do dono
  - Status "feito / pendente"

**Noite (1h)**
- [ ] **07:00–07:30** — Engine `mx_score_recalcular_loja` (RPC v1) — @data-engineer
  - Cálculo automático com pesos do `.docx`
  - Trigger noturno via cron Supabase
- [ ] **07:30–08:00** — @qa full gate + deploy + smoke

**Entregáveis do dia 2:**
- 4 telas novas (Plano de Ação MX, Alertas, Benchmarking, Agenda Executiva)
- 2 engines v1 (alertas rules-based + score auto)
- Total acumulado: ~40% do gap fechado

### O que o BLITZ NÃO entrega (ficará para o roadmap completo)
- Tela Central MX hub (visão integrada)
- Tela Consultor IA chat
- Tela Planejamento Estratégico (5 cards + tabela anual)
- Tela Universidade MX (biblioteca/trilhas/certificações)
- Módulos de Departamentos (6 áreas com fluxograma + checklist + biblioteca)
- Integrações WhatsApp/Outlook/Push
- Epics novos MX-19/20/21 da ata
- Deltas N1, N2, N4, N5, N7, N8, N9, N10, N11, N12, N13, N14, N15 (apenas N3 entra)
- Engines: Consultor IA, cálculo atraso, benchmarking agregações
- Testes E2E completos das novas telas (somente unit tests do shell)

---

## 2. ROADMAP COMPLETO — 4 sprints semanais para fechar 100%

### Sprint 1 (semana 1) — Pós-Blitz
**Objetivo:** Engines + telas restantes do `.docx` (Central MX, Consultor IA, Planejamento Estratégico)

- [ ] Tela **Central MX hub** integra alertas + planos + score + benchmark + agenda (visão 360°)
- [ ] Tela **Consultor IA** chat balão (delta N9) com banco de soluções (N10)
- [ ] Tela **Planejamento Estratégico** — 5 cards + tabela anual Meta/Realizado/Ano Anterior
- [ ] Engine `consultor_ia_sugerir_acao` rules-based v1
- [ ] Engine `mx_score_atualizar_atraso_plano` (cálculo automático de atraso)
- [ ] Stories: MX-14 (Consultor IA UI), MX-22 (Central MX hub)
- [ ] @po validate + @qa gate

**Esforço estimado:** 35-45h

### Sprint 2 (semana 2) — Departamentos + Universidade + N4
**Objetivo:** Reorientar menu por departamento (delta N4 da ata) + Universidade MX completa

- [ ] Refatorar menu lateral: visão `Departamentos` (6 áreas) ao invés de cargos
- [ ] Para cada departamento (Comercial, Marketing, Produto, Financeiro, RH, Operações):
  - Dashboard com 4 indicadores chave + índice de eficiência
  - Fluxograma + checklist
  - Biblioteca de regras de boas práticas
- [ ] Marketing como módulo robusto: Carteira da Empresa (delta N5), Agenda Estratégica Mensal (N14), Posicionamento (N15)
- [ ] Universidade MX: biblioteca, trilhas, aulas ao vivo, certificações (MX-17 expandido)
- [ ] Cultura de Resultado dentro de Comercial (N11)
- [ ] Índice de Felicidade dentro de RH (N12)
- [ ] Story: MX-15 (Departamentos), MX-17 (Universidade), MX-23 (Marketing carteira)

**Esforço estimado:** 50-70h

### Sprint 3 (semana 3) — Integrações + Plano de Ação refinements
**Objetivo:** WhatsApp callback (N2), Outlook, Push, Google Calendar full + segmentação plano (N1)

- [ ] Plano de Ação segmentado (loja/dept/indivíduo) — delta N1
- [ ] WhatsApp callback de status sim/não — delta N2 (depende de WhatsApp Meta API config)
- [ ] Push notifications (web push API)
- [ ] Outlook calendar sync (read + write)
- [ ] Google Calendar full bidirectional sync
- [ ] Story: MX-09.2 (segmentação), MX-24 (WhatsApp callback), MX-25 (Push), MX-26 (Outlook)

**Esforço estimado:** 60-100h (depende de credenciais Meta + Microsoft Graph)

### Sprint 4 (semana 4) — Novos epics da ata + closure
**Objetivo:** Sistema de Remuneração Inteligente, Organograma, Teste Comportamental, polish geral

- [ ] **EPIC MX-19** Sistema de Remuneração Inteligente (delta N7)
  - Cadastro plano atual
  - Comparativo abaixo/dentro/acima da média (parâmetros: região, tamanho, meta)
- [ ] **EPIC MX-20** Organograma + Plano de Carreira (delta N8)
  - Estrutura hierárquica visual
  - Plano de carreira por cargo
- [ ] **EPIC MX-21** Teste Comportamental + Banco de Talentos (delta N13)
  - Aplicação de teste no onboarding
  - Banco de "perfis vencedores" para futuras contratações
- [ ] **Tela Reunião dentro do sistema** (N12 — uma das 8 visitas é marketing dentro do app)
- [ ] **Refinamento Home Dono** — agenda automática via gestao@mx (delta da ata)
- [ ] Lighthouse audit + a11y full
- [ ] Documentação consolidada (atualizar PRD)
- [ ] Vídeo demo + handoff

**Esforço estimado:** 60-90h

---

## 3. Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| WhatsApp Meta API tem custo + onboarding longo | Sprint 3 paralelo: usar chat interno como fallback (N9) |
| Outlook requer Microsoft Graph + Azure AD app | Sprint 3 — postergar se bloqueado, manter Google Calendar |
| Engines SQL precisam de dados reais para validar | @data-engineer cria seeds canônicas + testes de regression |
| Lint warnings podem mascarar bugs reais | Sprint 1 começa com lint zero (entrega do Blitz) |
| Mudança de menu por departamento (N4) gera regressão | Feature flag `MX_MENU_V2` + rollout gradual |
| Supabase MCP sem permissão | @devops configura SUPABASE_ACCESS_TOKEN no setup MCP |

---

## 4. Métricas de Sucesso

| Sprint | Métrica | Alvo |
|---|---|---|
| Blitz | % de UI shells completos | 100% (MX-03/04/05/06/12) |
| Blitz | Lint warnings | 0 |
| Blitz | Cobertura schemas Wave 3 com UI | 60% (4 de 7 telas) |
| Sprint 1 | Engines rules-based ativas | 4 de 5 |
| Sprint 2 | Departamentos com fluxograma | 6 de 6 |
| Sprint 3 | Integrações operacionais | 3 de 4 (WhatsApp opcional) |
| Sprint 4 | Epics MX-19/20/21 entregues | 3 de 3 |
| Final | Cobertura `.docx` em produção | 95-100% |
| Final | Testes E2E críticos | 100% green |
| Final | Lighthouse score | ≥85 mobile, ≥90 desktop |

---

## 5. Sequenciamento — quem faz o quê

| Agente | Sprint Blitz | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 |
|---|---|---|---|---|---|
| @pm | — | Story MX-22 | Stories MX-23/24/25 | Stories MX-26/27 | EPICs MX-19/20/21 |
| @po | Ratificar Wave 3 | Validate MX-14, MX-22 | Validate MX-15/17 | Validate MX-09.2/24 | Validate MX-19/20/21 |
| @sm | Draft N3 | Draft Sprint 1 stories | Draft Sprint 2 | Draft Sprint 3 | Draft Sprint 4 |
| @architect | Review schemas das telas | Design Consultor IA | Design Departamentos | Design integrações | Design Remuneração |
| @data-engineer | Engine alertas v1 + score v1 | Engine consultor IA + atraso plano | Schema cultura/clima | Schema benchmarking aggregates | Schema remuneração/organograma/comportamental |
| @dev | UI shells + 4 telas Blitz | UI Central MX + Consultor IA + Planejamento | UI Departamentos + Universidade | UI integrações | UI Remuneração/Organograma/Comportamental |
| @ux-design-expert | Hardening Blitz | Design Consultor IA chat | Design Departamentos visual | — | Design Organograma visual |
| @qa | Full gate Blitz | Gate Sprint 1 | Gate Sprint 2 | Gate Sprint 3 | E2E final + Lighthouse |
| @devops | Deploy Blitz + Supabase MCP token | Cron Supabase setup | — | Meta API + Microsoft Graph setup | Release final + rollback drill |

---

## 6. Critério "Pronto e Funcionando" por entrega

Cada entrega só é considerada **Done** quando:

1. ✅ Story tem status `Done` em `docs/stories/`
2. ✅ Código merged em `main` via PR
3. ✅ `npm run lint` clean (0 errors, 0 warnings)
4. ✅ `npm run typecheck` clean
5. ✅ `npm test` passa (cobertura ≥ baseline atual)
6. ✅ `npm run build` clean
7. ✅ Vercel deploy `● Ready` com smoke test HTTP 200 + render OK
8. ✅ Supabase advisor sem novos `error` em security/performance
9. ✅ @qa fez `qa-gate` com verdict PASS/CONCERNS (CONCERNS aceitável se documentado)
10. ✅ Article IV — rastreabilidade explícita no story

---

## 7. Próximo Passo Imediato

Se você aprovar **AGORA** este roadmap, eu inicio o **Blitz 48h** seguindo a ordem do §1, com pushs incrementais e relatório de progresso a cada subtarefa concluída.

Se preferir um plano diferente (ex.: priorizar integrações, ou focar só em Departamentos), me diga qual fatia e eu reorganizo.

— Orion, orquestrando o sistema 🎯
