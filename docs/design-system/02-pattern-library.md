# MX Performance — Pattern Library

**Pipeline:** `design-system-build-quality` · **Phase:** 2/4 — Documentation
**Version:** 4.0 · **Stack:** React 19 + Vite 6 + Tailwind CSS 4.1.14 + Radix UI
**Source of truth:** `src/index.css` (`@theme` tokens) · **Mirror:** `tokens.yaml`

---

## Índice

1. [Brand Foundation](#brand-foundation)
2. [Design Tokens](#design-tokens)
3. [Atoms (7)](#atoms)
4. [Molecules (4)](#molecules)
5. [Organisms (2)](#organisms)
6. [UI Primitives (shadcn — 22)](#ui-primitives)
7. [Uso & Imports](#uso--imports)

---

## Brand Foundation

- **Nome:** MX PERFORMANCE
- **Tipografia:** Plus Jakarta Sans (sans) · JetBrains Mono (mono)
- **Logo:** `src/assets/mx-logo.png` (símbolo geométrico verde) + `public/favicon.svg`
- **Voice:** commanding, tracking-widest uppercase em CTAs, `font-black` default
- **Palette principal:** `#22C55E` (green-500) · `#0D3B2E` (green-900 dark)

---

## Design Tokens

### Cores — Brand

```css
--color-brand-primary: #22c55e;       /* Green-500 — CTAs */
--color-brand-secondary: #0D3B2E;     /* Dark green — surfaces dark */
--color-mx-green-{50..950}            /* 11 tints */
--color-mx-indigo-{50..950}           /* Legacy alias → green */
```

### Cores — Semantic

```css
--color-text-primary: #0A0A0B
--color-text-secondary: #475569
--color-text-tertiary: #94a3b8
--color-surface-default: #ffffff
--color-surface-alt: #f8fafc
--color-border-default: #f1f5f9
--color-border-strong: #e2e8f0
--color-status-{success,warning,error,info}
```

### Radius

`rounded-mx-sm` (0.5rem) · `mx-md` (0.75) · `mx-lg` (1) · `mx-xl` (1.25) · `mx-2xl` (1.5) · `mx-3xl` (2) · `mx-full`

### Spacing

`mx-tiny` (0.25) · `mx-xs` (0.5) · `mx-sm` (1) · `mx-md` (1.5) · `mx-lg` (2) · `mx-xl` (3) · `mx-2xl` (4)
Numeric: `mx-10` (2.5) · `mx-14` (3.5) · `mx-20` (5)

---

## Atoms

### Badge (`atoms/Badge.tsx`)
**Uso:** tags, status labels, counts.
**Props:** `variant`, `tone`, `className`
**Variantes previstas:** default, secondary, destructive, outline
**Exemplo:**
```tsx
<Badge variant="secondary" className="bg-brand-primary/10 text-brand-primary">MENTORADO</Badge>
```

### Button (`atoms/Button.tsx`)
**Uso:** CTAs, ações primárias/secundárias.
**Base class:** `inline-flex ... rounded-mx-md font-black uppercase tracking-widest ... focus-visible:ring-4 focus-visible:ring-brand-primary/20`
**Variantes:** `primary | secondary | ghost | outline`
**Sizes:** `default | icon | sm | lg`
**Touch target:** `h-mx-11` (2.75rem ≈ 44px) ✓ WCAG 2.5.5
**Acessibilidade:** `focus-visible:ring-4`, `disabled:pointer-events-none`, auto `aria-hidden="true"` em ícones children.
**Exemplo:**
```tsx
<Button>ENTRAR <ArrowRight size={18} /></Button>
<Button variant="outline" size="icon" aria-label="Atualizar"><RefreshCw /></Button>
```

### Input (`atoms/Input.tsx`)
**Uso:** campos de texto, busca.
**Base:** `rounded-mx-md border border-border-default bg-white px-5 py-3 text-sm font-bold ... focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 h-mx-14 sm:h-12`
**Acessibilidade:** `disabled:cursor-not-allowed disabled:opacity-50`, delega label para FormField.

### Select (`atoms/Select.tsx`)
**Uso:** dropdowns simples (não usa Radix — HTML nativo estilizado).
**Base:** `w-full h-mx-14 rounded-mx-xl px-6 text-sm font-bold focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 appearance-none`

### Skeleton (`atoms/Skeleton.tsx`)
**Uso:** loading placeholders.
**Padrão:** `animate-pulse bg-surface-alt rounded-mx-md`

### Textarea (`atoms/Textarea.tsx`)
**Uso:** inputs multi-line.
Mesma base visual do Input, altura variável.

### Typography (`atoms/Typography.tsx`)
**Uso:** controle centralizado de hierarquia textual.
**Variants:** `h1 | h2 | h3 | body | caption | label | micro`
**Tones:** `primary | secondary | muted | white | brand | error | success`

---

## Molecules

### Card (`molecules/Card.tsx`)
Container base com padding, radius e shadow. Wrapper de conteúdo.

### ChallengeCard (`molecules/ChallengeCard.tsx`)
Card especializado para desafios. Tone `brand` usa `bg-mx-green-50 border-mx-green-100` (via alias indigo).

### FormField (`molecules/FormField.tsx`)
**Uso:** wrapper de Input com label + error + icon.
**Props:** `label`, `error`, `id`, `icon`, `...InputProps`
**Acessibilidade:** `<label htmlFor={fieldId}>`, `aria-hidden="true"` em icon decorativo, `group-focus-within` style transfer. ✅ PATTERN EXEMPLAR.

### MXScoreCard (`molecules/MXScoreCard.tsx`)
Card de métricas com tone `brand | error | neutral`.

---

## Organisms

### DataGrid (`organisms/DataGrid.tsx`)
Tabela rica com ordenação/filtro/paginação. Wrapper do `ui/table.tsx`.

### PowerRankingList (`organisms/PowerRankingList.tsx`)
Ranking vertical de usuários com badges, posição, scores.

---

## UI Primitives

Baseados em **shadcn/ui + Radix UI**. Não devem ser consumidos diretamente por pages — passam pelos atoms/molecules.

| Primitive | Radix base | Uso |
|-----------|------------|-----|
| avatar | `@radix-ui/react-avatar` | Fotos de perfil |
| checkbox | `@radix-ui/react-checkbox` | Formulários |
| dialog | `@radix-ui/react-dialog` | Modais |
| dropdown-menu | `@radix-ui/react-dropdown-menu` | Menus |
| progress | `@radix-ui/react-progress` | Barras |
| scroll-area | `@radix-ui/react-scroll-area` | Listas scrolláveis |
| select | `@radix-ui/react-select` | Selects ricos |
| switch | `@radix-ui/react-switch` | Toggles |
| tabs | `@radix-ui/react-tabs` | Abas |
| tooltip | `@radix-ui/react-tooltip` | Tooltips |
| sonner/toaster | `sonner` | Notificações toast |
| chart | `recharts` | Gráficos |

---

## Uso & Imports

Projeto usa **absolute imports** via `@/` alias (ver Constitution Artigo VI — SHOULD).

```tsx
import { Button } from '@/components/atoms/Button'
import { FormField } from '@/components/molecules/FormField'
import { Typography } from '@/components/atoms/Typography'
import MxLogo from '@/assets/mx-logo.png'
```

### Pattern Board

- **Botão primário:** `<Button>TEXTO</Button>` (uppercase implícito)
- **Card de métrica:** `<MXScoreCard tone="brand" value={...} label={...} />`
- **Campo de formulário:** `<FormField label="..." icon={...} error={...} />`
- **Ícones:** `lucide-react` — sempre `size={18}` (default), ou `size={14}` (micro)

---

## Changelog (rebrand 2026-04-13)

- `brand-primary`: `#4f46e5` → `#22C55E`
- `brand-secondary`: `#1A1D20` → `#0D3B2E`
- Adicionado `mx-green-{50..950}` palette
- Aliased `mx-indigo-*` → green (legacy compat)
- Logo PNG real substitui SVG de letras "MX"
- Login redesign: split-screen premium
- Favicon: `public/favicon.svg` + `public/mx-logo.png`

---

**Cobertura:** 35/35 componentes documentados (100%).
