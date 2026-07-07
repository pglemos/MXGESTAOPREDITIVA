# Parte 8 — Pages + Components + Design

## Resumo

Escopo: 113 arquivos `.ts/.tsx` (~15.500 linhas) em `src/pages/`, `src/components/**` (exceto `.jsx`, fora do escopo pedido), `src/design/` e `src/design-system/`. `tsc --noEmit` e `eslint` não acusam nenhum erro/warning nos arquivos `.ts/.tsx` do escopo — os problemas encontrados são estruturais (arquitetura, duplicação, tamanho de arquivo, código morto), não mecânicos. Não há uso de `any` em nenhum arquivo do escopo.

O achado mais crítico é uma **segunda linha de design system inteira e morta**: `src/design/components/index.tsx` (824 linhas) + `src/design-system/index.ts` (14 linhas, barrel) + `src/design/tokens/index.ts` (62 linhas) — nenhum desses três arquivos é importado por absolutamente nada no restante de `src/` fora deles mesmos. Some-se a isso um bug real de sidebar (`SellerSidebar.tsx`) onde a navegação computada em `Layout.tsx` para o perfil vendedor é silenciosamente descartada e substituída por uma lista hardcoded, e páginas gigantes (`ConsultoriaVisitaExecucao.tsx` com 939 linhas) que misturam toda a lógica de persistência/upload/PDF com a UI.

## 1. DRY

- `src/design/components/index.tsx` (824 linhas) duplica conceitualmente quase tudo que já existe em `atoms/molecules/organisms`: `PageHeader` (3ª versão, ao lado de `molecules/PageHeader.tsx` e `molecules/PageHeading.tsx`), `EmptyState` (duplica `atoms/EmptyState.tsx`), `KpiCard` (duplica `molecules/StatCard.tsx`/`molecules/MXScoreCard.tsx`), `SkeletonPage/SkeletonKpiGrid/SkeletonTable/SkeletonClientList/SkeletonForm/SkeletonChart` (duplicam `atoms/skeletons/*`), `StatusPill` (duplica `molecules/StatusBadge.tsx`), `Sidebar`/`AppShell` (duplicam `components/Layout.tsx` + `SellerSidebar.tsx`). Esse arquivo é código morto (ver seção 2) mas evidencia que a duplicação já aconteceu — dois vocabulários de design system coexistiram no repo.
- `src/components/molecules/PageHeader.tsx` (36 linhas) vs `src/components/molecules/PageHeading.tsx` (40 linhas): dois cabeçalhos de página com propósito idêntico (title/description/breadcrumb/actions). Segundo a própria memória do projeto, `PageHeading` é o padrão canônico (espelha `/classificacao`), mas `src/pages/PainelConsultor.tsx` ainda usa o `PageHeader` antigo. Sugestão: migrar `PainelConsultor.tsx` para `PageHeading` e depreciar `PageHeader`.
- `src/components/molecules/StatCard.tsx` e `src/components/molecules/MXScoreCard.tsx` são dois "cartões de KPI" com API e visual muito próximos (ícone tintado + label + valor + detalhe). Nenhum dos dois é consumido de dentro do escopo auditado (só por `src/features/*`, fora do escopo) — vale avaliar consolidar em um único componente parametrizável antes que a duplicação se espalhe mais.
- `src/pages/MorningReport.tsx`: `AdminMorningReport` (linhas 101–481) e `StoreMorningReport` (linhas 483–761) repetem quase a mesma estrutura de 3–4 cards de KPI com gradiente/blur decorativo (ex.: linhas 320–372 vs 623–663) e a mesma tabela com cabeçalho sticky + linha expansível. Candidato claro a extrair um `<MorningKpiCard>` e um `<MorningGradeTable>` compartilhados.
- `src/pages/FunilVendedor.tsx`: toda a lógica de cálculo de esforço por canal (`calcEsforcoShowroom`, `calcEsforcoInternet`, `calcEsforcoCarteira`, `getLimitadorLabel`, `escolherCanalPrincipal`, `buildEtapaLinhas`, `pctSeguro`, linhas 627–756) está embutida na página, mas o arquivo já importa funções irmãs de `@/features/crm/lib/funil-vendas-diagnostico`. Essas ~130 linhas de cálculo puro deveriam morar no mesmo módulo de lib, não na página.
- `src/pages/FunilVendedor.tsx` usa uma paleta de cores Tailwind crua (`bg-green-50`, `text-blue-700`, `bg-orange-50`, `text-slate-400` etc., dezenas de ocorrências) em vez dos tokens do design system (`brand-primary`, `status-success`, `text-tertiary`...) usados em todo o resto do app — um terceiro "sistema de cor" ad hoc, paralelo ao canônico e ao morto.

