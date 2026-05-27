# Story MX-1.1 - Tokens de Cor (Paleta MX Performance)

## Status

✅ **Unblocked (2026-05-27) — Opção B aprovada via ADR-MX-002**

> Escopo redefinido: estender DS verde existente (`src/index.css`, 1570 linhas, marca `#22C55E`) com tokens **faltantes** (faixas MX Score + alert.consultive). NÃO é rebrand. Story passa de S → S (escopo reduzido — tokens semânticos aditivos apenas).

## Story

**As a** desenvolvedor de UI do MX Performance,
**I want** uma paleta de cores canônica em TypeScript com tokens semânticos para alertas e faixas de MX Score,
**so that** todas as Homes, Dashboards e Cards do sistema usem a mesma identidade visual aprovada (NFR-V1 a NFR-V7) sem hardcoding de hex em componentes.

## Executor Assignment

executor: "dev"
quality_gate: "dev"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build"]

## Epic Reference

- **Épico:** EPIC-MX-01 — Fundação Visual & Design System
- **Arquivo:** `docs/stories/epics/epic-mx-01-design-system-2026-05-27.md`
- **PRD:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md` §5.2 + §4.6 FR-ALERT-1 + §4.7 FR-SCORE-2

## Acceptance Criteria (revisados pós-ADR-MX-002)

- [ ] **Preservar** marca verde existente (`--color-brand-primary: #22C55E` em `src/index.css`)
- [ ] **Adicionar** 5 tokens semânticos de **faixa MX Score** ao `@theme` em `src/index.css`:
  - `--color-score-elite` (90–100, verde marca)
  - `--color-score-excellent` (80–89, verde claro)
  - `--color-score-good` (70–79, azul info reutilizado)
  - `--color-score-attention` (60–69, âmbar/warning)
  - `--color-score-critical` (<60, vermelho/error)
- [ ] **Adicionar** token semântico de alerta consultivo: `--color-alert-consultive` + `--color-alert-consultive-surface`
- [ ] Criar `src/design-system/tokens/colors.ts` espelhando tokens semânticos (alerta + score) para uso TS programático
- [ ] Criar `src/design-system/index.ts` (barrel)
- [ ] Tipos exportados: `AlertSemantic`, `ScoreBandSemantic`
- [ ] Zero regressão em `npm run lint` / `typecheck` / `test` / `build`

## Tasks / Subtasks

- [ ] Mapear estrutura atual de styles/tokens no projeto (procurar `src/styles/`, `src/design-system/`, `tailwind.config`)
- [ ] Decidir local canônico do arquivo de tokens (preferência: `src/design-system/tokens/colors.ts`)
- [ ] Implementar paleta primária azul (escala 50→900)
- [ ] Implementar neutros + tokens semânticos de alerta
- [ ] Implementar tokens semânticos de faixa MX Score
- [ ] Adicionar JSDoc com contrast ratios calculados (WCAG AA mínimo 4.5:1 para texto normal)
- [ ] Criar arquivo de teste verificando exports e types
- [ ] Atualizar barrel export
- [ ] Rodar quality gates locais (lint, typecheck, test, build)

## Dev Notes

### 🔍 Auditoria do estado atual (2026-05-27)

| Item | Estado encontrado |
|---|---|
| `src/design-system/` | **Não existe** — story criará a pasta |
| `src/styles/` | **Não existe** |
| Tailwind | v4.1.14 instalado (`@tailwindcss/vite`, `tailwind-merge`) |
| `tailwind.config*` | **Não existe** (Tailwind 4 usa config CSS-first via `@theme`) |
| `src/index.css` | Existe (entry point CSS principal) |
| Componentes existentes consumidores | `MXScoreCard` em `components/molecules/`, `MXScoreCompact` em `OwnerExecutiveCockpit.tsx` (untracked) — todos hardcoded em cores |

### 🎯 Decisão técnica recomendada (Tailwind 4 CSS-first)

Em Tailwind 4, tokens vivem em CSS via `@theme` directive. Sugestão de implementação dupla:

1. **Fonte de verdade CSS:** `src/design-system/theme.css` com `@theme { --color-primary-500: #...; }` — consumido pelo Tailwind para gerar utilities
2. **Espelho TypeScript:** `src/design-system/tokens/colors.ts` para uso programático (gráficos, computed styles)
3. **Barrel:** `src/design-system/index.ts` re-exporta tudo

Esta dualidade dá: ergonomia Tailwind + type-safety para casos programáticos.

### Componentes existentes a normalizar (Story 1.8 do épico)

- `MXScoreCard` em `src/components/molecules/` — provavelmente já usa faixas Score; após tokens consumir `score.elite/excellent/...`
- `MXScoreCompact` em `OwnerExecutiveCockpit.tsx` (l.581-...) — duplicação a deduplicar
- Componentes em `src/features/dashboard-loja/sections/` (`KpisSection`, `OwnerDecisionCards`, `PerformanceAlerts`)

### Constraint inviolável (NFR-V1 a V7)

| NFR | Valor |
|---|---|
| NFR-V1 | Fundo branco (`background: #FFFFFF`) |
| NFR-V2 | Cards arredondados (não aplica a colors, mas relevante p/ próximas stories) |
| NFR-V3 | Design clean — paleta enxuta, sem cores acessórias além das semânticas |
| NFR-V4 | Azul como cor principal |
| NFR-V5 | Visual moderno SaaS |
| NFR-V6 | Alta legibilidade — contraste WCAG AA obrigatório |
| NFR-V7 | Foco em cards e status (cores semânticas críticas) |

### Sugestão de paleta azul (referência SaaS moderno, ajustável)

Tons referenciais — definição final cabe ao implementador desde que respeite contrast ratios:

- `blue.50` → quase branco
- `blue.500` → primário canônico (foco de marca)
- `blue.700` → estado hover/active
- `blue.900` → headers/destaques

### Faixas MX Score → cores semânticas

Mapeamento sugerido (com base em convenções SaaS — confirmar com design):

| Faixa | Range | Cor sugerida |
|---|---|---|
| Elite | 90–100 | Verde (positive intense) |
| Excelente | 80–89 | Verde claro |
| Bom | 70–79 | Azul (primary) |
| Atenção | 60–69 | Amarelo/Âmbar |
| Crítico | <60 | Vermelho |

### Reuso obrigatório

Os tokens semânticos `alert.*` e `score.*` serão consumidos por:
- `<AlertCard>` (Story 1.5)
- `<StatusBadge>` (Story 1.6)
- Future: PerformanceAlerts.tsx (já existe em `src/features/dashboard-loja/sections/`)

## Testing

- Teste unitário verificando que cada export é uma string hex válida ou objeto de escala completo
- Teste TypeScript: tipos `AlertColor`, `ScoreBandColor` exportados e usáveis em consumidores
- Verificação manual de contrast em https://webaim.org/resources/contrastchecker/ (documentar resultado em JSDoc)

## Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Padrão visual (fundo branco, azul primário) | PRD §5.2 NFR-V1, NFR-V4 ← `.docx` §357–§364 |
| Tipos de alerta | PRD §4.6 FR-ALERT-1 ← `.docx` §225–§228 |
| Faixas MX Score | PRD §4.7 FR-SCORE-2 ← `.docx` §244–§249 |

## Estimate

S (small) — token file isolado, sem dependência externa.

## Next Step

Após DoD: @qa `*qa-gate` e desbloqueio das stories 1.3 a 1.7 (componentes base).
