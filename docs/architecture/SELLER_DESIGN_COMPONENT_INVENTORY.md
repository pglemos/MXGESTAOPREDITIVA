# Inventário visual canônico do vendedor

Fonte efetiva de navegação: `src/components/SellerSidebar.tsx` (`base44SellerSections`). Referências exportadas: `src/base44-reference/components/vendedor/`. Implementação aprovada real: `src/features/vendedor-home/`, `src/features/crm/`, `src/components/vendedor/` e componentes compartilhados.

| Padrão | Componente vendedor | Caminho | Props principais | Tokens | Reuso | Adaptação gerente |
|---|---|---|---|---|---|---|
| shell | `SellerLayoutShell` | `src/components/SellerSidebar.tsx` | perfil, navegação, logout, simulação | `sidebar-*`, `mx-*` | direto | fornecer seções gerenciais |
| page header | `PageHeading`, `VendedorHomeHeader` | `src/components/molecules/PageHeading.tsx`, `src/features/vendedor-home/sections/VendedorHomeHeader.tsx` | título, subtítulo, ações | texto, spacing, radius, shadow | direto | filtros e refresh gerenciais |
| card/panel | `DashboardCard`, `PanelTitle` | `src/features/vendedor-home/sections/DashboardPrimitives.tsx` | children, título, subtítulo, ação | surface, border, shadow, radius | adaptar | primitive neutro por papel |
| hero/meta | `GoalCard`, `CommissionHeroCard` | `src/features/vendedor-home/sections/GoalCard.tsx`, `src/components/vendedor/CommissionHeroCard.jsx` | métricas, progresso, CTA | brand, money, progress | adaptar | status de loja/equipe |
| KPI | `MiniMetric`, cards Home | `DashboardPrimitives.tsx`, `MetricsCardsGrid.tsx` | label, value, hint | typography, semantic states | adaptar | quatro métricas gerenciais |
| progresso/gauge | `MiniBar`, `ProgressRing` | `DashboardPrimitives.tsx` | value, label | brand, border | direto/adaptar | disciplina e execução |
| lista/linha | `ExecutionCenter`, `CarteiraClientes` | `ExecutionCenterCard.tsx`, `src/features/crm/CarteiraClientes.container.tsx` | items, ações | surface, divider, text | adaptar | movimento/rotina/equipe |
| avatar | `Avatar` | `src/components/atoms/Avatar.tsx` | nome, src, size | semantic/surface | direto | vendedor na tabela/card |
| badge/status | `Badge`, `StatusBadge` | `src/components/atoms/Badge.tsx`, `src/components/molecules/StatusBadge.tsx` | variant/status | `status-*` | direto | fechamento/rotina |
| empty/error | `EmptyState`, `AlertCard` | `src/components/atoms/EmptyState.tsx`, `src/components/molecules/AlertCard.tsx` | icon, title, action | semantic surfaces | direto | distinguir vazio de falha |
| loading | `Skeleton*` | `src/components/atoms/skeletons/` | shape/count | surface/border | direto | skeleton responsivo |
| tabs/filters | `TabNavPill`, `FilterBar`, `DatePicker`, `Select` | `src/components/molecules/`, `src/components/atoms/` | opções, valor, callbacks | input, focus, spacing | direto | período, loja, vendedor |
| modal/drawer | `Modal`, Radix/Vaul existentes | `src/components/organisms/Modal.tsx` e features | open, close, content | overlay, elevated, radius | direto | detalhe, agenda, correção |
| chart | wrappers e tokens | `src/lib/charts/tokens.ts` | séries, eixos | `chart-*` | direto | disciplina/meta/execução |
| CTA/icon | `Button`, Lucide | `src/components/atoms/Button.tsx` | variant, size, loading | brand/action/focus | direto | atualizar, cobrar, corrigir |

## Tokens usados

- Fonte: Inter.
- Marca/superfícies: `brand-primary`, `brand-secondary`, `surface-default`, `surface-alt`.
- Texto/borda: `text-primary`, `text-secondary`, `text-tertiary`, `border-default`, `border-subtle`.
- Estado: `status-success`, `status-warning`, `status-error`, `status-info` e respectivas surfaces.
- Estrutura: escalas canônicas `mx-*` de spacing, sizing, radius e shadow.
- Shell: família `sidebar-*`.
- Visual vendedor especializado: `seller-screen-bg`, `seller-card-bg`, `seller-money`, `seller-green*`, `seller-blue*`.
- Gráficos: somente `src/lib/charts/tokens.ts` / `chart-*`.
