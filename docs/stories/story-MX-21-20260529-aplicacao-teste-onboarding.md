# Story MX-21.2 - Aplicação de Teste no Onboarding

## Status

**InProgress** — implementada por @dev em 2026-05-29 (cadastro de questões + aplicação com escala 1–5 → cria sessão/respostas/perfil do usuário via auth.uid). `tsc`+`eslint` limpos. Pendente: validação visual + integração ao fluxo de onboarding real.

## File List

- `src/features/comportamental/hooks/useComportamental.ts` (criado) — questões + `aplicarTeste` + `calcularPerfil`.
- `src/features/comportamental/components/TesteComportamental.tsx` (criado) — questões + aplicação do teste.
- `src/features/comportamental/ComportamentalPage.tsx` (criado) — página + abas.
- `src/App.tsx` (editado) — rota `/banco-talentos`.

## Story

**As a** colaborador em onboarding,
**I want** responder a um teste comportamental integrado ao fluxo de entrada,
**so that** meu perfil seja registrado para desenvolvimento e referência.

## Executor Assignment

executor: "dev"
quality_gate: "architect"
quality_gate_tools: ["code_review", "pattern_validation", "npm run lint", "npm run typecheck"]

## Epic Reference

- **Épico:** EPIC-MX-21 — Teste Comportamental + Banco de Talentos
- **Arquivo:** `docs/stories/epics/epic-mx-21-teste-comportamental-banco-talentos-2026-05-29.md`
- **Fonte:** roadmap 2026-05-28 (delta N13), linha 176

## Acceptance Criteria

- [ ] **Given** colaborador em onboarding, **when** chega à etapa de teste, **then** responde às questões de `comportamental_questoes`.
- [ ] **Given** teste concluído, **when** submete, **then** respostas e perfil são gravados (21.1) vinculados ao colaborador.
- [ ] **Given** teste opcional/assíncrono, **when** pulado, **then** onboarding não é bloqueado (degradação graciosa).
- [ ] UI segue design system (EPIC-MX-01); integra ao onboarding de MX-17.

## Scope

**IN:** Fluxo de teste, captura/persistência via 21.1, integração ao onboarding, estado "pendente".
**OUT:** Schema (21.1), banco de perfis vencedores (21.3).

## Dependencies

- **Bloqueado por:** Story 21.1.
- **Relacionado a:** EPIC-MX-17 (onboarding).

## Complexity

**M** (5 pts) — fluxo multi-etapa integrado a onboarding.

## Business Value

Captura do perfil no momento certo (entrada), sem fricção.

## Risks

- **Bloquear onboarding** → teste assíncrono/opcional com estado pendente.

## Definition of Done

- [ ] Fluxo de teste funcional com persistência.
- [ ] Onboarding não regride / não bloqueia.
- [ ] Lint + typecheck verdes.
