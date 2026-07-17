import { useEffect, useState } from 'react'

// MX-22.6 (Spec §13 "sem conexão"): estado de interface obrigatório que
// faltava no Fechamento Diário — nenhum código existente observava
// navigator.onLine/online/offline. Hook isolado e puro na leitura do estado
// do browser; a UI decide o que fazer com ele (banner informativo, sem
// bloquear submissão — o erro real de rede já é tratado pelos catch/toast.error
// existentes em useCheckinsSubmit.ts).
export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState(() =>
        typeof navigator === 'undefined' ? true : navigator.onLine,
    )

    useEffect(() => {
        if (typeof window === 'undefined') return
        const goOnline = () => setIsOnline(true)
        const goOffline = () => setIsOnline(false)
        window.addEventListener('online', goOnline)
        window.addEventListener('offline', goOffline)
        return () => {
            window.removeEventListener('online', goOnline)
            window.removeEventListener('offline', goOffline)
        }
    }, [])

    return isOnline
}
