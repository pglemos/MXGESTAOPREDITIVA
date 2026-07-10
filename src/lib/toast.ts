import { toast as sonnerToast } from 'sonner'

/**
 * Durações canônicas de toast (P1-09, auditoria 2026-07-10): sucesso some
 * sozinho em menos de 3s; erro crítico permanece 8s. O Toaster global não
 * define mais 8s para tudo — cada tipo tem o seu tempo aqui.
 */
export const TOAST_DURATION_MS = {
    success: 3000,
    info: 4000,
    warning: 6000,
    error: 8000,
} as const

type ToastMessage = Parameters<typeof sonnerToast.success>[0]
type ToastOptions = Parameters<typeof sonnerToast.success>[1]

function withDuration(kind: keyof typeof TOAST_DURATION_MS) {
    return (message: ToastMessage, options?: ToastOptions) =>
        sonnerToast[kind](message, { duration: TOAST_DURATION_MS[kind], ...options })
}

export const toast = {
    success: withDuration('success'),
    info: withDuration('info'),
    warning: withDuration('warning'),
    error: withDuration('error'),
    loading: sonnerToast.loading,
    dismiss: sonnerToast.dismiss,
    promise: sonnerToast.promise,
}
