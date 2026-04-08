import { toast as sonnerToast } from 'sonner'

const TOAST_LIMIT = 3

type ToastOptions = {
    title: string
    description?: string
    variant?: 'default' | 'destructive'
}

type ToastItem = ToastOptions & { id: string }
type ToastState = { toasts: ToastItem[] }

type ToastAction =
    | { type: 'ADD_TOAST'; toast: ToastItem }
    | { type: 'UPDATE_TOAST'; toast: Partial<ToastItem> & { id: string } }
    | { type: 'DISMISS_TOAST'; toastId?: string }
    | { type: 'REMOVE_TOAST'; toastId?: string }

export function reducer(state: ToastState, action: ToastAction): ToastState {
    switch (action.type) {
        case 'ADD_TOAST':
            return {
                ...state,
                toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
            }

        case 'UPDATE_TOAST': {
            const toastIndex = state.toasts.findIndex(toast => toast.id === action.toast.id)
            if (toastIndex === -1) return state

            return {
                ...state,
                toasts: state.toasts.map(toast =>
                    toast.id === action.toast.id ? { ...toast, ...action.toast } : toast
                ),
            }
        }

        case 'DISMISS_TOAST':
            return state

        case 'REMOVE_TOAST':
            if (action.toastId === undefined) {
                return state.toasts.length ? { ...state, toasts: [] } : state
            }

            if (!state.toasts.some(toast => toast.id === action.toastId)) return state

            return {
                ...state,
                toasts: state.toasts.filter(toast => toast.id !== action.toastId),
            }

        default:
            return state
    }
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
