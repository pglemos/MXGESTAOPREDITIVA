# Story OPS-20260721 — Dados reais em todos os módulos e perfis

## Status

Ready for Review

## Executor Assignment

executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: ["bun", "playwright", "supabase", "coderabbit", "browser"]

## Story

**Como** operação da MX Gestão Preditiva,
**quero** que todos os módulos acessíveis por vendedor, gerente, dono, administrador, Admin MX e Consultor MX, incluindo a Loja MX,
**para que** funcionem somente com dados reais e persistência canônica, sem mensagens, fixtures, mocks ou fallbacks de demonstração no runtime.

## Contexto e fontes de verdade

- Pedido literal do usuário em 2026-07-21: verificar e corrigir todos os módulos e perfis, incluindo a Loja MX, e eliminar qualquer mensagem equivalente a `Dados fictícios — modelo em validação`.
- Continuação do hardening multi-role em `docs/stories/epics/epic-ops-20260507-multi-role-hardening.md` e `docs/stories/story-OPS-20260516-100-achados-multi-role-hardening.md`.
- A story `story-OWNER-20260721-base44-export-1x1-functional.md` aceitava estados demonstrativos identificados; este requisito posterior substitui essa permissão: nenhum estado demonstrativo pode permanecer em uma rota ativa.
- O Supabase é a fonte oficial de estado de negócio. `localStorage` e `sessionStorage` só podem manter preferências de interface, autenticação controlada, cache autorizado ou estado efêmero de navegação — nunca registros de negócio apresentados como reais.
- Ausência de dados deve renderizar estado vazio verdadeiro ou indisponibilidade explícita. É proibido preencher lacunas com números, pessoas, lojas, ações, metas, scores, programas, vendas, clientes ou históricos inventados.

## Acceptance Criteria

