# Story MX-AUDIT-20260617 - Vendedor Sprint 3/4 da auditoria

## Status
Ready Review

## Fonte
- `docs/auditorias/auditoria-modulo-vendedor-2026-06-17.md`
- Seção 10: Sprint 3 itens 11-16 e Sprint 4 itens 17-20.

## Story
Como vendedor, quero que as pendências médias/baixas da auditoria sejam fechadas para navegar por rotas consistentes, acessar deep links, usar botões restantes de Treinamentos/Perfil e manter dados auditáveis no banco.

## Acceptance Criteria
- [x] Rotas alternativas padronizadas funcionam sem quebrar as URLs existentes: `/feedback`, `/funil`, `/vendedor/funil`, `/vendedor/feedback`, `/vendedor/devolutivas`, `/vendedor/treinamentos`.
- [x] Redirects de alias preservam `search` e `hash`, incluindo deep links por aba como `?tab=provas`.
- [x] `/vendedor/configuracoes` existe, aparece para vendedor e não libera `/configuracoes` administrativa para vendedor.
- [x] Botões restantes em Treinamentos e Meu Perfil executam ação concreta ou navegação interna/externa.
- [x] `seller_product_categories` existe em migration idempotente com RLS por vendedor e liderança da loja.
- [x] Tabelas operacionais do vendedor recebem `updated_by` e trigger de auditoria quando existentes.
- [x] RBAC frontend mantém capabilities granulares para rotas/ações sensíveis sem abrir telas administrativas para vendedor.
- [x] Quality gates do projeto passam.

## Fora de Escopo
- Aplicar migrations no Supabase remoto.
- Push, PR ou release.
- Redesenho visual amplo das telas.
- Criar fluxo administrativo completo para manutenção de categorias de produto.

## Tasks
- [x] Criar migration de dados Sprint 3/4.
- [x] Cobrir migration com teste de contrato.
- [x] Criar rota e tela `/vendedor/configuracoes`.
- [x] Adicionar aliases e preservar query/hash em redirects.
- [x] Atualizar matriz de acesso frontend com testes.
- [x] Resolver botões remanescentes em Treinamentos e Perfil.
- [x] Rodar gates: typecheck, lint, test, build, diff check.

## Dev Agent Record

### Agent Model Used
Codex GPT-5

### Debug Log References
- `npm run typecheck` - passou antes e depois da tentativa de regenerar DB types.
- Testes focados - passaram:
- `bun test src/pages/VendedorConfiguracoes.test.tsx`
- `bun test src/features/crm/MeuPerfilVendedor.container.test.tsx`
- `bun test src/lib/auth/routeAccess.test.ts src/lib/vendedor-sprint3-4-data-migration.test.ts`
- `bun test src/lib/auth/capabilities.test.ts src/lib/auth/routeAccess.test.ts`
- `bun test src/pages/VendedorTreinamentos.test.tsx`
- `bun test src/pages/VendedorAjuda.test.tsx`
- `bun test src/features/crm/LeadsVendedor.container.test.tsx`
- `bun test src/features/crm/hooks/useCadenciaAgenda.test.ts`
- `npm run gen:db-types` - executou contra Supabase linked, mas o arquivo gerado foi restaurado porque o remoto ainda não contém migrations locais recentes (`cadencia_*`, `devolutiva_acoes`, remuneração), quebrando `typecheck`.
- `npm run lint` - passou.
- `npm test` - passou.
- `npm run build` - passou.
- `git diff --check` - passou.

### Completion Notes
- Relatório de auditoria atualizado para refletir Sprint 3/4 concluído e separar pendências fora do escopo.
- Rotas alternativas e namespace `/vendedor/*` adicionados com redirects preservando `search` e `hash`.
- Nova tela `/vendedor/configuracoes` criada para atalhos operacionais do vendedor sem abrir a configuração administrativa.
- Botões remanescentes em Treinamentos e Perfil passaram a executar ação, navegação ou scroll interno.
- Migration idempotente adiciona `seller_product_categories`, RLS e `updated_by` em tabelas operacionais quando existentes.
- Testes que mockavam hooks compartilhados foram completados para não mascarar exports usados pelos testes de contrato no run completo.

### File List
- `docs/auditorias/auditoria-modulo-vendedor-2026-06-17.md`
- `docs/stories/story-MX-AUDIT-20260617-vendedor-sprint3-4.md`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/lib/auth/routeAccess.ts`
- `src/lib/auth/routeAccess.test.ts`
- `src/pages/VendedorConfiguracoes.tsx`
- `src/pages/VendedorConfiguracoes.test.tsx`
- `src/pages/VendedorTreinamentos.tsx`
- `src/pages/VendedorTreinamentos.test.tsx`
- `src/features/crm/MeuPerfilVendedor.container.tsx`
- `src/features/crm/MeuPerfilVendedor.container.test.tsx`
- `src/features/crm/CentralExecucao.container.test.tsx`
- `src/features/crm/LeadsVendedor.container.test.tsx`
- `src/features/crm/hooks/useCadenciaAgenda.test.ts`
- `src/features/vendedor-home/VendedorHome.container.test.tsx`
- `src/pages/VendedorAjuda.test.tsx`
- `supabase/migrations/20260617007000_vendedor_sprint3_4_dados.sql`
- `src/lib/vendedor-sprint3-4-data-migration.test.ts`

### Change Log
- 2026-06-17: Story criada a partir da auditoria do módulo vendedor para executar Sprint 3/4.
- 2026-06-17: Sprint 3/4 implementado e validado com gates locais.
