# Parte 3 — Gerente Feedback + Vendedor Home + Lojas + Ranking

## Resumo

Escopo: 65 arquivos / ~10.500 linhas em `gerente-feedback`, `vendedor-home`, `lojas`, `ranking`. Estado geral é razoável — sem `any`, sem violação de regras de hooks, sem `<div onClick>` sem acessibilidade, sem `img` sem `alt`. Os principais problemas são estruturais: dois arquivos gigantes (`VendedorHome.container.tsx` com 1102 linhas e `StoreTeamPanel.tsx` com 1058 linhas) concentrando múltiplas responsabilidades, forte duplicação entre os pares Admin/Store de `gerente-feedback` (hooks e modais quase idênticos), dead code confirmado em `VendedorHome.container.tsx`, e ausência total de testes nos 6 hooks orquestradores de página. Contagem aproximada: DRY 5, Dead code 3, TypeScript 2, Componentes 4, Estado 2, Hooks 2, Separação lógica/UI 2, Erros 3, Performance 2, Organização 2, Acessibilidade 0, Testes 3.

## 1. DRY

- `src/features/gerente-feedback/hooks/useAdminFeedback.ts:197-221` e `src/features/gerente-feedback/hooks/useStoreFeedback.ts:144-191` — `handleShareWhatsApp`, `filteredFeedbacks`, `handleRefresh` e o `useEffect` de `week_reference` são praticamente idênticos byte-a-byte entre os dois hooks. Sugestão: extrair `useFeedbackShare(devolutivas)`, `useFeedbackRefresh(activeTab, refetchFeedbacks, refetchReports)` e util `filterFeedbacksBySearch` compartilhados em `lib/helpers.ts`.
- `src/features/gerente-feedback/modals/AdminFeedbackModal.tsx` (384 linhas) e `src/features/gerente-feedback/modals/StoreFeedbackModal.tsx` (339 linhas) — estrutura quase idêntica: `dialogRef`, cálculo de `selectedSellerName`, `handleFeedbackActionSelect`, `useEffect` de Escape com `document.addEventListener('keydown', ...)`. Sugestão: extrair um `BaseFeedbackModal` compartilhado parametrizado pela fonte de sellers (admin vê todos + filtro de loja; store vê só os da loja).
- Padrão "Escape fecha modal/diálogo" reimplementado em pelo menos 6 lugares: `StoreFeedbackModal.tsx:62`, `AdminFeedbackModal.tsx:83`, `StoreTeamPanel.tsx:79` e `:159`, `useLojasPage.ts:35`, `SellerProfileModal.tsx:21`. Sugestão: criar hook compartilhado `useEscapeKey(active: boolean, onEscape: () => void)` em `src/hooks/`.
- `StoreTeamPanel.tsx:96-105` (`handleCopyRegistrationLink`) e `useLojasPage.ts:138-158` (`copyRegistrationLink`) — mesma lógica de `navigator.clipboard.writeText` com fallback de erro e toast. Sugestão: extrair `useClipboardCopy()` util compartilhada.
- `useAdminFeedback.ts` e `useStoreFeedback.ts` — o objeto inicial de `formData` (11 campos) é copiado quase integralmente entre os dois hooks (diferindo só em `caso_motivo` e ausência de `selectedStoreId`). Sugestão: extrair `createInitialFeedbackFormData(previousWeek)` em `lib/helpers.ts`.

## 2. Dead code

- `src/features/vendedor-home/VendedorHome.container.tsx:1054-1068` — função `MiniSparkline` definida mas nunca referenciada em nenhum arquivo do projeto. Remover.
- `src/features/vendedor-home/VendedorHome.container.tsx:936-951` — função `HeaderIcon` definida mas nunca referenciada em nenhum arquivo do projeto. Remover.
- `src/features/vendedor-home/VendedorHome.container.tsx:266-287` (`EstimatedSalaryCard`) — exportado e coberto por teste (`VendedorHome.container.test.tsx`), mas não é renderizado em nenhum lugar dentro do próprio `VendedorHome()` nem em outra tela do app. É código órfão na árvore de produção, mantido vivo só pelo teste. Sugestão: confirmar se foi substituído pelo `CommissionCard` (que cumpre papel parecido) e remover, ou reintegrá-lo à UI se ainda for necessário.

## 3. TypeScript

- Nenhum uso de `any` encontrado no escopo (bom).
- `src/features/lojas/components/StoreTeamPanel.tsx:319` — cast manual `as { success?: boolean; error?: string; temporary_password?: unknown } | null` inline no meio do handler. Sugestão: mover para um `type ApprovalResponse` nomeado perto do topo do arquivo ou em `types/`, reutilizável e testável.
- Mistura de `type` (maioria) e `interface` (`StoreGoalsPanelProps` em `StoreGoalsPanel.tsx:18`, ao lado de `type StoreBenchmarks` no mesmo arquivo) — inconsistência leve de convenção dentro do mesmo arquivo. Sugestão: padronizar em `type` para manter consistência com o resto do escopo.

