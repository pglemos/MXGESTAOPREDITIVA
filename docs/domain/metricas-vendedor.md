# Dicionário Oficial de Métricas do Vendedor

**Status:** Completo (auditoria 2026-07-11, item 2.3.4 do backlog de remediação)  
**Fonte de verdade:** código verificado arquivo:linha — não editar sem re-verificar  
**Consumidores gerais:** VendedorHome, Ranking, Relatórios, CRM

---

## 1. Score MX (Individual)

**Definição:** Nota 0–100 do vendedor combinando três dimensões (resultado, processo, disciplina), classificada em bandas.

**Fórmula (RPC `compute_individual_score_mvp(p_user, p_period)`):**
```
value = round(0.40 × resultado + 0.30 × processo + 0.30 × disciplina)
```
- Versão original: `supabase/migrations/20260609140000_mx_score_individual_mvp_rpc.sql:69`
- Versão vigente (recriada com disciplina persistida): `20260626120000_ev1_5_disciplina_persistida.sql`

**Dimensões:**
- **Resultado** (`20260609140000:63-67`): `% oportunidades com etapa='ganho' sobre o total do vendedor`. **ATENÇÃO: sem janela temporal** — considera TODAS as oportunidades do vendedor (não 7 dias).
- **Processo** (`20260609140000:52-60`): `% de comparecimento entre agendamentos resolvidos` (status `compareceu` / `nao_compareceu`) nos últimos 30 dias.
- **Disciplina** (`20260626120000:216-226`): `round(avg(pontuacao_disciplina_final))` dos lançamentos dos últimos 7 dias com o campo preenchido. Fallback pré-EV-1.5 (`:229-234`): `LEAST(100, round(count(DISTINCT reference_date) / 7 × 100))`.

**Bandas (`classify_score`, `20260527110000_score_engine_schema.sql:96-108`):**
| Banda | Faixa |
|-------|-------|
| elite | ≥ 90 |
| excellent | ≥ 80 |
| good | ≥ 70 |
| attention | ≥ 60 |
| critical | < 60 ou NULL |

**Fonte de dados:** tabelas `oportunidades`, `agendamentos`, `lancamentos_diarios`. Persistência em `score_calculations` — **imutável** (INSERT-only, idempotente por `(scope_type, scope_id, period, calculation_version)`, versão `mvp_v1`).

**Granularidade/Competência:** 1 cálculo por vendedor por dia (`period = CURRENT_DATE`); janelas 7d (disciplina), 30d (processo), all-time (resultado).

**Arredondamento:** cada dimensão `round()` inteiro; value final `round()` inteiro; hook aplica `Math.round` novamente.

**Consumidores:** `src/features/crm/hooks/useMeuScore.ts:34-87` (lê último `score_calculations` individual; se ausente, dispara a RPC e relê; labels de banda em PT via `BAND_LABEL`/`NEXT_BAND`) → `MXScoreCard`, `ScoreBandBadge`, ScoreCard do VendedorHome.

---

## 2. Disciplina (pontuação persistida no fechamento)

**Definição:** Pontuação 0–100 gravada em cada fechamento diário, refletindo cumprimento da rotina, com penalidade por atraso.

**Fórmula (`submit_checkin`, `20260626120000_ev1_5_disciplina_persistida.sql`):**
```
base  = LEAST(100, GREATEST(0, payload.pontuacao_disciplina_base))   -- linha 89
final = LEAST(100, GREATEST(0, base − 10pp se finalizado_apos_prazo)) -- linhas 97-98
```
- `finalizado_apos_prazo := v_is_late_now AND v_liberado` (linhas 90-94) — ou seja, penaliza quando o fechamento é finalizado após o prazo **via liberação**; aplica-se apenas aos escopos `daily`/`historical`; escopo `adjustment` (correção de gestor) nunca penaliza.
- Derivada no servidor — não confia no valor do client (comentário linha 39).

