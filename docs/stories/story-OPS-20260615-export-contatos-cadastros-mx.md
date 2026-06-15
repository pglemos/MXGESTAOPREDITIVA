# Story OPS-20260615 - Exportar Contatos dos Cadastros MX

## Status

Ready for Review

## Story

**As an** integrante interno MX,
**I want** baixar uma planilha Excel com contatos ativos dos cadastros da rede,
**so that** eu consiga acionar donos, gerentes e vendedores sem consultar loja por loja.

## Acceptance Criteria

1. Internos MX (`administrador_geral`, `administrador_mx`, `consultor_mx`) conseguem exportar XLSX com contatos ativos atuais.
2. Dono, gerente e vendedor não conseguem chamar a exportação global.
3. A planilha inclui usuários ativos com vínculo ativo em loja ativa e papel `dono`, `gerente` ou `vendedor`.
4. Vendedores respeitam `vendedores_loja` quando houver linha de vigência/ativo.
5. Sócios cadastrados em `lojas.partners` entram como `Dono/Sócio` quando possuem nome, telefone ou email.
6. O XLSX possui abas `Contatos` e `Resumo`.
7. A chamada via UI registra auditoria em `logs_auditoria` com ação `EXPORT_CONTATOS_CADASTROS_MX`.
8. Existe comando CLI first para gerar o arquivo operacionalmente antes da UI.

## Tasks / Subtasks

- [x] Implementar núcleo puro de normalização de contatos e resumo.
- [x] Criar testes unitários para usuários ativos, inativos, multi-loja e sócios.
- [x] Criar script CLI `export:team-contacts`.
- [x] Criar migration com RPC `exportar_contatos_cadastros_mx()`.
- [x] Adicionar card de exportação em `Sistema MX`.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm test`.
- [x] Rodar `npm run build`.

## Dev Notes

- Seguir Constitution: CLI First -> Observability Second -> UI Third.
- Não exportar senhas, auth metadata, IDs de autenticação ou dados operacionais.
- Usar `eh_area_interna_mx` como fonte de autorização da RPC.
- Preservar alteração local existente em `docs/prd/20260612-reuniao-modulo-vendedor.md`.

## Testing

- Unit: normalização de linhas, filtros de ativo/vigência e resumo.
- Security/RLS: internos MX permitidos, perfis de loja bloqueados.
- CLI: arquivo gerado com env válida e falha clara sem service role.
- UI: smoke em `Configurações > Sistema MX`.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-06-15: Story criada antes das alterações funcionais, conforme Constitution.
- 2026-06-15: RED confirmado com `bun test src/lib/team-contacts-export.test.ts` falhando por módulo ausente.
- 2026-06-15: GREEN confirmado com `bun test src/lib/team-contacts-export.test.ts` passando 4 testes.
- 2026-06-15: `npm test` inicialmente falhou por export ausente `EstimatedSalaryCard` em `VendedorHome.container.tsx` e expectativa `/historico` em `routeAccess.test.ts`; root cause investigado e corrigido com ajustes mínimos de contrato.
- 2026-06-15: `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passaram.
- 2026-06-15: Smoke Browser local em `http://localhost:3001/configuracoes?aba=sistema-mx` com dev-bypass `administrador_mx` confirmou o card `EXPORTAR CONTATOS` na aba `Sistema MX`.

### Completion Notes List

- Núcleo de exportação gera linhas de contatos e resumo sem expor dados de auth ou metadados sensíveis.
- CLI `npm run export:team-contacts` gera XLSX em `scratch/exports` por padrão e falha claramente sem `SUPABASE_SERVICE_ROLE_KEY`.
- RPC `exportar_contatos_cadastros_mx()` limita acesso a `eh_area_interna_mx()` e registra auditoria.
- UI adicionada em `Configurações > Sistema MX`, com download XLSX multi-aba.
- Dois contratos quebrados fora da exportação também foram corrigidos para liberar o gate completo: `EstimatedSalaryCard` exportado e `/historico` liberado para `vendedor`.

### File List

- `docs/stories/story-OPS-20260615-export-contatos-cadastros-mx.md`
- `package.json`
- `scripts/README.md`
- `scripts/export_team_contacts.ts`
- `src/features/configuracoes/components/tabs/SistemaMxTab.tsx`
- `src/features/vendedor-home/VendedorHome.container.tsx`
- `src/lib/auth/routeAccess.ts`
- `src/lib/export.ts`
- `src/lib/team-contacts-export.test.ts`
- `src/lib/team-contacts-export.ts`
- `supabase/migrations/20260615120000_export_team_contacts.sql`

### Change Log

- 2026-06-15: Story criada em `InProgress` para implementar exportação de contatos dos cadastros MX.
- 2026-06-15: Implementada exportação CLI, RPC auditável, helper XLSX multi-aba e card de download em Sistema MX.
- 2026-06-15: Corrigidos contratos de teste de Home Vendedor e matriz de rotas; todos os gates passaram.
