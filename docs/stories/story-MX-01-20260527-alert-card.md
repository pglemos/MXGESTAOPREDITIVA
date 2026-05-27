# Story MX-1.5 - Componente AlertCard

## Status

✅ **Done (2026-05-27)** — ADR-MX-002 aprovada (Opção B verde), componente implementado em `src/components/molecules/AlertCard.tsx`, 11 testes pass, exposto via `src/design-system/index.ts`.

## Story

**As a** usuário de qualquer perfil do MX Performance,
**I want** ver alertas estruturados com problema, impacto, recomendação e ação rápida,
**so that** posso decidir e agir conforme FR-ALERT-2 do PRD (.docx §229–§234).

## Executor Assignment

executor: "dev"
quality_gate: "qa"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "storybook a11y audit"]

## Epic Reference

- **Épico:** EPIC-MX-01 — Fundação Visual & Design System
- **Componente legado a substituir:** `src/features/dashboard-loja/sections/PerformanceAlerts.tsx`

## Acceptance Criteria

- [ ] Componente `<AlertCard>` em `src/components/molecules/AlertCard.tsx` (ou `src/design-system/components/AlertCard.tsx` se Story 1.1 desbloquear o path)
- [ ] Props: `type` (critical | warning | positive | consultive), `problem`, `impact`, `recommendation`, `quickAction?`
- [ ] Variantes visuais por tipo (FR-ALERT-1 .docx §225–§228)
- [ ] Ícone e cor de borda conforme tipo
- [ ] CTA "Ação rápida" como botão opcional
- [ ] Acessibilidade: `role="alert"` para critical, `aria-live="polite"` para warning/positive/consultive
- [ ] Mobile-friendly (responsive)
- [ ] Storybook stories cobrindo os 4 tipos
- [ ] Migração: `PerformanceAlerts.tsx` consome `<AlertCard>` (deduplicação)

## Tasks / Subtasks

- [ ] Inventariar uso atual de alertas em `src/features/*`
- [ ] Desenhar API do componente
- [ ] Implementar `<AlertCard>` consumindo tokens
- [ ] Stories Storybook
- [ ] Refatorar `PerformanceAlerts.tsx`
- [ ] Testes unitários + a11y

## Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Tipos de alerta | PRD §4.6 FR-ALERT-1 ← `.docx` §225–§228 |
| Estrutura obrigatória (problema, impacto, recomendação, ação) | PRD §4.6 FR-ALERT-2 ← `.docx` §229–§234 |

## Estimate

M (medium).
