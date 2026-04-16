import { type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { X } from 'lucide-react'

const modalSizeVariants = cva(
  'w-full bg-white shadow-mx-xl rounded-mx-3xl overflow-hidden flex flex-col max-h-[90vh]',
  {
    variants: {
      size: {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-xl',
        xl: 'max-w-mx-sidebar-expanded',
        '2xl': 'max-w-4xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export interface ModalProps extends VariantProps<typeof modalSizeVariants> {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  showClose?: boolean
  footer?: ReactNode
  className?: string
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
  footer,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-mx-black/60 backdrop-blur-md z-[100]" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] focus:outline-none',
            modalSizeVariants({ size }),
            className
          )}
        >
          <div className="p-mx-lg border-b border-border-default flex items-center justify-between sticky top-mx-0 bg-white z-10 shrink-0">
            <div>
              <Dialog.Title asChild>
                <Typography variant="h3">{title}</Typography>
              </Dialog.Title>
              {description && (
                <Dialog.Description asChild>
                  <Typography variant="tiny" tone="muted" className="mt-1 block">{description}</Typography>
                </Dialog.Description>
              )}
            </div>
            {showClose && (
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="w-mx-xl h-mx-xl rounded-mx-xl bg-surface-alt flex items-center justify-center text-text-tertiary hover:text-text-primary transition-all shrink-0"
                >
                  <X size={20} />
                </button>
              </Dialog.Close>
            )}
          </div>

          <div className="p-mx-lg overflow-y-auto flex-1">
            {children}
          </div>

          {footer && (
            <div className="p-mx-lg border-t border-border-default flex justify-end gap-mx-sm sticky bottom-mx-0 bg-white shrink-0">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
