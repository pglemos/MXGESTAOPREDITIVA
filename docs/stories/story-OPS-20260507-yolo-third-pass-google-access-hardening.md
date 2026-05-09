# Story OPS-20260507 - Terceiro Passe Yolo de Acesso Google e Pre-Cadastro

## Status

Done

## Contexto

Nova rodada yolo acionada apos a Story 7. Os agentes apontaram residuos ainda confirmaveis em Edge Functions que usam service role ou dados publicos: sincronizacao Google Calendar, arquivos Google Drive e GET publico de pre-cadastro.

Esta fatia e local-only: nao executa deploy remoto, nao aplica migration remota, nao faz push/PR/release e nao troca secrets.

## Acceptance Criteria

- [x] Vincular ao epic `EPIC-OPS-20260507-MULTI-ROLE-HARDENING`.
- [x] Orquestrar revisao multiagente com @qa, @architect/@data-engineer, @po/@sm e @devops sem push/deploy.
- [x] Validar acesso do usuario por RLS/session antes de `google-calendar-sync` usar service role para persistir IDs.
- [x] Validar acesso do usuario ao cliente antes de `google-drive-files` listar, enviar, remover ou criar pastas para `clientId`.
- [x] Reduzir exposicao do GET publico de `store-pre-registration` para retornar apenas dados publicos necessarios.
- [x] Preservar secrets, tokens, chaves e autoridade @devops para push/PR/release.
- [x] Atualizar checklist por papel, Dev Agent Record, gates e File List.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm test`.
- [x] Rodar `npm run build`.
- [x] Registrar bloqueio de `deno check` se `deno` nao estiver disponivel localmente.

## Checklist por Papel

- [x] Vendedor/Gerente/Dono: pre-cadastro publico nao enumera dados cadastrais sensiveis da loja.
- [x] Gerente/Admin MX: Google Calendar nao aceita payload cross-scope por body quando chamado com sessao de usuario.
- [x] Admin/MX/Consultor: Google Drive valida escopo do cliente antes de operar com service role.
- [x] DevOps: push, PR, deploy remoto e secrets seguem reservados e nao executados.

## Dev Agent Record

### Agentes

- @aiox-master (Orion): coordenacao, story, integracao e gates.
- @qa (Quinn): priorizacao de residuos Google/pre-cadastro.
- @dev (Dex): patches locais de Edge Functions.
- @architect/@data-engineer: limites de RLS/session antes de service role.
- @po/@sm/@pm: story nova e escopo.
- @devops: validacao de gates locais e limites remotos.

### Debug Log

- Story criada porque o novo pedido abriu residuos alem da Story 7 concluida.
- @po/@sm confirmou que a rodada deveria ser Story 8, nao anexo da Story 7.
- @architect/@data-engineer recomendou limitar esta fatia a Calendar + Drive + GET publico de pre-cadastro.
- @qa apontou P0 em `google-calendar-sync`: body controlado pelo usuario era persistido via service role sem revalidacao do registro.
- `google-calendar-sync` passou a carregar visita/evento canônico via `sessionClient`/RLS antes de criar `adminClient` e antes de buscar tokens Google.
- @qa apontou P0 em `google-drive-files`: papel interno MX bastava para operar qualquer `clientId` com service role.
- `google-drive-files` passou a validar usuario ativo e acesso ao cliente via `sessionClient` antes de `getClient`, `ensure-folder`, `list`, `upload`, `delete`, `setup_client` e `delete_client_folder`.
- `setup_all` deixou de aceitar JWT decodificado sem assinatura e agora exige bearer igual ao service-role real.
- `store-pre-registration` GET publico passou a selecionar/retornar somente `id` e `name` da loja.
- @devops registrou que `deno` e Docker estao indisponiveis; validação real de Edge Functions fica bloqueada localmente.

### Gates

- [x] `npm run typecheck` - passed.
- [x] `npm run lint` - passed.
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
- Backfill OAuth, bucket privado de avatar e hardening amplo de scripts service-role ficam para stories dedicadas se exigirem operacao remota.
- Docker indisponivel bloqueia `supabase start`, `supabase db reset --local`, `supabase db lint --local` e `supabase functions serve`.
- `supabase/config.toml` referencia `supabase/seed.sql`, que nao existe; validacao local de DB precisaria `--no-seed` ou seed corrigido.

### File List

- `docs/stories/story-OPS-20260507-yolo-third-pass-google-access-hardening.md`
- `docs/stories/epics/epic-ops-20260507-multi-role-hardening.md`
- `supabase/functions/google-calendar-sync/index.ts`
- `supabase/functions/google-drive-files/index.ts`
- `supabase/functions/store-pre-registration/index.ts`
