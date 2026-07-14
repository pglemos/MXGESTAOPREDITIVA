# Relatório Final — Módulo Gerencial

## Commit

`59c3f40f9a7d59ba6216d629156d6c0780204a71` (base da branch; alterações ainda não commitadas)

## Branch

`fix/manager-module-full-parity-20260714`

## Ambiente

- MX local: `http://127.0.0.1:3001`
- MX produção: `https://mxperformance.vercel.app` — somente leitura nesta execução
- Base44: `https://mx-gerente.base44.app`
- Referência ZIP: `/private/tmp/mx-gerente-reference-20260714-Y474U3`, somente leitura

## Ferramenta de navegador

Chrome DevTools MCP em Chrome real; Browser in-app/extension não ficou disponível. O fallback Playwright/Chromium permanece configurado para E2E. A sessão real permitiu autenticação, navegação, cliques, inspeção, screenshots e estados modais.

## Versões

Node `v24.13.0`; npm `11.6.2`; Chromium via Playwright.

## Resultado executivo

O resultado é `STATUS FINAL: PARCIAL`.

Implementado e verificado nesta branch:

- fórmula pura de Rotina da Equipe com pesos oficiais de 100 pontos e denominador recalculado para não aplicáveis;
- estados `—` para ausência de fonte em métricas de fechamento e `NaN` de Meta da Loja;
- Início consumindo o Plano de Sustentação oficial, com fechamentos mensais e calendário configurado;
- browser local pós-patch: rota `/gerente/rotina-equipe` em `1440×900` e `390×844`, estado vazio estável, console/network limpos e sem overflow;
- E2E autenticado histórico desta retomada: `npm run test:e2e -- src/test/manager-module.playwright.ts`, Chromium `5/5` e mobile-chrome `5/5`, com credencial somente em runtime; a reexecução final depende de `E2E_ROLE_PASSWORD` ou `E2E_AUTH_PASSWORD` disponível no ambiente;
- E2E produção somente leitura: menu/rotas `1/1`, conteúdo nos três viewports `1/1`, console/network `1/1`;
- segurança de rota em Chrome real: vendedor bloqueado; dono/admin autenticados acessaram seus escopos;
- regressão visual MX versionada: `30/30` (dez telas × `1440×900`, `768×1024`, `390×844`);
- suíte completa: `918 pass`, `0 fail`;
- lint: `0` erros e 22 warnings preexistentes;
- typecheck, build, `git diff --check`, validações AIOX e bundle budget passaram;
- capturas local/produção versionadas nos três viewports mínimos;
- Base44 autenticado recapturado com conteúdo carregado nas dez rotas e nos três viewports mínimos; capturas `06-*` e diffs Base44×MX versionados.

O módulo não está aprovado porque ainda não houve fixture/staging autorizada para mutações críticas, auditoria RLS cross-store completa, decisão definitiva do Ranking e publicação/homologação pós-deploy.

## Fontes e precedência

Aplicada e documentada em `ADR-MANAGER-SOURCE-PRECEDENCE.md`:

`Especificação funcional textual > Base44 visual/comportamental > MX infraestrutura`.

O sidebar escuro MX foi preservado; `CalendarClock` e `BrainCircuit` permanecem as exceções visuais autorizadas.

## Matriz resumida

| Tela | Funcional | Visual | Dados | Segurança | E2E | Produção | Status |
|---|---|---|---|---|---|---|---|
| Início | Parcialmente corrigido | Local capturado; Base44 sem baseline equivalente | Plano oficial ligado | Rota protegida; RLS não reauditado nesta rodada | Passa local/produção existentes | Não promovido | EM AUDITORIA |
| Rotina do Dia | Sem nova mutação nesta rodada | Local capturado nos viewports mínimos | `execution_actions`/fontes canônicas | Não reauditado nesta rodada | Passa no conjunto de dez rotas | Não promovido | EM AUDITORIA |
| Fechamento Diário | Ausência não vira zero; mutações pendentes | Local capturado; Base44 instável | `lancamentos_diarios`/auditoria | Não reauditado nesta rodada | Passa local/produção existentes | Não promovido | EM AUDITORIA |
| Rotina da Equipe | Score oficial e série histórica canônica corrigidos; cobrança pendente | Base44 e MX carregados; diff versionado | Seis fontes canônicas por vendedor/data | Escopo existente; cobrança não rehomologada | Chromium `5/5` + mobile `5/5` | Não promovido | EM AUDITORIA |
| Minha Equipe | Sem nova mutação nesta rodada | Capturada nos viewports mínimos | Dados reais do dashboard | Não reauditado nesta rodada | Passa no conjunto de dez rotas | Não promovido | EM AUDITORIA |
| Meta da Loja | `NaN` corrigido; plano oficial coberto por testes | Base44 e MX carregados; diff versionado | Meta/calendário/check-ins | Não reauditado nesta rodada | Passa no conjunto de dez rotas | Não promovido | EM AUDITORIA |
| Desenvolvimento | Fluxos de produção não executados | Capturada nos viewports mínimos | Feedback/PDI canônicos | Mutação não executada | Passa no conjunto de dez rotas | Não promovido | EM AUDITORIA |
| Mentor | Conteúdo determinístico existente | Capturada nos viewports mínimos | Recomendações reais ainda não comparadas | Não reauditado nesta rodada | Passa no conjunto de dez rotas | Não promovido | EM AUDITORIA |
| Ranking | Quatro períodos expostos; fórmula continua provisória | Capturada com Mensal/Trimestral/Semestral/Anual; ausência usa `Sem dados oficiais`/`—` | `useStoreRankingPageData` e RPC oficial | Vendedor bloqueado na rota; ranking carregado para gerente/admin | `5/5` unitário/componente + navegação real | Não promovido | EM AUDITORIA |
| Universidade MX | Catálogo/abas carregados | Capturada nos viewports mínimos | Progresso/mutação não homologados | Não reauditado nesta rodada | Passa no conjunto de dez rotas | Não promovido | EM AUDITORIA |