## 2. Dead code

- **`src/design-system/index.ts`** (14 linhas): barrel que reexporta `@/design/tokens`, `@/design/motion`, `@/design/components`, `AlertCard` e `ScoreBandBadge`. Nenhum arquivo em `src/` importa de `@/design-system`. 100% morto.
- **`src/design/components/index.tsx`** (824 linhas): único consumidor é o barrel morto acima. Nenhum símbolo (`Sidebar`, `AppShell`, `PageShell`, `PageHeader`, `SurfaceCard`, `KpiCard`, `SegmentedControl`, `StatusPill`, `PriorityBadge`, `EmptyState`, `SkeletonPage`, `DataTable`, `ClientActionRow`, `RoutineStepCard`, `Timeline`, `FunnelChannelCard`, `FormSectionCard`, `MotionStagger` etc.) é importado de fora deste arquivo/barrel. 100% morto.
- **`src/design/tokens/index.ts`** (62 linhas): `mxColors`, `mxTypography`, `mxLayout`, `mxRadius`, `mxShadow` — usado apenas pelo `design/components/index.tsx` (também morto) e reexportado pelo barrel morto. 100% morto.
  - Total: **900 linhas mortas** (~5,8% do escopo) concentradas em 3 arquivos.
- **`src/components/SellerSidebar.tsx:68-114`** — constante `sellerSections` (módulo-level) é o valor default do prop `navSections`, mas o único consumidor (`Layout.tsx:300`) sempre passa `navSections={sidebarSections}` explicitamente, então o default nunca é usado. Adicionalmente, para o perfil vendedor, `renderSidebarContent` (linha 387) ignora o próprio prop `navSections` recebido e usa a lista hardcoded `base44SellerSections` (linhas 371–386, recriada em toda renderização). Resultado: a navegação `vendedor: [...]` computada em `Layout.tsx:185-220` (via `useMemo` em `sidebarSections`, linhas 261–287) é calculada e imediatamente descartada para todo usuário vendedor — duas fontes de verdade para o menu do vendedor, uma delas morta e enganosa para manutenção futura.
- **`src/components/atoms/skeletons/SkeletonCard.tsx`**: usado apenas no próprio Storybook (`_stories/SkeletonComposites.stories.tsx`), nunca em código de produção.
- **`src/design-system/tokens/colors.ts:84`** — `classifyScore`: `if (value >= 90) return value <= 100 ? 'elite' : 'elite'` — os dois ramos do ternário retornam o mesmo valor; condição morta, pode virar apenas `return 'elite'`.
- **"Sucesso" falso em handlers de e-mail**: `src/pages/MorningReport.tsx:266-274` e `519-530` (`handleSendEmail`, duplicado nos dois componentes do arquivo) e `src/pages/OperationalSettings.tsx:70-75` (`fetchSettings`) não fazem nenhuma chamada real — são só `await new Promise(r => setTimeout(r, ...))` seguido de `toast.success(...)`. O usuário recebe confirmação de que um relatório foi "enviado para a Direção MX" ou que as configurações foram "sincronizadas" quando nada aconteceu de fato. Não é dead code no sentido clássico, mas é um stub que finge sucesso — deveria estar atrás de feature flag/TODO explícito ou ser implementado.

## 3. TypeScript

- Nenhum uso de `any` em todo o escopo (`.ts`/`.tsx`).
- `interface` é usado consistentemente para props de componente (`extends React.HTMLAttributes<...>`) e `type` para uniões/aliases — convenção coerente, sem inconsistência real digna de nota.
- `src/pages/FunilVendedor.tsx:44-46` faz um cast forçado do client Supabase: `const readOnlyDb = supabase as unknown as { from: (table: string) => ReadOnlyTable }` para contornar a tipagem gerada, com um tipo `ReadResult { data: unknown; error: {...} | null }`. Isso mascara o tipo real das tabelas lidas (`eventos_comerciais`, `clientes_oportunidades`, `regras_metas_loja`) e joga a responsabilidade de validar o shape para o código que consome `FunnelRow` — puro `unknown` sem parsing/validação depois. Vale tipar via `Database` gerado do Supabase em vez do cast duplo.
- `src/components/atoms/Typography.tsx:55` — `(variant as TypographyElementType)` reaproveita o valor de `variant` (que é uma união de nomes de estilo, ex. `'caption' | 'mono'`) como se fosse `TypographyElementType` (nomes de tag HTML). Funciona hoje porque os dois conjuntos têm overlap parcial (`h1`-`h4`, `p`), mas é um cast sem type guard que quebra silenciosamente se alguém adicionar uma variante nova sem tag HTML homônima.

