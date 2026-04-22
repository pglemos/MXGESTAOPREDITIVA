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
} from '@/lib/schemas/consulting-client.schema'

export function useConsultingClientDetailBySlug(slug?: string) {
  const { supabaseUser, role } = useAuth()
  const [client, setClient] = useState<ConsultingClientDetail | null>(null)
  const [assignableUsers, setAssignableUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canManage = role === 'admin'

  const fetchClient = useCallback(async () => {
    if (!supabaseUser || !slug || slug === 'undefined') {
      setClient(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // First, resolve the slug to ID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
    
    let query = supabase.from('consulting_clients').select('*')
    if (isUuid) {
      query = query.or(`slug.eq.${slug},id.eq.${slug}`)
    } else {
      query = query.eq('slug', slug)
    }

    const { data: clientData, error: clientError } = await query.maybeSingle()

    if (clientError || !clientData) {
      setError(clientError?.message || 'Cliente não encontrado.')
      setClient(null)
      setLoading(false)
      return
    }

    const clientId = clientData.id

    // Fetch related data
    const [unitsRes, contactsRes, assignmentsRes, visitsRes, financialsRes, modulesRes, usersRes, inventoryRes] = await Promise.all([
      supabase.from('consulting_client_units').select('*').eq('client_id', clientId).order('is_primary', { ascending: false }).order('name', { ascending: true }),
      supabase.from('consulting_client_contacts').select('*').eq('client_id', clientId).order('is_primary', { ascending: false }).order('name', { ascending: true }),
      supabase.from('consulting_assignments').select('*, user:users(id,name,email,role)').eq('client_id', clientId).order('created_at', { ascending: true }),
      supabase.from('consulting_visits').select('*, consultant:users(name,email), auxiliary_consultant:users(name,email)').eq('client_id', clientId).order('visit_number', { ascending: true }),
      supabase.from('consulting_financials').select('*').eq('client_id', clientId).order('reference_date', { ascending: false }),
      supabase.from('consulting_client_modules').select('*').eq('client_id', clientId).order('module_key', { ascending: true }),
      supabase.from('users').select('id,name,email,role').eq('active', true).order('name', { ascending: true }),
      supabase.from('consulting_inventory_snapshots').select('*').eq('client_id', clientId).order('reference_month', { ascending: false }),
    ])

    const detail: ConsultingClientDetail = {
      ...(clientData as ConsultingClient),
      store_id: clientData.store_id || null,
      units: parseConsultingClientUnitArray(unitsRes.data || []),
      contacts: parseConsultingClientContactArray(contactsRes.data || []),
      assignments: parseConsultingAssignmentArray(assignmentsRes.data || []),
      visits: (visitsRes.data || []) as any[],
      financials: parseConsultingFinancialArray(financialsRes.data || []),
      modules: parseConsultingClientModuleArray(modulesRes.data || []),
      inventory_snapshots: (inventoryRes.data || []) as any[],
    }

    setClient(detail)
    setAssignableUsers(usersRes.data || [])
    setLoading(false)
  }, [slug, supabaseUser])

  const clientId = client?.id

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
    deleteFinancial
  }
}