## 4. Componentes

- `src/features/vendedor-home/VendedorHome.container.tsx` — 1102 linhas, define o container principal **e** 20 subcomponentes de apresentação (`GoalCard`, `CommissionCard`, `AppointmentsCard`, `ActivitiesCard`, `ScoreCard`, `ExecutionCenter`, `CloseDayCard`, `RankingPanel`, `EvolutionPanel`, `AchievementsPanel`, `TrainingsPanel`, `FeedbackPanel`, mais primitivos de UI). Sugestão: mover cada card para `sections/` (o projeto já tem esse padrão em outras features) e manter só a orquestração no container.
- `src/features/lojas/components/StoreTeamPanel.tsx` — 1058 linhas, mistura: listagem/filtro de equipe, painel de pré-cadastros com aprovação via fetch direto à edge function, modal de edição de integrante e modal de confirmação genérica, tudo no mesmo componente. Sugestão: quebrar em `TeamListSection`, `PreRegistrationQueue`, `EditMemberModal` e `ConfirmationDialog` (este último reaproveitável — o padrão de `pendingConfirmation` já parece candidato a hook/componente genérico usado também em `useLojasPage.ts` via `requestToastConfirmation`, mas aqui é reimplementado com modal próprio ao invés de toast).
- `src/features/gerente-feedback/modals/AdminFeedbackModal.tsx` (384 linhas) — um único componente cobre seleção de vendedor, cálculo de métricas, formulário completo e catálogo de ações de feedback. Candidato a quebrar em `SellerPicker` + `FeedbackMetricsForm` + `FeedbackActionPicker`.
- JSX aninhado profundo em `StoreTeamPanel.tsx:576-671` (cards de pré-cadastro dentro de `CardContent` dentro de `Card` dentro de `aside`, com 5+ níveis de `div` condicionais) — dificulta leitura. Sugestão: extrair `PreRegistrationCard` como componente próprio recebendo `item` e callbacks.

## 5. Estado

- `src/features/lojas/components/StoreTeamPanel.tsx:71-73` — `pendingConfirmations` (Set) e `pendingConfirmation` (objeto único) coexistem para o mesmo conceito de "confirmação pendente", criando duas fontes de verdade que precisam ser sincronizadas manualmente em `requestConfirmation`, `clearPendingConfirmation` e nos dois `useEffect` de Escape. Sugestão: consolidar em um único `useReducer` com estado `{ open: PendingConfirmation | null }` e derivar o "já existe confirmação para esta key" a partir dele, eliminando o Set redundante.
- `formData` inicial duplicado entre `useAdminFeedback.ts:41-56` e `useStoreFeedback.ts:43-59` (ver item DRY) é também um caso de estado espelhado entre dois hooks irmãos que deveriam compartilhar uma única definição de shape.

## 6. Hooks

- Nenhuma violação das regras de hooks (chamadas condicionais/loop) encontrada.
- `src/features/lojas/components/StoreTeamPanel.tsx:79-88` e `:159-166` — dois `useEffect` distintos escutando `keydown` para fechar diálogos diferentes (`pendingConfirmation`/`editingMember` no primeiro, só `pendingConfirmation` no segundo). O segundo é redundante com parte do primeiro (ambos reagem a `pendingConfirmation` Escape) — o handler de `:159` sempre dispara junto com o de `:79` quando `pendingConfirmation` está setado, resultando em dois listeners de teclado ativos simultâneos para o mesmo caso. Sugestão: unificar em um único `useEffect`/hook (ver `useEscapeKey` sugerido no item DRY).
- `src/features/gerente-feedback/hooks/useAdminFeedback.ts:109-110` — `await import('@/lib/supabase')` e `await import('@/lib/feature-flags')` dentro do `useCallback` a cada chamada de `loadSellerMetrics`, em vez de import estático no topo do arquivo. Não há necessidade aparente de code-splitting aqui (o resto do arquivo já importa `useFeedbacks`/`useTeam` estaticamente); isso adiciona overhead de resolução de módulo repetido sem benefício claro. Sugestão: mover para import estático, a menos que exista razão documentada de lazy-load.

## 7. Separação lógica/apresentação

- `src/features/lojas/components/StoreTeamPanel.tsx:295-344` (`executeReviewPreRegistration`) — chamada HTTP direta (`fetch(approvalFunctionUrl, ...)`) com montagem de headers/Authorization e parsing de resposta dentro de um componente de apresentação. Sugestão: mover para um hook dedicado (`useStorePreRegistrationApproval` ou função em `lib/`) que o componente apenas consome, seguindo o padrão já usado por `useTeam`/`useStores` no mesmo arquivo.
- `src/features/gerente-feedback/hooks/useAdminFeedback.ts:90-153` (`loadSellerMetrics`) — monta datas, decide entre RPC ou query direta via feature flag, e formata patch de métricas, tudo dentro do hook de página em vez de um módulo de domínio isolado e testável. Está num hook (não num componente visual), o que é aceitável, mas a ausência de qualquer teste (ver item 12) torna essa lógica de negócio de fato não verificada.

