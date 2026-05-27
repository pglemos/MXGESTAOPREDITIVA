# EPIC-MX-01 — Fundação Visual & Design System

**Data:** 2026-05-27
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
**Wave:** 1 — Foundation (Top-3)

---

## 1. Goal

Estabelecer o **Design System fundacional do MX Performance** que materialize os princípios visuais NFR-V1 a NFR-V7 do PRD-mestre, servindo como base única para todas as Homes (Dono, Gerente, Vendedor), Departamentos, Central MX e Dashboards.

> Sem esse épico concluído, qualquer UI gerada produz **retrabalho garantido**.

---

## 2. Background

O `.docx` fonte (§357–§366) define o Padrão Visual aprovado:

- Fundo branco
- Cards arredondados
- Design clean
- Azul como cor principal
- Visual moderno SaaS
- Alta legibilidade
- Poucos gráficos — foco em cards e status

Esses requisitos foram codificados como **NFR-V1 a NFR-V7** no PRD-mestre §5.2.

**Estado atual do código:** `src/features/dashboard-loja/*` e `src/features/vendedor-home/*` já contêm componentes parciais (KpisSection, OwnerDecisionCards, PerformanceAlerts, PerformanceTab). Esse épico inclui uma **story de migração/normalização** desses componentes para o DS canônico.

---

## 3. Acceptance Criteria (do épico)

| AC | Critério |
|---|---|
| **AC-01** | Tokens de cor publicados (paleta verde `#22C55E` (ADR-MX-002) primária + neutros + status crítico/atenção/positivo/consultivo conforme FR-ALERT-1) |
| **AC-02** | Tokens de tipografia, espaçamento e raios definidos (cards arredondados — NFR-V2) |
| **AC-03** | Componentes base implementados: `Card`, `KpiCard`, `AlertCard`, `StatusBadge`, `MetricNumber`, `EmptyState`, `SkeletonCard` |
| **AC-04** | Guia de uso (Storybook ou MDX) documentando cada componente com exemplos |
| **AC-05** | Lint/typecheck sem regressões em `src/features/dashboard-loja/*` e `src/features/vendedor-home/*` após migração |
| **AC-06** | NFR-V7 verificado: nenhuma tela do MVP usa gráficos complexos; apenas cards/status/sparklines simples |
| **AC-07** | Acessibilidade básica WCAG AA (contraste, foco visível, navegação por teclado) |

---

## 4. Stories Planejadas (a serem detalhadas por @sm)

> Numeração `1.x` segue convenção AIOX (`{epicNum}.{storyNum}`)

| Story | Título | Resumo |
|---|---|---|
| **1.1** | Tokens — paleta de cores | Publicar `tokens/colors.ts` com primária verde `#22C55E` (ADR-MX-002), neutros, status |
| **1.2** | Tokens — tipografia e espaçamento | Definir escala tipográfica e spacing system |
| **1.3** | Componente Card base | `Card` com variantes (default, elevated, interactive) |
| **1.4** | Componente KpiCard | KPI numérico + label + delta opcional |
| **1.5** | Componente AlertCard | 4 tipos: Crítico/Atenção/Positivo/Consultivo (FR-ALERT-1) com estrutura problema/impacto/recomendação/ação |
| **1.6** | Componente StatusBadge | Badge para faixas do MX Score (Elite/Excelente/Bom/Atenção/Crítico) |
| **1.7** | EmptyState e Skeleton | Estados de carregamento e ausência de dados |
| **1.8** | Migração de componentes legados | Refatorar `KpisSection`, `OwnerDecisionCards`, `PerformanceAlerts`, `PerformanceTab` para usar o DS |
| **1.9** | Guia de uso (Storybook/MDX) | Documentação navegável dos componentes |
| **1.10** | A11y audit gate | Validar WCAG AA com axe |

---

## 5. Dependencies

**Bloqueado por:** ☐ Nenhum — é épico raiz.

**Bloqueia:**
- EPIC-MX-03 (Home Dono / Diretor)
- EPIC-MX-04 (Home Gerente Comercial)
- EPIC-MX-05 (Home Vendedor)
- EPIC-MX-12 (Dashboard Executivo)
- EPIC-MX-13 (Planejamento Estratégico)
- Indiretamente: TODOS os épicos com UI

---

## 6. Article IV — Rastreabilidade (No Invention)

| Item | Fonte |
|---|---|
| Padrão visual NFR-V1 a V7 | PRD §5.2 ← `.docx` §357–§366 |
| Tipos de alerta (AC-01) | PRD §4.6 FR-ALERT-1 ← `.docx` §225–§228 |
| Faixas MX Score (AC-06 + Story 1.6) | PRD §4.7 FR-SCORE-2 ← `.docx` §244–§249 |
| Estado atual dos componentes | git status sessão 2026-05-27, branch `main` |

---

## 7. Next Step

@sm `*draft` da story 1.1 (Tokens — paleta de cores) para iniciar implementação.
