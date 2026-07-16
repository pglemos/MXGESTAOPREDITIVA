# Story MX-EV2-20260716 — Carteira Base44 1:1 em produção

## Status

InProgress

## Executor Assignment

executor: `@dev`
quality_gate: `@architect`
quality_gate_tools:
- `bun test`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Playwright/Chrome
- Supabase CLI
- GitHub Actions
- Vercel

## Story

**As a** vendedor,
**I want** usar `/carteira-clientes` com a composição visual e comportamental da rota `/carteira` do Base44,
**so that** todos os fluxos de clientes e missões funcionem com persistência, segurança e continuidade reais no MX Gestão Preditiva.

## Source Requirements

- Plano técnico versionado: `docs/superpowers/plans/2026-07-16-carteira-clientes-base44-1to1.md`.
- PRD EV-2: `docs/prd/modulo-vendedor/02-epic-carteira-cadencia.md`.
- PRD mestre: `docs/prd/modulo-vendedor/00-prd-mestre.md`, requisito R-03 de integração Carteira/Central/Funil.
- Referência visual versionada: `src/base44-reference/pages/CarteiraClientes.jsx` e `src/base44-reference/components/carteira/*`.
- Implementação inicial integrada pelo PR #98; esta story cobre a auditoria/remediação pós-merge e a comprovação em produção.

## Acceptance Criteria

1. `/carteira-clientes` monta exclusivamente `CarteiraClientesBase44Page`; aliases preservam query string e o container legado não é carregado pela rota.
2. Página, componentes e overlays preservam a composição Base44 observável, com busca, filtros, cards, ficha, modais, Modo Ataque, Plano de Ataque e Execução de Missão funcionais em desktop, tablet e mobile.
3. Nenhuma ação visual fica decorativa: criar/editar cliente, alterar próximo passo, registrar resultado, iniciar/pausar/retomar/concluir missão, pular cliente, não contatar, reativar e recarregar produzem feedback e persistência real.
4. Clientes, oportunidades e agendamentos usam seleção determinística; mutações multientidade são transacionais; cliques simultâneos/retries não duplicam registros.
5. Missões e itens persistem fila, índice, contadores e status; retomada funciona após reload/logout/login; concorrência não perde atualizações nem permite escrita cruzada.
6. `carteira_missoes`, `carteira_missao_itens` e RPCs possuem RLS/grants restritivos, `SECURITY DEFINER` com `search_path` seguro, validação de usuário/loja/cliente e bloqueio explícito de `anon`/`PUBLIC`.
7. Migration aditiva e rollback são versionados, aplicados no projeto `fbhcmzzgwjdgkctlfvbo`; `src/types/database.generated.ts` coincide com o schema remoto.
8. Erros de leitura/gravação liberam loading, preservam dados digitados quando aplicável e exibem feedback compreensível; não há rejection sem tratamento nem travamento do cliente Supabase.
9. Gates locais aplicáveis passam: paridade Carteira, migration contract/reversibility, lint, typecheck, suíte unitária e build.
10. Gates remotos aplicáveis passam no SHA final: Carteira Base44, db-types-diff, Smoke 403, RLS Matrix, acessibilidade, secret scan e bundle budget.
11. O `main` final contém a entrega sem perder mudanças concorrentes; Vercel publica o mesmo SHA em estado `READY`.
12. `/carteira-clientes` é validada em produção com contas autorizadas e negativas, console/network limpos, persistência após reload e ausência de acesso anônimo indevido.

## CodeRabbit Integration

**Primary Type:** Full-stack, banco, segurança e deploy
**Complexity:** Alta

**Primary Agents:** `@dev`, `@data-engineer`
**Supporting Agents:** `@ux-design-expert`, `@qa`, `@devops`

- [ ] Pre-Commit: revisar concorrência, idempotência, tratamento de erro, SQL/RLS e regressões.
- [ ] Pre-PR: validar integração, tipos gerados, migrations e rollback.
- [ ] Pre-Deployment: validar secrets, checks, SHA, Supabase e Vercel.

**Self-Healing:** `@dev` em modo light, máximo de 2 iterações/15 minutos para CRITICAL; HIGH é documentado. `@qa` usa modo full para CRITICAL/HIGH antes do veredito.

