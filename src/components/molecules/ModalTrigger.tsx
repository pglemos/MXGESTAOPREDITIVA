import * as React from 'react'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/organisms/Modal'

export interface ModalTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  modalContent: React.ReactNode
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  footer?: React.ReactNode
}

const ModalTrigger = React.forwardRef<HTMLDivElement, ModalTriggerProps>(
  ({ className, modalContent, title, description, size = 'md', footer, children, ...props }, ref) => {
    const [open, setOpen] = React.useState(false)

    return (
      <>
        <div
          ref={ref}
          className={cn('inline-flex', className)}
          onClick={() => setOpen(true)}
          {...props}
        >
          {children}
        </div>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={title}
          description={description}
          size={size}
          footer={footer}
        >
          {modalContent}
        </Modal>
      </>
    )
  }
)
ModalTrigger.displayName = 'ModalTrigger'

export { ModalTrigger }