## 4. Componentes

- `src/pages/ConsultoriaVisitaExecucao.tsx` — **939 linhas**, maior arquivo do escopo. Um único componente de página concentra: formulário de período de análise, execução metodológica por número de visita, upload/download/exclusão de evidências, geração de resumo via IA (chamada a Edge Function), geração/depoimento de relatório em texto, exportação para PDF, envio por WhatsApp, assinatura/"acknowledge" do gestor e persistência com fallback de schema (`stripUnsupportedVisitColumns`). Candidato forte a quebra em: `useVisitDraft` (estado + persistência), `useVisitAttachments` (upload/download/delete), `useVisitAiSummary`, e componentes de apresentação `VisitAttachmentsPanel`, `VisitReportModal`.
- `src/pages/ProdutosDigitais.tsx` — 803 linhas: mistura CRUD completo (fetch/create/update/archive), validação Zod, filtros/métricas derivadas e o modal de formulário inteiro no mesmo arquivo. Separar em `useDigitalProducts` (hook de dados) + `DigitalProductForm` (modal).
- `src/pages/MorningReport.tsx` — 761 linhas com dois componentes de página completos (`AdminMorningReport`, `StoreMorningReport`) no mesmo arquivo, cada um fazendo fetch, agregação de dados e toda a UI. Deveriam ser dois arquivos, com os componentes de tabela/cards compartilhados extraídos (ver seção 1).
- `src/pages/FunilVendedor.tsx` — 756 linhas, ~10 componentes de apresentação (`StatusMetaCard`, `EsforcoNecessarioCard`, `EficienciaCanalCard`, `CanalCard`, `EtapaLinha`, `BaseEstatisticaCard`, `EvolucaoCollapsible`, etc.) e todas as funções de cálculo puro definidos inline no mesmo arquivo da página.
- `src/pages/StorePreRegistration.tsx` (708), `src/components/SellerSidebar.tsx` (563), `src/pages/PainelConsultor.tsx` (542), `src/pages/Login.tsx` (528), `src/pages/GerenteTreinamentos.tsx` (503) — todos acima de 500 linhas; mesmo padrão de página fazendo fetch + regras de negócio + UI extensa no mesmo arquivo.
- `src/design/components/index.tsx` (824 linhas) e `src/components/atoms/_stories/*`/`SkeletonComposites.stories.tsx` não contam para esse ponto por serem código morto/histórias, mas reforçam o padrão de arquivo-monólito no projeto.

## 5. Estado

- Nenhum uso de `React.createContext`/`useContext` em todo o escopo — não há prop drilling relevante nem uso indevido de Context (o app usa hooks de dados + props diretos).
- `src/pages/Login.tsx` — 11 `useState` interdependentes (`email`, `password`, `newPassword`, `confirmPassword`, `showPassword`, `error`, `success`, `loading`, `fieldErrors`, `loginAttempts`, `lockoutUntil`) controlando três fluxos (login/forgot/recovery) com transições de estado específicas (lockout progressivo, reset de tentativas). Bom candidato a `useReducer` com um reducer por modo, reduzindo o risco de estados inconsistentes (ex. `loading=true` sem `error` limpo).
- `src/pages/ConsultoriaVisitaExecucao.tsx` — 10 `useState` que representam, na prática, um único "rascunho de visita" (`checklist`, `executiveSummary`, `feedbackClient`, `nextCycleGoal`, `attachments`, `headerBase`, `quantData`, `analysisPeriodPreset/Start/End`) — todos são lidos juntos em `buildVisitPayload()`. Um `useReducer` (ou um único `useState<VisitDraft>`) simplificaria a sincronização feita hoje em múltiplos `useEffect`.

## 6. Hooks

- `eslint` (regra `react-hooks/exhaustive-deps` incluída na config do projeto) não acusa nenhuma violação nos arquivos do escopo — deps de `useEffect`/`useMemo`/`useCallback` estão corretas onde auditadas manualmente (`ConsultoriaVisitaExecucao.tsx`, `ProdutosDigitais.tsx`, `MorningReport.tsx`, `FunilVendedor.tsx`).
- Nenhuma violação das Regras dos Hooks encontrada (hooks sempre no topo, sem chamadas condicionais).
- Ver seção 5 para os dois candidatos concretos a `useReducer` (`Login.tsx`, `ConsultoriaVisitaExecucao.tsx`).

## 7. Separação lógica/apresentação

