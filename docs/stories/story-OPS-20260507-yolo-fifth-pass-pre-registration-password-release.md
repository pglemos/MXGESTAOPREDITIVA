# Story OPS-20260507 - Quinto Passe Yolo de Senha de Pre-Cadastro

## Status

In Progress

## Contexto

Continuacao autonoma apos a Story 9. Um residuo P1 ainda confirmavel e o fluxo de pre-cadastro entregar senha temporaria ao solicitante antes da aprovacao Admin MX, mesmo com usuario marcado como pendente/inativo no perfil.

Esta fatia e local-only: nao executa deploy remoto, nao aplica migration remota, nao faz push/PR/release e nao troca secrets.

## Acceptance Criteria

- [x] Vincular ao epic `EPIC-OPS-20260507-MULTI-ROLE-HARDENING`.
- [ ] `store-pre-registration` nao retorna senha temporaria ao solicitante publico.
- [ ] A senha temporaria e gerada/rotacionada apenas no ato de aprovacao admin.
- [ ] `approve-store-registration` valida erro de update no Auth antes de concluir aprovacao.
- [ ] UI publica mostra apenas status pendente e e-mail informado, sem senha.
- [ ] Admin MX recebe a senha temporaria somente apos aprovar o login.
- [ ] Preservar secrets, tokens, chaves e autoridade @devops para push/PR/release.
- [ ] Atualizar checklist por papel, Dev Agent Record, gates e File List.
- [ ] Rodar gates locais aplicaveis.

## Checklist por Papel

- [ ] Vendedor/Gerente/Dono: solicitante nao recebe senha antes da aprovacao.
- [ ] Admin MX: aprovacao gera senha temporaria para comunicacao controlada.
- [ ] DevOps: push, PR, deploy remoto e secrets seguem reservados e nao executados.

## Dev Agent Record

### Agentes

- @aiox-master (Orion): coordenacao, story, implementacao local e gates.

### Debug Log

- Story criada para reduzir risco de credencial provisoria antes da validacao de hierarquia.

### Gates

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run validate:structure`
- [ ] `npm run validate:agents`
- [ ] `git diff --check`
- [ ] `deno check` Edge Functions tocadas

### Residuos Esperados

- Sem deploy remoto nesta story.
- Sem migration remota nesta story.
- `deno check` depende de `deno` instalado localmente.

### File List

- `docs/stories/story-OPS-20260507-yolo-fifth-pass-pre-registration-password-release.md`
- `docs/stories/epics/epic-ops-20260507-multi-role-hardening.md`
