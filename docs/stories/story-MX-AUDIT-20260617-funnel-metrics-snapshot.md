# Story MX-AUDIT-20260617 - Snapshot historico do funil

## Status
Ready Review

## Fonte
- `docs/auditorias/auditoria-modulo-vendedor-2026-06-17.md`
- Pendencia D2/alta: `funnel_metrics` inexistente, funil computado apenas em runtime.
- Stories relacionadas: `story-MX-AUDIT-20260617-score-rls-hardening.md`, `story-MX-AUDIT-20260617-vendedor-sprint3-4.md`.

## Story
Como vendedor e liderança da loja, quero registrar snapshots historicos do Funil de Vendas para que o desempenho por periodo e canal possa ser auditado depois, sem depender apenas do calculo em memoria da tela.

## Acceptance Criteria
- [x] Migration cria `public.funnel_metrics` com periodo, vendedor, loja, totais, canais, timestamps e constraints basicas.
- [x] RLS permite leitura pelo proprio vendedor, gerente/dono da loja e perfis internos MX.
- [x] Escrita direta por cliente fica bloqueada; snapshot e feito por RPC `upsert_funnel_metrics_snapshot`.
- [x] RPC valida usuario autenticado, resolve loja ativa do vendedor e grava snapshot idempotente por periodo.
- [x] Funil mostra o ultimo snapshot historico e permite registrar snapshot do periodo selecionado.
- [x] Teste de contrato cobre tabela, RLS, RPC e ausencia de policy permissiva.
- [x] Testes focados, lint, typecheck, test suite e build passam ou ficam explicitamente reportados.

## Fora de Escopo
- Aplicar migration no Supabase remoto.
- Regenerar `database.generated.ts` enquanto houver drift remoto conhecido.
- Substituir o calculo runtime atual do Funil.
- Criar dashboard gerencial historico completo.

## Tasks
- [x] Criar migration idempotente `funnel_metrics` + helper RLS + RPC.
- [x] Adicionar teste de contrato da migration.
- [x] Criar hook `useFunnelMetricsSnapshot`.
- [x] Integrar card compacto no `FunilVendedor`.
- [x] Atualizar auditoria e File List.
- [x] Rodar validacoes.

## Dev Notes
- Usar nomes CRM existentes: `loja_id` e `seller_user_id`.
- Snapshot deve ser aditivo; a tela continua calculando plano e cards pelo runtime atual.
- A RPC deriva dados de `oportunidades` do vendedor autenticado no periodo selecionado.
- `database.generated.ts` nao deve ser regenerado nesta story por drift remoto ja identificado.
- Arquivos de padrao do `devLoadAlwaysFiles` e fallbacks declarados no core-config nao existem neste checkout; seguir padroes locais existentes das stories de auditoria.

## Testing
- `bun test src/lib/funnel-metrics-snapshot-migration.test.ts`
- `bun test src/features/crm/FunilVendedor.container.test.tsx`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `git diff --check`

## Dev Agent Record
### Agent Model Used
Codex

### Debug Log References
- AIOX greetings (`aiox-master`, `data-engineer`, `dev`, `sm`) falharam por dependencia local ausente: `.aiox-core/node_modules/human-signals`.
- `devLoadAlwaysFiles` e fallbacks do core-config nao existem no checkout atual.
- `bun test src/lib/funnel-metrics-snapshot-migration.test.ts src/features/crm/FunilVendedor.container.test.tsx` -> 8 pass, 0 fail.
- `npm run lint` -> pass.
- `npm run typecheck` -> pass.
- `npm test` -> pass.
- `npm run build` -> pass.
- `npm run validate:structure` -> pass.
- `npm run validate:agents` -> exit 0 com warnings preexistentes de dependencias AIOX declaradas ausentes.
- `git diff --check` -> pass.

### Completion Notes List
- Criada persistencia `funnel_metrics` com RLS escopado e escrita direta bloqueada para clientes autenticados.
- Adicionada RPC `upsert_funnel_metrics_snapshot` para snapshot idempotente do funil por periodo.
- Funil do vendedor ganhou card de snapshot historico com leitura do ultimo registro e acao para registrar o periodo atual.
- Auditoria atualizada removendo `funnel_metrics` das pendencias do corte fechado.

### File List
- `docs/stories/story-MX-AUDIT-20260617-funnel-metrics-snapshot.md`
- `docs/auditorias/auditoria-modulo-vendedor-2026-06-17.md`
- `supabase/migrations/20260617009000_funnel_metrics_snapshot.sql`
- `src/lib/funnel-metrics-snapshot-migration.test.ts`
- `src/features/crm/hooks/useFunnelMetricsSnapshot.ts`
- `src/features/crm/FunilVendedor.container.tsx`
- `src/features/crm/FunilVendedor.container.test.tsx`

### Change Log
- 2026-06-17: Story criada a partir da auditoria do modulo vendedor.
- 2026-06-17: Snapshot historico do funil implementado e validado localmente.
