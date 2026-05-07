# Story OPS-20260507 - Loja Sandbox MX Consultoria

## Status

Ready for Review

## Contexto

O painel live tinha lojas de teste/MX redundantes (`LOJA TESTE AIOX`, `LOJA TESTE E2E`, `MX PERFORMANCE`, `TESTE`) aparecendo na rede. A operação precisa manter somente uma loja sandbox `MX CONSULTORIA`, com usuários por papel para validação e acesso manual.

## Acceptance Criteria

- [x] Manter somente uma loja sandbox com nome `MX CONSULTORIA`.
- [x] Remover lojas redundantes de teste/MX.
- [x] Garantir dono, gerente e vendedores vinculados à `MX CONSULTORIA`.
- [x] Garantir perfis internos MX para acesso aos módulos internos.
- [x] Garantir regras operacionais básicas da loja.
- [x] Validar login real dos usuários provisionados.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm test`.
- [x] Rodar `npm run build`.

## Dev Agent Record

### Debug Log

- Criado script idempotente `scripts/provision_mx_consultoria_sandbox.ts`.
- Reaproveitada a loja `MX PERFORMANCE` como `MX CONSULTORIA`.
- Removidas as lojas redundantes `LOJA TESTE AIOX`, `LOJA TESTE E2E` e `TESTE`.
- Provisionados/atualizados perfis internos MX, dono, gerente e dois vendedores com autenticação confirmada.
- Recriados vínculos da loja para dono, gerente e vendedores.
- Recriada vigência operacional ativa dos vendedores na `MX CONSULTORIA`.
- Ajustado script para reativar usuários após trigger de limpeza de vínculos.
- Ajustado script para não atualizar `regras_metas_loja` quando a regra já existe, evitando trigger legado de histórico inexistente.
- Validação live confirmou somente `MX CONSULTORIA` entre nomes teste/MX, quatro vínculos ativos e todos os logins funcionando.
- Gates locais: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

### File List

- `docs/stories/story-OPS-20260507-mx-consultoria-sandbox.md`
- `scripts/provision_mx_consultoria_sandbox.ts`
