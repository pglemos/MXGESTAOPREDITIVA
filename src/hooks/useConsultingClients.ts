import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type {
  ConsultingAssignment,
  ConsultingClient,
  ConsultingClientContact,
  ConsultingClientDetail,
  ConsultingClientUnit,
  ConsultingVisit,
  ConsultingFinancial,
  ConsultingMethodologyStep,
} from '@/features/consultoria/types'

type CreateConsultingClientInput = {
  name: string
  legal_name?: string
  cnpj?: string
  product_name?: string
  notes?: string
}

export function useConsultingClients() {
  const { supabaseUser, role } = useAuth()
  const [clients, setClients] = useState<ConsultingClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const canCreate = role === 'admin'

  const fetchClients = useCallback(async () => {
    if (!supabaseUser) {
      setClients([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('consulting_clients')
      .select('*')
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setClients([])
    } else {
      setClients((data || []) as ConsultingClient[])
    }

    setLoading(false)
  }, [supabaseUser])

  const createClient = useCallback(async (input: CreateConsultingClientInput) => {
    if (!canCreate || !supabaseUser) {
      return { error: 'Apenas admin pode criar clientes da consultoria.' }
    }

    const payload = {
      name: input.name.trim(),
      legal_name: input.legal_name?.trim() || null,
      cnpj: input.cnpj?.trim() || null,
      product_name: input.product_name?.trim() || null,
      notes: input.notes?.trim() || null,
      created_by: supabaseUser.id,
    }

    const { error: insertError } = await supabase
      .from('consulting_clients')
      .insert(payload)

    if (insertError) {
      return { error: insertError.message }
    }

    await fetchClients()
    return { error: null }
  }, [canCreate, fetchClients, supabaseUser])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  return {
    clients,
    loading,
    error,
    canCreate,
    refetch: fetchClients,
    createClient,
  }
}

export function useConsultingClientDetail(clientId?: string) {
  const { supabaseUser } = useAuth()
  const [client, setClient] = useState<ConsultingClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClient = useCallback(async () => {
    if (!supabaseUser || !clientId) {
      setClient(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const [clientRes, unitsRes, contactsRes, assignmentsRes, visitsRes, financialsRes] = await Promise.all([
      supabase.from('consulting_clients').select('*').eq('id', clientId).maybeSingle(),
      supabase.from('consulting_client_units').select('*').eq('client_id', clientId).order('is_primary', { ascending: false }).order('name', { ascending: true }),
      supabase.from('consulting_client_contacts').select('*').eq('client_id', clientId).order('is_primary', { ascending: false }).order('name', { ascending: true }),
      supabase.from('consulting_assignments').select('*, user:users(id,name,email,role)').eq('client_id', clientId).order('created_at', { ascending: true }),
      supabase.from('consulting_visits').select('*, consultant:users(name,email), auxiliary_consultant:users(name,email)').eq('client_id', clientId).order('visit_number', { ascending: true }),
      supabase.from('consulting_financials').select('*').eq('client_id', clientId).order('reference_date', { ascending: false }),
    ])

    if (clientRes.error) {
      setError(clientRes.error.message)
      setClient(null)
      setLoading(false)
      return
    }

    const detail = clientRes.data
      ? {
          ...(clientRes.data as ConsultingClient),
          units: (unitsRes.data || []) as ConsultingClientUnit[],
          contacts: (contactsRes.data || []) as ConsultingClientContact[],
          assignments: (assignmentsRes.data || []) as ConsultingAssignment[],
          visits: (visitsRes.data || []) as ConsultingVisit[],
          financials: (financialsRes.data || []) as ConsultingFinancial[],
        }
      : null

    setClient(detail)
    setLoading(false)
  }, [clientId, supabaseUser])

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  return {
    client,
    loading,
    error,
    refetch: fetchClient,
  }
}

export function useConsultingMethodology() {
  const [steps, setSteps] = useState<ConsultingMethodologyStep[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSteps() {
      const { data } = await supabase
        .from('consulting_methodology_steps')
        .select('*')
        .order('visit_number', { ascending: true })
      
      setSteps((data || []) as ConsultingMethodologyStep[])
      setLoading(false)
    }
    fetchSteps()
  }, [])

  return { steps, loading }
}

export function useConsultingClientMetrics() {
  const { clients, loading } = useConsultingClients()

  const metrics = useMemo(() => {
    const total = clients.length
    const active = clients.filter((client) => client.status === 'ativo').length
    const paused = clients.filter((client) => client.status !== 'ativo').length

    return { total, active, paused }
  }, [clients])

  return { metrics, loading }
}
