# Vendas: Busca/Cancelamento na Carteira + Divergência de Dados entre Telas

**Data:** 2026-07-23
**Origem:** Solicitação via `@aiox-master` (Orion) — feedback de campo (Vitor/gestor Loja Leal + lojas recém-implementadas)
**Status:** Story 3 (bug) — **causa raiz corrigida e aplicada em produção, verificada com dado real** (ver seção "FIX APLICADO" abaixo). Stories 1 e 2 seguem Draft para validação de @po (`*validate-story-draft`).

> Nota de processo: este documento é insumo de spec, não uma story AIOX formal. Criação de story/epic é domínio exclusivo de @sm/@pm — encaminhar para `*create-story` após validação de escopo.

---

## Story 1 — Busca e visualização de vendas na Carteira (Mentor Comercial)

**Como** consultor/vendedor,
**quero** localizar rapidamente um cliente ou uma venda já registrada dentro da minha Carteira/Mentor Comercial,
**para** confirmar status, corrigir dados ou dar sequência ao pós-venda sem precisar vasculhar listas longas.

### Critérios de Aceite
1. O campo "Buscar cliente..." já visível no header do Mentor Comercial (`src/features/crm/lib/mentorComercial.ts`, tela `Carteira Ativa`) passa a buscar também por **vendas concluídas**, não só leads/oportunidades em aberto.
2. Resultado de busca mostra, no mínimo: nome do cliente, veículo, data da venda, canal de origem e status atual (Ativa/Cancelada/Desistência).
3. Painel de **Filtros** (já existente — ver campo "SITUAÇÃO" no drawer) ganha uma opção de situação `Venda concluída` ao lado das já existentes (`Sem visita`, `Proposta enviada`, `Recuperação`...).
4. Cliente com venda concluída não desaparece da carteira após a venda — permanece pesquisável para fins de pós-venda/cancelamento.
5. Tempo de resposta da busca ≤ 1s para carteiras de até 500 clientes (paridade com a busca de leads atual).

---

## Story 2 — Fluxo de Cancelamento / Desistência de venda

**Como** consultor/gestor,
**quero** alterar o status de uma venda para `Cancelada` ou `Desistência` diretamente a partir do registro do cliente,
**para** manter os números de vendas confiáveis quando o negócio "cai" após o registro.

### Critérios de Aceite
1. A partir do card/ficha do cliente na Carteira, existe uma ação explícita (ex.: menu de status ou botão) para alterar o status da venda, sem depender de busca em outra tela.
2. Ao alterar para `Cancelada` ou `Desistência`, o sistema exige um motivo (texto curto ou lista pré-definida) — mesmo padrão já usado em outros fluxos de cancelamento do produto (`status: 'cancelada'` em `useExecutionActions.ts`, `agenda-admin`, `manager/day-routine`).
3. Venda cancelada/desistência **sai imediatamente** de todos os contadores de "vendas realizadas" (ranking, painel do gestor, painel geral do admin) na próxima leitura — não é preciso reprocessamento manual.
4. Histórico da mudança de status fica registrado (quem alterou, quando, motivo) — auditável, mesmo padrão de outros status transitions do produto.
5. Reversão do cancelamento (correção de erro operacional) é possível por até X dias, restrita a gestor/admin (RBAC a definir com @architect).
6. A ação de cancelar é visualmente distinta e pede confirmação (é destrutiva para os números de meta) — seguir padrão `destructive: true` de `src/features/central-execucao/lib/activity-results.ts`.

**Observação técnica relevante:** hoje o único conceito próximo de "desistência" encontrado no código é o resultado de atividade `"Desistiu da compra"` em `src/features/checkin/sections/CheckinCrmSection.tsx:145` — é um **código de resultado de check-in do dia**, não um status persistente e reversível da venda em si. Não há hoje uma entidade "venda" com campo de status mutável e pesquisável. @architect e @data-engineer precisam decidir: (a) adicionar status à tabela/registro que hoje representa a venda dentro de `lancamentos_diarios`, ou (b) promover "venda" a entidade própria. Essa decisão de modelagem impacta diretamente o Bug da Story 3.

---

