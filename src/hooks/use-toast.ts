import { toast as sonnerToast } from 'sonner'

type ToastOptions = {
    title: string
    description?: string
    variant?: 'default' | 'destructive'
}

export function toast({ title, description, variant }: ToastOptions) {
    if (variant === 'destructive') {
        sonnerToast.error(title, { description })
        return
    }

    sonnerToast(title, { description })
}

export function useToast() {
    return {
        toasts: [] as any[],
        dismiss: (id?: string) => {}
    }
}
