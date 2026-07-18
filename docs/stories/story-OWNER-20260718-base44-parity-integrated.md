# Story OWNER-20260718 — Paridade integrada do módulo Dono com Base44

## Status

Merged to `main`; production deployment pending Vercel infrastructure.

## Contexto

O aplicativo Base44 `6a593eaeb2d720b667d3d5c3` contém uma referência visual e funcional extensa para o ambiente Dono. O MX Performance de produção já possui autenticação, multi-loja, RBAC, shell, dashboard, Planejamento Estratégico, Plano de Ação, alertas, agenda, departamentos, consultoria e persistência canônica no Supabase.

A implementação não importa `@base44/sdk`, não cria uma segunda árvore de rotas e não replica entidades locais. A referência Base44 foi adaptada ao domínio canônico existente.

## Objetivo

Reproduzir a arquitetura de informação, hierarquia visual e fluxos executivos do Base44 no módulo Dono, preservando o shell e a integração atual com Supabase, Vercel, Gerente e Vendedor.

## Requisitos funcionais

- [x] Navegação do Dono organizada em Gestão, Estratégia, Negócio, Desenvolvimento e Ação Global.
- [x] Início com previsão de vendas de hoje, lucro bruto, volume, estoque, MX Score, meta, agenda, alertas e departamentos.
- [x] Central de Decisões derivada de alertas e planos de ação existentes, sem tabela duplicada.
- [x] Planejamento Estratégico consumindo `catalogo_indicadores_planejamento` e `valores_indicadores_planejamento`.
- [x] Plano de Ação consumindo `planos_acao`, `historico_planos_acao` e `evidencias_planos_acao`.
- [x] Consultoria consumindo visitas e agenda de consultoria existentes.
- [x] Departamentos, Mercado e Universidade reutilizando módulos existentes.
- [x] Falar com Consultor recebe contexto da tela, consulta o consultor vinculado e persiste solicitações auditáveis.

## Restrições atendidas

- Módulos Gerente e Vendedor não receberam alterações de comportamento.
- Entidades existentes foram reutilizadas; somente `solicitacoes_consultoria` foi criada porque não havia equivalente canônico.
- Nenhuma dependência Base44 foi adicionada em produção.
- `localStorage` não foi usado como fonte oficial de dados de negócio.
- RLS das solicitações é restrito a Dono, consultor vinculado e área interna MX.
- Query strings legadas foram preservadas.

## Critérios de aceite

- [x] Destinos únicos na sidebar para as seções e departamentos do Dono.
- [x] Módulos do Dono continuam dentro da rota canônica da loja.
- [x] Layout responsivo usa grids e rolagem interna sem introduzir largura fixa na página.
- [x] Estados de loading, vazio e erro são explícitos no fluxo de consultoria.
- [x] Build, typecheck, lint e testes passam no head final.
- [x] Supabase permanece sem duplicação dos domínios existentes.
- [ ] Produção Vercel publica a revisão do `main`.

## Evidência de integração

- PR: `#125`
- Merge commit: `3a9d1a3c2f710ed857f544ecab54915487e9a301`
- CI: 13 gates aprovados no merge commit real da PR.
- Supabase: tipos gerados pelo projeto `fbhcmzzgwjdgkctlfvbo` e validados pelo gate `db-types-diff`.
- Vercel: deployments recentes falharam antes do build com `Resource provisioning failed`; aguardando nova execução bem-sucedida da integração Git.

## Limitações conhecidas

1. O card de estoque permanece como `Pendente` porque ainda não existe uma fonte canônica validada de estoque por loja no MX. O Base44 usa fixture local, que não foi promovida a dado real.
2. A Central de Decisões organiza e contextualiza alertas e ações existentes, mas os comandos diretos `Aprovar` e `Delegar` ainda não possuem uma transição persistente própria. O usuário é direcionado ao Plano de Ação canônico, evitando estados falsos.
3. A tela de Consultoria reúne o ciclo, a pauta e a agenda existente. A agenda completa continua no módulo canônico já existente.

## File list

### Navegação e cockpit

- `src/components/Layout.tsx`
- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx`
- `src/features/dashboard-loja/sections/owner-cockpit/OwnerBase44Views.tsx`
- `src/features/dashboard-loja/sections/owner-cockpit/OwnerHome.tsx`
- `src/features/dashboard-loja/sections/owner-cockpit/OwnerModuleGrid.tsx`
- `src/features/dashboard-loja/sections/owner-cockpit/ownerBase44Config.ts`
- `src/features/dashboard-loja/sections/owner-cockpit/ownerBase44Config.test.ts`
- `src/features/dashboard-loja/sections/owner-cockpit/format.tsx`
- `src/features/dashboard-loja/sections/owner-cockpit/types.ts`

### Consultoria contextual

- `src/features/dono/FalarConsultorDono.tsx`
- `src/features/dono/ownerConsultantContext.ts`
- `src/features/dono/ownerConsultantContext.test.ts`
- `src/lib/owner-consultant-request-migration.test.ts`
- `src/lib/owner-consultant-bridge-migration.test.ts`
- `src/types/database.generated.ts`

### Supabase

- `supabase/migrations/20260718223000_owner_consultant_requests.sql`
- `supabase/migrations/20260718224500_owner_consultant_bridge.sql`
- `supabase/migrations/20260718225000_owner_consultant_bridge_status.sql`
- `supabase/migrations/20260718225500_owner_consultant_requests_rls_perf.sql`
- Rollbacks correspondentes em `supabase/rollbacks/`.

### Documentação

- `docs/stories/story-OWNER-20260718-base44-parity-integrated.md`
- `docs/superpowers/plans/2026-07-18-owner-base44-parity-integrated.md`
