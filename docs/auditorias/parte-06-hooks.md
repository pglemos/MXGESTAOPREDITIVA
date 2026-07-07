# Parte 6 — src/hooks

## Resumo

`src/hooks/` (~75 arquivos, ~10.830 linhas) tem uma boa fundação arquitetural: padrão "composer + sub-hooks" bem aplicado em `useAuth.tsx`/`auth/*` e `useCheckins.ts`/`checkins/*`, zero uso de `any` em todo o diretório, e barrels (`index.ts`) consistentes em `agenda/`, `auth/`, `checkins/`, `team/`. Os problemas concentram-se em: (1) duplicação pesada do padrão "RPC se flag ligada, senão query direta + agregação por Map" repetido em `useRanking.ts`, `useStores.ts` e `team/useTeamMembers.ts`; (2) `usePDI_MX.ts` é um hook de ~186 linhas fazendo 10+ responsabilidades de mutation; (3) ausência quase total de testes para hooks críticos de dados (ranking, PDI, agenda, team, sub-hooks de auth); (4) vários hooks de mutation não usam `useCallback`, recriando funções a cada render.

## 1. DRY

- `src/hooks/useRanking.ts:60-92` (em `useRanking`), `src/hooks/useRanking.ts:256-274` (em `useGlobalRanking`), `src/hooks/useRanking.ts:404-422` (em `useStorePerformance`) — as três funções repetem o mesmo padrão "se `isLancamentosViaRpcEnabled()` usa `supabase.rpc('get_lancamentos_*')`, senão faz `select` direto em `lancamentos_diarios`". Sugestão: extrair um helper único `fetchLancamentos({ scope: 'store'|'rede'|'referencia', storeId?, startDate, endDate })` em `@/lib/checkins` ou similar, reutilizável pelos 3 hooks.
- `src/hooks/useStores.ts:279-302` (em `useStoresStats`) e `src/hooks/useStores.ts:441-459` (em `useSellersByStore`) repetem o mesmo dual-path RPC/query para checkins do dia, já visto em `useRanking.ts` e `team/useTeamMembers.ts:86-121`. É o mesmo bloco de código reescrito 4+ vezes no diretório — forte candidato a um helper compartilhado `fetchCheckinsForScope(...)`.
- `src/hooks/checkins/useCheckinsList.ts`, `useCheckinsToday.ts`, `useMyCheckins.ts` (função `useMyCheckins`) e `useMyCheckins.ts` (função `useCheckinsByDateRange`) — todos repetem: `isLancamentosViaRpcEnabled()` → RPC ou fallback `select` em `lancamentos_diarios`, seguido de `map(withCheckinTotals)`. Sugestão: extrair `fetchLancamentosDiarios(params)` compartilhado entre os 4 arquivos.
- `src/hooks/usePDI_MX.ts:427-530` — `createSellerPDIAction`, `updateSellerPDIAction`, `updateSellerPDIActionStatus`, `updateSellerPDIGoals`, `linkSellerPDIActionContent`, `sendSellerPDIActionToCentral` repetem literalmente o mesmo esqueleto (`setLoading(true)` → `setError(null)` → `rpc(...)` → `setLoading(false)` → `if (error) { setError; return {id:null,error} }` → `invalidateQueries` → `return {id,error:null}`). Sugestão: um helper genérico `runPdiMutation(rpcName, params, invalidateKeys)` reduziria ~100 linhas repetidas.
- `src/hooks/team/useTeamInvites.ts`, `useTeamMembership.ts` (3 funções) — todas chamam `supabase.functions.invoke('manage-store-team'|'register-user', ...)` e replicam o bloco `if (!error && data?.success) { await refetchMembers(); return {...} } return { error: ... }`. Sugestão: helper `invokeTeamFunction(action, body, refetchMembers)`.

## 2. Dead code

Nenhum achado relevante. Todos os hooks de topo-nível confirmados com uso real fora de `src/hooks/` (diretamente ou via barrel `useData.ts`/`checkins/index.ts`/`agenda/index.ts`/`team/index.ts`). `usePDI.ts` (sem sufixo `_MX`) só é consumido via barrel (`usePDIs`, `useMyPDIs` re-exportados em `useData.ts`), mas está em uso. Não foram encontrados hooks duplicados nomeados de forma idêntica entre `src/features/*/hooks` e `src/hooks/`.

