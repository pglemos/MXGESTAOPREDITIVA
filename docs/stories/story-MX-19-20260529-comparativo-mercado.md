# Story MX-19.3 - Comparativo de Mercado (Abaixo/Dentro/Acima)

## Status

**InProgress** — implementada por @dev em 2026-05-29 (comparativo com classificação abaixo/dentro/acima + parâmetros região/tamanho/meta; estado "sem referência" tratado). `tsc --noEmit` + `eslint` limpos. Pendente: validação visual com app rodando (QA).

## File List

- `src/features/remuneracao/components/ComparativoMercado.tsx` (criado) — parâmetros + tabela com badge de classificação.
- `src/features/remuneracao/hooks/useRemuneracao.ts` (compartilhado) — `useBenchmark` + `montarComparativo`.

## Story

**As a** Dono/RH da loja,
**I want** ver cada cargo classificado como abaixo, dentro ou acima da média de mercado, parametrizado por região, tamanho de loja e meta,
**so that** eu tome decisões data-driven de retenção e dimensionamento de custo.

## Executor Assignment

executor: "dev"
quality_gate: "architect"
quality_gate_tools: ["code_review", "pattern_validation", "npm run lint", "npm run typecheck"]

## Epic Reference

- **Épico:** EPIC-MX-19 — Sistema de Remuneração Inteligente
- **Arquivo:** `docs/stories/epics/epic-mx-19-remuneracao-inteligente-2026-05-29.md`
- **Fonte:** roadmap 2026-05-28 (delta N7), linha 170

## Acceptance Criteria

- [ ] **Given** plano cadastrado (19.2) e benchmark (19.1), **when** abre o comparativo, **then** cada cargo é classificado abaixo/dentro/acima da faixa de mercado.
- [ ] **Given** parâmetros região/tamanho/meta, **when** o usuário ajusta, **then** a classificação recalcula contra a faixa correspondente.
- [ ] **Given** ausência de benchmark para um cargo, **when** exibe, **then** mostra estado "sem referência" (sem erro).
- [ ] Visual usa design system (EPIC-MX-01); acesso restrito conforme 19.1/MX-02.

## Scope

**IN:** Lógica de classificação, seletor de parâmetros, visualização por cargo, estado vazio.
**OUT:** Schema (19.1), cadastro (19.2), agregações avançadas de benchmarking (delega a EPIC-MX-10).

## Dependencies

- **Bloqueado por:** Stories 19.1 e 19.2.
- **Relacionado a:** EPIC-MX-10 (benchmarking agregado — opcional para enriquecer faixas).

## Complexity

**M** (5 pts) — lógica de faixas + UI parametrizável.

## Business Value

Transforma dado bruto em decisão: onde a empresa paga fora do mercado.

## Risks

- **Faixas de benchmark imprecisas** → marcar fonte/data; estado "sem referência" evita conclusão errada.

## Definition of Done

- [ ] Classificação correta validada com dados de exemplo.
- [ ] Recálculo por parâmetro funcional.
- [ ] Lint + typecheck verdes.
- [ ] Acesso restrito testado.