## Story 3 (BUG/CRÍTICO) — Divergência de contagem de vendas entre telas

**Como** administrador da rede,
**quero** que o número de vendas seja o mesmo em qualquer tela do sistema,
**para** confiar no painel geral ao tomar decisões sobre lojas críticas/metas.

### Critérios de Aceite
1. Para o mesmo período e a mesma loja, `Painel Geral` (admin), tela do gestor da loja e Mentor Comercial do vendedor mostram o **mesmo total de vendas**.
2. Toda venda com `submission_status` diferente de `draft` é contabilizada em **todas** as telas — nenhuma tela conta rascunho, nenhuma tela ignora lançamento oficial.
3. A feature flag que hoje alterna a fonte de dados (`mx_flag_lancamentos_via_rpc`) não pode produzir números diferentes entre usuários da mesma loja — ou a flag vira 100% RPC em todo lugar, ou é removida.
4. Existe teste automatizado (`*.test.ts`) que compara o total agregado pela via RPC e pela via SELECT direto para o mesmo dataset e falha se divergirem.
5. Após o fix, reprocessar/validar manualmente as lojas citadas como recém-implementadas para confirmar paridade retroativa.

---

## Plano de Diagnóstico Técnico — Divergência de Vendas

### Achado 1 (ATUALIZADO — causa raiz provável confirmada por código) — Dois sistemas de contagem de venda coexistindo, migração incompleta

Existem **dois read models de "venda" concorrentes** no schema, e a migração que trocou um pelo outro só cobriu parte das telas:

