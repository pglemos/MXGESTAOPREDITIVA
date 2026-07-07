# Parte 4 — Remuneração + Landing + Agenda Admin + Sales Performance + Rotina Gerente

## Resumo

Escopo com ~85 arquivos / ~9200 linhas nas 5 features. Qualidade geral boa: hooks orquestradores bem isolados dos containers, lógica de cálculo de remuneração (`comparativo.ts`) limpa e testada, error boundaries por seção. Principais problemas: duplicação de componente `Field` e do padrão CRUD-form em `remuneracao/components/*` (3x), tipos `any` em `useAgendaAdminForms.ts`, card clicável sem acessibilidade de teclado em `RotinaRitualMatinal.tsx`, e cobertura de teste muito baixa (2 de ~85 arquivos têm teste correspondente). Nenhum vazamento de dependência circular ou violação de regra de hooks encontrado.

Achados por severidade: **Alto**: 3. **Médio**: 9. **Baixo/observação**: 8.

## 1. DRY
- `src/features/remuneracao/components/CadastroPlanos.tsx:128`, `src/features/remuneracao/components/CadastroRegras.tsx:212`, `src/features/remuneracao/components/ComparativoMercado.tsx:105` — função `Field({ label, children })` duplicada de forma idêntica em 3 arquivos. Extrair para `src/features/remuneracao/components/Field.tsx` (ou promover para átomo compartilhado em `@/components/atoms`).
- `src/features/remuneracao/components/CadastroPlanos.tsx:11`, `src/features/remuneracao/components/CadastroRegras.tsx` (sem const nomeada, mas mesmo padrão) — `const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` repetido em 3 arquivos (também em `ComparativoMercado.tsx`, `MinhaRemuneracaoPage`/dashboard cards). Extrair para `@/lib/format` (ex.: `formatBRL`).
- `src/features/remuneracao/components/CadastroPlanos.tsx:27` e `CadastroRegras.tsx:53` — helper `num = (v: string) => Number(String(v).replace(',', '.')) || 0` duplicado; mover para util compartilhado (ex.: `@/lib/utils#parseDecimalInput`).
- `src/features/remuneracao/components/CadastroPlanos.tsx` e `CadastroRegras.tsx` — os dois arquivos replicam integralmente o esqueleto "form de cadastro + tabela + confirmação de remoção via `requestToastConfirmation`". Candidato a um hook/componente genérico `useCrudTable` ou `<CrudFormTable>` que receba colunas/campos como config.
- `src/features/agenda-admin/modals/EventoModal.tsx` e `src/features/agenda-admin/modals/VisitaModal.tsx` — cada campo do formulário repete o padrão `onChange={(e) => setForm((prev) => ({ ...prev, campo: e.target.value }))}` dezenas de vezes. Sugestão: hook `useFormField(setForm)` retornando um `handleChange(field)` genérico, reduzindo ~40 linhas por modal.

## 2. Dead code
- `src/features/agenda-admin/modals/VisitaModal.tsx:44-46` — função exportada `getSelectableAgendaClients(clients)` apenas retorna o array de entrada sem filtro/transformação (`return clients`). É um no-op; remover a função e usar `clients` diretamente na linha 90, ou implementar o filtro que o nome sugere.
- `src/features/remuneracao/MinhaRemuneracaoPage.tsx:44-46` — botão "Tentar novamente" no estado de erro não possui `onClick`; é puramente decorativo hoje. Adicionar handler (ex.: refetch/reload) ou remover o botão.

## 3. TypeScript
- `src/features/agenda-admin/hooks/useAgendaAdminForms.ts:13-14,17` — `createVisit`/`updateVisit`/`createScheduleEvent` tipados como `(...args: any[]) => Promise<...>`. Como os call-sites (`handleSubmitSchedule`/`handleSubmitEvent`) já constroem `payload` com formato fixo, dá para tipar como `(payload: VisitPayload) => Promise<...>` e `(payload: VisitPayload & { id: string; status: string }) => Promise<...>`.
- `src/features/agenda-admin/hooks/useAgendaAdminForms.ts:18` — `updateScheduleEvent: (id: string, payload: any) => ...`; mesmo caso, tipar `payload` com o shape derivado de `EventForm`/`AgendaScheduleEvent` em vez de `any`.

