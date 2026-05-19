# ADR-0054 — Padrão de componentes UI: Atomic Design custom + Radix selective

**Status:** Proposed
**Date:** 2026-05-19
**Author:** @ux-design-expert (Uma)
**Related:** Story 3.10 / SYS-013, `docs/reviews/ux-component-duplication-audit.md`

---

## Contexto

Auditoria empírica de duplicação Radix vs custom (Story 3.10) revelou:

- Apenas 1 dependência Radix instalada (`@radix-ui/react-dialog`)
- Design system custom atomic-design já consolidado em `src/components/{atoms,molecules,organisms}/` (30 componentes, ~2.4k LOC)
- shadcn/ui **não foi adotado** (não há `components/ui/`)
- Risco identificado: alguns primitives custom têm cobertura a11y incompleta (Tooltip sem focus management, TabNav sem ARIA roving tabindex)

Esta ADR formaliza a política para evitar inconsistência futura e drift arquitetural.

---

## Decisão

### 1. Padrão primário: Custom Atomic Design

Todo componente UI novo é criado em `src/components/{atoms|molecules|organisms}/` seguindo atomic design. Variantes via `class-variance-authority`. Estilo via Tailwind + design tokens (`@theme` em `src/index.css`).

### 2. Adoção seletiva de Radix UI primitives

Radix UI primitives são adotados **caso a caso** quando **ambos** os critérios são verdade:

- (a) o primitive é **a11y-crítico** (gerencia foco, ARIA roles complexos, keyboard navigation não-trivial)
- (b) reimplementar custom geraria risco WCAG ou alto custo de manutenção

**Primitives candidatos justificáveis:** Dialog (já adotado), Tooltip, Tabs, Popover, Combobox, ToggleGroup.
**Primitives que NÃO justificam adoção:** Avatar (simples), Accordion (`<details>` nativo OK), Badge, Slot (custom CVA basta).

### 3. Encapsulamento obrigatório

Todo import `@radix-ui/*` fica **encapsulado em UM ÚNICO arquivo wrapper** dentro de `src/components/`. Consumidores (`src/features/`, `src/pages/`) **nunca importam `@radix-ui/*` diretamente**.

Exemplo correto:
```tsx
// src/components/organisms/Modal.tsx — wrapper canônico
import * as Dialog from '@radix-ui/react-dialog'
export function Modal(...) { ... }

// src/features/pdi/WizardPDI.tsx — consumidor
import { Modal } from '@/components/organisms/Modal'  // ✓
```

### 4. shadcn/ui é rejeitado

Modelo copy-paste registry conflita com nossa estratégia de:
- Design tokens centralizados (lint-tokens AST, Story 3.8)
- Atomic design strict
- Single source of truth por componente

### 5. Enforcement futuro (backlog Sprint 4+)

- ESLint rule `no-restricted-imports`: bloquear `@radix-ui/*` fora de `src/components/`
- Storybook (Story 3.9) documenta apenas componentes do design system custom
- CodeRabbit review flag para imports diretos de Radix em `features/` ou `pages/`

---

## Consequências

### Positivas

- **Bundle pequeno** — apenas Radix primitives realmente usados são instalados
- **Design tokens consistentes** — controle total de visual via Tailwind tokens
- **Onboarding claro** — "novo componente → atomic design custom; precisa a11y complexa → wrapper Radix em `components/`"
- **Manutenção concentrada** — Radix updates afetam só wrappers, não o app inteiro

### Negativas

- **Custo de manter primitives a11y custom** (Tooltip, TabNav) — mitigado por backlog Sprint 4 para migração seletiva a Radix
- **Curva de decisão** — devs precisam julgar "isto é a11y-crítico?" ao criar novo componente — mitigado por exemplos neste ADR

### Trade-offs aceitos

- NÃO usamos shadcn/ui (perdemos velocidade de registry copy-paste)
- NÃO usamos Material UI / Chakra (perdemos componentes prontos completos)
- ESCOLHEMOS controle de bundle, tokens e design consistency

---

## Aplicação

| Caso | Ação |
|------|------|
| Novo componente UI simples (Badge, Card) | Custom em `atoms/` ou `molecules/` |
| Novo componente UI a11y-crítico | Wrapper Radix em `components/` (1 wrapper, vários consumidores) |
| Refactor de Tooltip custom (a11y gap) | Sprint 4: substituir por `@radix-ui/react-tooltip` wrapped |
| `WizardPDI.tsx` import direto de `@radix-ui/react-dialog` | Sprint 4: refatorar para usar `<Modal>` wrapper |

---

## Referências

- `docs/reviews/ux-component-duplication-audit.md` — auditoria completa
- `docs/reviews/architect-review.md` §SYS-013 — débito original (a ser downgrade para "resolved")
- ADR-0050 (pages decomposition pattern)
- ADR-0051 (god hook split pattern)
- Story 3.10 — Auditoria componentes duplicados
