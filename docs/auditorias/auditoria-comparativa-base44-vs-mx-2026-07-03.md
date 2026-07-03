# Auditoria Comparativa — Base44 (protótipo) vs MX (produção) — Módulo Vendedor

**Data:** 2026-07-03
**Método:** leitura direta do export fonte do Base44 (zip `gestormx.zip`, atualizado em `src/base44-reference/`) contra o código-fonte atual do módulo vendedor no MX, página a página, componente a componente. 5 auditorias paralelas.
**Escopo:** Dashboard/Remuneração, Funil, Carteira, Execução, Treinamentos, Feedback, PDI, Ranking, Perfil.

---

## Sumário Executivo

O módulo vendedor do MX **não está atrás do Base44 em tudo** — em Treinamentos/Feedback/PDI e Central de Execução, o MX é hoje **mais avançado** (sessões PDI, feedback automático, integração com Central, cadência). O gap real está concentrado em **3 áreas**:

1. **Remuneração/Comissão** — maior gap de conteúdo visual. 5 cards do Base44 não existem no MX.
2. **Ranking** — 3 subcomponentes visuais desapareceram na refatoração.
3. ~~**Funil** — 3 blocos de diagnóstico/ação ausentes.~~ **CORRIGIDO 2026-07-03:** verificado ao vivo no app Base44 (aba Chrome) que `DiagnosticoPrincipal`/`OndeAgirAgora`/`RecuperarVendas` são arquivos órfãos, não usados em `FunilVendas.jsx`. Falso positivo — esta auditoria comparou existência de arquivo, não composição real da página. **Lição: auditoria de paridade sempre precisa confirmar contra o app renderizado, não só o código-fonte.**

**Status de execução (2026-07-03, mesma sessão):** Remuneração ✅, Ranking ✅, Funil ✅ (gap era falso positivo), Carteira ✅ (ScriptIA implementado como templates estáticos com 5 tons — ver decisão abaixo). Detalhes em `project_crm_vendedor_epic.md` (memória).

**3 conflitos de decisão de arquitetura encontrados durante a execução (perguntado ao user em cada um):**
1. Cor de destaque: MX tinha trocado rosa→azul (`commit a8fe03b`, "remove purple"). Revertido para teal+rosa exato do Base44.
2. Tipografia: story `EV-14` tinha suavizado `font-black`→`font-bold` nos headers (validado pela Mariane). Revertido só o `<h1>` de página pra `font-black` (evidência real do Base44 mostrou que só o h1 usa peso pesado, não botões/badges).
3. `ScriptIA`: Base44 usa LLM real. MX tem NFR-IA1 "sem LLM". User escolheu manter sem LLM — templates estáticos com transformação determinística por tom.

Gaps menores em Carteira (ScriptIA com LLM, fluxo contínuo pós-WhatsApp) e Treinamentos (player com quiz integrado, aulas ao vivo com gravação real).

---

## 1. Remuneração / Dashboard Financeiro — MAIOR GAP

**Base44:** `VendedorDashboard.jsx` (rota `/`) + 14 componentes em `components/vendedor/*`
**MX:** `MinhaRemuneracaoPage.tsx` + `useRemuneracaoEstimadaVendedor()` + `lib/comparativo.ts`

| Card Base44 | Status MX | Gap |
|---|---|---|
| CommissionHeroCard | Parcial (4 summary cards genéricos) | Sem "hero card" único destacado |
| **MilestoneCard** | ❌ Ausente | "Faltam X veículos para ganhar Y" — não renderizado (dado existe, falta UI) |
| **HotOpportunitiesCard** | ❌ Ausente | Oportunidades quentes → comissão potencial. Não aparece na tela de remuneração |
| **PerformanceCard** | ❌ Ausente | Comparativo "melhor mês vs atual" |
| **PotentialCommissionCard** | ❌ Ausente | Comissão projetada vs ganho potencial com oportunidades |
| **LastSixMonthsCard** | ❌ Ausente | Gráfico de barras 6 meses, destaca melhor mês |
| RecordRoutineCard | ❌ Ausente | — |
| CalculationDetailsDrawer | Parcial (`FormulaBreakdown` inline) | Base44 usa drawer/modal; MX é inline (aceitável) |
| PeriodFilter | Parcial | Base44: dropdown (mês atual/anterior/30d/customizado). MX: toggle binário Projetado/Realizado |

