# Story OPS-20260516 - Hardening Final Dos 168 Achados Multi-Role

## Status

Ready for Review

## Contexto

Continuação do `EPIC-OPS-20260507-MULTI-ROLE-HARDENING` para fechar os 168 achados residuais em Admin MX, dono, gerente e vendedor.

Restrições: sem agentes nativos de background do Codex para trabalho AIOX, sem rotação de secrets reais e sem alterar regra de negócio fora dos artefatos existentes.

## Acceptance Criteria

- [x] Segurança/rotas: capabilities são a fonte de decisão para rotas sensíveis e acesso negado usa estado 403 explícito.
- [x] Navegação global: menus e atalhos respeitam `routeAccess`, sem fallback para rota não autorizada.
- [x] Admin MX/lojas/equipe: arquivamento encerra vínculos ativos, restore é explícito, erros de clipboard/refresh/query são visíveis.
- [x] Dashboard/dono/gerente: loja inválida e ausência de loja têm estado acionável, sem fallback silencioso.
- [x] Feedback semanal: criação/listagem usam contrato comum, semana selecionável e validações obrigatórias.
- [x] PDI: escopo por capability, datas protegidas, empty states e bundle validado.
- [x] Vendedor/check-in/home: timezone, janelas de edição, erro visível, saída suja e WhatsApp protegidos.
- [x] Ranking/LiveFloor: erros propagados, anonimização não busca nome real, modal acessível e sem métricas fake.
- [x] QA/TestSprite/E2E: legados quarentenados, credenciais removidas e smoke por papel documentado.
- [x] Docs/readiness/performance: NO-GO residual documentado com owner, artefatos gerados fora da fonte e build sem alerta novo.

## Checklist Dos 168 Achados

- [x] Achados 1-18: Segurança, Auth e Rotas.
- [x] Achados 19-27: Layout e navegação global.
- [x] Achados 28-62: Admin MX, lojas e equipe.
- [x] Achados 63-75: Dashboard, dono e gerente.
- [x] Achados 76-89: Feedback semanal.
- [x] Achados 90-106: PDI gerente, dono e vendedor.
- [x] Achados 107-130: Vendedor, check-in e home.
- [x] Achados 131-153: Ranking, LiveFloor e modal de vendedor.
- [x] Achados 154-157: QA, TestSprite e E2E.
- [x] Achados 158-168: Docs, readiness, performance e artefatos.