## 8. Erros

- `src/features/gerente-feedback/hooks/useAdminFeedback.ts:170-195` (`handleSubmit`) — `await createFeedback(...)` sem `try/catch`; se a função rejeitar a Promise (em vez de retornar `{error}`), a exceção sobe não tratada e `saving` fica preso em `true` (não há `finally`). Sugestão: envolver em `try/finally` como já é feito em `StoreTeamPanel.handleUpdateMember`.
- `src/features/gerente-feedback/hooks/useStoreFeedback.ts:127-142` (`handleSubmit`) — mesmo problema: `await createFeedback(formData)` fora de try/catch, sem `finally` garantindo `setSaving(false)` em caso de exceção.
- `src/features/lojas/components/StoreTeamPanel.tsx:209-244` (`handleUpdateMember`) — usa `try/finally` (sem `catch`), então uma exceção lançada por `updateTeamMember` propaga sem feedback ao usuário além do `finally` resetar `saving`; não há toast de erro genérico para exceções inesperadas (só para `error` retornado explicitamente). Sugestão: adicionar `catch` com toast genérico antes do `finally`.

## 9. Performance

- `src/features/lojas/components/StoreTeamPanel.tsx:196-207` (`stats`) — `useMemo` recalcula 3 `.filter()` sobre `team` a cada render de `team`; correto em uso de memo, sem achado aqui, mas o componente todo (1058 linhas) não usa `React.memo` nos itens de lista (`filteredTeam.map(...)` renderiza `motion.div` complexos inline). Com listas de equipe grandes, cada re-render do painel re-renderiza todas as linhas. Sugestão: extrair `TeamMemberRow` como componente memoizado.
- `src/features/vendedor-home/VendedorHome.container.tsx` — vários subcomponentes (`GoalCard`, `ScoreCard`, etc.) são recriados como novas funções a cada render do módulo (na verdade são declarações top-level, então não são recriadas, mas recebem novos objetos/arrays inline como `attackItems` em `VendedorHome()` a cada render sem `useMemo`, ex.: linha 143-153). Como o array é pequeno e a tela não re-renderiza em alta frequência, o impacto é baixo — reportado como observação, não bloqueante.

## 10. Organização

- `src/features/vendedor-home/VendedorHome.container.tsx` (1102 linhas) e `src/features/lojas/components/StoreTeamPanel.tsx` (1058 linhas) fogem muito do padrão do restante do repositório, que já segue a convenção `containers/` + `sections/` + `hooks/` nas outras features do mesmo escopo (`gerente-feedback`, `ranking`). Sugestão: aplicar a mesma decomposição usada em `gerente-feedback` (container fino + `sections/*`) a essas duas features.
- Indentação inconsistente dentro de `VendedorHome.container.tsx` — blocos inteiros usam 1 espaço em vez de 2 (ex. linhas 289-363 `GoalCard`, 437-483 `ActivitiesCard`, 485-592 `ScoreCard`, 953-959 `DashboardCard`), enquanto o resto do arquivo usa 2 espaços. Indica edições manuais sem formatter consistente. Sugestão: rodar `prettier`/lint fix no arquivo.

## 11. Acessibilidade

Nenhum achado relevante. Todos os `<img>` do escopo têm `alt`; não há `<div onClick>` interativo sem `role`/`tabIndex`/`aria-label` (ex.: `RankingPodium.tsx:32-44` já implementa `role="button"`, `tabIndex`, `onKeyDown` corretamente); modais usam `role="dialog"`/`aria-modal`/`aria-labelledby` de forma consistente.

## 12. Testes

- Nenhum dos 6 hooks orquestradores de página tem teste: `useAdminFeedback.ts`, `useStoreFeedback.ts`, `useVendedorHomePage.ts`, `useLojasPage.ts`, `useGlobalRankingPageData.ts`, `useStoreRankingPageData.ts`. São os pontos que concentram regra de negócio (cálculo de métricas semanais, criação/edição de loja, aprovação de pré-cadastro) e ficam sem verificação automatizada.
- `src/features/lojas/components/StoreTeamPanel.tsx` (1058 linhas, contém fluxo crítico de aprovação de login via edge function) não tem arquivo `.test.tsx` correspondente.
- `src/features/gerente-feedback/modals/AdminFeedbackModal.tsx` e `StoreFeedbackModal.tsx` não têm teste próprio (existe teste apenas para `FeedbackActionCatalogModal` e `FeedbackList`), apesar de concentrarem o fluxo de submissão de feedback.
