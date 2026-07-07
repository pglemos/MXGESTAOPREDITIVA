# Parte 2 — Dashboard Loja + Consultoria + Configurações

## Resumo

Código em geral bem estruturado: tipagem forte (zero `any` encontrado), separação lógica/apresentação consistente (hooks puros como `usePerformanceAlerts`, `useDashboardLojaData`), tratamento de erro via padrão `{ error }` + toast bem aplicado na maioria dos formulários. Os principais problemas são de tamanho/organização (`OwnerExecutiveCockpit.tsx` com 1782 linhas concentrando ~20 componentes), dados mockados misturados com dados reais em telas "prontas" (agenda executiva, calendário, benchmark), um bug real de estado não persistido em `OperacionalLojaTab`, e ausência total de testes unitários/componente no escopo. Achados por severidade: 3 críticos (bug funcional + dados mock em produção), ~10 médios (arquivos grandes, duplicação, falta de testes), demais são notas menores de estilo/consistência.

## 1. DRY

- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx:214` e `src/features/dashboard-loja/sections/ManagerOperationalCockpit.tsx:660` — função `formatInteger` duplicada de forma idêntica (`Math.round(value || 0).toLocaleString('pt-BR')`). Extrair para `src/lib/format.ts` (já existe `fmt`/`pct` usados em `DREView.tsx`) e reusar nos dois cockpits.
- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx` (`MXScoreCompact`, `SemiCircularGauge` em `ManagerOperationalCockpit.tsx:511`, `OwnerSemiGauge` em `OwnerExecutiveCockpit.tsx:1174`) — três variações do mesmo gauge semicircular (arco 180°→0°, gradiente vermelho/amarelo/verde, ponteiro) reimplementadas com pequenas variações de raio/tamanho em pelo menos 3 componentes. Candidato a `SemiCircularGauge` compartilhado em `src/components/molecules/` parametrizado por tamanho.
- `src/features/consultoria/components/PmrDiagnosticsView.tsx:26-79` (`FULL_TEMPLATE_FIELDS`) — catálogo de perguntas do PMR hardcoded no componente, sobrepondo o que já vem de `usePmrDiagnostics`/`templates`. Mesma estrutura de perguntas provavelmente também existe em `consultoria/data/pmr-questions.ts`; vale consolidar numa única fonte para não divergir quando o formulário for atualizado.
- Padrão `pendingCreateRequest`/contador de solicitação de criação (`CentralMxPlanoSegmentadoPanel.tsx:59-133`) e handlers de export CSV (`OwnerExecutiveCockpit.tsx:1318-1356`) não têm duplicata direta encontrada — sem achado adicional aqui.

## 2. Dead code

- `src/features/configuracoes/components/tabs/OperacionalLojaTab.tsx:47-52` — estado `settings` (`audit_mode`, `strict_checkin`, `morning_report_time`, `allow_manual_retro`) é lido/alterado na UI (toggles, input de horário) mas `handleSave` (linha 65-77) só persiste `emailLists` via `updateDeliveryRules`. Os 4 toggles/campo de horário nunca são salvos — bug funcional, não apenas dead code: usuário acha que configurou algo que não é gravado em lugar nenhum.
- `src/features/dashboard-loja/sections/ManagerOperationalCockpit.tsx:380-381` — comentário explícito `discipline reserved for future use` com `<span className="sr-only">` carregando um valor (`discipline`) calculado (linha 335) mas nunca exibido visualmente, só em texto para leitor de tela. Ou remove o cálculo ou usa de fato no layout.
- `src/features/dashboard-loja/sections/ManagerOperationalCockpit.tsx:630-639` (`gaugeColor`) — função aparenta ser usada apenas por `gaugeGradient` (linha 641), o que é normal; sem dead code aqui, mas note que `GaugeScore` (linha 487) e `SemiCircularGauge` (linha 511) coexistem sem uso claro de ambos simultaneamente nas telas atuais — confirmar se `GaugeScore` ainda é referenciado fora do arquivo antes de remover.

## 3. TypeScript