- `src/pages/ConsultoriaVisitaExecucao.tsx` chama `supabase` diretamente 8+ vezes (storage, tabelas, RPC, Edge Functions) dentro do componente de página, incluindo lógica de fallback de schema (`stripUnsupportedVisitColumns`, `PGRST204`). Deveria estar em um hook/serviço de domínio (`useVisitPersistence`), deixando a página só orquestrar UI.
- `src/pages/FunilVendedor.tsx` chama `supabase.from(...)`/`supabase.rpc(...)` direto na página (linhas 86-94, 163-166) e concentra toda a lógica de negócio de "esforço necessário por canal" (ver seção 1) — mistura regra de negócio financeira/comercial com componente de apresentação.
- `src/pages/ProdutosDigitais.tsx`, `src/pages/GerenteTreinamentos.tsx`, `src/pages/PainelConsultor.tsx`, `src/pages/ConsultorNotificacoes.tsx`, `src/pages/ConsultorTreinamentos.tsx`, `src/pages/ConsultoriaClientes.tsx`, `src/pages/SellerPerformance.tsx` fazem chamadas Supabase diretamente na página em vez de via hook de dados dedicado — padrão recorrente em ~8 páginas do escopo.
- Em contraste, `src/components/organisms/*` e `src/components/molecules/*` estão limpos disso — nenhum organism/molecule do escopo chama `supabase` diretamente; a violação é sempre no nível de página, o que é o esperado, mas o volume de lógica de negócio embutida nessas páginas (cálculos, regras de fallback, geração de payload) é o que extrapola o razoável.

## 8. Erros

- **Bug real de promise não aguardada**: `src/pages/ConsultoriaVisitaExecucao.tsx:468-474` —
  ```ts
  try {
    supabase.functions.invoke('send-visit-report', { body: { visitId: visit.id } })
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Silent fail on email trigger:', e)
  }
  ```
  `supabase.functions.invoke(...)` retorna uma Promise e não é `await`ada nem tem `.catch()`. O `try/catch` ao redor só captura exceções síncronas; qualquer rejeição da chamada assíncrona vira uma unhandled promise rejection, não é capturada, e o usuário nunca é avisado se o disparo do e-mail de relatório falhar.
- `src/pages/AiDiagnostics.tsx:38-60` — `fetchAll` (dentro de `useEffect`) faz duas chamadas Supabase (`rpc` ou `select`) sem `try/catch` e sem checar `error` do retorno `{ data, error }` — se a chamada falhar, `data` fica `undefined`/`null`, o catch silencioso vira uma lista vazia sem qualquer feedback ao usuário nem log, mesmo em DEV.
- `src/pages/ConsultoriaVisitaExecucao.tsx:586-588` (`handleDownloadPDF`) usa `console.error(err)` sem o guard `import.meta.env.DEV` usado consistentemente no resto do arquivo (linhas 132, 357, 447, 473) — inconsistência de padrão de logging, log vaza para produção.
- Ver também seção 2 ("sucesso falso"): `MorningReport.tsx` (`handleSendEmail` x2) e `OperationalSettings.tsx` (`fetchSettings`) não têm tratamento de erro real porque não fazem operação real — o "caminho de erro" simplesmente não existe, o que impede o usuário de saber que a feature é um placeholder.
- Fora esses pontos, o padrão dominante no restante do escopo (`ProdutosDigitais.tsx`, `GerenteTreinamentos.tsx`, `ConsultorTreinamentos.tsx`, `ConsultoriaClientes.tsx` etc.) é sólido: checagem explícita de `{ error }` do Supabase com `toast.error(...)` em quase todo call site.

## 9. Performance

- `src/components/organisms/DataGrid.tsx` já é memoizado (`export const DataGrid = memo(DataGridInner)`) — único uso de `React.memo` no escopo, mas é o componente certo para isso (renderiza listas/tabelas grandes).
- `src/components/SellerSidebar.tsx:371-386` — `base44SellerSections` (array de 9 itens com ícones JSX) é recriado do zero a cada chamada de `renderSidebarContent`, que por sua vez é chamada duas vezes por render (desktop `aside` + drawer mobile) sempre que `collapsed`/`mobileOpen`/`userMenuOpen` mudam. Não é uma lista grande, mas é fácil de hoistar para module scope (como já é feito com `sellerSections`) e eliminar a realocação.
- Nenhuma lista sem virtualização com volume que justifique preocupação (maiores listas do escopo são tabelas de rede/lojas, tipicamente dezenas de linhas, já cobertas por `DataGrid`).
- Nenhuma imagem não otimizada relevante — os únicos `<img>` do escopo (`Avatar.tsx`, `Perfil.tsx`, `SellerSidebar.tsx` logo) são pequenos/avatares com fallback de erro tratado (`onError` em `Avatar.tsx`).

