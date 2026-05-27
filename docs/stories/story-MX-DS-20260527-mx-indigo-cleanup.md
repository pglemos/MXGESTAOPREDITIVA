# Story MX-DS - Cleanup de aliases legacy `mx-indigo` → `mx-green`

## Status

Draft (Tech Debt) — Wave-3+

## Story

**As a** mantenedor do Design System MX Performance,
**I want** remover os aliases `--color-mx-indigo-*` em `src/index.css` (que apontam para `--color-mx-green-*`) e migrar os 4 consumidores remanescentes para usar `mx-green` diretamente,
**so that** o DS tenha apenas uma fonte de verdade canônica (verde) sem confusão histórica do rebrand antigo (indigo → green).

## Executor Assignment

executor: "dev"
quality_gate: "dev"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build", "browser visual regression"]

## Epic Reference

- **Épico:** EPIC-MX-01 (Design System) — tech debt remanescente da Story 1.1 / ADR-MX-002
- **PRD:** §5.2 NFR-V3 (clean — DS sem duplicação)

## Background

Auditoria 2026-05-27 (Story MX-1.2) identificou 11 aliases CSS em `src/index.css` (linhas 183–193) mapeando `--color-mx-indigo-*` → `--color-mx-green-*`. Origem: rebrand antigo de indigo para verde sem cleanup completo.

**Consumidores remanescentes (4 arquivos):**

```
src/features/ranking/components/SellerListItem.tsx
src/features/consultoria/components/GoogleCalendarView.tsx
src/features/lojas/components/StoreGoalsPanel.tsx
src/features/lojas/modals/CreateStoreModal.tsx
```

## Acceptance Criteria

- [ ] Identificar exato uso de classes `mx-indigo-*` em cada um dos 4 arquivos
- [ ] Substituir por `mx-green-*` equivalente (alias atual já é 1:1, sem mudança visual)
- [ ] Visual regression check: navegar nas 4 telas afetadas (ranking, agenda consultoria, store goals panel, create store modal) e confirmar zero diferença visual
- [ ] Remover os 11 aliases de `src/index.css` (linhas 183–193 atuais)
- [ ] Build + lint + typecheck sem regressões

## Tasks / Subtasks

- [ ] Auditar cada uso: pode ser que algumas classes sejam dinâmicas (`bg-mx-indigo-${shade}`) — exige substituição cuidadosa
- [ ] Refatorar SellerListItem.tsx
- [ ] Refatorar GoogleCalendarView.tsx
- [ ] Refatorar StoreGoalsPanel.tsx
- [ ] Refatorar CreateStoreModal.tsx
- [ ] Browser smoke test cada componente
- [ ] Remover aliases CSS
- [ ] Build final

## Risk

🟡 **Médio** — substituição visual deve ser 1:1 (aliases já apontam para os mesmos valores), mas qualquer overflow/uso dinâmico de string interpolation pode quebrar silenciosamente.

## Estimate

S (small) — 4 arquivos + grep+replace + smoke test.

## Article IV

| Item | Fonte |
|---|---|
| NFR-V3 (clean) | PRD §5.2 ← `.docx` §361 |
| Identificação dos aliases | auditoria src/index.css 2026-05-27 |
| 4 consumidores | grep auditoria 2026-05-27 |

## Next Step

Após implementação, validar com QA em ambiente staging antes de merge.