1. Uma matriz versionada inventaria todas as rotas e módulos ativos por perfil (`vendedor`, `gerente`, `dono`, `administrador`, `administrador_mx`/Admin MX e `consultor_mx`/Consultor MX), incluindo a Loja MX, com fonte de dados, escrita, autorização e evidência de teste.
2. Nenhuma rota ativa exibe `Dados fictícios — modelo em validação` nem texto semanticamente equivalente a dados fictícios, demonstração, mock ou validação visual de negócio.
3. Nenhum módulo ativo usa fixtures, `DEMO_*`, `Mock*`, `demoMode`, catálogos com valores simulados ou bootstrap em `localStorage` como fonte de dados de negócio.
4. Dados oficiais são lidos e gravados por contratos Supabase/RPC existentes ou por contratos novos auditáveis quando o schema atual for insuficiente; toda escrita preserva autenticação, escopo de loja/cliente e RLS deny-by-default.
5. O módulo Dono substitui `homeData`, `actionPlanFixtures`, `MockStrategicPlanRepository` e repositórios demonstrativos de Consultoria por fontes MX reais ou estados vazios funcionais, sem quebrar rotas, filtros, exportações e ações válidas.
6. Vendedor e Loja MX não ativam dados demo em desenvolvimento quando a consulta real retorna vazio; carteira, funil, fechamento, treinamentos, PDI, feedback, perfil, ranking e loja mostram somente dados persistidos ou estado vazio real.
7. Gerente usa dados reais e escopo correto em rotina, equipe, metas, mentor, desenvolvimento, ranking, treinamentos, fechamento, funil e loja; nenhum fallback numérico de mockup compõe KPIs.
8. Administrador, Admin MX e Consultor MX usam identidades e escopos canônicos, sem usuário/loja sintéticos; módulos de lojas, agenda, visitas, consultoria, relatórios, treinamentos, configurações e auditoria preservam as permissões específicas de cada perfil.
9. A Loja MX é validada como loja real do banco: vínculos, equipe, metas, lançamentos, clientes, agenda, check-ins, rankings e dashboards devem refletir os registros remotos existentes, sem seeds de demonstração inseridos para mascarar ausência.
10. Testes de contrato impedem regressão: varredura de runtime bloqueia textos/identificadores proibidos e testes focados comprovam que respostas vazias não acionam fixtures ou valores inventados.
11. Smokes autenticados por perfil percorrem todas as rotas permitidas, verificam ausência de erro de página/console, chamadas reais de rede, estados vazios corretos e isolamento de escopo. Testes mutáveis usam registros temporários identificáveis e limpeza por ID.
12. `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam; migrations/RLS, quando alteradas, têm prova remota ou CI claramente identificada, sem alegar execução local inexistente.
13. Nenhum secret, token, senha ou credencial é impresso, salvo, versionado, capturado em screenshot ou incluído em relatório.

## Fora de escopo

- Inventar dados para preencher telas vazias.
- Redesenhar módulos sem necessidade funcional para remover mocks.
- Alterar permissões de perfil além do necessário para restaurar o contrato já documentado.
- Publicar, criar PR ou executar deploy sem handoff ao `@devops` e autorização correspondente.

## 🤖 CodeRabbit Integration

**Primary Type**: Full-stack / Integration
**Secondary Types**: Database, Frontend, Security, Architecture, Testing
**Complexity**: High

**Primary Agents**:
- @dev
- @data-engineer para schema/RLS quando necessário

**Supporting Agents**:
- @qa
- @architect para decisões de fonte canônica não resolvidas pelos artefatos
- @devops para publicação e validação remota quando solicitadas

**Quality Gates**:
- [x] Pre-Commit (@dev): CodeRabbit sem CRITICAL; revisar mocks, escopo, erros e secrets.
- [ ] Pre-PR (@devops): regressão, migrations, RLS, contratos e vazamento de secrets.
- [ ] Pre-Deployment (@devops): CI, Supabase, Vercel e smoke autenticado por perfil.

**Self-Healing**:
- Primary Agent: @dev (light)
- Max Iterations: 2
- Timeout: 15 minutos
- CRITICAL: corrigir automaticamente; HIGH: documentar; MEDIUM/LOW: não mascarar.

**Focus Areas**:
- Ausência completa de dados fictícios no runtime.
- Fonte canônica e persistência real por módulo.
- RLS e escopo de loja/cliente por perfil.
- Empty states honestos, acessíveis e acionáveis.
- Cobertura de rotas, rede/console e limpeza de dados temporários.

## Tasks / Subtasks

- [x] 1. Construir inventário executável multi-role (AC: 1, 2, 3, 8, 9)
  - [x] Mapear rotas permitidas, menus, módulos e submódulos dos seis perfis e da Loja MX.
  - [x] Classificar cada fonte como real, preferência/cache permitido, teste-only ou fictícia proibida.
  - [x] Registrar matriz com leitura, escrita, tabela/RPC, escopo e evidência esperada.
- [x] 2. Remover dados fictícios do Dono (AC: 2, 3, 4, 5)
  - [x] Substituir Home, Plano Estratégico, Plano de Ação e Consultoria por adaptadores Supabase canônicos ou estados vazios reais.
  - [x] Remover badges/textos demonstrativos, fixtures de negócio e persistência local de registros oficiais.
  - [x] Preservar preferências puramente visuais e fluxos válidos de exportação/ação.
- [x] 3. Fechar resíduos de Vendedor, Gerente e Loja MX (AC: 2, 3, 4, 6, 7, 9)
  - [x] Remover `demoMode` da carteira e fallbacks numéricos de mockup.
  - [x] Auditar adapters Base44 e módulos de treinamento/fechamento para impedir bootstrap local de negócio.
  - [x] Validar fontes reais e estados vazios em todas as rotas operacionais.
- [x] 4. Fechar resíduos de Administrador, Admin MX e Consultor MX (AC: 2, 3, 4, 8, 9)
  - [x] Auditar identidade, seleção de loja/cliente, agenda, visitas, consultoria, relatórios, treinamentos e configurações.
  - [x] Eliminar usuários, lojas e registros sintéticos em runtime.
  - [x] Provar permissões e RLS específicas sem ampliar acesso por papel genérico.
- [x] 5. Implementar contratos e persistência faltantes (AC: 4, 5, 8, 9, 12)
  - [x] Reutilizar tabelas/RPCs existentes; criar migration somente após provar lacuna.
  - [x] Adicionar RLS, índices, constraints, tipos e testes de matriz quando houver schema novo.
  - [x] Validar migrations de forma idempotente e registrar a origem da evidência local/remota.
- [x] 6. Criar regressão anti-ficção e validar ponta a ponta (AC: 10, 11, 12, 13)
  - [x] Adicionar contrato estático sobre runtime ativo com allowlist apenas para testes, referência Base44 e termos de domínio legítimos como `comp_demonstracao`.
  - [x] Testar empty states e ausência de fallback inventado por módulo.
  - [x] Rodar smokes autenticados de todas as rotas por perfil, com inspeção de rede/console e limpeza de dados temporários.
  - [x] Executar lint, typecheck, suíte global, build, CodeRabbit e checklist DoD.
- [x] 7. Corrigir regressões da reunião da Carteira (AC: 4, 6, 12)
  - [x] Persistir troca, financiamento, proposta e transições de funil no contrato canônico, com contexto real vendedor/loja na simulação.
  - [x] Alinhar próximo passo, mensagem de WhatsApp, retorno transacional e encerramento de venda ao estado persistido.
  - [x] Versionar campanhas/feirão/desconto/bônus na troca com RPC, RLS, idempotência e rollback; validar a migration local e remotamente.

## Dev Notes

### Fontes e padrões existentes

- React 19, TypeScript 5.8, Vite 6, Supabase direto e rotas lazy são a base existente; manter imports `@/` e integração incremental. [Source: `docs/architecture/00-overview.md#existing-project-analysis`]
- Componentes de UI não devem conter chamadas Supabase; organismos podem consumir hooks, preservando separação de apresentação e dados. [Source: `docs/architecture/01-component-arch.md#atomic-design-layer-definitions`]
- Estado remoto deve usar hooks/serviços de domínio e chaves por papel/loja; não criar um segundo banco local para registros de negócio. [Source: `docs/architecture/02-data-layer.md#hook-decomposition-plan-td-04-td-07`]
- O risco crítico conhecido é vazamento entre lojas por RLS; testes automatizados por papel são obrigatórios. [Source: `docs/prd/prd_mestre_mx_performance.md#riscos-e-mitigacoes`]
- O produto separa experiências de dono, gerente, vendedor, marketing/administrativo e Consultor MX. [Source: `docs/prd/prd-refatoracao-mx-performance-reuniao-2026-05-22.md#arquitetura-funcional-recomendada`]
- A visão Dono deve usar dados reais existentes e respeitar os dados reais disponíveis. [Source: `docs/prd/modulo-visao-dono-cockpit-executivo-2026-05-26.md#criterios-de-aceite`]

