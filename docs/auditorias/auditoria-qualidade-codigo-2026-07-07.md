# Auditoria de Qualidade de Código — MX Gestão Preditiva

**Data:** 2026-07-07
**Escopo:** `src/` inteiro — 741 arquivos, ~116.000 linhas (exclui `src/base44-reference`, referência visual intencional, e `database.generated.ts`, gerado pelo Supabase).
**Método:** 9 lotes paralelos, cada um aplicando o mesmo checklist de 12 pontos (DRY, dead code, TypeScript, componentes, estado, hooks, separação lógica/apresentação, tratamento de erro, performance, organização, acessibilidade, testes). Relatórios completos por lote em `parte-01` a `parte-09` neste diretório — este documento é a síntese.

## Sumário executivo

Cerca de **270 achados** catalogados nos 9 lotes. A base é tecnicamente sólida: `tsc`/`eslint` não acusam nada nos escopos auditados, uso de `any` é praticamente zero em todo o `src`, e o padrão hook-de-dados + componente-de-apresentação é seguido na maioria das features. Os problemas reais são arquiteturais e de disciplina de manutenção, não bugs de sintaxe:

- **Dead code em volume real**: ~2.700 linhas confirmadas mortas (automation/ inteiro, segunda árvore de design system, componentes de checkin nunca ligados, hooks/telas órfãs).
- **Cobertura de teste concentrada em lib pura**, com um buraco quase total em autenticação/autorização, hooks orquestradores de página e o organism mais reutilizado do design system.
- **Arquivos-monólito recorrentes**: 6+ arquivos entre 800 e 1800 linhas, todos misturando UI + regra de negócio + chamada direta ao Supabase.
- **Duplicação sistemática de pequenos utilitários** (normalização de telefone/data, mapas de cor por status, componente `Field`, gauge semicircular, `cssVar`) reimplementados de forma independente em 3 a 17 arquivos cada.
- **Dois bugs funcionais reais** encontrados incidentalmente (não são só "código feio"): configurações que a UI deixa editar mas nunca salva, e navegação da sidebar do vendedor computada e depois silenciosamente descartada.

## Achados críticos (top 20, por risco)

1. **RBAC sem nenhum teste unitário** — `useAuthRBAC.ts`, `useAuthProfile.ts`, `useAuthSession.ts`, `useAuthActions.ts` (~900 linhas somadas) calculam `effectiveRole`/`effectiveStoreId` e controlam simulação de papel. Zero cobertura direta; só há teste E2E via UI. Regressão silenciosa aqui vaza dado entre perfis. *(parte-09, parte-06)*
2. **`checkin-service.ts` deprecated ainda em produção, sem teste, erro de auditoria engolido** — o insert em `logs_auditoria` não checa `error` de retorno; se falhar, a operação principal segue sem qualquer rastro. Ainda importado por `AiDiagnostics.tsx` e `MorningReport.tsx`. *(parte-07, parte-09)*
3. **`src/lib/automation/` inteiro é código morto** (13 arquivos, ~600 linhas) — usa `node-cron`/`process.env` (incompatível com runtime Vite/browser), sem nenhuma rota/cron acionando. Arrasta `node-cron` e `exceljs` no `package.json` sem uso real em nenhum outro lugar. *(parte-07)*
4. **Segunda árvore de design system inteira, morta** — `src/design/components/index.tsx` (824 linhas) + `src/design-system/index.ts` + `src/design/tokens/index.ts` (~900 linhas totais) duplicam conceitualmente `atoms/molecules/organisms` mas não são importados por nada fora de si mesmos. *(parte-08)*
5. **Bug real de navegação**: `Layout.tsx` computa a sidebar do vendedor via `useMemo` e passa como prop; `SellerSidebar.tsx:387` ignora o prop e usa uma lista `base44SellerSections` hardcoded sempre que o perfil é vendedor — duas fontes de verdade, uma descartada silenciosamente. *(parte-08)*
6. **`DataGrid.tsx` (organism mais reutilizado do design system) sem acessibilidade de teclado na linha clicável e sem teste** — reproduzido também em `MorningReport.tsx:405`. *(parte-08)*
7. **~1.100 linhas de dead code em checkin**: `CheckinAdjustmentTab.tsx` (820L) e `CheckinSidebar.tsx` (99L) nunca importados; `NumberInput.tsx` (154L) reimplementado inline em vez de reusado. *(parte-01)*
8. **`useCheckinPage.ts` é um "god hook"**: 829 linhas, 12+ responsabilidades (form, deadline, disciplina, WhatsApp, draft, 8 validações em cascata no submit), sem teste próprio — é o núcleo do fechamento diário. *(parte-01)*
9. **Falha silenciosa em `useCrmDerivedTotals.ts`**: se qualquer uma das 4 queries paralelas falhar, retorna zeros sem log/toast — vendedor vê formulário "vazio" achando que não há dados. *(parte-01)*
10. **Bug funcional confirmado**: `OperacionalLojaTab.tsx` deixa o usuário alterar 4 toggles + horário, mas `handleSave` só persiste `emailLists` — as outras configurações nunca são salvas. *(parte-02)*
11. **Três "sucessos falsos"**: `MorningReport.tsx` (`handleSendEmail` x2) e `OperationalSettings.tsx` (`fetchSettings`) apenas fazem `setTimeout` + `toast.success`, sem operação real — usuário acredita que um relatório foi enviado ou que configs foram sincronizadas. *(parte-08)*
12. **Promise não aguardada em `ConsultoriaVisitaExecucao.tsx:468-474`**: `supabase.functions.invoke(...)` (envio de e-mail de relatório) não é `await`ada nem tem `.catch()` — falha vira unhandled rejection silenciosa. *(parte-08)*
13. **`central-mx-engine.ts` (motor de score/alertas do dashboard executivo, 514 linhas) com teste raso**: só 3 blocos checando forma/estrutura, nenhum cobrindo a lógica real de `scoreFromActual` ou os gatilhos de `buildAlerts`. *(parte-07)*
14. **Dados 100% mockados em telas ativas e roteadas**: `FunilVendasGerente.tsx`, `MetasGerente.tsx` (rotas gerente/dono) e `FalarConsultorDono.tsx` exibem números/contatos hardcoded como se fossem reais. *(parte-05)*
15. **Testes E2E com padrão "não pode falhar"**: dezenas de specs usam `expect(x || true).toBe(true)` ou engolem exceção com `.catch(() => expect(true).toBe(true))` — dão falsa sensação de cobertura em `components/consultoria/agenda.playwright.ts`. *(parte-09)*
16. **Testes de Modal mockam o Radix inteiro**: nunca exercitam focus-trap, portal ou fechamento real por Escape/clique-fora — bug de acessibilidade real não seria pego. *(parte-09)*
17. **Dois god components de ~1.100 linhas**: `VendedorHome.container.tsx` (1102L, 20 subcomponentes) e `StoreTeamPanel.tsx` (1058L, listagem + aprovação de pré-cadastro + 2 modais). *(parte-03)*
18. **`OwnerExecutiveCockpit.tsx`**: 1782 linhas, ~30 componentes internos, dashboard executivo inteiro num arquivo só. *(parte-02)*
19. **Testes "sempre verdes"**: `PageHeader.test.tsx` e `EmptyState.test.tsx` usam asserts que passam independente do comportamento real (`toBeDefined()` em resultado de `queryByText`, heurística `a || b.length===0`). *(parte-09)*
20. **Duplicação sistemática de utilitários pequenos** — ver seção abaixo.

