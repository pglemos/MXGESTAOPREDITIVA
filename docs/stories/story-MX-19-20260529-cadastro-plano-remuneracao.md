# Story MX-19.2 - Cadastro do Plano de Remuneração Atual

## Status

**InProgress** — implementada por @dev em 2026-05-29 (tela de cadastro funcional, RLS-aware). `tsc --noEmit` + `eslint` limpos. Pendente: validação visual com app rodando (QA).

## File List

- `src/features/remuneracao/hooks/useRemuneracao.ts` (criado) — hooks de planos/benchmark/lojas + cálculo.
- `src/features/remuneracao/components/CadastroPlanos.tsx` (criado) — form + tabela de planos por cargo.
- `src/features/remuneracao/RemuneracaoPage.tsx` (criado) — página + seletor de loja + abas.
- `src/App.tsx` (editado) — rota `/remuneracao` (RoleSwitch dono/admin).

## Story

**As a** Dono/RH da loja,
**I want** cadastrar o plano de remuneração atual por cargo (fixo, variável e benefícios),
**so that** a empresa tenha o registro estruturado que alimenta o comparativo de mercado.

## Executor Assignment

executor: "dev"
quality_gate: "architect"
quality_gate_tools: ["code_review", "pattern_validation", "npm run lint", "npm run typecheck"]

## Epic Reference

- **Épico:** EPIC-MX-19 — Sistema de Remuneração Inteligente
- **Arquivo:** `docs/stories/epics/epic-mx-19-remuneracao-inteligente-2026-05-29.md`
- **Fonte:** roadmap 2026-05-28 (delta N7), linha 170

## Acceptance Criteria

- [ ] **Given** perfil autorizado (master/director/hr), **when** acessa Remuneração, **then** vê formulário de cadastro por cargo (fixo/variável/benefícios).
- [ ] **Given** perfil não autorizado, **when** tenta acessar, **then** é bloqueado (route guard + RLS de 19.1).
- [ ] **Given** plano salvo, **when** recarrega, **then** dados persistem corretamente em `remuneracao_planos`.
- [ ] **Given** edição, **when** salva, **then** valores são validados (numéricos, não-negativos).
- [ ] UI segue design system (EPIC-MX-01) e não expõe salário individual a perfis sem permissão.

## Scope

**IN:** Tela/rota de cadastro, formulário por cargo, persistência via 19.1, validações, route guard.
**OUT:** Schema (19.1), cálculo comparativo (19.3).

## Dependencies

- **Bloqueado por:** Story 19.1 (schema), EPIC-MX-02 (route guards).
- **Bloqueia:** Story 19.3 (precisa de dados cadastrados).

## Complexity

**M** (5 pts) — CRUD com guard de acesso e validações.

## Business Value

Captura estruturada do plano atual — pré-requisito para qualquer análise de remuneração.

## Risks

- **Exposição de salário na UI** → guard + componente respeita RLS; @architect valida no gate.

## Definition of Done

- [ ] CRUD funcional com persistência verificada.
- [ ] Route guard testado por perfil.
- [ ] Lint + typecheck verdes.
- [ ] Sem regressão na navegação de Pessoas.
