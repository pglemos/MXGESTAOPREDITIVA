# Story OPS-20260507 - Quarto Passe Yolo de OAuth e Scripts Destrutivos

## Status

Done

## Contexto

Nova continuacao autonoma acionada pelo aiox-master apos a Story 8. Os residuos confirmaveis restantes incluem reconnect OAuth que nao atualiza o e-mail Google salvo em token existente e scripts operacionais com service role que resetam senhas com valor fixo assim que executados.

Esta fatia e local-only: nao executa deploy remoto, nao aplica migration remota, nao faz push/PR/release e nao troca secrets.

## Acceptance Criteria

- [x] Vincular ao epic `EPIC-OPS-20260507-MULTI-ROLE-HARDENING`.
- [x] `google-oauth-handler` atualiza `google_email` e scopes ao reconectar token existente.
- [x] Scripts de reset de senha exigem `--apply` explicito antes de escrever no Auth.
- [x] Scripts de reset de senha deixam de usar senha fixa no codigo e exigem `MX_RESET_PASSWORD`.
- [x] Scripts validam `SUPABASE_URL`/`VITE_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` antes de criar cliente admin.
- [x] Preservar secrets, tokens, chaves e autoridade @devops para push/PR/release.
- [x] Atualizar checklist por papel, Dev Agent Record, gates e File List.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm test`.
- [x] Rodar `npm run build`.
- [x] Registrar bloqueio de `deno check` se `deno` nao estiver disponivel localmente.

## Checklist por Papel

- [x] Admin/MX/Consultor: reconnect Google nao mantem e-mail antigo em token OAuth existente.
- [x] Admin MX: scripts de reset nao alteram senhas sem `--apply` e senha definida em ambiente.
- [x] Dono/Gerente/Vendedor: resets operacionais nao sobrescrevem credenciais por acidente.
- [x] DevOps: push, PR, deploy remoto e secrets seguem reservados e nao executados.

## Dev Agent Record

### Agentes

- @aiox-master (Orion): coordenacao, story, implementacao local e gates.

### Debug Log

- Story criada para continuar residuos da Story 8 sem ampliar para bucket privado de avatar, pois esse item exige desenho de URL assinada/storage path para nao quebrar avatares existentes.
- `google-oauth-handler` ja persistia `google_email` ao inserir token novo, mas nao ao atualizar token existente; reconnect poderia manter o e-mail antigo.
- Atualizacao de token existente agora inclui `google_email` junto com `access_token`, `expires_at` e `scopes`.
- `reset_passwords.ts`, `reset_passwords_v2.ts` e `reset_admin_single.ts` passaram a sair em dry-run por padrao.
- Os resets destrutivos agora exigem `--apply` e `MX_RESET_PASSWORD` com pelo menos 10 caracteres.
- A criacao do cliente Supabase admin nos scripts ocorre somente apos confirmar `--apply`, envs obrigatorias e senha definida.
- Os tres scripts foram executados sem `--apply`; todos encerraram em dry-run sem escrita no Auth.

### Gates

- [x] `npm run typecheck` - passed.
- [x] `npm run lint` - passed.
- [x] `npm test` - 227 passed.
- [x] `npm run build` - passed with existing large chunk warning.
- [x] `npm run validate:structure` - passed.
- [x] `npm run validate:agents` - passed.
- [x] `git diff --check` - passed.
- [x] `deno check` Edge Functions tocadas - blocked; `deno` nao instalado localmente.
- [x] `npx tsx scripts/reset_passwords.ts` - dry-run, no write.
- [x] `npx tsx scripts/reset_passwords_v2.ts` - dry-run, no write.
- [x] `npx tsx scripts/reset_admin_single.ts` - dry-run, no write.

### Residuos Esperados

- Sem deploy remoto nesta story.
- Sem migration remota nesta story.
- `deno check` depende de `deno` instalado localmente.
- Bucket privado de avatar permanece para story dedicada porque o app atualmente armazena `avatar_url` publica em muitos consumidores.

### File List

- `docs/stories/story-OPS-20260507-yolo-fourth-pass-oauth-script-guards.md`
- `docs/stories/epics/epic-ops-20260507-multi-role-hardening.md`
- `supabase/functions/google-oauth-handler/index.ts`
- `scripts/README.md`
- `scripts/reset_passwords.ts`
- `scripts/reset_passwords_v2.ts`
- `scripts/reset_admin_single.ts`