## Padrões de duplicação cross-feature

Estes não aparecem como um único achado porque nenhum agente viu o repo inteiro de uma vez — juntando os 9 relatórios, são o mesmo problema se repetindo:

| Utilitário | Já existe em | Reimplementado em |
|---|---|---|
| Normalização de telefone (`replace(/\D/g,'')`) | `src/lib/schemas/crm.schema.ts` | 13+ arquivos (crm, checkin, lojas, dono, pages) |
| Formatação de data pt-BR com fix de timezone | `src/lib/schemas/crm.schema.ts` (`formatDateBR`) | 17+ arquivos usando `toLocaleDateString` cru, sujeitos ao bug de "-1 dia" que o helper já corrige |
| Mapa status→classe Tailwind (success/warning/danger) | — nenhuma fonte canônica | 8+ arquivos (central-mx, departamentos, marketing, cultura-felicidade, crm, dashboard-loja) |
| Componente `Field` (label + children) | — | 5 arquivos (remuneracao x3, organograma, comportamental) |
| Gauge semicircular de score | — | 3 variações (`OwnerSemiGauge`, `SemiCircularGauge`, `MXScoreCompact`) |
| `cssVar()` (leitura de custom property) | `src/lib/charts/tokens.ts` | duplicada byte-a-byte em `src/design-system/tokens/colors.ts` (o próprio comentário do 2º arquivo admite a cópia) |
| Padrão RPC-se-flag-senão-query + agregação | — | `useRanking.ts` (3x), `useStores.ts` (2x), `team/useTeamMembers.ts`, `checkins/*` (4x) — mesmo bloco reescrito 9+ vezes em `src/hooks/` |
| `stripAccents`/normalização de texto | — | 4 arquivos (`pmr-engine.ts`, `development-content.ts`, `pdi-evolution.ts`, `utils.ts`) |
| `PageHeader` vs `PageHeading` | `PageHeading` é o padrão canônico (confirmado em memória do projeto) | `PainelConsultor.tsx` ainda usa `PageHeader`; `PageHeader` tem teste, `PageHeading` não |

## Cobertura de teste — panorama

Pontos fortes: `calculations.ts`, hooks de RBAC-adjacent simples, `atoms`/boa parte de `molecules`, schemas Zod centrais, ~19 testes de migração de dados legados.

