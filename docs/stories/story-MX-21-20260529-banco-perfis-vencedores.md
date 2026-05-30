# Story MX-21.3 - Banco de Perfis Vencedores

## Status

**InProgress** — implementada por @dev em 2026-05-29 (banco de perfis vencedores agregados, com aviso explícito de não-exposição individual). `tsc`+`eslint` limpos. Pendente: validação visual + engine de agregação automática (perfil × score).

## File List

- `src/features/comportamental/components/BancoTalentos.tsx` (criado) — form + listagem de perfis agregados.
- `src/features/comportamental/hooks/useComportamental.ts` (compartilhado) — `useBancoTalentos` + `perfilEntries`.

## Story

**As a** Dono/RH,
**I want** um banco de talentos que consolide os perfis comportamentais de colaboradores de alta performance,
**so that** eu use esses "perfis vencedores" como referência em futuras contratações.

## Executor Assignment

executor: "dev"
quality_gate: "architect"
quality_gate_tools: ["code_review", "pattern_validation", "npm run lint", "npm run typecheck"]

## Epic Reference

- **Épico:** EPIC-MX-21 — Teste Comportamental + Banco de Talentos
- **Arquivo:** `docs/stories/epics/epic-mx-21-teste-comportamental-banco-talentos-2026-05-29.md`
- **Fonte:** roadmap 2026-05-28 (delta N13), linha 176

## Acceptance Criteria

- [ ] **Given** perfis (21.1) cruzados com score (MX-07), **when** consolida, **then** o banco destaca padrões de alta performance.
- [ ] **Given** dado sensível, **when** exibido, **then** mostra padrão agregado — não expõe resultado individual a perfil não autorizado (MX-02).
- [ ] **Given** nova contratação, **when** comparada, **then** o sistema indica aderência ao perfil vencedor.
- [ ] UI segue design system (EPIC-MX-01).

## Scope

**IN:** Agregação de perfis × score, visualização do perfil vencedor, comparação de aderência.
**OUT:** Schema (21.1), aplicação do teste (21.2), ATS/recrutamento externo.

## Dependencies

- **Bloqueado por:** Stories 21.1 e 21.2, EPIC-MX-07 (score).

## Complexity

**M** (5 pts) — agregação + comparação com cuidado ético.

## Business Value

Contratação orientada por evidência de performance, não intuição.

## Risks

- **Viés/discriminação** → agregação, não exposição individual; revisão ética + @architect no gate.

## Definition of Done

- [ ] Agregação correta validada com dados de exemplo.
- [ ] Sem exposição individual indevida (RLS/agregação).
- [ ] Lint + typecheck verdes.
