import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton } from '@/components/atoms/Skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Primitivo de loading. A11y: o pai do skeleton DEVE setar `aria-busy="true"` e `aria-live="polite"`. Skeletons respeitam `prefers-reduced-motion`.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['rect', 'circle', 'text', 'avatar', 'chart', 'card', 'table-row'] },
  },
}

export default meta
type Story = StoryObj<typeof Skeleton>

export const Rect: Story = { args: { variant: 'rect', className: 'h-20 w-64' } }
export const Circle: Story = { args: { variant: 'circle', className: 'h-16 w-16' } }
export const Text: Story = { args: { variant: 'text', className: 'w-64' } }
export const Avatar: Story = { args: { variant: 'avatar' } }
export const Chart: Story = { args: { variant: 'chart' } }
export const Card: Story = { args: { variant: 'card' } }

export const Gallery: Story = {
  render: () => (
    <div aria-busy="true" aria-live="polite" className="space-y-4 w-full max-w-2xl">
      <Skeleton variant="rect" className="h-10 w-48" />
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/2" />
      <div className="flex gap-3">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="text" className="w-2/3" />
        </div>
      </div>
      <Skeleton variant="chart" />
    </div>
  ),
}
