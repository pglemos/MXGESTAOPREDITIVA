import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type OwnerConsultingProgramSummary = {
  clientId: string
  programKey: string
  programName: string
  totalVisits: number
  clientStatus: string
  clientModality: string | null
  visitsCompleted: number
  nextVisitNumber: number | null
  nextVisitScheduledAt: string | null
  nextVisitObjective: string | null
  nextVisitMeetLink: string | null
}

type RpcRow = {
  client_id: string
  program_key: string
  program_name: string
  total_visits: number
  client_status: string
  client_modality: string | null
  visits_completed: number
  next_visit_number: number | null
  next_visit_scheduled_at: string | null
  next_visit_objective: string | null
  next_visit_meet_link: string | null
}

export function useOwnerConsultingProgram(storeId: string | null | undefined) {
  const [program, setProgram] = useState<OwnerConsultingProgramSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProgram = useCallback(async () => {
    if (!storeId) {
      setProgram(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: rpcError } = await supabase
        .rpc('get_owner_consulting_program_summary', { p_store_id: storeId })
        .maybeSingle<RpcRow>()
      if (rpcError) throw rpcError
      setProgram(
        data
          ? {
              clientId: data.client_id,
              programKey: data.program_key,
              programName: data.program_name,
              totalVisits: data.total_visits,
              clientStatus: data.client_status,
              clientModality: data.client_modality,
              visitsCompleted: data.visits_completed,
              nextVisitNumber: data.next_visit_number,
              nextVisitScheduledAt: data.next_visit_scheduled_at,
              nextVisitObjective: data.next_visit_objective,
              nextVisitMeetLink: data.next_visit_meet_link,
            }
          : null,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar o programa de consultoria')
      setProgram(null)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchProgram()
  }, [fetchProgram])

  return { program, loading, error, refresh: fetchProgram }
}
