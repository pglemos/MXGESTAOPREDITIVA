import type { Meta, StoryObj } from '@storybook/react'
import { ModalTrigger } from '@/components/molecules/ModalTrigger'
import { Button } from '@/components/atoms/Button'

const meta: Meta<typeof ModalTrigger> = {
  title: 'Molecules/ModalTrigger',
  component: ModalTrigger,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Wrapper de Modal canônico (Radix Dialog) com focus trap nativo. Referência para Story 3.12 — todos os modals devem usar este pattern.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ModalTrigger>

export const Basic: Story = {
  args: {
    title: 'Confirmar ação',
    description: 'Esta operação não pode ser desfeita.',
    size: 'md',
    children: <Button variant="primary">Abrir Modal</Button>,
    modalContent: (
      <div className="space-y-3">
        <p className="text-text-secondary">
          Conteúdo do modal. Focus trap automático via Radix Dialog. ESC fecha. Click fora fecha.
        </p>
      </div>
    ),
    footer: (
      <div className="flex gap-2 justify-end">
        <Button variant="ghost">Cancelar</Button>
        <Button variant="primary">Confirmar</Button>
      </div>
    ),
  },
}

export const Large: Story = {
  args: {
    ...Basic.args,
    size: 'xl',
    title: 'Modal grande (xl)',
  },
}
