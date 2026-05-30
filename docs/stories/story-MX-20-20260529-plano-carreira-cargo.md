# Story MX-20.3 - Plano de Carreira por Cargo

## Status

**InProgress** — implementada por @dev em 2026-05-29 (trilha por cargo agrupada com níveis/requisitos/próximo cargo). `tsc`+`eslint` limpos. Pendente: validação visual.

## File List

- `src/features/organograma/components/PlanoCarreira.tsx` (criado) — form + trilhas agrupadas por cargo.
- `src/features/organograma/hooks/useOrganograma.ts` (compartilhado) — `useCarreira` + `porCargo`.

## Story

**As a** colaborador,
**I want** ver meu cargo atual e o caminho de evolução (próximos níveis e requisitos),
**so that** eu entenda como crescer na empresa.

## Executor Assignment

executor: "dev"
quality_gate: "architect"
quality_gate_tools: ["code_review", "pattern_validation", "npm run lint", "npm run typecheck"]

## Epic Reference

- **Épico:** EPIC-MX-20 — Organograma + Plano de Carreira
- **Arquivo:** `docs/stories/epics/epic-mx-20-organograma-plano-carreira-2026-05-29.md`
- **Fonte:** roadmap 2026-05-28 (delta N8), linha 173

## Acceptance Criteria

- [ ] **Given** trilha definida (20.1), **when** colaborador acessa carreira, **then** vê cargo atual + próximos níveis e requisitos.
- [ ] **Given** perfil gestor, **when** acessa, **then** vê trilhas dos cargos de sua equipe (conforme MX-02).
- [ ] **Given** trilha vinculável a trilhas de Universidade MX (MX-17), **when** disponível, **then** exibe o link (degradação graciosa se ausente).
- [ ] UI segue design system (EPIC-MX-01).

## Scope

**IN:** Visualização da trilha por cargo, requisitos por nível, vínculo opcional a MX-17.
**OUT:** Schema (20.1), organograma visual (20.2), criação de conteúdo de trilha (MX-17).

## Dependencies

- **Bloqueado por:** Story 20.1.
- **Relacionado a:** EPIC-MX-17 (trilhas), EPIC-MX-16 (PDIs).

## Complexity

**S–M** (3–5 pts) — visualização orientada a dados.

## Business Value

Transparência de evolução → engajamento e retenção.

## Risks

- **Acoplamento rígido com MX-17** → vínculo opcional com degradação graciosa.

## Definition of Done

- [ ] Trilha exibida por cargo com requisitos.
- [ ] Visão por perfil respeitada.
- [ ] Lint + typecheck verdes.
- [ ] Degradação graciosa sem MX-17.