- Nenhum uso de `: any`, `<any>` ou `as any` encontrado em todo o escopo (grep completo nos 66 arquivos) — ponto forte do código.
- `src/features/consultoria/types.ts` e `src/features/configuracoes/types.ts` — interfaces bem definidas, com uso correto de union types literais (`status: 'agendada' | 'concluida' | ...`) em vez de `string` solto. Padrão consistente `interface` para modelos de dados em todo o escopo (nenhuma inconsistência `interface` vs `type` relevante — `type` é usado para unions/aliases, `interface` para shapes de objeto, como esperado).
- `src/features/consultoria/types.ts:147` — `quant_data?: VisitOneQuantData | Record<string, unknown> | null` é um union pouco específico; o `Record<string, unknown>` mascara o formato real quando não é `VisitOneQuantData`. Se o campo sempre segue o schema `VisitOneQuantData` após migração de dados legados, considerar remover o fallback genérico ou documentar quando ocorre.
- `src/features/consultoria/components/VisitExecutionViews.tsx:100` — `VisitFourExecution` usa nomes de estado de uma letra só (`s, v, p, a, m`) que dificultam a leitura e o entendimento de tipos ao passar o mouse (`useState(false)`, `useState('')` etc. sem tipo explícito quando o valor poderia ser `number | null`). Não é erro de tipo, mas reduz a clareza do tipo inferido para quem lê.

## 4. Componentes

- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx` — 1782 linhas, ~30 componentes internos (`OwnerHome`, `StrategicPlanningView`, `ResultsView`, `ActionPlanView`, `AlertsView`, `BenchmarkingView`, `AgendaView`, `DepartmentsView`, mais helpers de gauge/donut/sparkline). É de longe o maior arquivo do escopo e mistura roteamento de seções, formatação, várias telas completas e componentes visuais de baixo nível no mesmo arquivo. Quebrar por seção (`sections/owner/OwnerHome.tsx`, `OwnerPlanejamento.tsx`, `OwnerAlertas.tsx`, `OwnerBenchmarking.tsx`, `OwnerAgenda.tsx`, `OwnerDepartamentos.tsx`) e mover os componentes visuais genéricos (`Sparkline`, `EficaciaDonut`, `OwnerSemiGauge`) para `components/molecules/`.
- `src/features/dashboard-loja/sections/ManagerOperationalCockpit.tsx` (678 linhas) — mesmo padrão em escala menor: um componente de tela + ~15 subcomponentes de apresentação (gauge, engagement metric, funnel row) no mesmo arquivo. Extrair pelo menos os componentes de gauge/progress para módulo compartilhado com o Owner (ver achado DRY acima).
- `src/features/consultoria/components/VisitOneHighFidelity.tsx` (526 linhas) — concentra 3 responsabilidades bem distintas em um arquivo: dashboards quantitativos (`VisitOneDashboards`), benchmark placeholder (`VisitOneBenchmark`) e entrevistas PMR completas com fetch/save (`VisitOneInterviews`, ~260 linhas sozinho). `VisitOneInterviews` já teria tamanho suficiente para ser extraído para arquivo próprio.
- `src/features/consultoria/components/VisitExecutionViews.tsx` (493 linhas) — 8 componentes de visita (`VisitTwoExecution` a `VisitEightExecution` + `VisitChecklist`) em um único arquivo. Cada `VisitXExecution` é razoavelmente independente (formulário próprio + `onGenerateSummary`); vale considerar um arquivo por visita ou ao menos agrupar por número de linhas quando o arquivo crescer mais.
- `src/features/dashboard-loja/sections/CentralMxPersistedPanels.tsx` (482 linhas) — 3 painéis (`Alertas`, `Planos`, `Agenda`) com padrão muito repetitivo (header com refresh, contador, lista, empty state). Já é razoavelmente organizado, mas o padrão de "Card com header + refresh button + count tiles + lista" se repete 3x quase idêntico; poderia virar um `PersistedPanelShell` genérico recebendo children.

## 5. Estado

- `src/features/dashboard-loja/sections/CentralMxPlanoSegmentadoPanel.tsx:60-133` — `pendingCreateRequest` + efeito que observa `createRequest` (prop numérica incrementada pelo pai `OwnerExecutiveCockpit.tsx:484,538`) para abrir o modal é um padrão de "prop como sinal de evento" via contador. Funciona, mas é frágil (dependente de re-render) comparado a um callback direto (`onRequestCreate` chamado via `ref`/callback) ou context local ao plano de ação.
- `src/features/dashboard-loja/DashboardLoja.container.tsx` + hooks (`useStoreActions`, `useStoreResolution`, `useDashboardLojaData`) — bom exemplo de estado bem distribuído em hooks especializados em vez de um único componente gigante; sem achado negativo aqui.
- Não foi encontrado uso de `Context` para dado que deveria ser local, nem prop drilling excessivo (a maioria dos dados passa por 1-2 níveis via props tipadas). Sem achados adicionais relevantes.

## 6. Hooks

- Nenhuma violação das regras dos hooks encontrada (nenhum hook condicional ou em loop nos arquivos lidos).
- `src/features/dashboard-loja/hooks/useDashboardLojaData.ts:58-97` — `useEffect` do canal Realtime tem array de dependências correto (`[selectedStoreId, refetch]`), com cleanup adequado (`clearTimeout` + `removeChannel`). Bom exemplo de hook bem escrito.
- `src/features/consultoria/components/VisitOneHighFidelity.tsx:287-295` — `useEffect` depende de `currentTmpl?.id` e `currentResp?.id`, mas o corpo também lê `currentTmpl.fields` e `currentResp?.answers/respondent_name/summary`; funciona porque `id` muda junto, mas é um padrão de dependência "por id" que a regra `exhaustive-deps` do ESLint tende a marcar — se o lint estiver com a regra ativa, confirmar que não há warning suprimido.
- `src/features/consultoria/components/VisitExecutionViews.tsx:100` (`VisitFourExecution`) — 5 `useState` independentes (`s, v, p, a, m`) mais um objeto `funnel` já combinando 4 campos. Esse componente é boa candidata a `useReducer` (ou ao menos um único objeto de formulário como já fazem `VisitFiveExecution`/`VisitSixExecution`/`VisitSevenExecution` no mesmo arquivo) — inconsistência de padrão dentro do próprio arquivo.

## 7. Separação lógica/apresentação

- `src/features/dashboard-loja/sections/PerformanceAlerts.tsx` (`usePerformanceAlerts`) — bom exemplo de regra de negócio (cálculo de alertas por thresholds de meta/disciplina/conversão) extraída para hook puro, reusado tanto no card quanto no owner. Sem achado negativo.
- `src/features/dashboard-loja/sections/CentralMxPlanoSegmentadoPanel.tsx:72-114` — chamadas diretas ao Supabase (`supabase.from('departamentos_mx')...`, `supabase.from('vendedores_loja')...`) dentro do componente de apresentação, em vez de dentro de um hook (`useCentralMxPlanosAcaoSegmentado` já existe mas não cobre esta busca de `scopeChoices`). Mover esse `Promise.all` para um hook dedicado (ex. `useCentralMxScopeChoices(storeId)`) manteria o componente livre de acesso a dados.
- `src/features/dashboard-loja/sections/CentralMxCriarPlanoModal.tsx:89-104` — chamada direta `supabase.rpc('criar_plano_acao', ...)` dentro do modal (componente de apresentação/formulário). Já está com try/catch adequado, mas o ideal seria expor essa ação via hook (`useCentralMxPlanosAcaoSegmentado` ou novo `useCriarPlanoAcao`) para manter o modal 100% apresentacional e testável sem mockar Supabase diretamente no componente.

## 8. Erros

- `src/features/dashboard-loja/sections/CentralMxCriarPlanoModal.tsx:87-114` — bom padrão: `try/catch/finally` com `toast.error` no catch. Referência positiva.
- `src/features/consultoria/components/VisitExecutionViews.tsx:103-128` (`VisitFourExecution.save`) — usa `try/finally` mas sem `catch`; se `createFeedback` rejeitar, o erro sobe sem tratamento e sem feedback ao usuário (nenhum toast de erro), apenas o loading é desligado no `finally`. Mesma estrutura se repete em `VisitFiveExecution.handleSave` (linha 200-230). Adicionar `catch` com `toast.error` como já é feito em `CentralMxCriarPlanoModal`.
- `src/features/dashboard-loja/sections/CentralMxPlanoSegmentadoPanel.tsx:72-110` — o `Promise.all` de 3 queries Supabase não trata rejeição (sem `.catch`/try-catch); se qualquer uma falhar, a Promise inteira rejeita e não há tratamento — a lista de `scopeChoices` simplesmente não é populada, sem aviso ao usuário sobre a falha.
- `src/features/consultoria/components/VisitExecutionViews.tsx:111` — `attention_points: '...'` enviado como valor literal fixo (reticências) no payload de `createFeedback`, em vez de um campo de formulário real ou `null`. Parece um placeholder esquecido de uma implementação incompleta; usuário nunca preenche pontos de atenção e o backend recebe sempre a string `"..."`.

## 9. Performance

- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx:486-496` — `buildCentralMx`, `departments`, `ownerAlerts`, `actions` corretamente memoizados com `useMemo`; bom uso de memoização para uma engine de cálculo potencialmente pesada.
- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx:793-832` (`Sparkline`) — recalcula pontos com `Math.sin`/`Math.cos` a cada render (sem `useMemo`), mas o cálculo é O(12) e puramente decorativo (dados fake/seed), então o custo é desprezível; não vale a complexidade de memoizar.
- Nenhuma lista grande sem paginação/virtualização identificada nos arquivos lidos (tabelas de plano de ação/alertas operam sobre volumes pequenos, tipicamente dezenas de linhas).
- Nenhuma imagem não otimizada além dos 3 `<img>` já usando `object-fit`/dimensões fixas — sem achado adicional.

## 10. Organização

- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx` importa diretamente de `@/features/central-mx/sections/...`, `@/features/departamentos/...`, `@/features/marketing/...`, `@/features/universidade/...`, `@/features/cultura-felicidade/...` (linhas 63-69) — o dashboard-loja depende de 5 outras features de alto nível. Não é dependência circular (verificação não encontrou import de volta dessas features para dashboard-loja), mas é um acoplamento amplo que contraria a ideia de "features" isoladas; considerar se esse roteamento deveria viver em uma camada de composição/rota em vez de dentro do componente de seção.
- Estrutura de pastas é consistente entre as 3 features (`components/` ou `sections/` + `hooks/` + `types.ts`), sem inconsistência de convenção relevante.
- `src/features/configuracoes/components/CreateStoreModal.tsx` e `src/features/dashboard-loja/sections/CreateStoreModal.tsx` — dois componentes com o mesmo nome (`CreateStoreModal`) em features diferentes; não é erro de compilação (namespaces diferentes), mas gera confusão em buscas/imports e pode indicar lógica duplicada de criação de loja em dois lugares — vale confirmar se as duas implementações realmente precisam existir separadamente.