### Achados iniciais confirmados

- `src/components/owner/home/homeData.js` declara dados fictícios estáticos.
- `src/components/owner/actionplan/actionPlanFixtures.js` injeta 24 ações fictícias e `actionPlanRepository.js` as grava em `localStorage`.
- `src/components/owner/strategic/MockStrategicPlanRepository.js` usa séries demonstrativas e `localStorage`.
- `src/components/owner/consulting/consultingFixtures.js` e `consultingRepository.js` mantêm programa/progresso demonstrativos.
- `src/features/crm/CarteiraClientes.container.tsx` ativa `DEMO_CLIENTES`, `DEMO_OPORTUNIDADES` e `DEMO_KPIS` em DEV quando a fonte real está vazia.
- `src/features/dashboard-loja/sections/owner-cockpit/OwnerHomeWidgets.tsx` possui fallback explícito para valores de mockup.
- `src/api/base44Client.js` contém tabelas virtuais persistidas em `localStorage`; cada consumidor ativo deve ser classificado antes de remoção para não atingir preferências legítimas ou testes.

### Restrições de execução

- Os arquivos `devLoadAlwaysFiles` e seus fallbacks configurados não existem neste checkout; usar os documentos de arquitetura reais citados acima.
- Não modificar `src/base44-reference/**`: é referência importada, não runtime oficial.
- Palavras de domínio como `demonstração` de produto e coluna `comp_demonstracao` não são dados fictícios; o contrato anti-ficção deve distinguir semântica de negócio de mocks.
- `localStorage` continua permitido para tema, densidade, preferências de tabela, feature flags de QA autorizadas e estado efêmero, desde que não substitua Supabase.

