# Dicionário Oficial de Métricas do Vendedor

**Status:** Em construção (auditoria 2026-07-11)  
**Responsável:** Documentação técnica  
**Competência:** Vendedor  
**Consumidores:** VendedorHome, Ranking, Relatórios, CRM

---

## Disciplina da Rotina (Daily Routine Discipline)

**Definição:** Percentual de dias em que o vendedor completou seu Fechamento Diário (puxada diária) no período observado (últimos 7 dias).

**Fórmula:**
```
disciplina_percentage = (dias_puxadas_realizadas / dias_esperados) * 100
status = 'consistent' se >= 90%, senão 'attention' se > 0%, senão 'no_data'
```

**Fonte de Dados:**
- Tabela: `lancamentos_diarios` (checkins)
- Condição: `seller_user_id = {id}` e `metric_scope = 'daily'` e `reference_date` IN últimos 7 dias
- Coluna: `reference_date` (filtrada por datas esperadas)

**Granularidade:** 7 dias deslizantes (última semana a partir de referenceDate)

**Arredondamento:** `Math.round((submittedDays / expectedDays) * 100)` → inteiro

**Consumidores:**
- `VendedorHome.container.tsx` → DisciplineCard, conquistas, CloseDayCard
- `Home/Relatórios` para monitoramento de disciplina

**Localização do Código:**
- Cálculo: `src/lib/daily-routine.ts:86-110` (`calculateDailyRoutineDiscipline()`)
- Consumo: `src/features/vendedor-home/hooks/useVendedorHomePage.ts:136-145`

**Observações:**
- 7 dias = período fixo (últimos 7 dias trabalháveis)
- Exclui fins de semana implicitamente (apenas datas em referenceDates)
- Sem casas decimais; expressado como inteiro de 0-100

---

## Score MX (MX Score)

**Definição:** NÃO LOCALIZADO  
**Busca realizada:**
- `src/hooks/useMeuScore.ts` → arquivo não encontrado em exploração
- Referências em: `VendedorHome.container.tsx:55` → `const { score, loading: scoreLoading, bandLabel, nextBand } = useMeuScore()`
- Componente: `src/components/molecules/MXScoreCard.tsx`

**Caminho sugerido de investigação:**
- Hook: `useMeuScore()` (definição em falta)
- Arquivo de teste: `src/components/molecules/MXScoreCard.test.ts`
- Componente: `MXScoreCard.tsx`
- Badge: `ScoreBandBadge.tsx`

**Status:** Documento pendente de atualização — formula não documentada no código visitado

---

## Ranking (Classificação de Vendedores)

**Definição:** Posição relativa do vendedor na lista ordenada de desempenho (vendas no período).

**Fonte de Dados:**
- Hook: `useRanking()` em `src/hooks/useRanking.ts`
- Consumidor: `src/features/vendedor-home/hooks/useVendedorHomePage.ts:44`
- Componentes: `src/pages/Ranking.tsx`, `src/components/ranking/TabelaRanking.jsx`, `src/components/ranking/PodioRanking.jsx`

**Granularidade:** NÃO LOCALIZADO  
Suposição: Período mensal ou semanal (conforme configuração loja)

**Arredondamento:** Inteiro (posição)

**Consumidores:**
- `Ranking` page
- `RankingPanel` em VendedorHome
- Dashboard-loja: `RankingSection.tsx`

**Status:** Pendente — cálculo da fórmula não documentado no hook

---

## Performance de Vendas (Official Seller Performance)

**Definição:** Métrica de desempenho mensal com 5 componentes: vendas realizadas, meta mensal, atingimento (%), projeção, e vendas do último dia.

**Componentes:**
1. **Vendas Realizadas** (vendas_realizadas): Total de vendas concluídas no mês
2. **Meta Mensal** (meta): Target mensal para o vendedor
3. **Atingimento** (atingimento): Percentual `(vendas_realizadas / meta) * 100`
4. **Projeção** (vendas_projetadas): Estimativa de vendas até fim do mês
5. **Vendas Último Dia** (vendas_ultimo_dia): Vendas do dia anterior

