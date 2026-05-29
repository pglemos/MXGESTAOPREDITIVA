import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

/**
 * Hook do Sprint 3 — S3-T4.
 *
 * Invoca a edge function `executive-agenda-google-sync` para sincronizar
 * um evento de `eventos_agenda_executiva` com o Google Calendar central.
 * A função já cuida do upsert/delete + atualização do `google_event_id`
 * e do `integration_status` direto na linha.
 */

export type ExecutiveAgendaSyncAction = 'upsert' | 'delete'

export type UseExecutiveAgendaGoogleSyncResult = {
  syncing: string | null
  sync: (eventId: string, action?: ExecutiveAgendaSyncAction) => Promise<boolean>
}

export function useExecutiveAgendaGoogleSync(): UseExecutiveAgendaGoogleSyncResult {
  const [syncing, setSyncing] = useState<string | null>(null)

  const sync = useCallback(
    async (eventId: string, action: ExecutiveAgendaSyncAction = 'upsert') => {
      setSyncing(eventId)
      try {
        const { data, error } = await supabase.functions.invoke(
          'executive-agenda-google-sync',
          {
            body: { eventId, action },
          },
        )
        if (error) throw error
        if (data && typeof data === 'object' && 'error' in data && data.error) {
          throw new Error(String(data.error))
        }
        toast.success(
          action === 'delete'
            ? 'Evento removido do Google Calendar.'
            : 'Evento sincronizado com o Google Calendar.',
        )
        return true
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : 'Não foi possível sincronizar com o Google Calendar.',
        )
        return false
      } finally {
        setSyncing(null)
      }
    },
    [],
  )

  return { syncing, sync }
}
