# Auditoria de Padrão UX — Módulo Vendedor

**Data:** 2026-06-17 · **Escopo:** todas as telas e arquivos do módulo vendedor
**Base de padrões:** `docs/reviews/ux-specialist-review.md` (catálogo UX-001..028)
**Método:** varredura estática (LOC, hex, a11y, skeleton, error boundaries, supabase direto, RHF, inline style) sobre a superfície vendedor.

---

## 1. Sumário Executivo

| Categoria | Resultado |
|-----------|-----------|
| ✅ **Dentro do padrão** | 0 hex hardcoded (lint-tokens enforce), 0 `supabase.from` direto nas telas, 0 `<img>` sem alt, `vendedor-home` decomposto (sections/hooks/Skeleton/ErrorBoundary) |
| ⚠️ **Fora do padrão** | 6 desvios sistêmicos: monolitos, `th scope` ausente, skeleton ausente, error boundary único, RHF ausente, aria-live ausente |

**Veredito:** módulo **funcionalmente 100%** (gates verdes), mas com **dívida de padrão UX** concentrada nas telas grandes (Treinamentos, PDI, Feedback) e containers CRM.

---

## 2. Achados Fora do Padrão

| # | UX-ID | Severidade | Desvio | Evidência | Arquivos |
|---|-------|-----------|--------|-----------|----------|
| V-1 | UX-007 | **Alta** | `<th>` sem `scope="col"` | 66 `<th>` em 8 telas, `scope=0` em todas | LeadsVendedor(6), CarteiraClientes(13), CentralExecucao(12), CheckinCrmSection(2), CheckinAdjustmentTab(9), VendedorFeedback(6), VendedorPDI(6), VendedorTreinamentos(12) |
| V-2 | UX-001 | **Alta** | Pages/containers monolíticos (>1000 LOC) | 7 arquivos; pior caso 3232 | VendedorTreinamentos **3232**, VendedorPDI 1445, CentralExecucao 1226, VendedorFeedback 1188, FunilVendedor 1133, VendedorHome 1012, MeuPerfilVendedor 1000 |
| V-3 | UX-008 | **Média** | Loading sem skeleton (CLS) | telas ramificam em `loading` mas renderizam 0 skeleton | VendedorPDI, VendedorFeedback, FunilVendedor, MeuPerfilVendedor, CentralExecucao (Treinamentos já tem) |
| V-4 | UX-025 | **Média** | Error boundary único no topo | 1 `<ErrorBoundary>` envolve TODAS as rotas (App.tsx:221-361); erro em 1 tela derruba app inteiro | src/App.tsx |
| V-5 | UX-009 | **Média** | Forms sem react-hook-form | 0 uso de RHF/zod nas telas vendedor; estado manual | Checkin, VendedorFeedback, VendedorPDI, VendedorConfiguracoes |
| V-6 | UX-007 | **Baixa** | Sem `aria-live` em regiões de status | 0 ocorrências (sonner cobre toast; updates custom não) | todas as telas |
| V-7 | UX-018 | **Baixa** | Inline `style={{}}` | ~10 arquivos (1-4 cada), maioria largura dinâmica de progress bar | CarteiraClientes(4), FunilVendedor(2), VendedorHome(2), outros(1) |

---

## 3. Plano de Correção

### Quick-wins (baixo risco, ~14h)
1. **V-1 `th scope`** (~3h) — adicionar `scope="col"` aos 66 headers. Substituição mecânica, zero risco visual. **Maior ganho a11y.**
2. **V-3 skeletons** (~6h) — extrair `<Skeleton variant>` para os 5 estados de loading sem skeleton. Reusar padrão de `vendedor-home`.
3. **V-4 error boundary por rota** (~3h) — extrair `<RouteErrorBoundary>` e envolver cada lazy route vendedor (contém falha à rota).
4. **V-6 aria-live** (~2h) — `aria-live="polite"` em banners de status dinâmico (gate, prescrição, ritual).

### Grandes refatorações (sprint dedicada)
- **V-2 monolitos** (~80h) — decompor Treinamentos→PDI→Feedback→containers CRM no padrão `container <200 LOC + sections/`. Ordem por LOC desc. Baseline Playwright pré/pós.
- **V-5 RHF** (~16h vendedor) — piloto `Checkin.tsx`, depois Feedback/PDI/Configuracoes. Adapter `<Form>` + zod.

### Dentro do padrão — manter
- Tokens (lint-tokens AST bloqueia hex) · arquitetura hook-por-domínio (sem supabase direto nas telas) · `vendedor-home` como referência de decomposição.

---

## 4. Recomendação

Aplicar **quick-wins V-1/V-3/V-4/V-6 já** (baixo risco, alto ganho a11y/resiliência, não tocam lógica). Monolitos (V-2) e RHF (V-5) entram como epic de hardening UX separado — não bloqueiam funcionalidade.