## 3. TypeScript

- Nenhum uso de `any` explícito encontrado em `src/hooks/` (grep por `: any`, `<any>`, `as any` retornou zero ocorrências) — ponto positivo, mantido consistentemente.
- `src/hooks/team/useTeamMembers.ts:86,343,465` (e equivalentes em `useStores.ts`) usam `as unknown as Array<{...}>` para tipar retornos do Supabase — funcional, mas o padrão se repete tanto que poderia virar tipos nomeados reutilizáveis em `team/types.ts`/`agenda/types.ts` em vez de tipos inline por call-site.
- `src/hooks/usePDI_MX.ts:103-160` define 6 tipos `PDI*Row` privados (não exportados) para os shapes de retorno do Supabase — bem feito, mas o arquivo mistura `interface` (linhas 8-101) com `type` (linhas 103-217) sem critério aparente; padronizar (ex.: `interface` para shapes de objeto público, `type` para unions/aliases) melhoraria consistência dentro do próprio arquivo.
- Barrels (`agenda/index.ts`, `checkins/index.ts`, `team/index.ts`) usam `export type { ... }` corretamente, separando tipos de valores — bom padrão a manter.

## 4. Componentes

N/A — não há JSX embutido relevante nesta pasta (apenas tipos de retorno referenciando componentes, ex. `CalendarAgendaItem` em `agenda/useAgendaView.ts`).

## 5. Estado

- `src/hooks/useAuth.tsx` e `src/hooks/auth/*` — estado de sessão/perfil/RBAC corretamente elevado a Context global (`AuthContext`), consumido via `useAuth()`. Modelagem adequada — não é candidato a mudança.
- `src/hooks/agenda/useAgendaFilters.ts:83-97` — estado de filtro (`dateFilter`, `statusFilter`, `consultantFilter`) é sincronizado com a URL via `syncSearchParams`/`getInitialSearchParam`. É local por design (não deveria ser global), mas o padrão de sincronização com `URLSearchParams` poderia ser extraído para um hook genérico `useUrlState(key, fallback)` reutilizável por outras telas com filtros (hoje é reimplementado só aqui).
- Nenhum hook do diretório aparenta estado "global demais" para uso local incorreto.

## 6. Hooks

- `src/hooks/agenda/useAgendaView.ts:124-138` — `goToPrevMonth` e `goToNextMonth` usam `useCallback(() => { setCalendarMonth(prev => ...) }, [])` com array de deps vazio, mas `setCalendarMonth` vem via props (não é garantidamente estável entre renders, pois é uma função declarada no componente pai, não um `setState` do React). Se o pai não memoizar `setCalendarMonth`, os callbacks ficam com uma referência potencialmente stale. Sugestão: incluir `setCalendarMonth` nas deps (é o padrão seguido corretamente em `goToToday`, linha 140-143 do mesmo arquivo, que só usa `setCalendarMonth` diretamente sem `useCallback` vazio).
- `src/hooks/usePDI_MX.ts:371-557` — `usePDI_MX()` é um "hook-container" que agrega 10 operações de mutation completamente diferentes (cargos, template, ações sugeridas, bundle de sessão, 6 variações de ações de PDI, print bundle) em um único hook de ~186 linhas. Viola separação de responsabilidade única; sugerido split em `usePDICatalog` (cargos/template/ações sugeridas), `usePDISessionMutations` (saveSessionBundle) e `usePDIActionMutations` (create/update/status/goals/link/send), seguindo o mesmo padrão de composição já usado em `useAuth`/`useCheckins`/`team`.
- `src/hooks/team/useTeamInvites.ts:21-32` e `src/hooks/team/useTeamMembership.ts:45-127` — `registerUser`, `updateVigencia`, `updateTeamMember`, `deleteTeamMember` são funções assíncronas simples (não `useCallback`), recriadas a cada render do hook. Como esses hooks recebem `refetchMembers` via props e são consumidos por componentes que os passam para `useEffect`/memoização a jusante, a falta de `useCallback` pode causar invalidação de memo downstream desnecessária.
- `src/hooks/auth/useAuthActions.ts:61-190` — `useMemo` recalcula todo o objeto de actions (`signIn`, `signOut`, `updateProfile`, `changePassword`) sempre que `profile` muda (linha 190 inclui `profile` nas deps só para o `updateProfile` interno usar `{ ...profile, ...updates }`). Isso propaga para o `useMemo` de `useAuth.tsx:97-146`, que inclui `actions.signIn`/`actions.signOut`/etc nas próprias deps — cada mudança de perfil recria o objeto de ações e, por transitividade, o `AuthState` inteiro. Não chega a ser bug funcional, mas é uma cadeia de recomputo maior que o necessário; poderia usar uma ref para `profile` dentro de `updateProfile` para remover a dependência.
- Nomenclatura de hooks está consistente — todos os arquivos revisados começam com `use` e seguem PascalCase após o prefixo. Nenhuma violação das regras dos hooks (chamadas condicionais, hooks dentro de loops, etc.) foi encontrada nos arquivos lidos.
- Nenhum caso claro de `useState` que se beneficiaria de `useReducer` — a maioria dos hooks com múltiplos `useState` (`data`, `loading`, `error`) segue um padrão simples de fetch, sem transições de estado complexas o suficiente para justificar reducer.