## Gates

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm test` passou com 276 testes.
- [x] `npm run build`
- [x] `deno check --node-modules-dir=auto supabase/functions/*/index.ts`
- [x] `npm run test:e2e -- --project=chromium --reporter=line --timeout=60000` passou com 16 executados e 64 skips por ausência de env autenticado/local service role.
- [x] `npm run validate:agents` passou com 0 erros e 121 warnings conhecidos de dependências AIOX.

## Dev Agent Record

### Debug Log

- Story criada para rastrear a correção final dos 168 achados.
- Capabilities receberam aliases públicos camelCase e `manage_team/view_ranking`; `view_products` deixou de incluir vendedor.
- `routeAccess` passou a aceitar regra por capability e a rota protegida retorna 403 autenticado em vez de redirecionamento silencioso.
- Navegação global e mobile passou a filtrar itens por `canAccessPath`; gerente sem loja não cai mais em `/lojas`.
- Simulação exige loja ativa selecionada por vínculo/contexto, sem fallback por nome de loja e sem mascarar `must_change_password`.
- Lojas usam `try/finally` no carregamento, validação de criação, arquivamento via fluxo que encerra vínculos e disciplina 0% para lojas vazias.
- Check-in centralizou motivos/limites, adicionou erro carregável, protegeu histórico contra falhas e bloqueou lançamento diário depois de 09:45.
- Ranking passou a expor erro, usar referência canônica, não buscar loja real quando anonimização está ativa e guardar privacidade por sessão/usuário.
- LiveFloor e SellerProfileModal receberam empty state, meta diária por calendário operacional, foco preso e alternativa textual para radar.
- PDI gerente/vendedor recebeu datas protegidas, refresh com `try/finally`, labels mais específicos, empty states e remoção de botão dentro de link.
- Feedback recebeu WhatsApp com `noopener,noreferrer`, parse de datas protegido, validação local no fluxo de loja e labels/ids adicionais.
- TestSprite legado foi mantido em quarentena e teve placeholders/credenciais literais substituídos por marcadores não secretos.
- Documentos de auditoria e recuperação tiveram senhas temporárias redigidas.
- Artefato técnico `src/lib/calculations.test.ts.orig` foi removido do source tree.
- `npm run typecheck` passou.
- `npm run lint` passou.
- `npm test` passou com 274 testes.
- `npm run build` passou sem alerta de chunk acima de 1000 kB.
- `deno check --node-modules-dir=auto supabase/functions/*/index.ts` passou.
- `npm run validate:agents` passou com 0 erros e 121 warnings existentes.
- Corrigido bloqueio técnico do runner Playwright: a porta padrão `3001` estava ocupada por outro projeto e o config reutilizava servidor local arbitrário.
- `playwright.config.ts` passou a usar porta padrão `3107` e só reutiliza servidor quando `PLAYWRIGHT_REUSE_SERVER=1`.
- `npx playwright test src/test/navigation.playwright.ts --project=chromium --reporter=line --timeout=30000` passou com 4 executados e 11 skips esperados sem env autenticado.
- `npm run test:e2e -- --project=chromium --reporter=line --timeout=60000` passou com 16 executados e 64 skips por ausência de env autenticado/local service role.
- Gates reexecutados após ajuste do Playwright: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `deno check --node-modules-dir=auto supabase/functions/*/index.ts` e `npm run validate:agents` passaram.
- Auditoria residual de 168 achados revalidada: rotas sensíveis legadas `/settings`, `/team`, `/simulacao`, `/produtos`, `/configuracoes` e `/pdi/:id/print` agora carregam capability explícita.
- Alias `/team` deixou de enviar gerente sem loja para `/lojas`; gerente com loja vai para aba de equipe da própria loja e falta de escopo retorna 403.
- Painel de equipe passou a usar `canManageTeam`, confirmação destrutiva em `alertdialog`, clipboard defensivo, PII de pré-cadastro redigida até expansão e senha temporária fora de toast.
- Criação/edição de loja recebeu RPCs de ciclo de vida `admin_update_store`, `admin_archive_store` e `admin_restore_store`, com encerramento explícito de vínculos ativos no arquivamento.
- Dashboard deixou de alterar `activeStoreId` por visualização, passou a validar limites de meta/benchmark, tratar realtime/refresh com erro e usar terminologia de arquivamento.
- Feedback Admin passou a usar o hook comum `createFeedback`, semana selecionável e busca de check-ins da semana escolhida.
- PDI passou a validar bundle com Zod antes da RPC e exibir erro parcial quando recomendações automáticas falham.
- Edge Functions de relatórios/Google/pré-cadastro tiveram casts `as any` removidos dos arquivos tocados; os adaptadores Supabase agora ficam isolados em tipos estruturais.
- Helper E2E não usa mais e-mail operacional padrão; testes autenticados exigem `E2E_AUTH_EMAIL`/`E2E_AUTH_PASSWORD` ou pulam explicitamente.
- Documentação histórica e artefatos de auditoria tiveram e-mails operacionais e senhas temporárias redigidos sem rotação de secrets reais.
- Artefatos gerados `playwright-report/`, `test-results/` e `deno.lock` foram removidos do workspace e adicionados à política de ignore local.
- Revisão pré-commit fechada: `submit_checkin` agora reforça no servidor que registro diário é apenas para vendedor, próprio usuário e até 09:45 BRT.
- Revisão pré-commit fechada: alteração de semana em devolutiva Admin/loja recalcula os totais do funil antes do salvamento.
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `deno check --node-modules-dir=auto supabase/functions/*/index.ts`, `npm run validate:agents` e `npm run test:e2e -- --project=chromium --reporter=line --timeout=60000` passaram na validação final.

### Workflow AIOX Complementar - 2026-05-16

- `aiox-master`: reabriu a story existente como fonte única para os 100 achados residuais de UX/UI, sem criar story duplicada e sem usar agentes nativos em background.
- `aiox-pm`: consolidou os achados em objetivos de produto por papel: reduzir obstrução mobile, explicitar permissões/estado, reduzir ambiguidade de ações e melhorar rotina diária do vendedor.
- `aiox-po`: validou que a correção deve permanecer dentro do hardening multi-role já aceito, sem inventar novo fluxo comercial nem alterar regra de negócio fora da UX.
- `aiox-architect`: definiu correções sistêmicas primeiro: área segura mobile no layout, barra inferior com rótulos, DataGrid com respiro de navegação, feedback persistente de sincronização e linguagem consistente de arquivamento.
- `aiox-dev`: aplicou os ajustes incrementais em `Layout`, `DataGrid`, produtos digitais, lojas, dashboard da loja, check-in e home do vendedor.
- `aiox-qa`: orientou gates de regressão com `typecheck`, `lint`, testes unitários e build após as mudanças; os resultados desta rodada ficam registrados abaixo.

### Debug Log - Rodada 100 Achados UX/UI

- Arquivos `docs/framework/coding-standards.md`, `docs/framework/tech-stack.md` e `docs/framework/source-tree.md` referenciados por `devLoadAlwaysFiles` não existem no workspace; fallback usado: artefatos presentes em `docs/architecture/`.
- Layout global recebeu área segura mobile para impedir que a barra fixa cubra CTAs e conteúdo rolável.
- Barra mobile passou a exibir rótulos visíveis para Início, Lançar/Equipe/Lojas, Menu, Rank e Perfil, reduzindo memorização por ícone.
- Menu mobile teve altura/padding reduzidos e limite por `100dvh` para diminuir rolagem interna cansativa.
- DataGrid mobile passou a reservar área segura inferior; tabela desktop removeu scroll escondido e recebeu instrução acessível para overflow horizontal.
- Produtos Digitais trocou ação visual `EXCLUIR` por `ARQUIVAR`, alinhando a UI ao comportamento real de preservação de histórico.
- Lojas tornou o filtro Ativas/Arquivadas visível também no mobile para Admin MX.
- Dashboard da loja adicionou estado persistente para falha de realtime/refresh, horário da última sincronização e data final visível em mobile.
- Dashboard da loja corrigiu linguagem sem acentos em alertas executivos/gerenciais e trocou `EXCLUIR` por `ARQUIVAR` na administração de loja.
- Check-in do vendedor passou a mostrar contagem até bloqueio, regra 0-999 em cada card, erro inline persistente no submit e botões `+/-` desabilitados nos limites.
- Check-in removeu emoji/confete textual do fluxo de sucesso e manteve celebração visual com ícone, reduzindo ruído em uso diário.
- Home do vendedor removeu emoji do título, priorizou o CTA de lançamento diário acima da prescrição tática e corrigiu textos sem acento.
- `npm run lint` passou, incluindo `tsc --noEmit` e `scripts/lint-tokens.js`.
- `npm test` passou com 276 testes.
- `npm run build` passou.
- `npm run validate:agents` passou com 0 erros e 121 warnings conhecidos de dependências AIOX.
- Verificação Browser em mobile `390x844` abriu `http://127.0.0.1:3108/`; ambiente local sem sessão autenticada exibiu a entrada pública, então a inspeção visual das rotas por papel segue dependente de credenciais/sessão válida.