## Testing

- Unit/contract: scanner anti-ficção, hooks/adapters de dados, empty states, escrita e erro visível.
- Database/RLS: matriz por perfil/loja/cliente para cada tabela/RPC alterada.
- Integration: respostas Supabase reais, estados vazios e falhas sem injetar fixture.
- E2E: Playwright autenticado por vendedor, gerente, dono, administrador, Admin MX e Consultor MX; Loja MX incluída.
- Browser: cada rota permitida com conteúdo estável, zero page error/`console.error`, rede esperada e nenhuma mensagem/dado fictício.
- Regressão: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `git diff --check`.

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-07-21 | 1.0 | Story corretiva criada a partir do pedido literal de dados reais em todos os perfis e módulos. | @sm |
| 2026-07-21 | 1.0.1 | Validated GO (9/10) — Status: Draft → Ready. Metadados de executor e gate alinhados ao workflow AIOX. | @po |
| 2026-07-22 | 1.1 | Runtime multi-role migrado para fontes reais, contrato anti-ficção e smoke autenticado integral concluídos; story enviada para review. | @dev |

## Dev Agent Record

### Agent Model Used

OpenAI Codex (GPT-5)

### Debug Log References

- Auditoria inicial: 140 suspeitas de runtime classificadas por termos de mock/demo/fake/localStorage; achados confirmados concentrados no módulo Dono, carteira DEV, adapter Base44 e fallback de cockpit.
- Contrato anti-ficção: `src/lib/real-data-runtime-contract.test.ts` percorreu o grafo ativo a partir de `src/App.tsx` sem violações.
- CodeRabbit: duas rodadas; resultado final com 0 CRITICAL, 0 MAJOR e 1 MINOR, corrigido antes dos gates finais.
- Smoke autenticado multi-role: `npx playwright test src/test/mx-consultoria-role-smoke.playwright.ts --project=chromium` — 1 passed (2.3m), cobrindo listas distintas dos seis perfis, chamada Supabase por rota, Loja MX real, detalhes de consultoria e isolamento do Consultor MX.
- Supabase remoto: migration `20260722024951` presente local/remoto; limpeza final confirmou 0 usuários `e2e-real-*` em `public.usuarios`, 0 em `auth.users` e 0 clientes de consultoria E2E.
- Gates finais: lint 0 erros/7 warnings preexistentes; typecheck OK; 1340 testes passaram/0 falharam; build Vite OK; `git diff --check` OK.
- Auditoria da reunião de 2026-07-22: `npm test` passou com 1358 testes/0 falhas; `npm run build` passou; `scripts/check_migration_reversibility.mjs --changed-only` passou; migration de troca/campanhas revisada com rollback e RLS versionados.
- Status remoto por migration no projeto Supabase `mxperformance`: a saída de `supabase migration list` em 2026-07-22 mostrou `Local = Remote` para `20260721141658`, `20260721142820`, `20260722024951` e `20260722180000`; o comando também conectou ao banco remoto e terminou sem divergência. CI, deploy `READY` e smoke autenticado de produção permanecem gates do `@devops`.

### Completion Notes List