## 4. Componentes
- `src/features/rotina-gerente/hooks/useRotinaGerentePage.ts` (474 linhas) — não é componente, mas concentra estado de 6 `useState`, 3 `useEffect`, ~6 handlers `useCallback` e composição de 10 hooks de domínio. Funciona (é o hook orquestrador documentado), mas está no limite de complexidade; se crescer mais, considerar quebrar em sub-hooks por responsabilidade (ex.: `useRotinaRealtimeEvents`, `useRotinaCorrectionQueue`, `useRotinaMatinal`).
- `src/features/agenda-admin/modals/EventoModal.tsx` (272 linhas) e `src/features/agenda-admin/modals/VisitaModal.tsx` (248 linhas) — JSX longo e repetitivo por causa da duplicação de padrão de campo (ver item DRY). Quebrar em subcomponentes de campo reduziria o tamanho substancialmente.
- Nenhum componente do escopo passa de ~300 linhas; não há candidato crítico a split estrutural além dos dois modais acima.

## 5. Estado
- `src/features/rotina-gerente/RotinaGerente.container.tsx:60-79` — prop drilling extenso: `RotinaDiarioTab` recebe 18 props vindas todas de `useRotinaGerentePage()`. Funciona porque o hook já centraliza o estado, mas se a árvore crescer mais um nível, considerar passar o objeto `page` inteiro (ou um slice memoizado) em vez de destructuring campo a campo.
- `src/features/rotina-gerente/sections/RotinaRitualMatinal.tsx:35-50` — estado `reuniaoDone`/`agendaValidated` e handlers `setReuniaoDone`/`setAgendaDone` vêm do hook pai; ok, mas note que esses dois booleanos não persistem (não são gravados em nenhuma tabela — servem só de gate local para `canTriggerMatinal`). Se a intenção é que sejam parte da auditoria da rotina diária, avaliar se não deveriam ser persistidos via `registerRoutine`.

## 6. Hooks
- Nenhuma violação das regras dos hooks encontrada (sem hooks condicionais/em loop).
- `src/features/rotina-gerente/hooks/useRotinaGerentePage.ts:101-110` — `useCallback` de `handleRefresh` lista 8 dependências; correto, mas é sinal de que a função faz "refresh de tudo" — candidato a hook dedicado `useRotinaRefreshAll(deps)` para isolar a orquestração de múltiplos refetches do restante do hook.
- `src/features/remuneracao/hooks/useRemuneracao.ts:134-179` (`useRemuneracaoEstimadaVendedor`) — `useEffect` com fetch duplo (`Promise.all` de planos + regras) e guard `alive` bem implementado; sem achados, mas é candidato a virar um hook de "data fetching" reutilizável já que o mesmo padrão (`alive` flag + `Promise.all` + `if (!alive) return`) se repete em `useBenchmark` (linhas 220-237) no mesmo arquivo.

## 7. Separação lógica/apresentação
- `src/features/remuneracao/components/CadastroPlanos.tsx` e `CadastroRegras.tsx` — validação de negócio (`if (num(form.valor) <= 0)`, `if (regraUsaMeta && ...)`) embutida diretamente no componente de apresentação (`handleSubmit`). Como as regras são específicas do domínio de remuneração, mover para uma função pura em `lib/comparativo.ts` (ex.: `validarRegraForm(form): string | null`) tornaria testável sem montar o componente.
- Chamadas Supabase ficam concentradas nos hooks (`useRemuneracao.ts`, `useRotinaGerentePage.ts`), não nos componentes de apresentação — padrão correto, sem achado aqui.

## 8. Erros
- `src/features/remuneracao/hooks/useRemuneracao.ts:57-71` (`reload`, `salvarPlano`, `removerPlano`) — chamadas Supabase sem `try/catch`; se o client rejeitar (erro de rede, não apenas `{error}` do PostgREST), a exceção sobe sem tratamento e a UI fica presa em `loading=true`. Mesmo padrão em `useRegrasRemuneracao` (linhas 82-112). Adicionar `try/catch/finally` para garantir `setLoading(false)` mesmo em falha de rede.
- `src/features/agenda-admin/hooks/useAgendaAdminForms.ts` — todos os handlers (`handleSubmitSchedule`, `handleSubmitEvent`, `handleCancelVisit` etc.) tratam o `{error}` retornado pelas mutations, mas não têm `try/catch` ao redor do `await`. Se a promise rejeitar (em vez de resolver com `{error}`), não há feedback ao usuário nem `setSubmitting(false)` — o botão fica travado em "SALVANDO...". Baixo risco dado o contrato atual dos hooks de CRUD, mas vale um `try/finally`.
- `src/features/rotina-gerente/hooks/useRotinaGerentePage.ts:272-320` (`handleTriggerMatinal`) — bom exemplo do padrão correto: `try/catch/finally` com feedback via `toast` e `setExecuting(false)` garantido. Usar como referência para os outros hooks acima.