### Workflow AIOX - Correção Completa Dos Itens 1-25

- `aiox-master`: manteve a story existente como trilha única e priorizou correções globais antes de ajustes pontuais para não criar divergência entre módulos.
- `aiox-pm`: traduziu os 25 achados em cinco objetivos: descoberta de conteúdo rolável, leitura operacional, feedback persistente, navegação pesquisável e linguagem de gestão consistente.
- `aiox-po`: confirmou que as mudanças devem preservar regra de negócio e atuar em UX/UI, acessibilidade, rotulagem e clareza de permissões.
- `aiox-architect`: definiu primitives compartilhadas para scroll, tipografia, ações semânticas, empty states, atualização temporal e glossário inline.
- `aiox-dev`: implementou os ajustes nos tokens, atoms, organisms, layout global e módulos de lojas, dashboard, ranking, vendedor, produtos, agenda e consultoria.
- `aiox-qa`: validou contratos com `npm run typecheck` e `npm run lint` logo após as mudanças estruturais; testes/build foram reexecutados ao final da rodada.

### Rastreabilidade Dos Itens 1-25

- [x] 1-2 Scroll escondido: `no-scrollbar` deixou de ocultar barras e passou a renderizar scrollbar fina e visível em todas as telas que usam a classe.
- [x] 3-4 Caixa alta/tracking: `Typography`, `Button` e `Card` reduziram uppercase/tracking globais, preservando labels curtas onde fazem sentido.
- [x] 5 Hierarquia visual: headings globais ficaram menores e com `leading-tight`, reduzindo competição em dashboards densos.
- [x] 6 Sombras fortes: tokens `--shadow-mx-xl`, `--shadow-mx-2xl` e `--shadow-mx-elite` foram suavizados globalmente.
- [x] 7-8 Toast como único feedback: `Toaster` ganhou duração maior, botão de fechar e expansão; Dashboard mantém aviso persistente de sync/refresh e estados vazios receberam próximo passo.
- [x] 9-10 Ações parecidas/sem padrão: criado `src/lib/ui/actionLabels.ts` com rótulos semânticos para atualizar, copiar, painel, equipe, arquivar/desativar/restaurar/excluir permanente.
- [x] 11 Estados vazios: `EmptyState` ganhou `nextStep` e módulos Produtos, Agenda e Configurações passaram a orientar o próximo passo.
- [x] 12 Modais grandes: `Modal` virou layout mobile com inset, scroll visível/contido, close acessível e footer com safe area.
- [x] 13 Botões icon-only: `Button size="icon"` agora mostra tooltip visual pelo `aria-label`; CTAs críticos de atualizar/compartilhar ganharam texto visível.
- [x] 14 Busca global: botão de busca do layout abre busca real de módulos em vez de redirecionar para uma rota contextual.
- [x] 15 Drawer desktop: retirada a dependência de `mouseLeave`; drawer fecha por ação explícita, seleção ou Escape.
- [x] 16 Menu mobile: menu ganhou campo de busca/filtro interno por categoria, item e rota.
- [x] 17 Bottom nav/CTAs: safe area foi preservada e footers de modal usam `env(safe-area-inset-bottom)` para não competir com barra fixa.
- [x] 18 RoleRedirect: rotas incompatíveis passaram a renderizar `ForbiddenRoute` explícita em vez de redirecionar silenciosamente.
- [x] 19 ForbiddenRoute: tela 403 agora informa rota, perfil e orienta pedir liberação ao Admin MX ou gestor responsável.
- [x] 20 Paridade rota/label: navegação e telas trocaram `Classificação/Arena` por `Ranking/Comparativo` mantendo `/classificacao` como alias técnico.
- [x] 21 Linguagem gamificada: removidos termos operacionais como `Arena`, `Tropa`, `campo de batalha`, `Rei da Arena`, `MX ELITE` e `Meritocracia` das telas de gestão recorrente.
- [x] 22 Formulários longos: modal base recebeu estrutura responsiva de header/body/footer, evitando scroll interno opaco e deixando seções existentes mais previsíveis.
- [x] 23 Última atualização: criado `LastUpdated` e aplicado em lojas, dashboard da loja, home do vendedor e ranking.
- [x] 24 Glossário inline: criado `GlossaryHint` e aplicado a métricas críticas do dashboard (`Escoamento Médio` e `Saúde Disciplinar`).
- [x] 25 CTAs múltiplos: headers críticos passaram a agrupar ações com rótulos visíveis, timestamps e ações secundárias menos ambíguas.

### Debug Log - Rodada Itens 1-25

