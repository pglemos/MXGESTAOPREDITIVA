# Story OWNER-20260718 — Paridade integrada do módulo Dono com Base44

## Status

Done — merged to `main` and published in production.

## Contexto

O aplicativo Base44 `6a593eaeb2d720b667d3d5c3` contém a referência visual e funcional do ambiente Dono. O MX Performance já possuía autenticação, multi-loja, RBAC, shell, dashboard, Planejamento Estratégico, Plano de Ação, alertas, agenda, departamentos, consultoria e persistência canônica no Supabase.

A implementação não importa `@base44/sdk`, não cria uma segunda árvore de rotas e não replica entidades locais. A referência Base44 foi adaptada ao domínio canônico existente.

## Objetivo

Reproduzir a arquitetura de informação, hierarquia visual e fluxos executivos do Base44 no módulo Dono, preservando o sidebar universal e a integração atual com Supabase, Vercel, Gerente e Vendedor.

## Requisitos funcionais

- [x] Navegação do Dono organizada em Gestão, Estratégia, Negócio, Desenvolvimento e Ação Global.
- [x] Início com previsão de vendas de hoje, lucro bruto, volume, estoque, MX Score, meta, agenda, alertas e departamentos.
- [x] Central de Decisões derivada de alertas e planos de ação existentes, sem tabela duplicada.
- [x] Planejamento Estratégico consumindo `catalogo_indicadores_planejamento` e `valores_indicadores_planejamento`.
- [x] Plano de Ação consumindo `planos_acao`, `historico_planos_acao` e `evidencias_planos_acao`.
- [x] Consultoria consumindo visitas e agenda de consultoria existentes.
- [x] Departamentos, Mercado e Universidade reutilizando módulos existentes.
- [x] Falar com Consultor recebe contexto da tela, consulta o consultor vinculado e persiste solicitações auditáveis.
- [x] Design System Base44 isolado dentro do cockpit do Dono, preservando o sidebar compartilhado.

## Restrições atendidas

- Módulos Gerente e Vendedor não receberam alterações de comportamento.
- Entidades existentes foram reutilizadas; somente `solicitacoes_consultoria` foi criada porque não havia equivalente canônico.
- Nenhuma dependência Base44 foi adicionada em produção.
- `localStorage` não foi usado como fonte oficial de dados de negócio.
- RLS das solicitações é restrito a Dono, consultor vinculado e área interna MX.
- Query strings legadas foram preservadas.
- Fixtures Base44 não foram promovidas a dados reais.

## Critérios de aceite

- [x] Destinos únicos na sidebar para as seções e departamentos do Dono.
- [x] Módulos do Dono continuam dentro da rota canônica da loja.
- [x] Layout responsivo usa grids e rolagem interna sem introduzir largura fixa na página.
- [x] Estados de loading, vazio e erro são explícitos no fluxo de consultoria.
- [x] Build, typecheck, lint e testes passam no head final.
- [x] Supabase permanece sem duplicação dos domínios existentes.
- [x] Produção Vercel publica a revisão do `main`.
- [x] Domínios e aliases oficiais apontam para o deployment publicado.
- [x] Rotas públicas do SPA e chunks específicos do módulo Dono respondem com HTTP 200.
- [x] Nenhum erro, warning ou fatal foi registrado no runtime após a publicação e os acessos de smoke.

## Evidência de integração

- PR: `#125`
- Merge commit: `3a9d1a3c2f710ed857f544ecab54915487e9a301`
- Commit de reacionamento documental: `294e0c441d94b99cb08f71fbd26c87333f524afd`
- CI: 13 gates aprovados no merge commit real da PR.
- Supabase: tipos gerados pelo projeto `fbhcmzzgwjdgkctlfvbo` e validados pelo gate `db-types-diff`.
- Vercel project: `mxperformance`
- Deployment publicado: `dpl_Hd3Wej8Bqxg71agjNjopxy53uNiL`
- Estado do deployment: `READY`
- Target: `production`
- Build Vite concluído em aproximadamente 33 segundos após os contratos, typecheck, testes de resiliência e lint de tokens.
- Aliases: `mxperformance.com.br`, `www.mxperformance.com.br`, `mxperformance.vercel.app`, `mxperformance-synvolt.vercel.app` e `mxperformance-git-main-synvolt.vercel.app`.
- Smoke público: `/login`, `/lojas`, `/lojas?ownerSection=rotina` e `/falar-consultor` respondendo corretamente pelo SPA.
- Chunks publicados: Dashboard do Dono e Falar com Consultor, incluindo `get_owner_consultant_contact` e persistência em `solicitacoes_consultoria`.

## Auditoria autenticada de produção

A matriz planejada de 17 rotas em 1440, 1024, 768 e 390 px não foi executada contra a produção autenticada porque os secrets `E2E_ROLE_PASSWORD` e `E2E_AUTH_PASSWORD` não estão configurados no GitHub Actions. A ausência foi confirmada antes de qualquer navegação protegida.

Nenhuma credencial foi inserida em arquivo, log, commit ou workflow público. A validação visual autenticada do código final já passou no CI da PR em desktop e mobile; a matriz completa contra o domínio publicado permanece uma tarefa de configuração operacional, não uma falha conhecida do runtime.

## Limitações conhecidas

1. O card de estoque permanece como `Pendente` porque ainda não existe uma fonte canônica validada de estoque por loja no MX. O Base44 usa fixture local, que não foi promovida a dado real.
2. A Central de Decisões organiza e contextualiza alertas e ações existentes, mas os comandos diretos `Aprovar` e `Delegar` ainda não possuem uma transição persistente própria. O usuário é direcionado ao Plano de Ação canônico, evitando estados falsos.
3. A tela de Consultoria reúne o ciclo, a pauta e a agenda existente. A agenda completa continua no módulo canônico já existente.
4. A matriz autenticada de produção depende da configuração segura de um secret E2E no GitHub Actions.

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
- `src/styles/owner-base44-visual-scope.css`

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