Lacunas por prioridade de risco:
1. **Segurança/autorização** — RBAC (achado #1), `checkin-service.ts` (achado #2).
2. **Hooks orquestradores de página sem nenhum teste**: `useCheckinPage`, `useRotinaGerentePage` (474L), `useAdminFeedback`/`useStoreFeedback`, `useVendedorHomePage`, `useLojasPage`, `useGlobalRankingPageData`/`useStoreRankingPageData`, `useRanking.ts`, `useTeam*`, `useStores.ts`, todo `agenda/*`.
3. **Design system**: `DataGrid.tsx` (achado #6), `PageHeading.tsx` (versão canônica, ironicamente sem teste enquanto a versão descontinuada tem).
4. **Módulos de feature inteiros sem teste**: `dashboard-loja` (31 arq.), `sales-performance` (23), `consultoria` (17), `configuracoes` (18), `consultoria-cliente` (16), `lojas` (12), `rotina-gerente` (12).
5. **Qualidade dos testes existentes**: padrão "não pode falhar" no E2E (achado #15), mock de Radix inteiro (achado #16), asserts sempre-verdadeiros (achado #19), fixtures hardcoded frágeis em testes de segurança.

## Achados por lote (detalhe completo)

| Lote | Escopo | Arquivo |
|---|---|---|
| 1 | `features/crm`, `features/checkin` | [parte-01-crm-checkin.md](parte-01-crm-checkin.md) |
| 2 | `features/dashboard-loja`, `consultoria`, `configuracoes` | [parte-02-dashboard-consultoria-config.md](parte-02-dashboard-consultoria-config.md) |
| 3 | `features/gerente-feedback`, `vendedor-home`, `lojas`, `ranking` | [parte-03-gerente-vendedor-lojas-ranking.md](parte-03-gerente-vendedor-lojas-ranking.md) |
| 4 | `features/remuneracao`, `landing`, `agenda-admin`, `sales-performance`, `rotina-gerente` | [parte-04-remuneracao-landing-agenda-sales-rotina.md](parte-04-remuneracao-landing-agenda-sales-rotina.md) |
| 5 | 17 features pequenas (pdi, organograma, comportamental, marketing, dono, etc.) | [parte-05-features-pequenas.md](parte-05-features-pequenas.md) |
| 6 | `src/hooks` inteiro | [parte-06-hooks.md](parte-06-hooks.md) |
| 7 | `src/lib` inteiro | [parte-07-lib.md](parte-07-lib.md) |
| 8 | `src/pages`, `src/components`, `src/design`, `src/design-system` | [parte-08-pages-components-design.md](parte-08-pages-components-design.md) |
| 9 | `src/types` (não gerado) + `src/test` | [parte-09-types-tests.md](parte-09-types-tests.md) |

## Recomendações — ordem sugerida

1. **Remover dead code confirmado** (baixo risco, alto ganho de clareza): `src/lib/automation/`, `src/design/` + `src/design-system/`, `CheckinAdjustmentTab.tsx`, `CheckinSidebar.tsx`, `CentralMxHub.tsx`, `PrintableFeedback.tsx`/`WeeklyStoreReport.tsx`, tipos mortos de `src/types/index.ts`. ~2.700 linhas removíveis sem risco funcional (todas confirmadas sem import externo).
2. **Corrigir os 2 bugs funcionais reais**: `OperacionalLojaTab` (achado #10) e `SellerSidebar` (achado #5) — são regressões silenciosas de UX ativas em produção agora.
3. **Fechar o buraco de teste em auth**: `useAuthRBAC` primeiro (achado #1), depois `checkin-service.ts` (achado #2, ou remover se de fato morto).
4. **Substituir os 3 stubs de "sucesso falso"** por implementação real ou removê-los explicitamente (achado #11) — hoje enganam o usuário sobre uma ação que não ocorreu.
5. **Consolidar as duplicações de utilitário pequeno** listadas acima — cada uma é um PR de baixo risco e alto valor (elimina superfície de bug por divergência).
6. **Quebrar os 4 arquivos-monólito de maior risco**: `useCheckinPage.ts`, `OwnerExecutiveCockpit.tsx`, `VendedorHome.container.tsx`, `StoreTeamPanel.tsx` — nessa ordem de prioridade (o primeiro é o mais crítico ao negócio: fechamento diário).
7. **Testar `DataGrid.tsx` e corrigir a11y de teclado** nas 2 ocorrências de linha clicável sem `role`/`tabIndex`/`onKeyDown` (`DataGrid.tsx`, `MorningReport.tsx:405`) — usar `AdminNetworkView.tsx:68-80` como referência de implementação correta já existente no projeto.
8. **Substituir o padrão "não pode falhar" nos testes E2E** por asserts reais — do contrário a suíte não vai pegar regressão nenhuma nesses fluxos.
