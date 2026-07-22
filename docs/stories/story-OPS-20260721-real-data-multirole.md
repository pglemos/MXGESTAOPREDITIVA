# Story OPS-20260721 — Dados reais em todos os módulos e perfis

## Status

Ready

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
- [ ] Pre-Commit (@dev): CodeRabbit sem CRITICAL; revisar mocks, escopo, erros e secrets.
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

- [ ] 1. Construir inventário executável multi-role (AC: 1, 2, 3, 8, 9)
  - [ ] Mapear rotas permitidas, menus, módulos e submódulos dos seis perfis e da Loja MX.
  - [ ] Classificar cada fonte como real, preferência/cache permitido, teste-only ou fictícia proibida.
  - [ ] Registrar matriz com leitura, escrita, tabela/RPC, escopo e evidência esperada.
- [ ] 2. Remover dados fictícios do Dono (AC: 2, 3, 4, 5)
  - [ ] Substituir Home, Plano Estratégico, Plano de Ação e Consultoria por adaptadores Supabase canônicos ou estados vazios reais.
  - [ ] Remover badges/textos demonstrativos, fixtures de negócio e persistência local de registros oficiais.
  - [ ] Preservar preferências puramente visuais e fluxos válidos de exportação/ação.
- [ ] 3. Fechar resíduos de Vendedor, Gerente e Loja MX (AC: 2, 3, 4, 6, 7, 9)
  - [ ] Remover `demoMode` da carteira e fallbacks numéricos de mockup.
  - [ ] Auditar adapters Base44 e módulos de treinamento/fechamento para impedir bootstrap local de negócio.
  - [ ] Validar fontes reais e estados vazios em todas as rotas operacionais.
- [ ] 4. Fechar resíduos de Administrador, Admin MX e Consultor MX (AC: 2, 3, 4, 8, 9)
  - [ ] Auditar identidade, seleção de loja/cliente, agenda, visitas, consultoria, relatórios, treinamentos e configurações.
  - [ ] Eliminar usuários, lojas e registros sintéticos em runtime.
  - [ ] Provar permissões e RLS específicas sem ampliar acesso por papel genérico.
- [ ] 5. Implementar contratos e persistência faltantes (AC: 4, 5, 8, 9, 12)
  - [ ] Reutilizar tabelas/RPCs existentes; criar migration somente após provar lacuna.
  - [ ] Adicionar RLS, índices, constraints, tipos e testes de matriz quando houver schema novo.
  - [ ] Validar migrations de forma idempotente e registrar a origem da evidência local/remota.
- [ ] 6. Criar regressão anti-ficção e validar ponta a ponta (AC: 10, 11, 12, 13)
  - [ ] Adicionar contrato estático sobre runtime ativo com allowlist apenas para testes, referência Base44 e termos de domínio legítimos como `comp_demonstracao`.
  - [ ] Testar empty states e ausência de fallback inventado por módulo.
  - [ ] Rodar smokes autenticados de todas as rotas por perfil, com inspeção de rede/console e limpeza de dados temporários.
  - [ ] Executar lint, typecheck, suíte global, build, CodeRabbit e checklist DoD.

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

## Dev Agent Record

### Agent Model Used

_A preencher por @dev._

### Debug Log References

- Auditoria inicial: 140 suspeitas de runtime classificadas por termos de mock/demo/fake/localStorage; achados confirmados concentrados no módulo Dono, carteira DEV, adapter Base44 e fallback de cockpit.

### Completion Notes List

_A preencher por @dev._

### File List

- `docs/stories/story-OPS-20260721-real-data-multirole.md`

## QA Results

Pendente.
