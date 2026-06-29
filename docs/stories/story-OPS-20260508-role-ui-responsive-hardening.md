# Story OPS-20260508 - Hardening Visual Responsivo dos Perfis Operacionais

## Status

Ready for Review

## Story

**As a** Admin Master MX em consultoria,
**I want** que todas as telas de vendedor, gerente e dono estejam visualmente consistentes em desktop e mobile,
**so that** eu possa apresentar o sistema completo sem cards quebrados, textos cortados, ícones desalinhados ou componentes inutilizáveis.

## Executor Assignment

executor: "ux-design-expert"
quality_gate: "dev"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build", "browser responsive audit"]

## Acceptance Criteria

- [x] Auditar as principais rotas dos perfis `vendedor`, `gerente` e `dono` em viewport desktop.
- [x] Auditar as principais rotas dos perfis `vendedor`, `gerente` e `dono` em viewport mobile.
- [x] Corrigir quebras visuais evidentes: texto cortado indevidamente, cards com overflow, botões/ícones desalinhados, tabelas/painéis sem scroll adequado e conteúdo sobreposto.
- [x] Preservar a lógica funcional existente e o escopo dos módulos reais de cada perfil.
- [x] Validar navegação com login/simulação usando os usuários MX disponíveis.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm test`.
- [x] Rodar `npm run build`.

## Tasks / Subtasks

- [x] Mapear rotas e componentes compartilhados usados pelos perfis vendedor, gerente e dono.
- [x] Criar/usar auditoria responsiva com evidências desktop e mobile.
- [x] Corrigir padrões globais e componentes compartilhados.
- [x] Corrigir páginas específicas onde o problema não for compartilhado.
- [x] Reexecutar auditoria visual e quality gates.

## Dev Notes

- Requisito originado diretamente do usuário após entrega da simulação de perfis do Admin Master MX.
- A auditoria deve cobrir o uso real via computador e mobile, priorizando usabilidade de consultoria e apresentação.
- Não alterar permissões, regras de negócio ou dados da loja MX fora do necessário para renderização.

## Testing

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Auditoria Playwright responsiva nas rotas de vendedor, gerente e dono em `1366x768` e `390x844`.
- Segunda auditoria Playwright responsiva completa após o commit inicial, com foco em componentes ainda quebrados.

## Dev Agent Record

### Debug Log

- Story criada para cumprir o gate AIOX de desenvolvimento orientado por story.
- Browser plugin abriu o login local, mas falhou ao preencher o input `type=email` por limitação do mecanismo de edição; auditoria seguiu por automação Playwright/Chrome em navegador real.
- Chrome DevTools MCP validou login, abertura do menu `Simulação`, entrada em `Vendedor`, viewport mobile sem overflow horizontal e console sem erros.
- Audit inicial identificou overflow no banner de simulação mobile, aside do check-in sem token de largura, header de Dashboard Loja em 1366px, tabs mobile em Gerente Treinamentos/Dashboard Loja, ranking mobile e botões da Rotina Gerente.
- Audit final severo: 62 verificações em rotas de vendedor, gerente e dono nos viewports desktop e mobile, `issueCount: 0`.
- Segunda passada encontrou 5 pontos residuais: CTA de devolutivas no desktop, card de lançamento pendente no mobile e ações/listas do ranking no mobile.
- Segunda passada corrigida e revalidada: 62 verificações em rotas de vendedor, gerente e dono nos viewports desktop e mobile, `issueCount: 0`.
- `npm run lint`: passou após correção dos tokens `gap-mx-xs`.
- `npm run typecheck`: passou.
- `npm test`: passou, 228 testes.
- `npm run build`: passou.
- Revisao cross-role 2026-05-27 aplicada com base nas 6 imagens do modulo do dono e no documento `MX PERFORMANCE - DESENVOLVIMENTO.docx`.
- Analise funcional registrada em `docs/prd/analise-modulos-dono-gerente-vendedor-2026-05-27.md`, separando o que deve ser Home executiva do dono, central operacional do gerente e fluxo diario do vendedor.
- Dono: Central MX reorganizada com Planejamento Estrategico, Plano de Acao, Alertas Inteligentes, Benchmarking, Agenda Executiva e Consultor IA; cockpit executivo preserva dados reais e estados pendentes quando nao ha fonte.
- Gerente: navegacao reorganizada para Central Operacional, Rotina Comercial e Gestao de Gente; KPIs da performance ajustados para Meta, Realizado, Projecao, Agendamentos Hoje, Conversao e MX Score.
- Vendedor: navegacao reorganizada para Meu Dia e Evolucao, com Meu Dia, Agenda, Funil, Fechar Meu Dia, Ranking, Feedbacks, PDI, Treinamentos e Trilhas.
- `npm run typecheck`: passou.
- `npm run lint`: passou com 56 warnings preexistentes de acessibilidade fora do escopo desta revisao.
- `npm test`: passou, 308 testes, 0 falhas.
- `npm run build`: passou.
- Imagem da visao do gerente recebida em 2026-05-27: cockpit operacional criado para `role === gerente`, com Meta do Mes, Ritmo Diario, Conversao Geral, Agendamentos Hoje, MX Score, Desempenho da Equipe, Funil, Alertas, Engajamento, Ranking e Agenda.
- Header legado de Dashboard Loja ocultado na Home de gerente para preservar a experiencia de painel operacional.
- Browser: a sessao autenticada atual estava como `dono`; `/simulacao/gerente` retornou 403 corretamente. Regressao do cockpit do dono validada em desktop/mobile sem overflow horizontal. Visao do gerente validada por typecheck, lint, testes e build.
- `npm run typecheck`: passou.
- `npm run lint`: passou com 56 warnings preexistentes de acessibilidade fora do escopo desta revisao.
- `npm test`: passou, 308 testes, 0 falhas.
- `npm run build`: passou.
- Imagem da visao do vendedor recebida em 2026-05-27: Home `Meu Dia` redesenhada para meta mensal, comissao pendente quando nao ha regra real, agendamentos, atividades, Score MX, agenda, fechamento do dia, ranking, evolucao, conquistas, treinamentos e ultimo feedback.
- Hook da Home do vendedor passou a carregar devolutivas junto com metas, check-ins, ranking e treinamentos para sustentar o bloco de feedback sem dados falsos.
- `npm run typecheck`: passou.
- `npm run lint`: passou com 56 warnings preexistentes de acessibilidade fora do escopo desta revisao.
- `npm test`: passou, 308 testes, 0 falhas.
- `npm run build`: passou.
- Continuidade 2026-05-27 via `aiox-master`: DOCX completo conferido por extracao textual porque o ambiente nao tem LibreOffice/Poppler/python-docx para renderizacao visual.
- Contrato de alertas ajustado para cumprir o documento: problema, impacto, recomendacao e acao rapida agora aparecem separados nas leituras de dono e gerente.
- `npm run typecheck`: passou.
- 2026-06-19: Novo `SellerLayoutShell` reaproveitado como sidebar global para gerente, dono e perfis internos MX, preservando a navegacao por papel em `Layout.tsx`.
- 2026-06-19: `npm run typecheck`, `npm run lint`, `npm test` (600 pass) e `npm run build` passaram.
- 2026-06-22: Revisao UX da Home do vendedor corrigiu scrollbar visivel no sidebar, removeu status online falso, removeu fallbacks falsos de meta/comissao/score, ajustou empty states, contraste e grid dos cards superiores.
- 2026-06-22: `npm run typecheck`, `bun test src/features/vendedor-home/VendedorHome.container.test.tsx`, `npm run lint`, `npm test` e `npm run build` passaram.
- 2026-06-27: Telas do vendedor alinhadas ao pacote visual Base44 anexado: Home, Central de Execucao, Carteira de Clientes, Funil de Vendas e Meu Perfil passaram a usar os entry-points `src/base44-reference/pages/*`.
- 2026-06-27: Adapter `base44Client` adicionado para entidades mockadas da referencia, incluindo metodo `get(id)` usado pela ficha da Carteira.
- 2026-06-27: Central de Execucao corrigida para abrir pendencias sem navegar para rota legada e para formatar datas sem `NaN` quando a pendencia nao traz data direta.
- 2026-06-27: Deploy de producao validado em `https://mxperformance-douclug9d-synvolt.vercel.app` com login de vendedor; rotas `/home`, `/central-de-execucao`, `/carteira-clientes`, `/funil-comercial` e `/perfil` carregaram sem erro runtime.
- 2026-06-27: Browser smoke autenticado validou drawer de pendencias da Central, abertura de ficha na Carteira e Carteira mobile; evidencias geradas em `output/playwright/prod-*.png`.
- 2026-06-27: `npm run typecheck`, `npm run build`, `npm run lint` e `npm test` passaram; suite retornou 671 testes, 0 falhas.
- 2026-06-27: Correção visual global do módulo vendedor removeu o frame externo do shell, preservou o contrato de rolagem interna, padronizou padding dos wrappers Base44 e eliminou margem duplicada do `PageHeader`.
- 2026-06-27: Auditoria Playwright local gerou evidências em `output/playwright/layout-fix-final` e `output/playwright/layout-fix-contract` para Home, Central, Carteira, Funil, Perfil e Carteira mobile sem overflow horizontal.
- 2026-06-27: `npm run typecheck`, `npm run build`, `npm run lint` e `npm test` passaram novamente; suite retornou 671 testes, 0 falhas.
- 2026-06-27: Deploy Vercel producao `dpl_4gVq8hfzz2obZWxGf8oNt2Y6dPGp` publicado em `https://mxperformance-7u7z8ab64-synvolt.vercel.app`.
- 2026-06-27: Smoke autenticado em producao validou Home, Central, Carteira, Funil, Perfil e Carteira mobile sem overflow horizontal; evidencias em `output/playwright/prod-layout-fix-final`.
- 2026-06-27: Padronizacao fina com referencia `/terminal-mx`: `/central-de-execucao`, `/carteira-clientes` e `/funil-comercial` ficaram com `h1.left=276`, `header.left=252`, `header.width=1180` em viewport 1440 e sem overflow horizontal.
- 2026-06-27: Funil de Vendas reestruturado para restaurar o grid dos 3 KPIs no topo; validacao Playwright confirmou cards em 3 colunas desktop e empilhados sem overflow em 390px.
- 2026-06-27: `npm run typecheck`, `npm run build`, `npm run lint` e `npm test` passaram; suite retornou 671 testes, 0 falhas.
- 2026-06-27: Deploy Vercel producao `dpl_HitMV2JoWVGgjBgDPJCZ4U2x77kM` publicado em `https://mxperformance-mii0lotos-synvolt.vercel.app` e alias `https://mxperformance.vercel.app`.
- 2026-06-27: Smoke autenticado em producao validou `/terminal-mx`, `/central-de-execucao`, `/carteira-clientes` e `/funil-comercial` em 1440x900 e 390x844 sem overflow horizontal e sem erros de console; evidencias em `output/playwright/prod-header-final`.
- 2026-06-27: Validacao ampliada encontrou crash real ao clicar em `Rotina do Dia`: `Cannot read properties of undefined (reading 'track')`. Adapter `base44Client` corrigido com `analytics.track()` compatível com a referencia Base44.
- 2026-06-27: `npm run typecheck`, `npm run build`, `npm run lint` e `npm test` passaram apos a correcao; suite retornou 671 testes, 0 falhas.
- 2026-06-27: Deploy Vercel producao publicado em `https://mxperformance-5siwy4ko7-synvolt.vercel.app` e alias `https://mxperformance.vercel.app`.
- 2026-06-27: Validacao final autenticada em producao retornou `allPass=true`: sem console errors, page errors, request failures, HTTP errors, overlays ou overflow; cabecalhos/laterais alinhados ao Terminal e interacoes de Rotina, Carteira e Funil funcionando; evidencias em `/tmp/mx-prod-final-validation-1782572561926`.

### Completion Notes

- Experiencia de vendedor publicada em producao com layout Base44 e sidebar/nav ajustadas para desktop e mobile.
- Entry-points antigos continuam preservados como rotas da aplicacao, mas agora renderizam as telas Base44 adaptadas ao projeto.
- Smoke de producao autenticado confirmou login real, navegacao principal do vendedor, drawer de pendencias e ficha da Carteira.
- Rodada visual posterior corrigiu spacing, cabecalho, titulos e rolagem do shell vendedor mantendo o contrato do Check-in.
- Rodada final alinhou titulos/cabecalhos/laterais das tres rotas CRM ao Terminal MX e corrigiu o grid quebrado do Funil de Vendas.
- Validacao final corrigiu o crash de analytics na aba Rotina e comprovou producao sem erros para Central, Carteira e Funil.

### File List

- `docs/stories/story-OPS-20260508-role-ui-responsive-hardening.md`
- `docs/prd/analise-modulos-dono-gerente-vendedor-2026-05-27.md`
- `src/index.css`
- `src/components/Layout.tsx`
- `src/components/SellerSidebar.tsx`
- `src/components/ui/MxPageHeader.jsx`
- `src/components/molecules/TabNavPill.tsx`
- `src/pages/DashboardLoja.tsx`
- `src/features/dashboard-loja/DashboardLoja.container.tsx`
- `src/features/dashboard-loja/sections/KpisSection.tsx`
- `src/features/dashboard-loja/sections/ManagerOperationalCockpit.tsx`
- `src/features/dashboard-loja/sections/OwnerDecisionCards.tsx`
- `src/features/dashboard-loja/sections/PerformanceAlerts.tsx`
- `src/features/dashboard-loja/sections/PerformanceTab.tsx`
- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx`
- `src/pages/GerenteFeedback.tsx`
- `src/pages/GerenteTreinamentos.tsx`
- `src/pages/Ranking.tsx`
- `src/pages/RotinaGerente.tsx`
- `src/pages/VendedorHome.tsx`
- `src/pages/CentralExecucao.tsx`
- `src/pages/CarteiraClientes.tsx`
- `src/pages/FunilVendedor.tsx`
- `src/pages/MeuPerfilVendedor.tsx`
- `src/api/base44Client.js`
- `src/base44-reference/carteira/*.jsx`
- `src/base44-reference/execucao/*.jsx`
- `src/base44-reference/layout/*.jsx`
- `src/base44-reference/pages/*.jsx`
- `src/components/carteira/*.jsx`
- `src/components/execucao/*.jsx`
- `src/components/ui/*.jsx`
- `components.json`
- `package.json`
- `package-lock.json`
- `src/features/vendedor-home/VendedorHome.container.tsx`
- `src/features/vendedor-home/VendedorHome.container.test.tsx`
- `src/features/vendedor-home/hooks/useVendedorHomePage.ts`
