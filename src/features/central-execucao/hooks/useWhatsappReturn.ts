import { useCallback, useEffect, useRef } from 'react'
import {
  consumeWhatsappReturn,
  saveWhatsappDeparture,
} from '@/features/central-execucao/lib/whatsapp-return'
import type { CentralExecutionAction } from '@/features/central-execucao/types/central-execucao.types'

function normalizeWhatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('55') ? digits : `55${digits}`
}

export function useWhatsappReturn({
  actions,
  onReturn,
}: {
  actions: CentralExecutionAction[]
  onReturn: (action: CentralExecutionAction) => void
}) {
  const actionsRef = useRef(actions)
  const onReturnRef = useRef(onReturn)

  useEffect(() => { actionsRef.current = actions }, [actions])
  useEffect(() => { onReturnRef.current = onReturn }, [onReturn])

  const checkReturn = useCallback(() => {
    if (typeof window === 'undefined') return
    if (document.visibilityState !== 'visible') return

    const departure = consumeWhatsappReturn(window.sessionStorage)
    if (!departure) return

    const action = actionsRef.current.find(item => item.id === departure.actionId)
    if (action) onReturnRef.current(action)
  }, [])

  useEffect(() => {
    const handleVisibility = () => checkReturn()
    const handleFocus = () => checkReturn()
    const handlePageShow = () => checkReturn()

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [checkReturn])

  const openWhatsapp = useCallback((action: CentralExecutionAction) => {
    const phone = action.client?.telefone || action.snapshots.phone || ''
    const number = normalizeWhatsappNumber(phone)
    if (!number || typeof window === 'undefined') return false

    saveWhatsappDeparture(window.sessionStorage, {
      actionId: action.id,
      leftAt: Date.now(),
    })

    window.open(`https://wa.me/${number}`, '_blank', 'noopener,noreferrer')
    return true
  }, [])

  return { openWhatsapp, checkReturn }
}