**Fonte de dados:** tabela `lancamentos_diarios`, colunas `pontuacao_disciplina_base` / `pontuacao_disciplina_final`.

**Granularidade:** por fechamento diário (1/dia/vendedor).

**Arredondamento:** clamp [0,100]; média posterior arredondada pelos consumidores.

**Consumidores:** dimensão disciplina do Score MX (média 7d); RPC de performance oficial (média do período); ver também §5 (disciplina client-side de 7 dias).

---

## 3. Ranking (Classificação de Vendedores)

**Definição:** Posição relativa dos vendedores da loja ordenados por vendas do período.

**Fonte de dados:** RPC `vendedor_performance_oficial` (ver §4) + `vendedores_loja`/`vinculos_loja` (equipe ativa) + `regras_metas_loja` (meta).

**Ordenação (`src/hooks/useRanking.ts:187-192`):**
1. `vnd_total` decrescente
2. Empate: perfil "Venda Loja" vai para o final
3. Empate: `visitas` decrescente

Posição = índice + 1 (`useRanking.ts:212` e `:369`).

**Derivados por entrada (`useRanking.ts:193-212`):**
- `atingimento = calcularAtingimento(vnd_total, meta)` (meta > 0)
- `efficiency = vnd_total / (meta/total_dias × dias_decorridos) × 100`
- `projecao = round(vnd_total / dias_decorridos × total_dias)` (Venda Loja: = vnd_total)
- `ritmo = ceil((meta − vnd_total) / dias_restantes)` (Venda Loja: 0)
- `gap = max(meta − vnd_total, 0)`

**Granularidade/Competência:** mês corrente por padrão (1º do mês → último dia, `useRanking.ts:52-57`); aceita filtros de data.

**Consumidores:** `src/pages/Ranking.tsx`, `PodioRanking`/`TabelaRanking`, `RankingPanel` (VendedorHome), `RankingSection` (dashboard-loja).

---

## 4. Performance de Vendas (Oficial)

**Definição:** Métrica oficial mensal do vendedor calculada server-side, fonte única para Home/Ranking.

**RPC:** `vendedor_performance_oficial(p_start_date, p_end_date, p_store_id, p_seller_id)` — `supabase/migrations/20260710150000_official_seller_performance.sql`.

**Componentes (linhas verificadas):**
- **Vendas realizadas** (`:92-101`): `count(eventos_comerciais WHERE tipo_evento='venda_realizada')`, competência = `coalesce(data_competencia, data_evento em TZ America/Sao_Paulo)` no período.
- **Vendas do último dia** (`:96`): vendas com competência = `p_end_date`.
- **Projeção** (`:143`): `round(vendas / dias_decorridos × total_dias, 2)`.
- **Meta individual** (`:142` + CTE `store_rules :131-134`): `monthly_goal / seller_count`, onde `seller_count = greatest(1, nº vendedores ativos não venda-loja)`; perfil Venda Loja recebe meta 0. Fonte: `regras_metas_loja`. **Modos `custom`/`proportional` de rateio estão pendentes (backlog 2.3.1) — hoje o rateio é sempre divisão igual.**
- **Atingimento** (`:144`): `round(vendas / (monthly_goal / seller_count) × 100, 2)`; 0 se meta ≤ 0.
- **Disciplina** (`:120`): `avg(pontuacao_disciplina_final)` dos fechamentos oficiais do período (`metric_scope='daily'`, submetido, não-draft, com produção > 0 ou `zero_reason` preenchida — CTE `official_closings :102-114`).
- **Comissão realizada** (`:145`): `vendas × per_sale_commission_rate` (soma das `remuneracao_regras` ativas tipo `comissao_por_venda`).
- **Comissão projetada** (`:146`): `projeção × per_sale_commission_rate`.

**Granularidade/Competência:** por vendedor+loja, período arbitrário (Home usa 1º do mês → hoje; ver `useVendedorHomePage.ts:55-58`).

**Arredondamento:** projeção e atingimento com 2 casas decimais; contagens inteiras.

