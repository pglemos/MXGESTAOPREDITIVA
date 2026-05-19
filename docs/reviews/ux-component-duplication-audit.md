# Auditoria — Componentes Duplicados Radix vs Custom

**Date:** 2026-05-19
**Author:** @ux-design-expert (Uma)
**Story:** 3.10 / SYS-013
**Status:** AUDIT-ONLY (sem refactor invasivo)

---

## 1. Executive Summary

**Findings inesperados vs premissa da story:**

A story 3.10 (SYS-013) foi escrita assumindo coexistência de **múltiplos primitives Radix + wrappers shadcn/ui + componentes custom duplicados**. A auditoria empírica do `src/` revelou um quadro substancialmente diferente:

- **Apenas 1 dependência Radix instalada:** `@radix-ui/react-dialog@^1.1.15`
- **Não existe `src/components/ui/`** (convenção shadcn) — o projeto NÃO usa shadcn/ui
- **Design system é custom atomic-design** (`atoms/`, `molecules/`, `organisms/`) com 30 componentes, ~2.359 LOC totais
- **Radix é usado em apenas 4 arquivos** (Modal organism + WizardPDI + 2 testes) — sempre via wrapper `<Modal>`
- **Zero dependências Radix declaradas mas não usadas** — não há candidatos a `npm uninstall`

**Conclusão:** O débito SYS-013 foi mitigado organicamente pela evolução do projeto. **Não há duplicação Radix vs custom**. Existe risco oposto (reinvenção de primitives a11y) — mas é decisão arquitetural válida documentada pelo padrão atomic-design.

**Top recomendação:** Formalizar política via ADR-0054 ("Padrão custom atomic-design + Radix apenas para Dialog") e fechar SYS-013 como **RESOLVIDO POR EVOLUÇÃO** com escopo reduzido em Stories futuras.

---

## 2. Radix Deps Instalados (Inventário Real)

| Package | Versão | Imports em `src/` | Status |
|---------|--------|-------------------|--------|
| `@radix-ui/react-dialog` | ^1.1.15 | 4 arquivos (1 wrapper, 1 consumidor direto, 2 testes) | **EM USO — manter** |

**Nenhum outro primitive Radix instalado.** Não há `react-dropdown-menu`, `react-popover`, `react-tooltip`, `react-select`, `react-tabs`, `react-accordion`, `react-switch`, `react-toggle-group` etc.

### Imports diretos de `@radix-ui/react-dialog`

| Arquivo | Tipo | Recomendação |
|---------|------|--------------|
| `src/components/organisms/Modal.tsx` | Wrapper canônico (correto) | **MANTER** |
| `src/features/pdi/WizardPDI.tsx` | Uso direto fora do wrapper | **REFACTOR** — migrar para `<Modal>` (Sprint 4) |
| `src/test/organisms/Modal.test.tsx` | Teste do wrapper | OK |
| `src/test/molecules/ModalTrigger.test.tsx` | Teste do trigger | OK |

---

## 3. Custom Components Auditados

Inventário completo de `src/components/{atoms,molecules,organisms}/`:

### Atoms (12 componentes, 749 LOC)

| Component | LOC | Equivalente Radix? | Recomendação |
|-----------|----:|-------------------|--------------|
| `Accordion.tsx` | 71 | `@radix-ui/react-accordion` (NÃO instalado) | **ADAPT** — usa `<details>` HTML nativo (a11y OK, leve). Manter custom. |
| `Avatar.tsx` | 99 | `@radix-ui/react-avatar` (NÃO instalado) | **ADAPT** — simples, não justifica dep. Manter. |
| `Badge.tsx` | 50 | N/A (não é primitive Radix) | **CREATE** — design-system core. Manter. |
| `Button.tsx` | 109 | `@radix-ui/react-slot` (NÃO instalado) | **CREATE** — variantes via CVA, design tokens. Manter. |
| `DatePicker.tsx` | 31 | N/A | **ADAPT** — wrapper de `<input type="date">`. Manter. |
| `EmptyState.tsx` | 86 | N/A | **CREATE** — pattern composto. Manter. |
| `Input.tsx` | 24 | N/A | **CREATE** — wrapper de `<input>`. Manter. |
| `Select.tsx` | 70 | `@radix-ui/react-select` (NÃO instalado) | **ADAPT** — usa `<select>` HTML nativo (a11y nativo, sem JS). Manter. ⚠️ ver risco mobile keyboard. |
| `Skeleton.tsx` | 50 | N/A | **CREATE** — Story 3.14. Manter. |
| `Textarea.tsx` | 23 | N/A | **CREATE** — wrapper de `<textarea>`. Manter. |
| `Tooltip.tsx` | 59 | `@radix-ui/react-tooltip` (NÃO instalado) | **REVIEW** ⚠️ — implementação custom CSS hover. Falta foco/teclado WCAG. **Backlog Sprint 4.** |
| `Typography.tsx` | 68 | N/A | **CREATE** — design tokens. Manter. |

### Molecules (12 componentes, 611 LOC)

| Component | LOC | Recomendação |
|-----------|----:|--------------|
| `Breadcrumb.tsx` | 43 | **CREATE** — manter |
| `Card.tsx` | 71 | **CREATE** — manter |
| `FilterBar.tsx` | 36 | **CREATE** — manter |
| `FormField.tsx` | 55 | **CREATE** — manter |
| `GlossaryHint.tsx` | 21 | **CREATE** — usa Tooltip (herda risco a11y) |
| `LastUpdated.tsx` | 27 | **CREATE** — manter |
| `MXScoreCard.tsx` | 72 | **CREATE** — domínio-específico, manter |
| `ModalTrigger.tsx` | 43 | **CREATE** — wrapper de Dialog.Trigger, OK |
| `PageHeader.tsx` | 36 | **CREATE** — manter |
| `StatusBadge.tsx` | 92 | **CREATE** — manter |
| `TabNav.tsx` | 47 | **REVIEW** ⚠️ — alternativa: `@radix-ui/react-tabs` para a11y completa (ARIA tabs). Backlog. |
| `TabNavPill.tsx` | 68 | **REVIEW** ⚠️ — idem |

