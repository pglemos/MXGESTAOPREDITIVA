# Skeleton Screens — Guia de Uso

> **Story 3.14** — Sprint 3 — UX-perceived-perf
> Última atualização: 2026-05-19

## Quando usar Skeleton vs Spinner

| Cenário | Componente | Justificativa |
|--------|-----------|---------------|
| Loading > 300ms | **Skeleton** | Reduz percepção de espera (Nielsen +30%) e CLS |
| Loading < 300ms | **Sem indicador** | Skeleton "pisca" e degrada UX |
| Ação inline (botão "salvando") | `RefreshCw animate-spin` (spinner inline) | Feedback localizado |
| Page-level (carga inicial / refetch grande) | **Skeleton matching o layout final** | Evita CLS, reduz percepção de lentidão |
| Identificação de unidade / resolução de auth (curto e indeterminado) | Spinner centralizado | Layout não é conhecido ainda |

**Heurística:** se você conhece o layout final → use Skeleton; se é estado indeterminado de curtíssima duração → spinner.

## Padrão para evitar CLS

Skeleton deve ter **dimensões próximas ao conteúdo final**:
- Mesma altura de header/cards/linhas
- Mesmo grid (cols/breakpoints)
- Mesmo padding/gap

Use as classes do design system (`h-mx-10`, `h-mx-64`, `w-mx-48`, etc.) — elas casam com os componentes reais.

## Acessibilidade

- **Container pai** carregando: `aria-busy="true"` + `aria-live="polite"` + `aria-label="..."` descritivo
- **Skeleton (atom)**: já é `aria-hidden="true"` por padrão (decorativo)
- **Sem texto visível**: o `aria-label` do container anuncia o estado para AT
- **Reduced motion**: shimmer usa `motion-safe:animate-pulse` — desativado automaticamente

```tsx
{isLoading && (
  <main
    aria-busy="true"
    aria-live="polite"
    aria-label="Carregando ranking"
  >
    <SkeletonStats count={4} />
    <SkeletonList items={6} showAvatar />
  </main>
)}
```

## Componentes disponíveis

| Componente | Path | Uso típico |
|-----------|------|-----------|
| `<Skeleton variant=... />` | `@/components/atoms/Skeleton` | Primitivo (rect/circle/text/avatar/chart/card/table-row) |
| `<SkeletonTable />` | `@/components/atoms/skeletons` | Tabelas (rows × cols) |
| `<SkeletonCard />` | `@/components/atoms/skeletons` | Cards com header/body |
| `<SkeletonList />` | `@/components/atoms/skeletons` | Listas (notificações, vendedores) |
| `<SkeletonChart />` | `@/components/atoms/skeletons` | Placeholder de gráfico (barras) |
| `<SkeletonStats />` | `@/components/atoms/skeletons` | Grid de KPI cards |

Import via barrel:
```tsx
import { SkeletonStats, SkeletonList, SkeletonTable } from '@/components/atoms/skeletons'
```

## Pages cobertas (Story 3.14)

1. `DashboardLoja.tsx` — performance tab + resolving (aria-busy)
2. `Lojas.tsx` — listing (aria-busy)
3. `VendedorHome.tsx` — painel inicial (aria-busy)
4. `GerenteFeedback.tsx` — devolutivas (2 spots, aria-busy)
5. `GerentePDI.tsx` — PDI listing (aria-busy)
6. `PainelConsultor.tsx` — rede (aria-busy)
7. `Ranking.tsx` — global + por loja (2 spots, skeletons novos + aria-busy)
8. `VendedorTreinamentos.tsx` — trilhas (skeletons novos + aria-busy)
9. `MorningReport.tsx` — rede + matinal (2 spots, skeletons novos + aria-busy)
10. `Historico.tsx` — meu histórico (skeletons novos + aria-busy)

## Storybook

Story do Skeleton/skeletons depende de Story 3.9 (Storybook setup). TODO após 3.9.

## Referências

- Nielsen Norman: [Perceived Performance](https://www.nngroup.com/articles/response-times-3-important-limits/)
- Web Vitals: [CLS](https://web.dev/cls/)
- WCAG 2.1: SC 4.1.3 (status messages) → `aria-live="polite"`