**Fórmula:**
```
atingimento_percentage = (vendas_realizadas / meta) * 100
falta_x = max(meta - vendas_realizadas, 0)
projecao = calculada por RPC (fórmula conforme projection_mode da loja)
```

**Fonte de Dados:**
- RPC Supabase: `useOfficialSellerPerformance()` hook em `src/features/vendedor-home/hooks/useVendedorHomePage.ts:59-63`
- Parâmetros: `(start_date, end_date, seller_id, store_id)`
- Período: Mês corrente (1º do mês até data atual)

**Granularidade:** Diária (atualizada conforme vendas são registradas)

**Arredondamento:** 
- Atingimento: `Math.round()`
- Falta X: inteiro
- Projeção: conforme configuração (inteiro ou decimal)

**Consumidores:**
- `VendedorHome`: GoalCard, CommissionCard
- `Relatórios de Performance`
- `useVendedorHomePage()` compila tudo em `metrics`

**Localização do Código:**
- Hook: `src/features/vendedor-home/hooks/useVendedorHomePage.ts:59-63` (useOfficialSellerPerformance)
- Consumo: `useVendedorHomePage.ts:79-90` (metrics merge)
- Componente: `src/features/vendedor-home/sections/GoalCard.tsx`

**Observações:**
- Sobrescreve legacyMetrics quando disponível
- Determinada por RPC (implementation details em migration)
- Projeção depende de `projection_mode` da loja

---

## Meta Mensal (Goal)

**Definição:** Target mensal de vendas atribuído ao vendedor ou loja.

**Fórmula:** Definida em regras de meta da loja ou sistema corporativo

**Fonte de Dados:**
- Hook: `useGoals()` em `src/hooks/useGoals.ts`
- Tabelas: `goals` (loja), `seller_goals` (vendedor)
- Consumo: `useVendedorHomePage.ts:38-43`

**Granularidade:** Mensal

**Arredondamento:** Inteiro (unidades ou R$)

**Consumidores:**
- `GoalCard` component
- `Relatórios`
- Cálculo de `falta_x` em performance

**Status:** Parcialmente documentado — regras de cálculo em `useGoals` hook

---

## Resumo de Fontes

| Métrica | Tabela/RPC Principal | Hook | Componente UI |
|---------|----------------------|------|---------------|
| Disciplina | `lancamentos_diarios` | `useVendedorHomePage` | `DisciplineCard` |
| Score | NÃO LOCALIZADO | `useMeuScore` | `MXScoreCard` |
| Ranking | `ranking` (conforme `useRanking`) | `useRanking` | `Ranking.tsx` |
| Performance | RPC `official_seller_performance` | `useOfficialSellerPerformance` | `GoalCard` |
| Meta | `goals` + `seller_goals` | `useGoals` | `GoalCard` |

---

## Lacunas Encontradas

1. **Score MX**: Nenhum hook `useMeuScore` localizado — pode estar em arquivo renomeado ou em pasta de imports não explorada
2. **Ranking Formula**: Lógica de ordenação não documentada em código visitado
3. **Performance RPC**: Implementação em `supabase/migrations/20260710150000_official_seller_performance.sql` não lida
4. **Meta Calculation Rules**: Lógica em `useGoals` não visitada
5. **Arredondamento de Projeção**: Conforme `projection_mode` mas modo não documentado

---

## Próximos Passos para Completar

- [ ] Ler `src/hooks/useMeuScore.ts` e documentar Score
- [ ] Ler `src/hooks/useRanking.ts` e documentar fórmula de Ranking
- [ ] Ler migration `20260710150000_official_seller_performance.sql` para RPC details
- [ ] Ler `src/hooks/useGoals.ts` para regras de Meta
- [ ] Validar período de cálculo para cada métrica
- [ ] Documentar `projection_mode` options e cálculo