- Scrollbars voltaram a ser descobríveis mesmo nas telas que continuam usando `no-scrollbar` por compatibilidade.
- Tipografia, botões e cards foram ajustados em primitives para reduzir caixa alta, tracking excessivo e títulos grandes em todo o app.
- Tooltip visual automático foi adicionado aos botões de ícone que já tinham `aria-label`, reduzindo dependência de memorização sem quebrar layout compacto.
- Layout global recebeu busca de módulos em desktop e mobile; o botão de busca deixou de funcionar como atalho disfarçado para `/lojas` ou `/classificacao`.
- Drawer desktop não fecha mais em `mouseLeave`, evitando perda acidental durante navegação por trackpad/teclado.
- Menu mobile recebeu filtro por texto e estado vazio quando nenhum módulo corresponde à busca.
- `ForbiddenRoute` foi reforçada com explicação acionável e rotas por papel passaram a exibir bloqueio explícito quando o papel não corresponde.
- Linguagem de ranking foi padronizada em Layout, Ranking, VendedorHome, Lojas, SalesPerformance e componentes de ranking.
- Dashboard da loja ganhou glossário inline para métricas com termo técnico e usa `LastUpdated` no bloco de sincronização.
- Lojas, Ranking e VendedorHome exibem atualização temporal e CTAs de refresh com texto visível.
- Produtos, Agenda e catálogo de opções agora mostram próximo passo em estados vazios.
- `npm run typecheck` passou após a rodada 1-25.
- `npm run lint` passou após a rodada 1-25.
- `npm test` passou com 276 testes após a rodada 1-25.
- `npm run build` passou após a rodada 1-25.
- `npm run validate:agents` passou com 0 erros e 121 warnings conhecidos de dependências AIOX.
- Browser local em `http://127.0.0.1:3108/` validado em viewports `390x844` e `1440x900`; sem erros de console. Ambiente sem sessão autenticada mostrou a entrada pública.

### Workflow AIOX - Correção Completa Dos Itens 26-60

- `aiox-master`: manteve a mesma story e restringiu a rodada ao escopo Admin MX, evitando refatoração ampla fora dos módulos citados.
- `aiox-pm`: traduziu os achados em objetivos de produto: reduzir aprendizagem de jargões, separar governança de consumo, tornar riscos administrativos explícitos e unificar criação/edição de loja.
- `aiox-po`: confirmou critérios de aceite para não alterar permissões nem regra de negócio; mudanças ficam em navegação, rótulos, disclosure progressivo, preview e feedback visual.
- `aiox-architect`: definiu a solução por áreas: navegação com descrição, configurações pesquisáveis, loja com fluxo canônico, dashboard com administração colapsada e produtos com modos separados.
- `aiox-dev`: aplicou as correções em `Layout`, `Configuracoes`, `ConfigTabsNav`, `tabRegistry`, `Lojas`, `DashboardLoja`, `AiDiagnostics` e `ProdutosDigitais`.
- `aiox-qa`: validou contratos com `npm run typecheck` e `npm run lint` durante a implementação; gates completos ficam registrados abaixo.

### Rastreabilidade Dos Itens 26-60

- [x] 26 Menu Admin com muitos módulos: busca de módulo já está ativa no layout e foi mantida como padrão desktop/mobile.
- [x] 27 Categorias exigiam aprendizado: categorias Admin foram renomeadas para `Rede e Gestão`, `Rotina e Conteúdo`, `Relatórios e Diagnóstico` e `Configurações`, com descrição contextual.
- [x] 28 `/configuracoes` concentrava temas: header e cards de orientação separam minha conta, lojas/equipe, operação por loja e governança.
- [x] 29 Admin se perdia entre configurações: `Configuracoes` ganhou atalhos explícitos para `/lojas`, `/configuracoes/operacional` e conta pessoal.
- [x] 30 Abas demais sem filtro: `ConfigTabsNav` recebeu busca interna e estado vazio.
- [x] 31 `Role gated`: badge trocado para `Acesso pelo perfil`, descrevendo benefício em vez de mecanismo.
- [x] 32 Read-only/editável parecidos: abas de consulta ganharam borda tracejada, badge `Consulta` e rótulo `Consulta segura`.
- [x] 33 Aparência parecia global: `Aparência` virou `Minha Aparência` e saiu de Sistema para Pessoal.
- [x] 34-35 Lojas e Dashboard duplicavam criação: Dashboard da loja não abre mais modal de criação; direciona para `Gerenciar lojas`, mantendo criação canônica em `/lojas`.
- [x] 36 `DASH`: ações viraram `Abrir painel` e `Abrir equipe`.
- [x] 37 `Tropa`/`Sinc.`: tabela usa `Equipe` e `Disciplina`.
- [x] 38 Preview do pré-cadastro: coluna de pré-cadastro mostra preview selecionável do link antes de copiar.
- [x] 39 Clipboard só por toast: falha de clipboard agora cria alerta persistente acima da lista de lojas.
- [x] 40 `ESTABELECER LOJA`: modal canônico de lojas usa `Criar loja`.
- [x] 41 Filtro sem contagem: filtros Ativas/Arquivadas mostram contagem por estado.
- [x] 42 Aderência sem fórmula: card usa `GlossaryHint` explicando média de disciplina diária das lojas ativas com equipe.
- [x] 43 `Sincronia Média`: rótulo trocado para `Disciplina média`.
- [x] 44-46 Dashboard misturava admin/performance: administração da loja virou painel compacto com parâmetros colapsáveis e explicação de impacto.
- [x] 47 E-mails por vírgula: campos de destinatários exibem chips por e-mail e destacam inválidos visualmente.
- [x] 48 Benchmark sem impacto: cada benchmark mostra qual régua visual do funil será alterada.
- [x] 49 Fonte sem consequência: seleção App nativo/Forms legado/Híbrido mostra explicação operacional da fonte.
- [x] 50 Arquivar perto de editar/nova: arquivamento saiu do header e foi isolado em `Zona de risco`.
- [x] 51 Relatórios espalhados: layout Admin ganhou grupo `Relatórios e Diagnóstico` com Matinal, Performance de Vendas e Diagnóstico Operacional.
- [x] 52 `/auditoria` ambígua: navegação e tela usam `Diagnóstico Operacional`, mantendo a rota técnica por compatibilidade.
- [x] 53 Linguagem técnica em auditoria: `AiDiagnostics` trocou `Auditoria Forense`, `console` e `veredito` por linguagem operacional.
- [x] 54 Produtos misturavam administração/consumo: Produtos Digitais ganhou modos `Administração` e `Consumo`.
- [x] 55 Métricas sem uso: cards passaram a mostrar cobertura de públicos e indicam explicitamente ausência de telemetria de engajamento.
- [x] 56 Produtos padrão sem preview: criação em massa agora exige confirmação com lista dos produtos que serão criados.
- [x] 57 Link interno parecia quebrado: consumidor não vê mais `Produto interno`; Admin vê `Destino interno: catálogo MX`.
- [x] 58 Produto interno para consumidor: rótulo interno fica restrito ao modo administrativo.
- [x] 59 Públicos difíceis de revisar: formulário mostra resumo dos públicos selecionados antes da grade.
- [x] 60 Catálogo/treinamentos/PDI duplicados: Produtos e Configurações indicam que rotas próprias são uso diário e Configurações é governança.