**Modelo NOVO (canônico, orientado a evento):** `eventos_comerciais` (`tipo_evento = 'venda_realizada'`) + `oportunidades` (`etapa = 'ganho'`). Criado/consolidado por:
- `supabase/migrations/20260710140000_transactional_direct_sale_and_competence.sql` — RPC `registrar_venda_direta`: cria oportunidade + **exatamente 1** evento oficial de venda + entrega opcional, numa transação, com dedup por `(loja_id, telefone_normalizado)` via `pg_advisory_xact_lock`. É o caminho oficial de registro de venda hoje.
- `supabase/migrations/20260710150000_official_seller_performance.sql` — RPC `vendedor_performance_oficial`: conta `count(*)` de `eventos_comerciais` (`venda_realizada`) por vendedor/loja/período. Comentário no topo do arquivo: *"Read model único para **Home, Minha Meta, Ranking e Relatórios**"* — ou seja, o próprio autor da migration já delimitou o escopo, e **painel administrativo de rede não estava na lista**.
- Consumido por: [src/hooks/useRanking.ts:87](src/hooks/useRanking.ts#L87) (`useRanking`, Mentor Comercial/ranking por loja) e [src/hooks/useOfficialSellerPerformance.ts](src/hooks/useOfficialSellerPerformance.ts) (usado em `useDashboardLojaData.ts`, dashboard do dono da loja).

**Modelo LEGADO (self-report diário):** `lancamentos_diarios` — soma de `vnd_porta_prev_day + vnd_cart_prev_day + vnd_net_prev_day` preenchidos manualmente no fechamento diário do vendedor. Filtro `metric_scope='daily'` + `submission_status <> 'draft'` (`isOfficialLancamento()`, [src/hooks/useRanking.ts:30-32](src/hooks/useRanking.ts#L30)). Ainda alimenta, via `useGlobalRanking`/`useStorePerformance`/`useStoresStats` (gated pela flag `isLancamentosViaRpcEnabled()` entre RPC `get_lancamentos_*` e SELECT direto — mesma tabela em ambos os ramos):
- [src/features/ranking/hooks/useGlobalRankingPageData.ts](src/features/ranking/hooks/useGlobalRankingPageData.ts) / `GlobalRankingView.tsx`
- [src/features/sales-performance/hooks/useStorePerformancePage.ts](src/features/sales-performance/hooks/useStorePerformancePage.ts) / `StorePerformanceView.tsx`, `src/pages/SellerPerformance.tsx`
- [src/features/lojas/hooks/useLojasPage.ts](src/features/lojas/hooks/useLojasPage.ts) (`useStoresStats`) — tela **Lojas** (visão de rede do admin, `OwnerExecutiveSection`)
- `src/features/configuracoes/components/tabs/LojasRedeTab.tsx`

**Por que isso explica o bug relatado:** venda registrada hoje via fluxo comercial (CRM/checkout) grava em `eventos_comerciais` através de `registrar_venda_direta`. Se o vendedor **não preencher também** os campos `vnd_*` no fechamento diário (`lancamentos_diarios`) — ou preencher em duplicidade/parcial — o número diverge estruturalmente: telas do modelo novo (Mentor Comercial do gestor/vendedor) mostram a venda real; telas do modelo legado (Painel Geral/Lojas, Ranking Global, Sales Performance) não a contam, porque estão olhando outra tabela. Isso é consistente e sistemático, não um bug intermitente de RLS — **é a arquitetura atual tendo duas fontes de verdade não sincronizadas**, o que também bate com "lojas recém-implementadas": lojas novas tendem a operar 100% pelo fluxo comercial novo (`registrar_venda_direta`) e nunca preenchem o fechamento diário legado do mesmo jeito que lojas antigas acostumadas ao fluxo antigo.

### Achado 2 — A flag `mx_flag_lancamentos_via_rpc` não muda a causa raiz, mas soma ruído

`src/lib/feature-flags.ts:19-48` — mesmo dentro do modelo legado, a flag (override por `localStorage`, depois env de build, default `false`) decide entre RPC `get_lancamentos_*` e SELECT direto **na mesma tabela** `lancamentos_diarios`. Não deveria, sozinha, mudar o total — mas se as duas implementações tiverem filtros sutilmente diferentes (a confirmar), é uma segunda fonte de divergência sobreposta à do Achado 1. Vale testar isoladamente depois de resolver o Achado 1.

### Achado 3 — Sinal indireto de migração incompleta: sync do Realtime feito em duas etapas

`src/lib/manager-sales-realtime-migration.test.ts` confirma que `lancamentos_diarios` foi ligado ao Supabase Realtime em `20260714185743_manager_sales_realtime_sync.sql`, e só **4 dias depois** `eventos_comerciais` foi ligado em `20260714213501_manager_sales_official_realtime_sync.sql` — evidência de que o rollout do modelo novo é recente e gradual, reforçando que outras superfícies (painéis de rede) provavelmente ainda não foram migradas.

### CONFIRMADO EM PRODUÇÃO (2026-07-23) — causa raiz validada com dado real

Rodada a query de comparação (mês corrente, `eventos_comerciais` vs `lancamentos_diarios`) direto no projeto `fbhcmzzgwjdgkctlfvbo` via Supabase Management API (token de acesso cedido pelo usuário nesta sessão, uso pontual, **não persistido** em nenhum arquivo/memória). Resultado (lojas com gap > 0, mês corrente):

| Loja | Vendas modelo novo (`eventos_comerciais`) | Vendas modelo legado (`lancamentos_diarios`) | Gap |
|---|---|---|---|
| BROTHERS CAR | 24 | 0 | 24 |
| IDEAL AUTOMOTIVE | 10 | 0 | 10 |
| MX CONSULTORIA | 11 | 2 | 9 |
| **LIAL** | **10** | **1** | **9** |
| AUTO UP | 5 | 0 | 5 |
| IDEAL MOTORS | 5 | 0 | 5 |
| (demais 33 lojas ativas) | 0 | 0 | 0 |

**LIAL bate exatamente com o print do Painel Geral anexado ao pedido original** (linha "LIAL · 26 leads · 3 agendamentos · 85 visitas · **1 venda**" / grade diária mostrando "DIELLE AMORIM · 1 · CONVERSÃO"): o painel mostra `1`, que é exatamente o total do modelo legado (`lancamentos_diarios`) para essa loja no mês — enquanto a loja de fato tem **10 vendas reais** registradas em `eventos_comerciais`. Hipótese do Achado 1 confirmada, não é mais especulação: **o Painel Geral/Lojas conta pelo modelo errado (legado)**, subcontando por um fator de até 10x nas lojas mais afetadas.

Lojas com 0/0 não têm sinal de divergência este mês (sem venda registrada em nenhum dos dois modelos) — não invalidam a hipótese, só não têm dado pra testar.

**Causa raiz do bug está confirmada. Não é RLS, não é vínculo de loja/consultor errado, não é a flag `mx_flag_lancamentos_via_rpc` — é leitura da tabela errada nos hooks `useGlobalRanking`/`useStorePerformance`/`useStoresStats` (e telas que os consomem).** A auditoria de RLS/multi-tenant do Achado original (item 5 dos passos investigativos) vira baixa prioridade — o gap se explica inteiramente pela divergência de read model.

### Passos de investigação recomendados (ordem sugerida)

1. **Confirmar controlado:** para uma loja com o bug reproduzido, rodar `SELECT count(*) FROM eventos_comerciais WHERE tipo_evento='venda_realizada' AND loja_id=... AND data_competencia BETWEEN ...` vs `SELECT sum(vnd_porta_prev_day+vnd_cart_prev_day+vnd_net_prev_day) FROM lancamentos_diarios WHERE store_id=... AND submission_status<>'draft' AND ...` — confirmar que os totais realmente divergem como a hipótese prevê (via CLI Supabase linkada — MCP Supabase não tem permissão neste projeto, ver `reference_supabase_mx_performance` memory; precisa `SUPABASE_ACCESS_TOKEN` do usuário).
2. Confirmar se o componente exato que renderiza "Performance das lojas"/"VENDAS NO MÊS" no Painel Geral usa de fato `useStoresStats`/`useLojasPage` ou outro hook ainda não localizado (esta análise não achou o componente-fonte exato do card "VENDAS NO MÊS"/"FLUXO COMERCIAL"; `useLojasPage`/`OwnerExecutiveSection` é o candidato mais forte pelas colunas batendo, mas não 100% confirmado).
3. Levantar, por loja, se o fluxo comercial atual usa `registrar_venda_direta` consistentemente ou se ainda existem caminhos que só tocam `lancamentos_diarios` sem gerar `eventos_comerciais` (o inverso do problema).
4. Decisão de arquitetura: migrar os hooks legados (`useGlobalRanking`, `useStorePerformance`, `useStoresStats`) para `vendedor_performance_oficial` (ou uma RPC-irmã agregada por rede), deprecando a contagem de "vendas" via `lancamentos_diarios` — mantendo `lancamentos_diarios` só para o que ele ainda é fonte de verdade (leads/agendamentos/visitas/disciplina, não afetados por este bug).
5. Auditoria retroativa: para lojas recém-implementadas, comparar `eventos_comerciais` vs `lancamentos_diarios` do mês inteiro e decidir se precisa de backfill (o padrão do `INSERT ... backfill_oportunidades` no topo de `20260710150000_official_seller_performance.sql` é o precedente a seguir).

### Owners sugeridos (conforme matriz de delegação AIOX)
- Confirmação de causa raiz com dados reais + backfill → **@data-engineer**
- Decisão de arquitetura (migrar consumers para `eventos_comerciais`, aposentar `lancamentos_diarios` como fonte de vendas) → **@architect**
- Modelagem de status de venda (Story 2 — cancelamento/desistência em `eventos_comerciais`/`oportunidades`) → **@architect** + **@data-engineer**
- Stories formais + critérios finais → **@po** (validação) / **@sm** (criação)

---

## FIX APLICADO (2026-07-23) — Story 3 (Painel Geral / PainelConsultor.tsx)

### Componente exato localizado

`src/pages/PainelConsultor.tsx:248-251` (`fetchNetworkSnapshot`) — é a tela "Painel Geral" dos prints originais (cards `VENDAS NO MÊS`/`FLUXO COMERCIAL`/`LOJAS CRÍTICAS`/`DISCIPLINA MÉDIA`, tabela "Performance das lojas", campo "Localizar unidade"). Chama `supabase.rpc('get_resumo_rede_periodo', ...)`, definida em `supabase/migrations/20260718093000_network_summary_rpc.sql`, que somava `sales` a partir de `lancamentos_diarios.vnd_porta_prev_day + vnd_cart_prev_day + vnd_net_prev_day` — o modelo legado do Achado 1. Confirma 100% a hipótese: é o mesmo padrão arquitetural, só que na tela certa desta vez.

(O outro print, "Grade Diária" com JOAO DANIEL/DIELLE AMORIM/BRUNO SANTOS, é `src/features/dashboard-loja/sections/RankingSection.tsx`, alimentado por `useRanking`/`vendedor_performance_oficial` — já correto, modelo novo. `viewMode='day'` nesse print, por isso os números baixos ali não são o bug, são atividade do dia.)

### Correção

Migration `supabase/migrations/20260723150000_network_summary_sales_source_fix.sql` — `CREATE OR REPLACE FUNCTION public.get_resumo_rede_periodo`: coluna `sales` agora conta `eventos_comerciais` (`tipo_evento='venda_realizada'`), mesmo critério de `vendedor_performance_oficial`. `leads`/`agd`/`vis` continuam vindo de `lancamentos_diarios` (não fazem parte do bug). Autorização (`eh_area_interna_mx()`), validação de range e `log_rpc_error` preservados 1:1. Sem mudança de contrato (assinatura, tipo de retorno, grants) — nenhum client precisa mudar.

Teste: `src/lib/network-summary-sales-source-fix.test.ts` (4/4 pass) — valida que a função lê `eventos_comerciais`, não soma mais `vnd_*`, preserva `leads/agd/vis` e preserva auth/validação/grants.

### Aplicado e verificado em produção (projeto `fbhcmzzgwjdgkctlfvbo`)

Migration aplicada via Supabase Management API (token cedido pelo usuário nesta sessão, uso pontual, não persistido) e registrada em `supabase_migrations.schema_migrations` (version `20260723150000`) para o `supabase migration list --linked` ficar em dia. `pg_proc.prosrc` confirmado contendo a nova lógica.

Re-execução da lógica da função nova, mês corrente, produção:

| Loja | Vendas (antes — legado) | Vendas (depois — `eventos_comerciais`) | Leads/Agd/Visitas (inalterados) |
|---|---|---|---|
| LIAL | 1 | **10** | 26 / 3 / 85 (bate exato com o print original) |
| BROTHERS CAR | 0 | **25** | — |
| IDEAL AUTOMOTIVE | 0 | **10** | — |
| MX CONSULTORIA | 2 | **11** | 42 / 19 / 70 |
| AUTO UP | 0 | **5** | — |
| IDEAL MOTORS | 0 | **5** | — |

`leads`/`agd`/`vis` de LIAL e MX CONSULTORIA batem exatamente com os prints originais — confirma que só a coluna `sales` estava errada, resto do pipeline sempre esteve certo.

### Testes rodados

- `bun test src/lib/network-summary-sales-source-fix.test.ts` → 4 pass.
- `bun test src/lib` (511 testes, projeto inteiro) → 511 pass, 0 fail.
- `npm run typecheck` → limpo.
- `npm test` (suíte completa, 1391 testes) → 1389 pass, **2 fail pré-existentes e não relacionados**: `carteira-source-parity.test.ts` (`VeiculosChegaram.jsx` Base44 parity) — arquivo `src/components/carteira/VeiculosChegaram.jsx` está modificado no working tree por trabalho em andamento de outra sessão/processo neste mesmo diretório (não-worktree), sem relação com `eventos_comerciais`/`lancamentos_diarios`/`PainelConsultor`. Não foi tocado nem investigado a fundo aqui — fora de escopo desta correção.

### O que NÃO foi feito (fora do escopo desta rodada, fica para @architect priorizar)

`useGlobalRanking`, `useStorePerformance` (`src/hooks/useRanking.ts`) e as telas Ranking Global (`GlobalRankingView.tsx`) / Sales Performance (`StorePerformanceView.tsx`) têm a **mesma falha arquitetural** (leem `lancamentos_diarios` para vendas) mas não foram alteradas nesta rodada — não havia print/confirmação direta de bug nessas telas especificamente, e trocar 2 hooks com bastante lógica própria (flag `mx_flag_lancamentos_via_rpc`, status "Presente/Ausente" em tempo real) merece revisão de @architect antes, não é tão cirúrgico quanto o fix do `get_resumo_rede_periodo`. Recomendo abrir como fast-follow.
