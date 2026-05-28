# Story OPS-20260528 - Zerar Warnings de Lint Legados

## Status

Draft

## Story

**As a** maintainer da base MX Performance,
**I want** zerar os 56 warnings de lint pré-existentes detectados no QA gate Wave 3,
**so that** o sinal de `npm run lint` volte a ser limpo e novas regressões sejam detectadas imediatamente sem ruído de warnings históricos.

## Executor Assignment

executor: "dev"
quality_gate: "qa"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build"]

## Epic Reference

- Operacional / Dívida técnica (sem epic dedicado, criado a partir de QA gate)
- QA gate fonte: `docs/reports/qa-gate-mx-wave3-stories-20260528.md`

## Context

Durante o QA gate dry-run da Wave 3 (5 stories Ready-for-Review: MX-08, MX-09, MX-10, MX-11, MX-13), `npm run lint` retornou `0 errors / 56 warnings`. Todos os warnings são pré-existentes e fora do escopo das stories Wave 3, mas precisam ser tratados para manter o sinal de lint utilizável como guard rail de PRs futuros.

Distribuição dos 56 warnings:

| Arquivo | Warnings | Categoria |
|---|---|---|
| `src/lib/observability/sentry.ts` | 2 | `Unused eslint-disable directive` |
| `src/lib/observability/web-vitals.ts` | 2 | `Unused eslint-disable directive` |
| `src/pages/Login.tsx` | 2 | `jsx-a11y/no-autofocus` |
| `src/pages/Perfil.tsx` | 6 | `jsx-a11y/click-events-have-key-events`, `no-static-element-interactions`, `label-has-associated-control` |
| `src/pages/StorePreRegistration.tsx` | 5 | `jsx-a11y/label-has-associated-control` |
| Outros (a inventariar) | ~39 | Mistos a11y + diretivas |

## Acceptance Criteria

1. `npm run lint` retorna `0 errors / 0 warnings` em CI e localmente.
2. Cada warning é resolvido pela causa raiz (ajuste de código ou remoção da diretiva morta), não por `eslint-disable` adicional.
3. Warnings de `Unused eslint-disable directive` resolvidos removendo as diretivas que não suprimem nada.
4. Warnings `jsx-a11y/no-autofocus` resolvidos removendo `autoFocus` ou substituindo por foco gerenciado via ref + `useEffect` quando a UX exigir foco inicial.
5. Warnings `jsx-a11y/label-has-associated-control` resolvidos vinculando `htmlFor` ao `id` do input correspondente.
6. Warnings de `click-events-have-key-events` + `no-static-element-interactions` resolvidos transformando elementos `div/span` clicáveis em `button` ou adicionando `role`, `tabIndex`, `onKeyDown` apropriados.
7. Nenhuma regressão funcional nas páginas afetadas (Login, Perfil, StorePreRegistration).
8. `npm test`, `npm run typecheck` e `npm run build` permanecem verdes.

## Tasks / Subtasks

- [ ] Inventariar os 56 warnings com `npm run lint > lint-baseline.log`.
- [ ] Resolver os 4 warnings `Unused eslint-disable directive` em `src/lib/observability/`.
- [ ] Resolver os 2 warnings `no-autofocus` em `src/pages/Login.tsx`.
- [ ] Resolver os 6 warnings de a11y em `src/pages/Perfil.tsx`.
- [ ] Resolver os 5 warnings `label-has-associated-control` em `src/pages/StorePreRegistration.tsx`.
- [ ] Inventariar e resolver os ~39 warnings restantes.
- [ ] Rodar `npm run lint` final — exigir `0 errors / 0 warnings`.
- [ ] Rodar `npm run typecheck`, `npm test` e `npm run build` — todos verdes.
- [ ] Validar manualmente: Login, Perfil e StorePreRegistration mantêm comportamento atual.

## Dev Notes

- Evitar `eslint-disable-next-line` como solução — é considerada regressão.
- Para `autoFocus`, preferir `useEffect` com `ref.current?.focus()` se a UX realmente exigir foco inicial.
- Para `label-has-associated-control`, padronizar com `id` único no input + `htmlFor` no label.
- Para `div onClick`, usar `<button type="button">` com `className` para preservar estilo.
- Não introduzir nova dependência.

## Testing

- `npm run lint` — exigir 0/0.
- `npm test` — manter 358 pass / 0 fail.
- `npm run typecheck` — clean.
- `npm run build` — sucesso.
- Manual smoke test: login, edição de perfil, pré-cadastro de loja.

## Article IV - Rastreabilidade

| Item | Fonte |
|---|---|
| 56 warnings inventário | `docs/reports/qa-gate-mx-wave3-stories-20260528.md` §2.2 |
| Baseline de testes 358 pass | QA gate Wave 3, seção 2.3 |
| Origem do trabalho | Decisão @aiox-master pós-QA gate (sessão 2026-05-28) |

## File List

(Será preenchido durante a execução)

- `docs/stories/story-OPS-20260528-lint-warnings-cleanup.md`

## Dev Agent Record

### Debug Log

(A preencher)

### Completion Notes

(A preencher)

### Change Log

- 2026-05-28: Story criada por @aiox-master (Orion) a partir do QA gate Wave 3.
