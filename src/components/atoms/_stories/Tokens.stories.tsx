import type { Meta, StoryObj } from '@storybook/react'

/**
 * Tokens canônicos do Design System MX.
 *
 * Esta story é a SoT visual dos tokens declarados em `src/index.css` via `@theme`.
 * Use-a como referência ao construir novos componentes: NÃO hardcode hex/spacing —
 * consuma sempre via classes Tailwind (`text-brand-primary`, `p-mx-md`, etc.).
 */
const meta: Meta = {
  title: 'Design System/Tokens',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Catálogo visual de tokens (color, spacing, typography, radius). Tokens vivem em `src/index.css` (`@theme`) e são consumidos via Tailwind 4.',
      },
    },
  },
}

export default meta
type Story = StoryObj

const ColorSwatch = ({ name, className }: { name: string; className: string }) => (
  <div className="flex flex-col items-start gap-1">
    <div className={`h-16 w-32 rounded-mx-md border border-border-strong ${className}`} />
    <span className="text-xs font-mono text-text-secondary">{name}</span>
  </div>
)

export const Colors: Story = {
  render: () => (
    <div className="p-6 space-y-6 bg-surface text-text-primary">
      <h2 className="text-2xl font-black">Brand</h2>
      <div className="flex flex-wrap gap-4">
        <ColorSwatch name="brand-primary" className="bg-brand-primary" />
        <ColorSwatch name="brand-secondary" className="bg-brand-secondary" />
        <ColorSwatch name="mx-black" className="bg-mx-black" />
      </div>

      <h2 className="text-2xl font-black">Status</h2>
      <div className="flex flex-wrap gap-4">
        <ColorSwatch name="status-success" className="bg-status-success" />
        <ColorSwatch name="status-warning" className="bg-status-warning" />
        <ColorSwatch name="status-error" className="bg-status-error" />
        <ColorSwatch name="status-info" className="bg-status-info" />
      </div>

      <h2 className="text-2xl font-black">Surface</h2>
      <div className="flex flex-wrap gap-4">
        <ColorSwatch name="surface" className="bg-surface" />
        <ColorSwatch name="surface-alt" className="bg-surface-alt" />
      </div>
    </div>
  ),
}

export const Spacing: Story = {
  render: () => (
    <div className="p-6 space-y-3 bg-surface">
      {['mx-xs', 'mx-sm', 'mx-md', 'mx-lg', 'mx-xl', 'mx-2xl'].map((token) => (
        <div key={token} className="flex items-center gap-4">
          <span className="text-xs font-mono w-24 text-text-secondary">{token}</span>
          <div className={`h-6 bg-brand-primary rounded-sm`} style={{ width: `var(--spacing-${token})` }} />
        </div>
      ))}
    </div>
  ),
}

export const Typography: Story = {
  render: () => (
    <div className="p-6 space-y-4 bg-surface text-text-primary">
      <p className="text-xs">text-xs — caption / metadata</p>
      <p className="text-sm">text-sm — body small</p>
      <p className="text-base">text-base — body default</p>
      <p className="text-lg">text-lg — body large</p>
      <p className="text-xl font-bold">text-xl bold — section title</p>
      <p className="text-2xl font-black">text-2xl black — page title</p>
      <p className="text-4xl font-black tracking-mx-wide">text-4xl tracking-mx-wide — hero</p>
    </div>
  ),
}

export const Radius: Story = {
  render: () => (
    <div className="p-6 flex flex-wrap gap-4 bg-surface">
      {['mx-sm', 'mx-md', 'mx-lg', 'mx-xl', 'mx-2xl', 'mx-full'].map((r) => (
        <div key={r} className="flex flex-col items-center gap-2">
          <div className={`h-20 w-20 bg-brand-secondary rounded-${r}`} />
          <span className="text-xs font-mono text-text-secondary">rounded-{r}</span>
        </div>
      ))}
    </div>
  ),
}