**Focus Areas:** RLS/grants e `SECURITY DEFINER`; atomicidade e idempotência; tratamento de erro/loading; WCAG/teclado; responsividade; migrations/rollback; ausência de secrets; correspondência SHA GitHub/Vercel.

## Tasks / Subtasks

- [ ] Auditar implementação integrada e registrar gaps reais (AC: 1–8)
  - [ ] Confirmar rota e ausência de carregamento legado.
  - [ ] Mapear todos os cliques, persistência, loading e erros.
  - [ ] Reproduzir concorrência/idempotência e retomada de missão.
- [ ] Corrigir aplicação e componentes sem alterar artificialmente a referência Base44 (AC: 2–5, 8)
  - [ ] Adicionar testes de comportamento antes das correções.
  - [ ] Preservar paridade visual e mover regras de integração para adapter/wrappers.
- [ ] Corrigir banco, RLS, RPCs, grants, concorrência e rollback por migration complementar (AC: 4–7)
  - [ ] Não editar destrutivamente migration aplicada.
  - [ ] Regenerar tipos com Supabase CLI 2.75.0, igual ao CI.
- [ ] Executar gates locais completos e revisar o diff (AC: 9)
- [ ] Validar no navegador em desktop, tablet e mobile, incluindo reload e perfis (AC: 2, 3, 5, 8, 12)
- [ ] Publicar via `@devops`, acompanhar checks/merge/deploy e executar smoke pós-deploy (AC: 10–12)
- [ ] Atualizar checkboxes, File List, Dev Agent Record e evidências desta story.

## Dev Notes

- O Base44 vence em composição e comportamento observável; React/Auth/Supabase/RLS do MX permanecem a infraestrutura.
- A UI runtime importa a página de referência, enquanto `installCarteiraBase44Adapter.js` adapta entidades Base44 para o schema normalizado.
- O histórico do PR registrou lock do `supabase-js` ao encadear RPC e leitura/auth na mesma tick; todos os fluxos semelhantes precisam ser testados, não apenas `saveClient`.
- `src/components/carteira/*` deve permanecer byte-a-byte igual à referência quando não houver wrapper necessário. Divergências permitidas devem existir apenas para persistência/feedback e manter tokens visuais.
- Migrations aplicadas recebem correções complementares; não apagar nem reescrever histórico remoto.
- ClickUp não está configurado no ambiente; a story é rastreada localmente, como as stories EV-2 anteriores.

### Implementation Surface

- `src/pages/CarteiraClientes.tsx`
- `src/features/carteira-clientes/pages/CarteiraClientesBase44Page.tsx`
- `src/features/carteira-clientes/lib/installCarteiraBase44Adapter.js`
- `src/features/carteira-clientes/lib/carteira-mappers.ts`
- `src/components/carteira/*`
- `supabase/migrations/*carteira*.sql`
- `supabase/rollbacks/*carteira*.sql`
- `src/types/database.generated.ts`
- `.github/workflows/carteira-clientes-parity-verification.yml`
- `.github/workflows/db-types-diff.yml`
- `.github/workflows/smoke-403.yml`
- `.github/workflows/rls-matrix.yml`

## Testing

- Unitários/contratos: Bun Test em `src/features/carteira-clientes/**` e `src/lib/carteira-*.test.ts`.
- Gates: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, verificador de paridade e reversibilidade.
- Banco: `db-types-diff`, Smoke 403 e RLS Matrix com casos `anon`, vendedor próprio/outro, gerente, dono e Admin MX.
- Browser real: produção em 390×844, 768×1024, 1024×768, 1440×900 e 1920×1080; validar console, network, reload e persistência.

## Dev Agent Record

### Agent Model Used

_A preencher por @dev._

### Debug Log References

_A preencher por @dev._

### Completion Notes

_A preencher por @dev._

### File List

- `docs/stories/story-MX-EV2-20260716-carteira-base44-1x1-production.md`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-07-16 | 1.0.0 | Story criada a partir do prompt mestre, PR #98, plano técnico e PRD EV-2. | River (@sm) |
| 2026-07-16 | 1.0.1 | Validated GO (9/10) — Status: Draft → Ready. | Pax (@po) |
| 2026-07-16 | 1.0.2 | Development started (yolo mode) — Status: Ready → InProgress. | Dex (@dev) |

## QA Results

_A preencher por @qa._