## Correções realizadas

- `buildOfficialRoutineScore` em `manager-team-routine.ts`, com componentes, pesos, evidência, motivo e retorno `null` quando não há base.
- `buildOfficialRoutineTrend` reutiliza o score oficial por vendedor/data; o proxy histórico anterior baseado somente em `execution_actions` deixou de alimentar a UI.
- `ManagerRoutineDetailModal` exibe os seis componentes oficiais e o denominador aplicado, incluindo `Não aplicável`.
- `formatClosingMetric` e resumo de fechamento nullable; `Qualificados` e `Garantia` deixaram de exibir zero inventado.
- detalhes e tabela de fechamento agora exibem `—` quando não existe fechamento.
- `formatStoreGoalMetric(NaN)` agora exibe `—`.
- Home removeu a base fixa de 22 dias e usa `calculateSustainabilityPlan` + calendário/configuração oficial.
- Feedback, PDI e vendedores agora propagam erro de consulta até a UI; falha não é exibida como lista vazia (`ManagerDevelopmentErrorStates`: `3/3`).
- Ranking gerencial agora expõe Mensal/Trimestral/Semestral/Anual, declara a fórmula como provisória e não fabrica `0 vendas`/`0%` sem base oficial.
- Filtros do Ranking agora possuem `id/name`; o reload no Chrome real eliminou o issue de acessibilidade de campos sem identificação.
- Meta da Loja e Início agora reutilizam o mesmo adaptador de linhas de fechamento e predicado de dia operacional; Fechamento Diário sanitiza campos inválidos antes das somas e calcula a necessidade sem arredondamento prematuro.
- E2E recebeu gate explícito para console e responses/request failures.

## Segurança e RLS

Nenhuma migration foi criada, RLS não foi desabilitado e nenhuma mutação de produção foi executada. No Chrome local, o vendedor recebeu `Acesso não autorizado` em `/gerente/minha-equipe`; dono e admin autenticados carregaram seus escopos. A auditoria negativa formal cross-store em consultas/mutations ainda é pendência.

## Acessibilidade

E2E cobriu navegação de abas, modais, Escape e clipping nos viewports obrigatórios. A lint global permanece com 22 warnings preexistentes fora do patch; não há novos erros.

## Performance

Build passou. Bundle: `1728.99/1800 KB` gzip; chunks dentro do budget.

## Console e network

O gate autenticado percorreu as dez rotas em Chromium e mobile-chrome sem erros de console, 4xx/5xx ou overflow; a retomada confirmou no Chrome DevTools MCP que os requests do Ranking usam `store_id` explícito e retornam HTTP 200.

## Regressão visual

Capturas versionadas em:

`docs/qa/evidence/manager-parity/2026-07-14/`

O gate automatizado está em `e2e/visual/manager-module.spec.ts`, com baselines em
`e2e/visual/__screenshots__/manager-module.spec.ts-snapshots/` e projetos dedicados
para `1440×900`, `768×1024` e `390×844`. O resultado atual é `30/30`.

Após a correção de `id/name` no Ranking, a composição visual não mudou; a evidência
Chrome pós-correção está em `mx-local/09-ranking-loaded-mx-local-1440x900-*postfix.png`.

Os diffs P0 foram gerados com ImageMagick. O diff carregado Base44×MX está em `measurements/base44-vs-mx-loaded-ae.txt` e `diffs/*-base44-vs-mx-loaded-*`. Os valores não são aprovação automática: incluem diferenças autorizadas do sidebar MX e diferenças de massa/estado; a homologação visual final ainda requer alinhamento de dados determinísticos e limiar formal.

## CI

Não houve push, PR ou CI remoto nesta execução.

## Deploy

Nenhum deploy foi executado. `ALLOW_PRODUCTION_MUTATIONS` não estava autorizado; a produção foi somente consultada.

## Pendências críticas

1. Executar fixture autorizada em local/staging para validar gravação e idempotência: criação/conclusão de ação, cobrança, regularização, leads, feedback, PDI e conclusão de treinamento.
2. Completar auditoria RLS cross-store e por papel com fixture autorizada.
3. Formalizar a decisão do Dono sobre a fórmula definitiva do Ranking; até lá a fórmula permanece provisória.
4. Revisar os diffs carregados com dados determinísticos e limiar formal; a regressão MX local já está automatizada (`30/30`).
5. Reexecutar o gate Playwright autenticado com `E2E_ROLE_PASSWORD` ou `E2E_AUTH_PASSWORD` disponível no ambiente; sem a variável, a suíte agora falha explicitamente em vez de marcar os casos como `skipped`.
6. Passar por QA/DevOps, commit, PR e eventual deploy somente após autorização explícita.

## Veredito final

`STATUS FINAL: PARCIAL`

Não há aprovação global nem declaração de Done.
