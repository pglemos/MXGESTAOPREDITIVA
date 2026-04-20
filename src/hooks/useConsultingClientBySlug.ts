import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { ConsultingClientDetail } from '@/features/consultoria/types'
import {
  parseConsultingClientUnitArray,
  parseConsultingClientContactArray,
  parseConsultingAssignmentArray,
  parseConsultingFinancialArray,
  parseConsultingClientModuleArray,
  type ConsultingClient,
  type ConsultingVisit,
} from '@/lib/schemas/consulting-client.schema'

export function useConsultingClientDetailBySlug(slug?: string) {
  const { supabaseUser, role } = useAuth()
  const [client, setClient] = useState<ConsultingClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClient = useCallback(async () => {
    if (!supabaseUser || !slug) {
      setClient(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // First, resolve the slug to ID
    const { data: clientData, error: clientError } = await supabase
      .from('consulting_clients')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (clientError || !clientData) {
      setError(clientError?.message || 'Cliente não encontrado.')
      setClient(null)
      setLoading(false)
      return
    }

    const clientId = clientData.id

    // Fetch related data
    const [unitsRes, contactsRes, assignmentsRes, visitsRes, financialsRes, modulesRes] = await Promise.all([
      supabase.from('consulting_client_units').select('*').eq('client_id', clientId).order('is_primary', { ascending: false }).order('name', { ascending: true }),
      supabase.from('consulting_client_contacts').select('*').eq('client_id', clientId).order('is_primary', { ascending: false }).order('name', { ascending: true }),
      supabase.from('consulting_assignments').select('*, user:users(id,name,email,role)').eq('client_id', clientId).order('created_at', { ascending: true }),
      supabase.from('consulting_visits').select('*, consultant:users(name,email), auxiliary_consultant:users(name,email)').eq('client_id', clientId).order('visit_number', { ascending: true }),
      supabase.from('consulting_financials').select('*').eq('client_id', clientId).order('reference_date', { ascending: false }),
      supabase.from('consulting_client_modules').select('*').eq('client_id', clientId).order('module_key', { ascending: true }),
    ])

    const detail = {
      ...(clientData as ConsultingClient),
      units: parseConsultingClientUnitArray(unitsRes.data || []),
      contacts: parseConsultingClientContactArray(contactsRes.data || []),
      assignments: parseConsultingAssignmentArray(assignmentsRes.data || []),
      visits: (visitsRes.data || []) as ConsultingVisit[],
      financials: parseConsultingFinancialArray(financialsRes.data || []),
      modules: parseConsultingClientModuleArray(modulesRes.data || []),
    }

    setClient(detail)
    setLoading(false)
  }, [slug, supabaseUser])

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  return { client, loading, error, refetch: fetchClient }
}