**Segurança:** RLS por papel — vendedor vê só a si; gestor/dono vê a loja; admins veem tudo (`:87-91`).

**Consumidores:** `src/hooks/useRanking.ts:44-84` (chama a RPC), `src/hooks/useOfficialSellerPerformance.ts` → `useVendedorHomePage.ts:59-90` (merge sobre legacyMetrics) → GoalCard, CommissionCard, Relatórios.

---

## 5. Disciplina da Rotina (indicador client-side de 7 dias)

**Definição:** % de dias com fechamento diário enviado nos últimos 7 dias (indicador leve da Home; distinto da pontuação do §2).

**Fórmula (`src/lib/daily-routine.ts:86-110`, `calculateDailyRoutineDiscipline`):**
```
percentage = round(dias_com_fechamento / dias_esperados × 100)
status: 'consistent' se ≥ 90, senão 'attention'; 'no_data' se 0 dias esperados
```

**Fonte:** `lancamentos_diarios` com `metric_scope='daily'` filtrados pelas 7 datas de referência (`useVendedorHomePage.ts:136-145`).

**Consumidores:** DisciplineCard, CloseDayCard e conquistas do VendedorHome.

---

## 6. Meta Mensal e fórmulas client-side

**Meta:** `regras_metas_loja.monthly_goal` (loja) dividida igualmente entre vendedores ativos não venda-loja (ver §4). Hooks: `useGoals`/`useStoreMetaRules` (`src/hooks/useGoals.ts`).

**Fórmulas utilitárias (`src/lib/calculations.ts`, verificadas):**
| Função | Linhas | Fórmula | Arredondamento |
|--------|--------|---------|----------------|
| `calcularAtingimento` | 24-28 | `vendas / meta × 100` | 1 casa decimal (`round(x×10)/10`); 0 se meta ≤ 0 |
| `calcularFaltaX` | 30-33 | `max(meta − vendas, 0)` | inteiro |
| `calcularProjecao` | 35-39 | `(vendas / dias_decorridos) × total_dias` | `Math.round` inteiro |
| `calcularRitmo` | 41-46 | `max(meta − vendas, 0) / dias_restantes` | 1 casa decimal |
| `calcularFunil` | 98-114 | leads→agd→visitas→vendas com taxas `round(%)`; agd = `agd_cart_prev_day + agd_net_prev_day` | inteiro |
| `somarVendas` | 227-229 | `Σ (vnd_porta_prev_day + vnd_cart_prev_day + vnd_net_prev_day)` | inteiro |

Dias úteis conforme metodologia MX: segunda a sábado (`isBusinessDay`, `calculations.ts:48-51`).

---

## Resumo de Fontes

| Métrica | Fonte principal | Cálculo | Consumidor UI |
|---------|-----------------|---------|---------------|
| Score MX | `score_calculations` (via RPC `compute_individual_score_mvp`) | server | `useMeuScore` → MXScoreCard |
| Disciplina (pontuação) | `lancamentos_diarios.pontuacao_disciplina_final` (via `submit_checkin`) | server | Score, Performance |
| Disciplina (7d Home) | `lancamentos_diarios` | client (`daily-routine.ts`) | DisciplineCard |
| Ranking | RPC `vendedor_performance_oficial` | server + sort client | Ranking.tsx |
| Performance | RPC `vendedor_performance_oficial` | server | GoalCard/CommissionCard |
| Meta | `regras_metas_loja.monthly_goal / seller_count` | server | GoalCard |

## Pendências conhecidas

- Rateio de meta `custom`/`proportional` não implementado (backlog 2.3.1) — divisão igual hardcoded na RPC.
- Dimensão "resultado" do Score MX não tem janela temporal (all-time) — divergência potencial vs. expectativa de janela 7d; validar com produto.
- Coexistem dois indicadores de "disciplina" (pontuação persistida §2 vs. % de fechamentos §5) — nomes iguais na UI podem confundir.