## 9. Performance
- `src/features/landing/hooks/useLandingEffects.ts:160-176` — seletor `document.querySelectorAll('.mxp-root a, .mxp-root button, ...')` roda a cada mount do efeito de cursor customizado; como é executado uma vez (`[]`), não é um problema de re-render, mas é sensível a mudanças de DOM depois do mount (novos elementos revelados por scroll não recebem os listeners de `mouseenter`/`mouseleave`). Não é bug de performance, é um gap funcional a considerar se novos elementos interativos aparecerem após reveal.
- `src/features/sales-performance/sections/AdminStoreMatrixTable.tsx` — renderiza a tabela completa de `metrics.byStore` sem paginação/virtualização. Com poucas dezenas de lojas hoje não é crítico, mas se a rede crescer (centenas de lojas) vale considerar virtualização (`react-virtual`/`react-window`).
- Nenhum componente do escopo mostra função recriada de forma problemática a cada render sem memoização — os hooks já usam `useCallback`/`useMemo` de forma consistente.

## 10. Organização
- Estrutura de pastas consistente entre as 5 features (`components/`, `hooks/`, `sections/`, `data/`, `lib/` quando aplicável) — sem achados de inconsistência estrutural.
- Nenhuma dependência circular detectada entre os módulos do escopo.
- `src/features/landing/data/landing-css.ts` (485 linhas) — arquivo de CSS-in-JS auto-extraído e intencionalmente congelado ("Do NOT alter visual rules without updating Playwright snapshots"); não é um achado de organização, é dívida técnica documentada e aceita — mantido fora do escopo de refatoração.

## 11. Acessibilidade
- `src/features/rotina-gerente/sections/RotinaRitualMatinal.tsx:86-95` — `<Card onClick={() => step.set(!step.done)}>` é um elemento clicável sem `role="button"`, `tabIndex={0}` nem handler de teclado (`onKeyDown` para Enter/Space). Não é navegável nem ativável via teclado. Corrigir adicionando semântica de botão ou trocando por um `<button>` nativo envolvendo o conteúdo.
- `src/features/rotina-gerente/sections/RotinaRitualMatinal.tsx:134-140` — o botão "Concluir" dentro do card acima não tem `onClick` próprio (depende do clique borbulhar do `Card` pai). Isso o torna focável mas funcionalmente morto ao ser ativado via teclado/Enter (o clique do botão não dispara o toggle porque não há handler nele nem no evento de teclado do Card). Adicionar `onClick={() => step.set(!step.done)}` diretamente no botão, independente do card.
- Imagens verificadas (`MinhaRemuneracaoPage.tsx:71`, `landing/sections/FooterSection.tsx:9`, `landing/sections/TopBarSection.tsx:11`) possuem `alt` adequado — nenhum achado de `img` sem alt no escopo.
- Nenhum `<div onClick>` bruto encontrado nas outras features (Agenda Admin, Sales Performance, Remuneração, Landing) — apenas o caso acima em Rotina Gerente.

## 12. Testes
- `src/features/rotina-gerente/hooks/useRotinaGerentePage.ts` (474 linhas, hook orquestrador central com realtime + múltiplos handlers) — sem teste correspondente em `src/test` ou arquivo `.test`/`.spec` ao lado. Maior lacuna de cobertura do lote dado o tamanho e criticidade (dispara Edge Function, aprova/rejeita correções, realtime subscriptions).
- `src/features/remuneracao/hooks/useRemuneracao.ts` — sem teste; a lógica de cálculo que consome (`comparativo.ts`) está bem testada, mas os hooks de fetch/mutation (`usePlanosRemuneracao`, `useRegrasRemuneracao`, `useRemuneracaoEstimadaVendedor`, `useBenchmark`) não têm cobertura.
- `src/features/landing/hooks/useLandingEffects.ts` — sem teste; aceitável dado que é majoritariamente manipulação de DOM/efeitos visuais cobertos por snapshot Playwright (conforme comentário no arquivo), mas nenhum teste unitário/integração cobre a lógica de mount/unmount dos observers.
- `src/features/sales-performance/hooks/useAdminPerformancePage.ts` — sem teste; lógica de `handleExport` (mapeamento de colunas para Excel) e `handleStoreClick` (navegação) não são triviais o suficiente para dispensar teste.
- Cobertura real do escopo: apenas `src/features/remuneracao/lib/comparativo.test.ts` e `src/test/agenda-admin/useAgendaAdminForms.test.tsx` existem — ou seja, 2 de ~85 arquivos (~2%).
