# Story OPS-20260501 - Gestão de Produtos Digitais por Público

## Status

Ready for Review

## Contexto

Solicitação operacional para transformar `/produtos` em catálogo administrável por Admin Master e Administrador MX, com criação, edição, exclusão, status, categoria e controle de público de exibição para vendedores, gerentes e donos.

## Acceptance Criteria

- [x] Administrador Master e Administrador MX conseguem criar produtos digitais.
- [x] Administrador Master e Administrador MX conseguem editar, excluir, arquivar e reativar produtos.
- [x] Produto possui nome, descrição, link, categoria, status, ordem e públicos de exibição.
- [x] Públicos suportados: vendedores, gerentes e donos.
- [x] Usuários sem permissão administrativa visualizam apenas produtos ativos liberados para seu público.
- [x] `/produtos` aparece na navegação de vendedores, gerentes e donos.
- [x] Campo Produto da Agenda consome o catálogo de `/produtos`, sem lista fixa local.
- [x] Schema versionado em migration Supabase.
- [x] Validação local via Chrome MCP em mobile sem overflow.
- [x] Gates de qualidade: `npm run lint`, `npm test`, `npm run build`.

## Dev Agent Record

### Debug Log

- Chrome MCP local em `/produtos`: modal de produto contém Nome, Link, Categoria, Status, Ordem, Públicos e Descrição.
- Chrome MCP com perfil vendedor: botão Novo Produto e filtro de status ficam ocultos; tela exibe aviso de catálogo filtrado por público.
- Chrome MCP em Agenda: select Produto não exibe PPA/PMR hardcoded; usa apenas produtos carregados do catálogo.
- Navegação atualizada para expor `/produtos` aos públicos classificados.

### File List

- `src/pages/ProdutosDigitais.tsx`
- `src/pages/AgendaAdmin.tsx`
- `src/components/Layout.tsx`
- `src/features/agenda/constants.ts`
- `src/hooks/useAgendaAdmin.ts`
- `src/types/database.ts`
- `supabase/migrations/20260501001000_produtos_digitais_admin_catalog.sql`
- `docs/stories/story-OPS-20260501-produtos-digitais-admin.md`