### Debug Log - Rodada Itens 26-60

- Layout Admin recebeu agrupamento explícito para relatórios e diagnóstico, reduzindo rotas espalhadas.
- Configurações recebeu busca lateral, atalhos para destinos administrativos e rótulos orientados ao usuário.
- Lojas recebeu contagens por status, preview de pré-cadastro, alerta persistente de clipboard e linguagem sem abreviação.
- Dashboard da loja passou a mostrar administração como painel compacto com configurações colapsáveis e zona de risco separada.
- Formulário operacional da loja ganhou chips de validação visual para destinatários, descrição de fonte de dados e impacto de benchmarks.
- Diagnóstico operacional reduziu linguagem técnica/forense para leitura executiva.
- Políticas operacionais trocaram `Modo de Auditoria Forense` por `Diagnóstico detalhado`.
- Produtos Digitais separou administração e consumo, adicionou preview de criação padrão e removeu rótulos internos para consumidores.
- `npm run typecheck` passou após a rodada 26-60.
- `npm run lint` passou após a rodada 26-60.
- `npm test` passou com 276 testes após a rodada 26-60.
- `npm run build` passou após a rodada 26-60.
- `npm run validate:agents` passou com 0 erros e 121 warnings conhecidos de dependências AIOX.
- Browser local em `http://127.0.0.1:3108/` validado em viewports `390x844` e `1440x900`; sem erros de console. Ambiente sem sessão autenticada mostrou a entrada pública.
- `npm run lint` reexecutado após ajuste final de linguagem de diagnóstico operacional e passou.

### Workflow AIOX - Correção Completa Dos Itens 61-85

- `aiox-master`: manteve a orquestração local no escopo Dono, sem acionar agentes nativos em segundo plano.
- `aiox-pm`: reposicionou Dono como perfil executivo: comparar lojas, decidir prioridades, acompanhar execução e solicitar alterações governadas.
- `aiox-po`: converteu os achados em critérios de aceite por jornada: `/lojas`, dashboard da loja, configurações, produtos, treinamentos, ranking, PDI, devolutivas e notificações.
- `aiox-architect`: definiu que links de loja carregam `?id=` além do slug, reduzindo fragilidade por renomeação, e que bloqueios devem ser explícitos.
- `aiox-dev`: aplicou correções nos módulos de navegação, lista de lojas, dashboard da loja, rotas, permissões e telas compartilhadas.
- `aiox-qa`: definiu gates de regressão para typecheck, lint, testes, build e validação AIOX.

### Rastreabilidade Dos Itens 61-85

- [x] 61 `/lojas` agora tem título e contexto executivo para Dono.
- [x] 62 Tela de lojas ganhou comparativo direto entre unidades e separa visão de rede de performance.
- [x] 63 Dashboard da loja removeu dependência de select no título para Dono e usa seletor compacto.
- [x] 64 Nome longo da loja agora renderiza como título quebrável; seletor fica em controle próprio.
- [x] 65 Links de loja para Dono/Admin carregam `?id={storeId}` junto ao slug, reduzindo fragilidade por renomeação.
- [x] 66 Unidade não localizada virou estado persistente recuperável com CTA para voltar às lojas.
- [x] 67 Dono sem loja ativa recebe empty state com próximo passo para solicitar vínculo/ativação ao Admin MX.
- [x] 68 Configurações mostram card `Permissões do Dono` explicando consulta versus edição.
- [x] 69 `Lojas & Rede` read-only fica contextualizada como acompanhamento governado.
- [x] 70 `Operacional` read-only orienta solicitação de alteração via Admin MX e atalho de notificação.
- [x] 71 `/lojas` ganhou comparação de disciplina, equipe e status `Decidir/Acompanhar`.
- [x] 72 Ausência de DRE no dashboard orienta solicitação de cadastro ao Admin MX.
- [x] 73 Alertas do Dono agora são ordenados por severidade e exibem impacto Alto/Médio/Baixo.
- [x] 74 Bloco `Visão do Dono` virou `Decisões do Dono`, com linguagem executiva.
- [x] 75 Produtos Digitais explica uso prático do catálogo para Dono e separa gestão do Admin MX.
- [x] 76 Dono passou a acessar Treinamentos pelo `RoleSwitch` e pelo menu.
- [x] 77 `/rotina` saiu do acesso de Dono; tentativa direta mostra bloqueio explícito.
- [x] 78 Ranking mostra contexto de governança para Dono.
- [x] 79 Dashboard do Dono separa decisão, acompanhamento e financeiro antes dos cards operacionais.
- [x] 80 Lista de lojas para Dono usa um CTA único `Abrir unidade`; equipe não compete com o clique principal.
- [x] 81 Pré-cadastro para Dono explica que o Admin MX opera o link.
- [x] 82 Notificações, PDI e Devolutivas agora exibem cards de papel do Dono e bloqueiam criação operacional para Dono.
- [x] 83 Primeira loja/rede ganhou onboarding visual por empty state dedicado.
- [x] 84 Dono vê explicitamente `O que eu decido hoje` versus `O que eu acompanho`.
- [x] 85 Menu do Dono passou a expor Ranking, PDI e Treinamentos; Configurações explica capacidades bloqueadas.