## 7. Separação lógica/apresentação

N/A — não há chamadas de API misturadas com lógica de apresentação; os hooks desta pasta são puramente lógica de dados/estado, sem JSX.

## 8. Erros

- `src/hooks/checkins/useCheckinsSubmit.ts:78` — `saveCheckin` chama `supabase.rpc('submit_checkin', ...)` sem `try/catch` ao redor da chamada de rede. Se a Promise rejeitar (erro de rede, não apenas `error` retornado no objeto), a exceção sobe não tratada para o chamador, sem passar por um estado de erro consistente com o resto do hook.
- `src/hooks/usePDI_MX.ts:378-538` — todas as 10 mutations (`fetchCargos`, `fetchTemplate`, `saveSessionBundle`, `createSellerPDIAction`, etc.) fazem chamadas RPC sem `try/catch`. `saveSessionBundle` (linha 415) e `fetchPrintBundle` (linha 536) fazem `throw error` deliberadamente, mas isso deixa `setLoading(true)` sem uma finalização garantida (`finally`) — se a exceção for lançada, `setLoading(false)` já foi chamado antes do `if (error) throw error`, então neste caso específico está OK, mas o padrão é frágil e inconsistente entre as 10 funções (algumas retornam `{error}`, outras lançam).
- `src/hooks/agenda/useAgendaEvents.ts:78-95` — `Promise.all` com 5 queries; se qualquer uma rejeitar (não apenas retornar `.error`), a exceção não tratada quebra o `refetch` inteiro sem passar pelo `setError`/`setLoading(false)`, deixando o hook preso em `loading: true` indefinidamente.
- Consistente em quase todo o diretório: erros de rede/consulta são sempre logados via `console.error('Audit Error [...]')` — bom padrão de auditoria — mas a maioria dos hooks também expõe `error` no retorno para a UI consumir (não é "erro só no console"). Exceção: `usePDI_MX.ts`, cujo `saveSessionBundle`/`fetchPrintBundle` propagam `throw` em vez de sempre popular `error`, exigindo que cada consumidor implemente seu próprio try/catch.

## 9. Performance

- `src/hooks/usePDI_MX.ts:371-557` — todas as 10 funções de mutation são recriadas a cada render do componente que usa `usePDI_MX()` porque, embora usem `useCallback`, várias dependem apenas de `[queryClient]` (estável) — isso está OK. Porém como o hook retorna um objeto novo a cada render (linhas 540-556, sem `useMemo` envolvendo o retorno), qualquer componente que desestruture o resultado e passe funções para componentes filhos memoizados (`React.memo`) perde a otimização, mesmo as funções internas sendo estáveis.
- `src/hooks/team/useTeamMembers.ts:39` — `calculateReferenceDate()` é chamado diretamente no corpo do hook (não memoizado) a cada render, e o valor resultante é usado como dependência de `useCallback` (linha 151). Como a função provavelmente envolve cálculo de data/timezone, refazer isso em toda renderização (inclusive as que não mudam storeId/role) é redundante; o mesmo padrão se repete em `useStores.ts:250,398`, `useRanking.ts:42`.
- `src/hooks/useStores.ts:122-236` — `createStore`, `updateStore`, `deleteStore`, `toggleStoreStatus` não usam `useCallback`, sendo recriadas a cada render de qualquer componente que chame `useStores()`. Como `useStores` é usado em telas com listas grandes (gestão de lojas), isso pode gerar re-render desnecessário em componentes filhos que recebem essas funções como props e são memoizados.
- `src/hooks/useAuth.tsx` — o `useMemo` do `AuthState` (linhas 97-146) tem 22 dependências; qualquer mudança em qualquer uma delas recria o objeto de contexto inteiro, causando re-render de **todos** os consumidores de `useAuth()` no app (hook extremamente compartilhado — usado em 110+ arquivos). Isso é esperado dado o design de Context único, mas reforça o ponto acima sobre `useAuthActions` recriar `signIn`/`signOut`/etc a cada mudança de `profile` — cada pequena atualização de perfil (ex.: trocar avatar) dispara essa cadeia e re-renderiza toda a árvore que consome `useAuth`.
- Listeners com cleanup corretos e bem implementados: `useAuthSession.ts:104-107` (unsubscribe do `onAuthStateChange`), `useNotifications.ts:63-65` (removeChannel do realtime), `useFocusTrap.ts:53-58` (removeEventListener + restauração de foco). Nenhum subscription/listener órfão detectado nos arquivos revisados.

