import { toast } from 'sonner'

type ConfirmationOptions = {
  key: string
  title: string
  description?: string
  label?: string
  durationMs?: number
  onConfirm: () => void | Promise<void>
}

const pendingConfirmations = new Set<string>()
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>()

function clearPendingConfirmation(key: string) {
  const timer = pendingTimers.get(key)
  if (timer) clearTimeout(timer)
  pendingTimers.delete(key)
  pendingConfirmations.delete(key)
}

export function requestToastConfirmation({
  key,
  title,
  description,
  label = 'Confirmar',
  durationMs = 12000,
  onConfirm,
}: ConfirmationOptions) {
  if (pendingConfirmations.has(key)) {
    toast.info('Confirmação já aberta para este item.')
    return
  }

  pendingConfirmations.add(key)
  pendingTimers.set(key, setTimeout(() => clearPendingConfirmation(key), durationMs + 1000))

  toast.warning(title, {
    description,
    duration: durationMs,
    action: {
      label,
      onClick: () => {
        clearPendingConfirmation(key)
        void Promise.resolve(onConfirm()).catch((error) => {
          toast.error(error instanceof Error ? error.message : 'Não foi possível concluir a ação.')
        })
      },
    },
  })
}