### Debug Log - Rodada Itens 61-85

- `Lojas` recebeu visão executiva, comparativo por loja, estado vazio de primeira unidade e texto de pré-cadastro governado.
- `DashboardLoja` passou a resolver loja por `id` na query, preservar `id` em troca de abas e renderizar erro recuperável para Dono.
- Dashboard do Dono ganhou trilha de decisão/acompanhamento/financeiro, DRE pendente com próximo passo e alertas priorizados por impacto.
- `App` e `routeAccess` removeram Dono da rotina gerencial e liberaram Treinamentos para Dono.
- `Layout` adicionou Ranking, PDI e Treinamentos ao menu do Dono, tornando capacidades visíveis em vez de ausentes.
- Configurações, Produtos Digitais, Ranking, Treinamentos, PDI, Devolutivas e Notificações passaram a mostrar contexto específico para Dono.
- `npm run typecheck` passou após a rodada 61-85.
- `npm run lint` passou após a rodada 61-85.
- `npm test` passou com 276 testes após a rodada 61-85.
- `npm run build` passou após a rodada 61-85.
- `npm run validate:agents` passou com 0 erros e 121 warnings conhecidos de dependências AIOX.

### Workflow AIOX - Correção Completa Dos Itens 86-110

- `aiox-master`: manteve a execução no workflow local AIOX e restringiu a rodada ao papel Gerente.
- `aiox-pm`: reposicionou o gerente como executor de rotina diária, leitura de performance e desenvolvimento da equipe, reduzindo ruído competitivo.
- `aiox-po`: transformou os achados em critérios de aceite para Dashboard da Loja, Rotina, Matinal, Devolutivas, PDI, Treinamentos e navegação de equipe.
- `aiox-architect`: definiu separação de responsabilidades: header leve, filtros de período em bloco próprio, ações próximas da métrica e feedback persistente em operações críticas.
- `aiox-dev`: aplicou correções em rotas/aliases, dashboard, rotina, matinal, devolutivas, PDI e treinamentos.
- `aiox-qa`: iniciou validação com `npm run typecheck` e `npm run lint`; gates completos ficam registrados após a execução final.

### Rastreabilidade Dos Itens 86-110

- [x] 86 `/team` ganhou alias `/equipe`, menu do gerente usa destino nomeado e o redirect preserva `?id=` da loja.
- [x] 87 Dashboard da loja manteve abas, mas separou controles de período em card próprio para reduzir peso do header.
- [x] 88 Header do dashboard ficou focado em loja, abas e atualizar; datas/período saíram do header.
- [x] 89 Date inputs viraram controles maiores, com labels Início/Fim e estado desabilitado em D-1.
- [x] 90 Leitura D-1 e intervalo manual agora têm descrição explícita, evitando conflito interpretativo.
- [x] 91 Rotina e Matinal ganharam alertas persistentes além de toast para sync, realtime, envio e falhas.
- [x] 92 Card de funil foi separado em Leads Gerados e Visitas Realizadas.
- [x] 93 Saúde disciplinar lista vendedores pendentes no próprio card.
- [x] 94 Métrica disciplinar ganhou CTA `Resolver na rotina` para gerente.
- [x] 95 Alertas gerenciais ganharam botões diretos para metas, rotina, devolutivas ou ranking.
- [x] 96 Cada etapa do Fluxo de Escoamento ganhou interpretação curta versus benchmark.
- [x] 97 Ranking no dashboard recebeu linguagem de ação gerencial, reduzindo leitura competitiva.
- [x] 98 Busca de vendedor agora expõe ações rápidas para devolutiva, PDI e rotina.
- [x] 99 Card de período mostra CTA para `Metas que alimentam a leitura`.
- [x] 100 RotinaGerente ganhou progresso global simples antes da sequência matinal.
- [x] 101 Gerente vê a unidade atual e a origem do contexto do vínculo.
- [x] 102 Lembretes de pendentes criam feedback persistente com horário e resultado.
- [x] 103 Texto de lembretes corrigido: `já` e `sessão`.
- [x] 104 Aprovar/rejeitar correção ganhou bloco `Decisão crítica`, referência e botões desabilitados durante auditoria.
- [x] 105 Disparo do Matinal registra auditoria persistente na tela com status e horário.
- [x] 106 Devolutivas mostram escopo do gerente e diferenciam admin/dono/gerente.
- [x] 107 Modal de devolutiva usa container móvel com scroll no corpo e header fixo.
- [x] 108 PDI mostra escopo do gerente em rota compartilhada.
- [x] 109 Treinamentos separa tarefa por abas mais claras e explica equipe, matriz e trilha.
- [x] 110 Linguagem competitiva de treinamentos foi reduzida: `tropa`, `elite`, `absorção` e reforço competitivo foram substituídos por termos operacionais.

### Debug Log - Rodada Itens 86-110

