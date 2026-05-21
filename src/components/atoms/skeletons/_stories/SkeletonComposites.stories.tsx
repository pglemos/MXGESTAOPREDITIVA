import type { Meta, StoryObj } from '@storybook/react'
import {
  SkeletonCard,
  SkeletonChart,
  SkeletonList,
  SkeletonStats,
  SkeletonTable,
} from '@/components/atoms/skeletons'

const meta: Meta = {
  title: 'Atoms/Skeleton/Composites',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Skeletons compostos (Card, Chart, List, Stats, Table) usados pelas pages durante loading. Sempre envolvidos em container com `aria-busy="true"`.',
      },
    },
  },
}

export default meta
type Story = StoryObj

export const Table: Story = {
  render: () => (
    <div aria-busy="true" aria-live="polite" className="w-full max-w-3xl">
      <SkeletonTable rows={5} cols={4} />
    </div>
  ),
}

export const Card: Story = {
  render: () => (
    <div aria-busy="true" aria-live="polite" className="w-full max-w-md">
      <SkeletonCard />
    </div>
  ),
}

export const List: Story = {
  render: () => (
    <div aria-busy="true" aria-live="polite" className="w-full max-w-md">
      <SkeletonList items={5} />
    </div>
  ),
}

export const Chart: Story = {
  render: () => (
    <div aria-busy="true" aria-live="polite" className="w-full max-w-2xl">
      <SkeletonChart />
    </div>
  ),
}

export const Stats: Story = {
  render: () => (
    <div aria-busy="true" aria-live="polite" className="w-full max-w-4xl">
      <SkeletonStats count={4} />
    </div>
  ),
}
