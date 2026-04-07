import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export function Toaster() {
    const { toasts, dismiss } = useToast()

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={cn(
                        'group pointer-events-auto relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-xl border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-5',
                        toast.variant === 'destructive'
                            ? 'border-status-error/30 bg-status-error-surface text-status-error'
                            : 'border-border-default bg-surface-main text-text-primary',
                    )}
                >
                    <div className="flex flex-col gap-1">
                        {toast.title && <div className="text-sm font-bold">{toast.title}</div>}
                        {toast.description && <div className="text-xs opacity-80">{toast.description}</div>}
                    </div>
                    <button type="button" aria-label="Fechar notificação" onClick={() => dismiss(toast.id)} className="opacity-0 group-hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15 rounded-mx-sm">
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </div>
            ))}
        </div>
    )
}