- Dashboard da loja recebeu card de período com leitura D-1/intervalo manual, inputs maiores e CTA para metas.
- Cards de performance passaram a separar Leads e Visitas, e disciplina passou a listar pendentes e abrir a rotina.
- Alertas gerenciais agora têm CTA navegável, e o funil mostra interpretação textual de cada benchmark.
- `/equipe` foi adicionado como alias descobrível de equipe para gerente, preservando loja por `id`.
- RotinaGerente ganhou progresso global, contexto explícito de loja, feedback persistente e auditoria de Matinal.
- Correções retroativas em RotinaGerente ganharam contexto de decisão crítica e estado de loading nos botões.
- MorningReport ganhou auditoria local persistente para refresh, exportação, WhatsApp e envio para Direção MX.
- Devolutivas, PDI e Treinamentos passaram a explicar o escopo do gerente em rotas compartilhadas.
- `npm run typecheck` passou após a rodada 86-110.
- `npm run lint` passou após ajuste de token no modal de devolutivas.
- `npm test` passou com 276 testes após a rodada 86-110.
- `npm run build` passou após a rodada 86-110.
- `npm run validate:agents` passou com 0 erros e 121 warnings conhecidos de dependências AIOX.

### Workflow AIOX - Correção Completa Dos Itens 111-135

- `aiox-master`: manteve a rodada restrita ao papel Vendedor e aos módulos do ritual diário, histórico, ranking, produtos, perfil, treinamentos, feedbacks e notificações.
- `aiox-pm`: reposicionou o vendedor em uma jornada diária simples: lançar primeiro, revisar alertas, pedir suporte e evoluir por prioridade.
- `aiox-po`: converteu os achados em critérios de aceite verificáveis para densidade, validação por campo, histórico comparável, CTA visível e linguagem operacional.
- `aiox-architect`: preservou contratos existentes de check-in, auditoria, rota protegida e catálogo; adicionou apenas a rota operacional `/ajuda`.
- `aiox-dev`: aplicou correções em `VendedorHome`, `Checkin`, `Historico`, `Ranking`, `ProdutosDigitais`, `Perfil`, `VendedorTreinamentos`, `VendedorFeedback`, `Notificacoes`, `App`, `Layout` e `routeAccess`.
- `aiox-qa`: iniciou validação com `npm run typecheck`; gates completos ficam registrados após a execução final.

### Rastreabilidade Dos Itens 111-135

- [x] 111 Home do vendedor ganhou bloco `Ritual de hoje` logo após o header, antes de cards densos.
- [x] 112 Lançamento Diário explicita Etapa 1 produção D-1 e Etapa 2 agenda de hoje.
- [x] 113 Campos numéricos do check-in ficaram mais compactos e com digitação direta em destaque.
- [x] 114 Check-in mostra alerta preventivo quando faltam até 15 minutos para o bloqueio.
- [x] 115 Campos vazios agora criam erro por campo antes do submit.
- [x] 116 Erros inline foram amarrados ao campo problemático com `aria-invalid` e `aria-describedby`.
- [x] 117 Regra de produção zero passou a ficar sempre visível antes da condição aparecer.
- [x] 118 Motivo `Outro` informa previamente a exigência de observação com mínimo de 8 caracteres.
- [x] 119 Botões +/- viraram ajuste secundário; campo aceita digitação direta e explica o uso.
- [x] 120 Limite 999 ganhou explicação operacional no check-in e no modal de correção.
- [x] 121 Sucesso do check-in não força navegação com delay; mostra confirmação persistente com ações.
- [x] 122 Histórico ganhou resumo comparativo em tabela curta antes dos cards longos.
- [x] 123 Correção aparece também no topo do card e na tabela comparativa.
- [x] 124 Modal de correção usa min/max 0-999 e valida os mesmos limites.
- [x] 125 Estado vazio do histórico mudou para `Nenhum registro encontrado`.
- [x] 126 Busca do histórico inclui canais, totais, datas, notas e motivos.
- [x] 127 Ranking do vendedor mostra contexto de meta individual e objetivo da leitura.
- [x] 128 Linguagem competitiva foi reduzida em ranking/home: X1, combatentes, campeão e on fire foram substituídos por comparativo, vendedores, 1º lugar e meta batida.
- [x] 129 Produtos Digitais explica para vendedor que catálogo vazio depende de liberação do Admin MX/gerente.
- [x] 130 Perfil do vendedor usa linguagem de `Minha Conta`, dados pessoais e segurança da conta.
- [x] 131 Nova rota `/ajuda` centraliza suporte do ritual diário e aparece na Home e no menu do vendedor.
- [x] 132 Treinamentos ganhou bloco de prioridade simples: gap, recomendados e biblioteca.
- [x] 133 Feedbacks mostram aviso de ciência pendente e CTA direto no topo do card.
- [x] 134 Notificações mostram card de ritual diário para vendedor com contagem pendente.
- [x] 135 Home e Check-in reforçam a separação entre produção D-1 e agenda de hoje.

### Debug Log - Rodada Itens 111-135

- `Checkin` recebeu `fieldErrors`, validação por campo, aviso de bloqueio próximo, regra persistente de produção zero e confirmação pós-salvamento sem redirecionamento automático.
- `Historico` recebeu busca ampliada, resumo comparativo em tabela, CTA de correção antecipado e limites equivalentes ao check-in no modal.
- `VendedorHome` recebeu bloco de ritual diário com lançamento, alertas e ajuda antes das demais leituras.
- `/ajuda` foi criado para vendedor e registrado em `App`, `Layout` e `routeAccess`.
- `Ranking`, `BattleView` e Home tiveram linguagem competitiva reduzida em favor de leitura de meta e comparação operacional.
- `ProdutosDigitais`, `Perfil`, `VendedorTreinamentos`, `VendedorFeedback` e `Notificacoes` passaram a exibir contexto específico do vendedor.
- `npm run typecheck` passou após a rodada 111-135.
- `npm run lint` passou após a rodada 111-135.
- `npm test` passou com 276 testes após a rodada 111-135.
- `npm run build` passou após a rodada 111-135.
- `npm run validate:agents` passou com 0 erros e 121 warnings conhecidos de dependências AIOX.
- `git diff --check` passou após a rodada 111-135.
- Browser local em `http://127.0.0.1:3002/ajuda` respondeu e redirecionou para `/login` sem erros de console quando sem sessão autenticada.