- Matriz versionada registra rotas, fontes Supabase/RPC, escrita, escopo e evidências para vendedor, gerente, dono, administrador geral, Admin MX, Consultor MX e Loja MX.
- O módulo Dono ativo passou a usar `OwnerLiveDataPage` e dados reais; fixtures e repositórios demonstrativos legados ficaram fora do grafo executável e são bloqueados pelo contrato anti-ficção.
- Carteira, fechamento, agenda, consultoria, remuneração, perfil e adapter Base44 deixaram de injetar dados, identidades, números ou catálogos simulados quando a fonte oficial está vazia.
- A Agenda Executiva do Dono não fabrica horários, calendários, compromissos ou lembretes; exibe somente alertas derivados dos indicadores e a agenda persistida canônica.
- Aliases de funil, subrotas de loja e a rotina da equipe agora seguem exatamente o `RoleSwitch` do App, mantendo o workspace legado do Dono exclusivo.
- Identidades ausentes são exibidas como `Nome não informado`, sem inventar vendedor, dono ou diretor; Mercado e Universidade MX não carregam mais badge de construção.
- A migration remota serializa a rotina e restringe o contato com consultor ao escopo de loja solicitado, sem autorização genérica por papel.
- O histórico local de migrations inclui as duas versões da simulação de Carteira já aplicadas no projeto remoto, eliminando divergência no Supabase Preview.
- A reunião também foi coberta no fluxo de Carteira: contexto real de vendedor/loja na simulação; Polo e valor de troca persistidos; alias `Confirmar visita amanhã` normalizado; `Converter financiamento aprovado` adicionado; `Venda realizada` fecha a oportunidade e avança para `ganho`; retorno WhatsApp usa mutação transacional com histórico.
- Plano de Ataque agora permite cadastrar campanha, feirão, desconto e bônus na troca com RPC/RLS/rollback versionados e iniciar missão para clientes ativos elegíveis.
- O resumo do programa de consultoria é carregado somente no cockpit do Dono; gerente e demais consumidores do dashboard não chamam a RPC exclusiva nem geram 403 em navegação autenticada.
- A simulação interna da Carteira mantém vendedor e loja reais no contexto de sessão e envia esse escopo à RPC canônica; cadastro, troca, financiamento, proposta e transições de próximo passo permanecem persistidos sem fallback local.
- O smoke cria identidades temporárias identificáveis, valida rede/console/rotas e sempre limpa por ID com `try/finally` e `Promise.allSettled`.
- Regressões adicionais cobrem concorrência de `useSellersByStore`, loading do nível de carreira, percentuais do Dono e isolamento dos mocks Supabase entre arquivos.
- Checklist DoD: 22/22 itens aplicáveis PASS, 6 N/A (sem dependências, variáveis/configurações novas, threshold formal de cobertura ou documentação de uso adicional), 0 FAIL. Story pronta para review; nenhum débito novo identificado.

### File List