**Gaps ordenados por impacto:**
1. Oportunidades Quentes (motivacional alto)
2. Histórico 6 meses (coaching/tendência)
3. Milestone / próximo marco (motivação, dado já existe no backend)
4. Filtro de período customizado
5. Compactação visual em cards (mobile scroll longo hoje)

---

## 2. Funil de Vendas

**Base44:** `FunilVendas.jsx` + 9 componentes em `components/funil/*`
**MX:** `FunilVendedor.tsx` + `FunilVendedor.container.tsx`

| Componente Base44 | Status MX | Gap |
|---|---|---|
| StatusMeta | Parcial | Base44: 1 card horizontal+progresso+grid 2×2. MX: 6 cards separados |
| EsforcoNecessario | Sim | Base44 escolhe 1 canal principal; MX mostra 3 em paralelo (mais informação, ok) |
| EficienciaCanal | Sim | Base44 expansível ao clique; MX fixo |
| BaseEstatistica | Sim | Praticamente idêntico |
| **DiagnosticoPrincipal** | ❌ Ausente | Categorização automática (Volume/Conversão/Recuperação) — orienta vendedor sobre o problema principal |
| **OndeAgirAgora** | ❌ Ausente | Até 3 ações priorizadas por canal |
| **RecuperarVendas** | ❌ Ausente | 3 maiores vazamentos do funil + recomendação |
| FunilCompacto | ❌ Ausente | Auxiliar visual de etapas com setas — baixo impacto isolado |

**Diferenças de cálculo:** "necessário/dia" — Base44 mostra decimal (X.XX), MX arredonda com `Math.ceil` (perde granularidade em metas baixas).

**Gaps ordenados por impacto:** DiagnosticoPrincipal > OndeAgirAgora > RecuperarVendas > decimal necessário/dia.

---

## 3. Carteira de Clientes

**Base44:** `CarteiraClientes.jsx` + 13 componentes em `components/carteira/*`
**MX:** `CarteiraClientes.tsx` + containers em `features/crm/`

18 de 21 componentes (Carteira+Execução) já implementados. Gaps:

1. **ScriptIA (CRÍTICO)** — Base44 gera script de WhatsApp via LLM com 5 tons (consultivo/direto/leve/reativação/áudio) + "gerar outra versão". MX usa templates estáticos, sem geração por IA.
2. **ProximaOportunidadeModal / fluxo contínuo (ALTO)** — Base44 mantém fila navegável fluida entre oportunidades. MX recarrega lista completa a cada ação.
3. **RetornoWhatsAppModal (ALTO)** — Base44 detecta retorno do WhatsApp via `visibilitychange` (janela 2min) e abre modal de resultado rápido automaticamente. MX não tem essa automação.
4. Gamificação do Modo Ataque (MÉDIO) — Base44 tem stats de sessão, tela de celebração (Trophy), timer. MX é funcional mas sem reforço positivo/persistência de sessão (sessionStorage).

## 4. Central de Execução

**Superset do Base44** — todos os 7 componentes (AbaHoje, AbaRotina, PendenciasDrawer, ResolverModal, ReagendarPendenciaModal, NovaAtividadeModal, ClienteFichaSheet) implementados, `PendenciasDrawer` idêntico em cores/tipos/ações. Sem gaps relevantes.

---

## 5. Treinamentos / Feedback / PDI

MX é **mais avançado** que Base44 nessas 3 telas (sessões PDI com histórico/evolução, feedback automático via cadência, ações vinculadas à Central, autoavaliação para autônomos). Gaps reais são de **infraestrutura de conteúdo**, não de UX:

1. Player de vídeo com quiz integrado (Base44 tem 5-10 perguntas com aprovação 70% dentro do player; MX trata Provas como aba/tela separada mockada)
2. Aulas ao vivo com URL de gravação real (MX hoje é mock)
3. `Desenvolvimento.jsx` (wrapper de abas Feedback+PDI) — **não vale reproduzir**; é só reorganização de UI, MX já trata como fluxos distintos por bom motivo (papéis diferentes: ler devolutiva vs executar plano).

---

## 6. Ranking

**Base44:** `Ranking.jsx` + 5 componentes em `components/ranking/*`
**MX:** `Ranking.tsx` + `RankingPodium` + `LeaderboardList`/`SellerListItem`

| Componente Base44 | Status MX | Gap |
|---|---|---|
| PodioRanking | Sim (refatorado, `RankingPodium`) | UX modernizada, comportamento preservado |
| **SuaPosicao** | ❌ Ausente como card isolado | "Faltam X para o Nº lugar" não calculado/exibido; hoje só um badge "VOCÊ" na lista |
| **CorridaPeriodo** | ❌ Ausente | Pista visual comparativa top-8 (avatares horizontais, meta como linha de chegada) desapareceu — virou lista vertical |
| **BonificacaoPeriodo** | ❌ Ausente | Sem card de bonificação 1º/2º/3º lugar + bônus meta; dado (`BonificacaoRanking`) não trafega em nenhum hook MX |
| TabelaRanking | Substituído por `LeaderboardList` | Perda de visão tabular condensada (7 colunas); status badge só aparece em modal, não inline |

**Gaps ordenados por impacto:** BonificacaoPeriodo (crítico, dado nem existe) > CorridaPeriodo > SuaPosicao > TabelaRanking (é trade-off de design, não necessariamente bug).

---

## 7. Meu Perfil

Estrutura MX é **superset** do Base44 (vínculo loja/autônomo, mix de canais, rotina com dias trabalhados, progresso de treinamento, remuneração estimada). Único ponto a confirmar: campo `education` (formação) existe no Base44 e não foi visto explicitamente no MX — verificar se foi descontinuado de propósito ou esquecido.

---

## Consolidado — Gaps do Módulo Inteiro, por Impacto

| # | Área | Gap | Esforço estimado |
|---|------|-----|-------------------|
| 1 | Remuneração | HotOpportunitiesCard + PotentialCommissionCard (oportunidades quentes → comissão potencial) | Médio |
| 2 | Remuneração | LastSixMonthsCard (histórico 6 meses) | Médio |
| 3 | Ranking | BonificacaoPeriodo (dado + card) | Médio-Alto (precisa schema novo) |
| 4 | Funil | DiagnosticoPrincipal + OndeAgirAgora + RecuperarVendas | Médio-Alto |
| 5 | Ranking | CorridaPeriodo (pista visual top-8) | Médio |
| 6 | Remuneração | MilestoneCard (dado já existe, só falta UI) | Baixo |
| 7 | Carteira | ScriptIA com LLM | Alto (depende de provider IA) |
| 8 | Carteira | RetornoWhatsAppModal + fluxo contínuo | Médio |
| 9 | Ranking | SuaPosicao (card isolado) | Baixo |
| 10 | Remuneração | Filtro de período customizado | Baixo |
| 11 | Treinamentos | Quiz integrado no player + gravações reais | Alto (infra de vídeo) |
| 12 | Carteira | Gamificação Modo Ataque (stats sessão + celebração) | Baixo |
| 13 | Perfil | Confirmar campo `education` | Trivial |

---

*Fonte: 5 auditorias paralelas (Explore agents) sobre `src/base44-reference/` (export atualizado do Base44) vs código-fonte atual do MX. Nenhuma alteração de código foi feita nesta etapa — apenas levantamento.*