## 11. Acessibilidade

- Os 3 `<img>` do escopo (`VisitReportTemplate.tsx:52,139`, `PerfilTab.tsx:71`) têm `alt` adequado e descritivo.
- `src/features/consultoria/components/VisitExecutionViews.tsx:463-489` (`VisitChecklist`) — item de checklist usa `div` com `role="checkbox"`, `tabIndex={0}`, `aria-checked`, `onClick` e `onKeyDown` tratando Enter/Espaço corretamente — bom exemplo de componente interativo custom acessível via teclado.
- Não foram encontrados `div`/`span` com `onClick` sem role/keyboard handler no escopo (grep dedicado não retornou casos) — os botões interativos usam elemento `<button>` nativo na grande maioria dos arquivos lidos.
- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx:1571` — calendário mockado usa `<span>` para dias do mês sem nenhuma interação (somente decorativo), o que é aceitável pois não há `onClick`; mas vale checar se a intenção futura é torná-lo clicável, caso em que precisará de `button`/`role` e navegação por teclado.

## 12. Testes

- Nenhum arquivo `*.test.tsx`, `*.test.ts`, `*.spec.tsx` ou `*.spec.ts` encontrado dentro de `src/features/dashboard-loja`, `src/features/consultoria` ou `src/features/configuracoes`.
- `src/test/` contém apenas testes e2e Playwright genéricos relacionados a consultoria (`consultoria.playwright.ts`, `mx-consultoria-role-smoke.playwright.ts`) — nenhum teste unitário cobre hooks críticos como `useDashboardLojaData`, `usePerformanceAlerts`, `useCentralMxPlanosAcaoSegmentado` ou componentes de cálculo puro como `buildPanoramaData`/`formatPlanningValue` em `OwnerExecutiveCockpit.tsx`.
- Funções puras e isoladas de fácil teste unitário sem qualquer cobertura: `usePerformanceAlerts` (regras de negócio de alertas), `buildCentralMx`/`departmentFromEngine`/`actionFromEngine` (`OwnerExecutiveCockpit.tsx`), `computeDRE`/`makeEmptyForm` (`DREView.tsx`). Recomenda-se priorizar testes unitários para essas funções de cálculo antes de qualquer teste de componente, dado o baixo custo de setup (são funções puras).