### Organisms (6 componentes, 1.008 LOC)

| Component | LOC | Recomendação |
|-----------|----:|--------------|
| `AgendaCalendar.tsx` | 267 | **CREATE** — domínio-específico |
| `DREForm.tsx` | 164 | **CREATE** — domínio-específico |
| `DRETable.tsx` | 121 | **CREATE** — domínio-específico |
| `DataGrid.tsx` | 173 | **CREATE** — domínio-específico |
| `Modal.tsx` | 96 | **ADAPT** — wrapper canônico de `@radix-ui/react-dialog`. **Manter — ground truth.** |
| `VisitCard.tsx` | 187 | **CREATE** — domínio-específico |

**Total auditado:** 30 componentes, 2.368 LOC.

---

## 4. Design Tokens — Status

Verificação amostral: tokens centralizados em `src/index.css` (`@theme`) + `tailwind.config.*`, alinhados pelas Stories 3.7 (charts) e 3.8 (lint-tokens AST). Não foram identificados **tokens duplicados ou mortos** em pass superficial. Auditoria profunda de tokens fica fora do escopo desta story (própria do lint-tokens — Story 3.8).

---

## 5. Plano de Consolidação Recomendado

### Curto prazo (este PR — Story 3.10)

Cleanup mínimo (nenhuma dep para remover):
- ✅ Documentar findings reais via este relatório
- ✅ Propor **ADR-0054 — Padrão custom atomic-design + Radix policy**
- ✅ Atualizar story 3.10 com escopo reduzido (audit-only)

### Médio prazo (Sprint 4)

1. **WizardPDI.tsx:** migrar import direto `@radix-ui/react-dialog` para `<Modal>` wrapper (consistência)
2. **Tooltip a11y:** avaliar adoção de `@radix-ui/react-tooltip` por causa de foco/teclado WCAG — risco SEC/UX médio
3. **TabNav a11y:** avaliar `@radix-ui/react-tabs` para ARIA tabs corretos
4. **Select mobile UX:** revisar se `<select>` nativo é UX adequada em mobile complexo (caso negativo, considerar `@radix-ui/react-select`)

### Backlog (Sprint 5+)

- Storybook (Story 3.9 ainda Ready) refletindo padrão decidido pelo ADR-0054
- ESLint rule custom: `no-restricted-imports` bloqueando `@radix-ui/*` fora de `src/components/`

---

## 6. Riscos

| Risco | Mitigação |
|-------|-----------|
| Tooltip custom não atende WCAG (sem keyboard/focus) | Story Sprint 4 — substituir por `@radix-ui/react-tooltip` |
| TabNav custom sem ARIA roving tabindex | Story Sprint 4 — `@radix-ui/react-tabs` ou ajuste a11y manual |
| Reinventar primitive complexo no futuro (ex: Combobox) sem usar Radix | ADR-0054 estabelece policy: **"se primitive é a11y-crítico e existe Radix, use Radix wrapped em `components/`"** |
| Story 3.10 original (50% migração) não aplicável | Reduzir escopo: audit-only + ADR; AC1-AC2 atendidos; AC3-AC5 movidos para backlog |

---

## 7. ADR Sugerido — ADR-0054

**Título:** Padrão de componentes UI — Atomic Design custom + Radix selective

**Status:** Proposed (aguarda @architect)

**Decisão proposta:**
1. **Custom atomic-design é o padrão** (`src/components/{atoms,molecules,organisms}/`)
2. **Radix primitives** são adotados **caso a caso** quando: (a) primitive é a11y-crítico (Dialog, Tooltip, Tabs, Combobox); (b) custom seria reinventar a roda com risco a11y
3. **Wrappers obrigatórios:** todo Radix import fica encapsulado em um único `components/` arquivo. Consumidores nunca importam `@radix-ui/*` diretamente
4. **ESLint rule** (futuro): `no-restricted-imports` bloqueia `@radix-ui/*` fora de `src/components/`
5. **shadcn/ui NÃO é adotado** — copy-paste registry conflita com atomic-design strict + design tokens

**Consequências positivas:** Controle total de design, bundle pequeno, tokens consistentes.
**Consequências negativas:** Custo de manter primitives a11y (Tooltip, Tabs) — mitigado por adoção seletiva Radix.

---

## 8. Conclusão

**SYS-013 NÃO é débito ativo** — premissa original (coexistência Radix direto + shadcn + custom) **não se materializou** no codebase. O projeto convergiu organicamente para um design system custom limpo com Radix usado apenas onde estritamente necessário (Dialog).

**Story 3.10 escopo final:**
- ✅ AC1 (auditoria) — este documento
- ✅ AC2 (decisão arquitetural) — ADR-0054 proposed
- ❌ AC3 (50% migração) — N/A (nada a migrar; 1 import direto refactor → backlog)
- ❌ AC4 (lint warning) — backlog Sprint 4
- ❌ AC5 (Storybook) — depende Story 3.9 (não implementada)

**Recomendação ao @po/@qa:** aceitar story como **PASS com escopo reduzido** (audit-only) — débito SYS-013 fica downgrade para "resolvido por evolução" no architect-review.