### File List

- `docs/stories/story-OPS-20260516-168-achados-final-hardening.md`
- `.gitignore`
- `docs/audit/mx-team-access-2026-04-30.md`
- `docs/audit/mx-team-provisioning-log-2026-04-30.md`
- `docs/audit/mx-team-provisioning-log-2026-05-11-dryrun.md`
- `docs/audit/mx-team-provisioning-log-2026-05-11.md`
- `docs/audit/admin-master-access-2026-05-02.md`
- `docs/audit/admin-master-full-e2e-20260503010521.md`
- `docs/audit/admin-master-full-e2e-20260503023622.md`
- `docs/audit/admin-master-full-e2e-20260503042149.md`
- `docs/audit/admin-master-full-e2e-20260503052018.md`
- `docs/audit/synvollt-admin-master-e2e-2026-05-02.md`
- `docs/stories/epics/epic-mx-platform-evolution/`
- `docs/stories/story-CONS-02-client-structure-and-assignments.md`
- `docs/stories/story-OPS-20260430-mobile-calendar-arena.md`
- `docs/stories/story-OPS-20260504-store-registration-profile.md`
- `docs/stories/story-QA-20260515-e2e-suite-stabilization.md`
- `docs/stories/story-manager-routine-04/spec/spec.md`
- `docs/stories/story-whatsapp-message-06/spec/spec.md`
- `docs/stories/story-OPS-20260514-admin-master-password-recovery.md`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/components/atoms/Button.tsx`
- `src/components/atoms/EmptyState.tsx`
- `src/components/atoms/Typography.tsx`
- `src/components/molecules/Card.tsx`
- `src/components/molecules/GlossaryHint.tsx`
- `src/components/molecules/LastUpdated.tsx`
- `src/components/organisms/Modal.tsx`
- `src/components/organisms/DataGrid.tsx`
- `src/features/configuracoes/components/ConfigTabsNav.tsx`
- `src/features/configuracoes/tabRegistry.ts`
- `src/features/configuracoes/components/AgendaOptionsCatalog.tsx`
- `src/features/configuracoes/components/tabs/OperacionalLojaTab.tsx`
- `src/features/consultoria/components/VisitExecutionViews.tsx`
- `src/features/lojas/components/StoreTeamPanel.tsx`
- `src/features/pdi/WizardPDI.tsx`
- `src/features/ranking/components/LiveFloor.tsx`
- `src/features/ranking/components/BattleView.tsx`
- `src/features/ranking/components/SellerProfileModal.tsx`
- `src/features/ranking/components/StoreBattleView.tsx`
- `src/hooks/useFeedbackReports.ts`
- `src/hooks/useFeedbacks.ts`
- `src/hooks/useAuth.tsx`
- `src/hooks/useCheckins.ts`
- `src/hooks/useCheckins.test.ts`
- `src/hooks/usePDI_MX.ts`
- `src/hooks/useRanking.ts`
- `src/hooks/useTeam.ts`
- `src/lib/auth/capabilities.ts`
- `src/lib/auth/capabilities.test.ts`
- `src/lib/auth/routeAccess.ts`
- `src/lib/auth/routeAccess.test.ts`
- `src/lib/calculations.test.ts.orig`
- `src/lib/ui/actionLabels.ts`
- `src/pages/AiDiagnostics.tsx`
- `src/pages/AgendaAdmin.tsx`
- `src/pages/Checkin.tsx`
- `src/pages/DashboardLoja.tsx`
- `src/pages/GerenteFeedback.tsx`
- `src/pages/GerentePDI.tsx`
- `src/pages/GerenteTreinamentos.tsx`
- `src/pages/Historico.tsx`
- `src/pages/Lojas.tsx`
- `src/pages/MorningReport.tsx`
- `src/pages/MXPerformanceLanding.tsx`
- `src/pages/Notificacoes.tsx`
- `src/pages/OperationalSettings.tsx`
- `src/pages/ProdutosDigitais.tsx`
- `src/pages/Ranking.tsx`
- `src/pages/RotinaGerente.tsx`
- `src/pages/SalesPerformance.tsx`
- `src/pages/VendedorHome.tsx`
- `src/pages/VendedorAjuda.tsx`
- `src/pages/VendedorFeedback.tsx`
- `src/pages/VendedorTreinamentos.tsx`
- `src/pages/VendedorPDI.tsx`
- `src/test/e2e-helpers/auth.ts`
- `src/test/auth-password-recovery.playwright.ts`
- `supabase/functions/_shared/drive-upload.ts`
- `supabase/functions/approve-store-registration/index.ts`
- `supabase/functions/feedback-semanal/index.ts`
- `supabase/functions/google-drive-files/index.ts`
- `supabase/functions/relatorio-matinal/index.ts`
- `supabase/functions/relatorio-mensal/index.ts`
- `supabase/migrations/20260516132000_admin_store_lifecycle_rpcs.sql`
- `testsprite_tests/`
- `playwright.config.ts`