## 10. Organização

- Estrutura `atoms/molecules/organisms` é respeitada e coerente dentro de `src/components/` — a inconsistência real está fora dela: `src/design/` e `src/design-system/` formam uma segunda árvore de design system, majoritariamente morta (seção 2), com nomenclatura de tokens divergente (`mx-navy`, `mx-teal`, `mx-action` vs. `brand-primary`, `status-success`, `border-default` usados em `atoms/molecules/organisms`).
- `src/pages/FunilVendedor.tsx` reforça essa fragmentação usando uma terceira paleta (Tailwind cru: `slate-*`, `blue-700`, `green-*`, `orange-*`, `amber-*`) — nenhuma das três convive bem com as outras duas.
- Nenhuma dependência circular encontrada nos imports do escopo.
- `src/components/SellerSidebar.tsx` mistura duas fontes de navegação (prop `navSections` vs. `base44SellerSections` hardcoded) no mesmo componente — ver seção 2, é também um problema de organização/clareza do fluxo de dados, não só código morto.

## 11. Acessibilidade

- `src/components/organisms/DataGrid.tsx:100-115` — linha de tabela (`MotionRow as="tr"`) recebe `onClick={() => onRowClick?.(item)}` e a classe `cursor-pointer` quando `onRowClick` existe, mas não tem `role="button"`, `tabIndex={0}` nem `onKeyDown`. Isso é o organism de tabela mais reutilizado do design system — qualquer página que passe `onRowClick` herda uma linha clicável não navegável por teclado e não anunciada como interativa por leitor de tela. Mesma lacuna se repete na view mobile (linhas 137-144, `<Card>` dentro de `MotionRow` com o mesmo `onClick`).
- `src/pages/MorningReport.tsx:405` — `<tr onClick={() => setExpandedStoreId(...)}>` com `cursor-pointer` para expandir a grade de vendedores por loja: mesmo problema (sem `role`, `tabIndex`, `onKeyDown`). Comparar com `src/components/admin/AdminNetworkView.tsx:68-80`, que implementa o mesmo padrão de "linha expansível" corretamente (`role="button"`, `tabIndex={0}`, `onKeyDown` tratando `Enter`/`Espaço`) — vale usar esse componente como referência para corrigir os dois casos acima.
- Fora esses dois pontos, a cobertura de acessibilidade do design system é boa: `Avatar`, `Badge`, `Tooltip`, `AlertCard`, `ScoreBandBadge`, `StatusBadge`, `TabNav`/`TabNavPill`, `Modal` (Radix Dialog) usam `aria-label`/`aria-live`/`role` de forma consistente; nenhum `<img>` sem `alt` foi encontrado (o único caso sinalizado por grep inicial, `Perfil.tsx:118`, é falso positivo — o `alt` está na linha seguinte da mesma tag).

## 12. Testes

- Cobertura de testes de design system é parcial. Sem teste: `src/components/atoms/Skeleton.tsx`, `Textarea.tsx`, todo `atoms/skeletons/*` (`SkeletonCard`, `SkeletonChart`, `SkeletonList`, `SkeletonStats`, `SkeletonTable`); `src/components/molecules/Breadcrumb.tsx`, `Card.tsx`, `GlossaryHint.tsx`, `LastUpdated.tsx`, `PageHeading.tsx`, `StatCard.tsx`, `TabNavPill.tsx`; `src/components/organisms/DataGrid.tsx`, `DREForm.tsx`, `DRETable.tsx`.
- `DataGrid.tsx` sem teste é o gap de maior risco: é o organism mais reutilizado (memoizado, com view mobile/desktop e o bug de acessibilidade da seção 11) e não tem nenhuma cobertura em `src/test/organisms/`.
- Ironia notável: `PageHeader.tsx` (versão não-canônica) tem teste em `src/test/molecules/PageHeader.test.tsx`, mas `PageHeading.tsx` (a versão canônica, referência de design segundo a própria documentação do projeto) não tem teste algum.
- Com testes: `Button`, `Typography`, `Input`, `DatePicker`, `Select`, `Accordion`, `Badge`, `Avatar`, `EmptyState`, `Tooltip` (atoms); `ModalTrigger`, `FormField`, `PageHeader`, `TabNav`, `StatusBadge`, `FilterBar`, `AlertCard`, `MXScoreCard`, `ScoreBandBadge` (molecules); `Modal`, `VisitCard`, `AgendaCalendar` (organisms).
