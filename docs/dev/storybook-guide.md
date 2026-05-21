# Storybook Guide — MX Design System

> **Status:** Piloto (Story 3.9 — Sprint 3)
> **Cobertura atual:** ~15% (5 stories piloto). Meta 4/5 (≥80%) movida para backlog Sprint 4.

## Rodando localmente

```bash
npm run storybook
# abre http://localhost:6006
```

Build estático (para preview por PR / publish):

```bash
npm run build-storybook
# saída em storybook-static/
```

## Estrutura

Stories vivem **ao lado** dos componentes em pastas `_stories/`:

```
src/components/
├── atoms/
│   ├── Button.tsx
│   ├── _stories/
│   │   ├── Tokens.stories.tsx        # Design tokens (SoT visual)
│   │   ├── Button.stories.tsx
│   │   └── Skeleton.stories.tsx
│   └── skeletons/
│       ├── SkeletonTable.tsx
│       └── _stories/
│           └── SkeletonComposites.stories.tsx
└── molecules/
    └── _stories/
        └── ModalTrigger.stories.tsx
```

Glob configurado em `.storybook/main.ts`: `src/**/*.stories.@(ts|tsx|mdx)`.

## Convenção de naming (title)

| Categoria | Title prefix |
|-----------|--------------|
| Tokens / cores / spacing | `Design System/Tokens` |
| Componentes primitivos | `Atoms/{ComponentName}` |
| Composições simples | `Molecules/{ComponentName}` |
| Composições complexas | `Organisms/{ComponentName}` |
| Charts / data viz | `Charts/{ChartName}` |

## Adicionando nova story

1. Crie `_stories/{Component}.stories.tsx` ao lado do componente.
2. Use o template:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { MyComponent } from '@/components/atoms/MyComponent'

const meta: Meta<typeof MyComponent> = {
  title: 'Atoms/MyComponent',
  component: MyComponent,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['a', 'b'] },
  },
}

export default meta
type Story = StoryObj<typeof MyComponent>

export const Default: Story = { args: { variant: 'a' } }
```

3. **Tokens primeiro:** ao mostrar variants, consuma sempre via classes Tailwind (`bg-brand-primary`), nunca hex direto. Linter `lint-tokens-ast.mjs` valida.

## Tailwind 4 + tokens

`.storybook/preview.ts` importa `src/index.css` (que contém `@theme`). Todos os tokens (`--color-brand-primary`, `--spacing-mx-md`, etc.) ficam disponíveis automaticamente.

## A11y addon

`@storybook/addon-a11y` roda axe-core em cada story. Stories de componentes core devem ter **0 violations**. Veja painel "Accessibility" no Storybook.

## Roadmap

- **Sprint 4:** cobrir todos ~30 componentes atomic-design (Story 3.9 follow-up).
- **Sprint 4:** Chromatic ou visual regression alternativa.
- **Sprint 4:** publish via Vercel preview por PR.

## Referências

- ADR-0055 — Storybook como SoT visual
- Story 3.9 — Sprint 3
- [Storybook 8 docs](https://storybook.js.org/docs/8/)
