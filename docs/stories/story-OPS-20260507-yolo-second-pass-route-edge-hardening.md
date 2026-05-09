# Story OPS-20260507 - Segundo Passe Yolo de Rotas, RLS e Edge Reports

## Status

Done

## Contexto

Novo pedido em modo yolo com @aiox-master, @qa, @dev e agentes de suporte apos as stories de hardening multi-role ja marcadas como `Done`.

Esta fatia cobre residuos confirmaveis encontrados no segundo passe local: rotas de fluxo operacional de vendedor ainda acessiveis por gerente/dono/admin, RLS critica de `usuarios` e `lancamentos_diarios`, endpoint de equipe com service role e `select('*')` em Edge Functions de relatorio/aprovacao com campos usados claramente identificaveis.

Chaves, tokens, secrets, migrations remotas, deploy, push, PR e release ficam fora do escopo.

## Acceptance Criteria

- [x] Vincular ao epic `EPIC-OPS-20260507-MULTI-ROLE-HARDENING`.
- [x] Orquestrar revisao multiagente com @qa, @architect/@data-engineer, @po/@sm e @ux/@analyst.
- [x] Restringir `/home` e `/historico` ao fluxo de vendedor quando acessados por rota autenticada.
- [x] Manter gerente, dono e admin redirecionados para seus paineis quando tentarem abrir fluxo operacional de vendedor.
- [x] Reduzir `select('*')` em Edge Functions de relatorio/aprovacao tocadas sem mudar schema ou deploy remoto.
- [x] Corrigir P0 de self-update sensivel em `usuarios` com trigger local de bloqueio.
- [x] Corrigir P1 de escrita de check-in fora da loja/vigencia com helper e policies locais.
- [x] Corrigir P1 de anexacao arbitraria no endpoint `manage-store-team`.
- [x] Preservar secrets, tokens, chaves e autoridade @devops para push/PR/release.
- [x] Atualizar checklist por papel, Dev Agent Record, gates e File List.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm test`.
- [x] Rodar `npm run build`.
- [x] Registrar bloqueio de `deno check` se `deno` nao estiver disponivel localmente.

## Checklist por Papel

- [x] Vendedor: `/home`, `/lancamento-diario` e `/historico` permanecem disponiveis.
- [x] Gerente: tentativa de acessar fluxo de vendedor redireciona para dashboard/rotina apropriada e auditoria local alinha com a rota.
- [x] Dono: tentativa de acessar fluxo de vendedor redireciona para governanca de lojas; PDI fica sem criacao pelo dono.
- [x] Admin/MX: relatorios e aprovacao usam contratos explicitos sem ampliar permissoes; P0/P1 RLS ficam fatiados em migration local.

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
- @qa/@architect apontaram P0 de self-update sensivel em `usuarios` e P1 de check-in fora da loja/vigencia.
- Migration local `20260507143000_yolo_second_pass_rls_hardening.sql` passou a bloquear self-update de `role`, `active`, `email`, `store_id`, `must_change_password` e `is_venda_loja` para usuario nao-admin.
- A mesma migration atualizou `tem_papel_loja` para exigir usuario ativo e adicionou `pode_lancar_checkin` com papel `vendedor`, vinculo de loja e vigencia ativa.
- `manage-store-team` passou a exigir alvo ja vinculado a loja gerenciada para dono/gerente e bloqueia movimentacao cross-store por nao-admin.
- `AiDiagnostics` foi alinhado a matriz testada: Admin MX e gerente acessam auditoria; dono nao acessa a rota.
- `GerentePDI` removeu criacao de PDI para dono, mantendo visualizacao.
- Aba Operacional em Configuracoes passou a marcar dono como somente leitura; rota direta `/configuracoes/operacional` ficou restrita a perfis internos.
- `deno --version` falhou com `command not found`; `deno check` local das Edge Functions ficou bloqueado pelo ambiente.
- Build passou com aviso residual de chunk grande `vendor-pdf`.

### Gates

- [x] `npm run typecheck` - passed.
- [x] `npm run lint` - passed.
- [x] `bun test src/lib/auth/routeAccess.test.ts` - 5 passed.
- [x] `npm test` - 227 passed.
- [x] `npm run build` - passed with existing large chunk warning.
- [x] `npm run validate:structure` - passed.
- [x] `npm run validate:agents` - passed.
- [x] `git diff --check` - passed.
- [x] `deno check` Edge Functions tocadas - blocked; `deno` nao instalado localmente.

### Residuos Esperados

- Sem deploy remoto nesta story.
- Sem migration remota nesta story.
- `deno check` depende de `deno` instalado localmente.
- Limpeza global de todos os `select('*')` do monorepo permanece fatiada para stories dedicadas.
- Achados de Google Calendar/Drive, OAuth token backfill, bucket privado de avatar e scripts service-role permanecem para stories dedicadas por exigirem validacao remota, storage policy ou redesenho de fluxo.

### File List

- `docs/stories/story-OPS-20260507-yolo-second-pass-route-edge-hardening.md`
- `docs/stories/epics/epic-ops-20260507-multi-role-hardening.md`
- `src/App.tsx`
- `src/features/configuracoes/tabRegistry.ts`
- `src/lib/auth/routeAccess.ts`
- `src/lib/auth/routeAccess.test.ts`
- `src/pages/AiDiagnostics.tsx`
- `src/pages/GerentePDI.tsx`
- `supabase/functions/manage-store-team/index.ts`
- `supabase/functions/_shared/store.ts`
- `supabase/functions/approve-store-registration/index.ts`
- `supabase/functions/feedback-semanal/index.ts`
- `supabase/functions/relatorio-matinal/index.ts`
- `supabase/functions/relatorio-mensal/index.ts`
- `supabase/migrations/20260507143000_yolo_second_pass_rls_hardening.sql`