## 10. Organização

- Estrutura consistente: cada subpasta (`agenda/`, `auth/`, `checkins/`, `team/`) segue o padrão `types.ts` + múltiplos `use*.ts` de responsabilidade única + `index.ts` barrel + um composer no nível de `src/hooks/` (`useAuth.tsx`, `useCheckins.ts`). Boa prática replicável para outros domínios do projeto.
- Nenhuma dependência circular detectada nas importações lidas (`agenda/*` importa de `@/hooks/useAuth`, nunca o inverso; `team/*` importa de `@/hooks/useAuth` e `@/hooks/useCheckins`, sem ciclo).
- Nenhum hook duplicado com nome idêntico entre `src/hooks/` e `src/features/*/hooks/` (confirmado via comparação de basenames). Os hooks de `features/` têm nomes de domínio específico (`useVendedorHomePage`, `useStoreRankingPageData`, etc.) que compõem os hooks de `src/hooks/`, sem sobreposição direta.
- `src/hooks/usePDI.ts` (sem sufixo) e `src/hooks/usePDI_MX.ts` coexistem com nomes muito parecidos e responsabilidades sobrepostas (ambos lidam com sessões de PDI). Vale documentar/renomear para deixar explícito o motivo da divisão (parece ser legado vs. versão "MX" nova) — hoje só é possível diferenciar lendo o conteúdo.

## 11. Acessibilidade

- `src/hooks/useFocusTrap.ts` — hook dedicado a manipulação de foco/teclado, implementado corretamente: captura o elemento com foco anterior, prende Tab/Shift+Tab dentro do container, e restaura o foco ao desmontar (linhas 53-58). Nenhum problema encontrado.

## 12. Testes

- Hooks com teste: `useAuth` (`useAuth.test.ts` + `__tests__/useAuth.spec.ts`), `useCheckins`, `useFocusTrap`, `useNotifications`, `useSellerMetrics`, `useStoreSales`, `useTacticalPrescription`.
- **Hooks críticos sem nenhum teste**: `useRanking.ts` (lógica de cálculo de ranking/atingimento/projeção usada em telas de vendedor e gestor — regra de negócio complexa, zero cobertura), `usePDI_MX.ts` (10 mutations de RPC sem teste), `useTeam.ts` e todo `team/*` (`useTeamMembers`, `useTeamMembership`, `useTeamInvites`, `useTeamMetrics` — CRUD de equipe com regras de autorização por role, sem teste), `useStores.ts` (CRUD de lojas com validação Zod, sem teste), todo `agenda/*` (`useAgendaEvents`, `useAgendaCRUD`, `useAgendaFilters`, `useAgendaView` — sincronização com Google Calendar e regras de visita PMR, sem teste), e os 4 sub-hooks de `auth/*` (`useAuthSession`, `useAuthProfile`, `useAuthRBAC`, `useAuthActions` — só o composer tem teste, a lógica interna de bootstrap/RBAC/simulação de perfil não tem cobertura unitária direta).
- Prioridade sugerida para cobertura: `auth/useAuthRBAC.ts` (lógica de simulação de papel e derivação de perfil efetivo, alto risco de regressão silenciosa), `useRanking.ts` (cálculo de metas/atingimento) e `team/useTeamMembership.ts` (mutations com controle de acesso por role).
