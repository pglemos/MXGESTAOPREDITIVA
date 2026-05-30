# Story MX-20.2 - Organograma Visual

## Status

**InProgress** — implementada por @dev/@ux em 2026-05-29 (árvore hierárquica recursiva com expand/collapse + add/remover nó). `tsc`+`eslint` limpos. Pendente: validação visual.

## File List

- `src/features/organograma/hooks/useOrganograma.ts` (criado) — fetch nós + `buildTree` + mutations.
- `src/features/organograma/components/OrganogramaVisual.tsx` (criado) — árvore navegável.
- `src/features/organograma/OrganogramaPage.tsx` (criado) — página + abas + seletor de loja.
- `src/App.tsx` (editado) — rota `/organograma`.

## Story

**As a** Dono/Master,
**I want** visualizar a estrutura hierárquica da empresa como uma árvore navegável,
**so that** eu enxergue a organização real e possa comunicá-la com clareza.

## Executor Assignment

executor: "ux-design-expert"
quality_gate: "dev"
quality_gate_tools: ["code_review", "accessibility_audit", "npm run lint", "npm run typecheck"]

## Epic Reference

- **Épico:** EPIC-MX-20 — Organograma + Plano de Carreira
- **Arquivo:** `docs/stories/epics/epic-mx-20-organograma-plano-carreira-2026-05-29.md`
- **Fonte:** roadmap 2026-05-28 (delta N8), linha 173

## Acceptance Criteria

- [ ] **Given** dados de 20.1, **when** abre o organograma, **then** vê árvore hierárquica com cargos/pessoas.
- [ ] **Given** estrutura grande, **when** renderiza, **then** usa expand/collapse ou virtualização (performance aceitável).
- [ ] **Given** nó selecionado, **when** clica, **then** vê detalhes do cargo/pessoa.
- [ ] Componente acessível (navegação por teclado, ARIA) e segue design system (EPIC-MX-01).

## Scope

**IN:** Componente de árvore, expand/collapse, detalhe do nó, responsividade.
**OUT:** Schema (20.1), edição estrutural avançada, plano de carreira (20.3).

## Dependencies

- **Bloqueado por:** Story 20.1 (schema).
- **Relacionado a:** EPIC-MX-01 (design system).

## Complexity

**M** (5 pts) — componente visual hierárquico com a11y e performance.

## Business Value

Clareza organizacional imediata para o Dono.

## Risks

- **Performance em estruturas grandes** → virtualização/lazy; @dev valida no gate.

## Definition of Done

- [ ] Árvore renderiza dados reais.
- [ ] a11y verificada (teclado + ARIA).
- [ ] Lint + typecheck verdes.
- [ ] Responsivo mobile/desktop.