- `docs/stories/story-OPS-20260721-real-data-multirole.md`
- `docs/quality/real-data-multirole-matrix.md`
- `src/api/base44Client.js`
- `src/components/carteira/ExecucaoMissao.jsx`
- `src/components/carteira/AlterarProximoPasso.jsx`
- `src/components/carteira/FichaClienteSheet.jsx`
- `src/components/carteira/NovoClienteModal.jsx`
- `src/components/carteira/PlanoAtaqueTab.jsx`
- `src/components/carteira/carteiraUtils.jsx`
- `src/components/carteira/scriptTemplatesLocal.js`
- `src/components/owner/OwnerContext.jsx`
- `src/components/owner/OwnerTopbar.jsx`
- `src/components/owner/actionplan/actionPlanFixtures.js`
- `src/components/owner/home/OwnerActionsBlock.jsx`
- `src/components/owner/home/SalesGoalBlock.jsx`
- `src/components/owner/home/SecondaryAlerts.jsx`
- `src/components/owner/strategic/strategicIndicatorCatalog.js`
- `src/components/ui/dialog.jsx`
- `src/components/ui/sheet.jsx`
- `src/features/carteira-clientes/components/carteira-rendered-parity.test.tsx`
- `src/features/carteira-clientes/components/carteira-source-parity.test.ts`
- `src/features/carteira-clientes/lib/carteira-adapter-contract.test.ts`
- `src/features/carteira-clientes/lib/carteira-mappers.test.ts`
- `src/features/carteira-clientes/lib/carteira-mappers.ts`
- `src/features/carteira-clientes/lib/carteira-meeting-regressions.test.ts`
- `src/features/carteira-clientes/lib/installCarteiraBase44Adapter.js`
- `src/features/carteira-clientes/lib/proximoPassoMx.js`
- `src/features/checkin/Checkin.container.test.ts`
- `src/features/checkin/Checkin.container.tsx`
- `src/features/checkin/hooks/useCheckinPage.ts`
- `src/features/checkin/sections/CheckinCrmSection.test.tsx`
- `src/features/checkin/sections/CheckinCrmSection.tsx`
- `src/features/checkin/sections/CheckinHeader.test.ts`
- `src/features/checkin/sections/CheckinHeader.tsx`
- `src/features/configuracoes/components/AgendaOptionsCatalog.tsx`
- `src/features/consultoria-cliente/sections/PDIsSection.tsx`
- `src/features/consultoria/components/VisitExecutionViews.tsx`
- `src/features/consultoria/components/ConsultingModulesPanel.tsx`
- `src/features/crm/CarteiraClientes.container.tsx`
- `src/features/crm/PlanoAtaqueTab.tsx`
- `src/features/dashboard-loja/hooks/useDashboardLojaData.ts`
- `src/features/dashboard-loja/hooks/useOwnerConsultingProgram.test.ts`
- `src/features/dashboard-loja/hooks/useOwnerConsultingProgram.ts`
- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx`
- `src/features/dashboard-loja/sections/owner-cockpit/AgendaView.tsx`
- `src/features/dashboard-loja/sections/owner-cockpit/OwnerHomeWidgets.test.tsx`
- `src/features/dashboard-loja/sections/owner-cockpit/OwnerHomeWidgets.tsx`
- `src/features/dashboard-loja/sections/owner-cockpit/format.tsx`
- `src/features/dashboard-loja/sections/owner-cockpit/ownerBase44Config.test.ts`
- `src/features/dashboard-loja/sections/owner-cockpit/ownerBase44Config.ts`
- `src/features/manager/team-routine/ManagerTeamRoutineCanonical.container.tsx`
- `src/features/manager/daily-closing/RegularizationsListModal.tsx`
- `src/features/manager/team-routine/manager-team-routine-canonical-source.test.ts`
- `src/features/owner-base44/OwnerLiveDataPage.tsx`
- `src/features/owner-base44/OwnerModule.tsx`
- `src/features/remuneracao/components/CadastroCarreira.tsx`
- `src/features/remuneracao/hooks/useRemuneracao.test.ts`
- `src/features/remuneracao/hooks/useRemuneracao.ts`
- `src/features/remuneracao/MinhaRemuneracaoPage.tsx`
- `src/features/ranking/components/SellerProfileModal.tsx`
- `src/features/rotina-gerente/hooks/useRotinaGerentePage.ts`
- `src/features/rotina-gerente/sections/RotinaAjustesTab.tsx`
- `src/features/gerente-feedback/lib/feedback-action-catalog.ts`
- `src/features/gerente-feedback/modals/AdminFeedbackModal.tsx`
- `src/features/gerente-feedback/modals/StoreFeedbackModal.tsx`
- `src/features/vendedor-home/hooks/useVendedorHomePage.ts`
- `src/features/vendedor-perfil/hooks/useMeuPerfilVendedor.ts`
- `src/hooks/useAgendaOptions.ts`
- `src/hooks/auth/authHelpers.ts`
- `src/hooks/auth/useAuthRBAC.ts`
- `src/hooks/useConsultingModules.ts`
- `src/hooks/usePDI_MX.ts`
- `src/hooks/usePerformance.ts`
- `src/hooks/useRanking.ts`
- `src/hooks/useStores.test.ts`
- `src/hooks/useStores.ts`
- `src/lib/mx-executive-foundation.test.ts`
- `src/lib/mx-executive-foundation.ts`
- `src/lib/owner-base44-exact-parity-contract.test.ts`
- `src/lib/auth/routeAccess.test.ts`
- `src/lib/auth/routeAccess.ts`
- `src/lib/owner-b44/AuthContext.jsx`
- `src/lib/real-data-multirole-migration.test.ts`
- `src/lib/real-data-runtime-contract.test.ts`
- `src/test/e2e-helpers/supabase-admin.ts`
- `src/test/e2e-helpers/real-data-role-routes.ts`
- `src/test/mx-consultoria-role-smoke-contract.test.ts`
- `src/test/mx-consultoria-role-smoke.playwright.ts`
- `src/pages/GerentePDI.tsx`
- `src/pages/VendedorConfiguracoes.tsx`
- `src/pages/VendedorHome.tsx`
- `supabase/migrations/20260722024951_serialize_routine_and_scope_consultant_contact.sql`
- `supabase/migrations/20260721141658_carteira_simulacao_vendedor.sql`
- `supabase/migrations/20260721142820_carteira_simulacao_inline_cleanup.sql`
- `supabase/migrations/20260722180000_carteira_trade_details_and_campaigns.sql`
- `supabase/rollbacks/20260722180000_carteira_trade_details_and_campaigns.sql`

## QA Results

### Review Date: 2026-07-22

### Reviewed By: Quinn (Test Architect)

### Veredito

PASS consultivo. Os achados da auditoria complementar foram corrigidos sem ampliar privilégios: aliases exclusivos do vendedor, subrotas comuns de loja, workspace legado do Dono e rotina da equipe estão alinhados ao `RoleSwitch`; agenda e identidades não fabricam dados; Mercado e Universidade MX não aparecem como indisponíveis.

### Evidências

- Contratos focados: 35 testes passaram, incluindo matriz de rotas, anti-ficção semântica, navegação Dono e cobertura E2E por perfil.
- Regressão: 1340 testes passaram, 0 falharam, 10674 asserções.
- Qualidade: lint com 0 erros e 7 warnings preexistentes; typecheck, build e `git diff --check` passaram.
- Smoke remoto autenticado: 1 passou em 2.3 min; seis perfis, Supabase por rota, Loja MX real, detalhes dinâmicos e isolamento do Consultor MX.
- Higiene remota após o smoke: 0 identidades E2E em `public.usuarios`, 0 em `auth.users` e 0 clientes temporários de consultoria.

### Observações

- Não foi executada nova rodada do CodeRabbit por instrução expressa do usuário; foram preservadas as duas rodadas já registradas no Dev Agent Record.
- Nenhum commit, push ou deploy foi executado nesta etapa.

### Complemento de QA — 2026-07-22

- Fluxo do período validado em navegador autenticado: mês, trimestre, ano e personalizado (05/07/2026–10/07/2026) alteraram KPIs e consultas Supabase para os intervalos correspondentes; sem erros de console.
- Atualizar dados disparou refetch real e exibiu `Performance sincronizada!`; notificações abriram estado informativo; filtros e busca de Alertas produziram subconjuntos e estado vazio; Benchmarking alterou o recorte e disparou novas chamadas `get_benchmark`.
- Todas as rotas da sidebar e aliases Dono foram percorridos em 1440×900; `/dono` e `/dono/resultados` também foram validados em 390×844 sem overflow. O gráfico de Resultados deixou de emitir warning de dimensões iniciais do Recharts.
- Gates repetidos após a última correção: typecheck OK, lint 0 erros/7 warnings preexistentes, build OK, `npm test` isolado com 1341 pass/0 fail e `git diff --check` OK.
