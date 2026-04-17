import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type {
  ConsultingClientContact,
  ConsultingClientDetail,
  ConsultingVisit,
} from '@/features/consultoria/types'
import {
  parseConsultingClientArray,
  parseConsultingClientUnitArray,
  parseConsultingClientContactArray,
  parseConsultingAssignmentArray,
  parseConsultingFinancialArray,
  parseConsultingMethodologyStepArray,
  type ConsultingClient,
  type ConsultingClientUnit,
  type ConsultingAssignment,
  type ConsultingFinancial,
  type ConsultingMethodologyStep,
} from '@/lib/schemas/consulting-client.schema'

type ConsultingAssignableUser = {
  id: string
  name: string
  email: string
  role: string
}

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
      try {
        setClients(parseConsultingClientArray(data || []))
      } catch (parseErr) {
        console.error('[useConsultingClients] Zod parse failed:', parseErr)
        setClients((data || []) as ConsultingClient[])
      }
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
  const { supabaseUser, role } = useAuth()
  const [client, setClient] = useState<ConsultingClientDetail | null>(null)
  const [assignableUsers, setAssignableUsers] = useState<ConsultingAssignableUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canManage = role === 'admin'

  const fetchClient = useCallback(async () => {
    if (!supabaseUser || !clientId) {
      setClient(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const [clientRes, unitsRes, contactsRes, assignmentsRes, visitsRes, financialsRes, usersRes] = await Promise.all([
      supabase.from('consulting_clients').select('*').eq('id', clientId).maybeSingle(),
      supabase.from('consulting_client_units').select('*').eq('client_id', clientId).order('is_primary', { ascending: false }).order('name', { ascending: true }),
      supabase.from('consulting_client_contacts').select('*').eq('client_id', clientId).order('is_primary', { ascending: false }).order('name', { ascending: true }),
      supabase.from('consulting_assignments').select('*, user:users(id,name,email,role)').eq('client_id', clientId).order('created_at', { ascending: true }),
      supabase.from('consulting_visits').select('*, consultant:users(name,email), auxiliary_consultant:users(name,email)').eq('client_id', clientId).order('visit_number', { ascending: true }),
      supabase.from('consulting_financials').select('*').eq('client_id', clientId).order('reference_date', { ascending: false }),
      supabase.from('users').select('id,name,email,role').eq('active', true).order('name', { ascending: true }),
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
          units: parseConsultingClientUnitArray(unitsRes.data || []),
          contacts: parseConsultingClientContactArray(contactsRes.data || []),
          assignments: parseConsultingAssignmentArray(assignmentsRes.data || []),
          visits: (visitsRes.data || []) as ConsultingVisit[],
          financials: parseConsultingFinancialArray(financialsRes.data || []),
        }
      : null

    setClient(detail)
    setAssignableUsers((usersRes.data || []) as ConsultingAssignableUser[])
    setLoading(false)
  }, [clientId, supabaseUser])

  const createUnit = useCallback(async (input: {
    name: string
    city?: string
    state?: string
    is_primary?: boolean
  }) => {
    if (!supabaseUser || !clientId || !canManage) {
      return { error: 'Apenas admin pode cadastrar unidade.' }
    }

    const { error: insertError } = await supabase.from('consulting_client_units').insert({
      client_id: clientId,
      name: input.name.trim(),
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      is_primary: input.is_primary ?? false,
    })

    if (insertError) return { error: insertError.message }
    await fetchClient()
    return { error: null }
  }, [canManage, clientId, fetchClient, supabaseUser])

  const createContact = useCallback(async (input: {
    name: string
    email?: string
    phone?: string
    role?: string
    is_primary?: boolean
  }) => {
    if (!supabaseUser || !clientId || !canManage) {
      return { error: 'Apenas admin pode cadastrar contato.' }
    }

    const { error: insertError } = await supabase.from('consulting_client_contacts').insert({
      client_id: clientId,
      name: input.name.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      role: input.role?.trim() || null,
      is_primary: input.is_primary ?? false,
    })

    if (insertError) return { error: insertError.message }
    await fetchClient()
    return { error: null }
  }, [canManage, clientId, fetchClient, supabaseUser])

  const upsertAssignment = useCallback(async (input: {
    user_id: string
    assignment_role: 'responsavel' | 'auxiliar' | 'viewer'
    active?: boolean
  }) => {
    if (!supabaseUser || !clientId || !canManage) {
      return { error: 'Apenas admin pode vincular consultores.' }
    }

    const { error: upsertError } = await supabase.from('consulting_assignments').upsert({
      client_id: clientId,
      user_id: input.user_id,
      assignment_role: input.assignment_role,
      active: input.active ?? true,
    }, { onConflict: 'client_id,user_id' })

    if (upsertError) return { error: upsertError.message }
    await fetchClient()
    return { error: null }
  }, [canManage, clientId, fetchClient, supabaseUser])

  const toggleAssignment = useCallback(async (assignmentId: string, active: boolean) => {
    if (!supabaseUser || !canManage) {
      return { error: 'Apenas admin pode alterar vinculos.' }
    }

    const { error: updateError } = await supabase
      .from('consulting_assignments')
      .update({ active })
      .eq('id', assignmentId)

    if (updateError) return { error: updateError.message }
    await fetchClient()
    return { error: null }
  }, [canManage, fetchClient, supabaseUser])

  const upsertFinancial = useCallback(async (input: {
    id?: string
    reference_date: string
    revenue: number
    fixed_expenses: number
    marketing_expenses: number
    investments: number
    financing: number
  }) => {
    if (!supabaseUser || !clientId || !canManage) {
      return { error: 'Apenas admin pode lancar dados financeiros.' }
    }

    const net_profit = input.revenue - input.fixed_expenses - input.marketing_expenses - input.investments - input.financing
    const roi = input.investments > 0 ? Number((net_profit / input.investments).toFixed(2)) : 0

    const payload = {
      client_id: clientId,
      reference_date: input.reference_date,
      revenue: input.revenue,
      fixed_expenses: input.fixed_expenses,
      marketing_expenses: input.marketing_expenses,
      investments: input.investments,
      financing: input.financing,
      net_profit,
      roi,
      conversion_rate: 0,
    }

    if (input.id) {
      const { error: updateError } = await supabase
        .from('consulting_financials')
        .update(payload)
        .eq('id', input.id)
      if (updateError) return { error: updateError.message }
    } else {
      const { error: insertError } = await supabase
        .from('consulting_financials')
        .insert(payload)
      if (insertError) return { error: insertError.message }
    }

    await fetchClient()
    return { error: null }
  }, [canManage, clientId, fetchClient, supabaseUser])

  const deleteFinancial = useCallback(async (financialId: string) => {
    if (!supabaseUser || !canManage) {
      return { error: 'Apenas admin pode excluir dados financeiros.' }
    }

    const { error: deleteError } = await supabase
      .from('consulting_financials')
      .delete()
      .eq('id', financialId)

    if (deleteError) return { error: deleteError.message }
    await fetchClient()
    return { error: null }
  }, [canManage, fetchClient, supabaseUser])

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  return {
    client,
    assignableUsers,
    loading,
    error,
    canManage,
    refetch: fetchClient,
    createUnit,
    createContact,
    upsertAssignment,
    toggleAssignment,
    upsertFinancial,
    deleteFinancial,
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
      
      setSteps(parseConsultingMethodologyStepArray(data || []))
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
