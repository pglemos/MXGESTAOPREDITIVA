# Story OPS-20260507 - Segundo Passe Yolo de Rotas e Edge Reports

## Status

In Progress

## Contexto

Novo pedido em modo yolo com @aiox-master, @qa, @dev e agentes de suporte apos as stories de hardening multi-role ja marcadas como `Done`.

Esta fatia cobre apenas residuos confirmaveis encontrados no segundo passe local: rotas de fluxo operacional de vendedor ainda acessiveis por gerente/dono/admin e `select('*')` em Edge Functions de relatorio/aprovacao com campos usados claramente identificaveis.

Chaves, tokens, secrets, migrations remotas, deploy, push, PR e release ficam fora do escopo.

## Acceptance Criteria

- [ ] Vincular ao epic `EPIC-OPS-20260507-MULTI-ROLE-HARDENING`.
- [ ] Orquestrar revisao multiagente com @qa, @architect/@data-engineer, @po/@sm e @ux/@analyst.
- [ ] Restringir `/home` e `/historico` ao fluxo de vendedor quando acessados por rota autenticada.
- [ ] Manter gerente, dono e admin redirecionados para seus paineis quando tentarem abrir fluxo operacional de vendedor.
- [ ] Reduzir `select('*')` em Edge Functions de relatorio/aprovacao tocadas sem mudar schema ou deploy remoto.
- [ ] Preservar secrets, tokens, chaves e autoridade @devops para push/PR/release.
- [ ] Atualizar checklist por papel, Dev Agent Record, gates e File List.
- [ ] Rodar `npm run typecheck`.
- [ ] Rodar `npm run lint`.
- [ ] Rodar `npm test`.
- [ ] Rodar `npm run build`.
- [ ] Registrar bloqueio de `deno check` se `deno` nao estiver disponivel localmente.

## Checklist por Papel

- [ ] Vendedor: `/home`, `/lancamento-diario` e `/historico` permanecem disponiveis.
- [ ] Gerente: tentativa de acessar fluxo de vendedor redireciona para dashboard/rotina apropriada.
- [ ] Dono: tentativa de acessar fluxo de vendedor redireciona para governanca de lojas.
- [ ] Admin/MX: relatorios e aprovacao usam contratos explicitos sem ampliar permissoes.

## Dev Agent Record

### Agentes

- @aiox-master (Orion): coordenacao, story, integracao e gates.
- @qa (Quinn): revisao multi-role e recomendacao de gates.
- @dev (Dex): correcoes locais de baixo risco.
- @architect/@data-engineer: validacao de Edge Functions, dados e limites arquiteturais.
- @po/@sm/@pm: escopo, story nova e acceptance criteria.
- @ux/@analyst: inconsistencias de navegacao/visibilidade por papel.
- @devops: autoridade reservada para push/PR/release, nao executada nesta story.

### Debug Log

- Story criada porque o novo pedido abriu correcoes alem das stories anteriores ja marcadas como `Done`.
- `@po/@sm` recomendou story nova vinculada ao epic em vez de reabrir stories concluidas.
- Segundo passe local encontrou `/home` e `/historico` disponiveis para roles nao-vendedor na matriz de rota.
- `routeAccess` restringiu `/home`, `/lancamento-diario` e `/historico` ao papel `vendedor`.
- `App` passou a redirecionar gerente, dono e admin nessas rotas se o componente for alcançado.
- `_shared/store`, `relatorio-matinal`, `feedback-semanal`, `relatorio-mensal` e `approve-store-registration` trocaram consultas amplas por contratos explicitos.

### Gates

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `bun test src/lib/auth/routeAccess.test.ts`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `deno check` Edge Functions tocadas

### Residuos Esperados

- Sem deploy remoto nesta story.
- Sem migration remota nesta story.
- `deno check` depende de `deno` instalado localmente.
- Limpeza global de todos os `select('*')` do monorepo permanece fatiada para stories dedicadas.

### File List

- `docs/stories/story-OPS-20260507-yolo-second-pass-route-edge-hardening.md`
- `docs/stories/epics/epic-ops-20260507-multi-role-hardening.md`
- `src/App.tsx`
- `src/lib/auth/routeAccess.ts`
- `src/lib/auth/routeAccess.test.ts`
- `supabase/functions/_shared/store.ts`
- `supabase/functions/approve-store-registration/index.ts`
- `supabase/functions/feedback-semanal/index.ts`
- `supabase/functions/relatorio-matinal/index.ts`
- `supabase/functions/relatorio-mensal/index.ts`
