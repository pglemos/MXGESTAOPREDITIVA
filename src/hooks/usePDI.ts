import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { PDIFormData } from '@/types/database'
import { parsePDIArray, parsePDIReviewArray, type PDI, type PDIReview } from '@/lib/schemas/pdi.schema'

interface PDIReviewCreateDTO {
  notes?: string
  rating?: number
  pdi_id?: string
  reviewer_id?: string
}

const ALLOWED_REVIEW_KEYS = new Set<string>(['notes', 'rating', 'pdi_id', 'reviewer_id'])

function sanitizeReviewPayload(data: Record<string, unknown>): PDIReviewCreateDTO {
  const sanitized: PDIReviewCreateDTO = {}
  for (const key of ALLOWED_REVIEW_KEYS) {
    if (key in data) (sanitized as Record<string, unknown>)[key] = data[key]
  }
  return sanitized
}

export function usePDIs(storeIdOverride?: string) {
  const { profile, storeId: authStoreId, role } = useAuth()
  const queryClient = useQueryClient()
  const storeId = storeIdOverride || authStoreId

  const { data: pdis, isLoading: loading, refetch } = useQuery({
    queryKey: ['pdis', storeId, role, profile?.id],
    queryFn: async () => {
      if (!profile || (!storeId && role !== 'admin')) return [] as (PDI & { seller_name?: string })[]

      let query = supabase.from('pdis').select('*, seller:users!pdis_seller_id_fkey(name)')
      if (role === 'vendedor') query = query.eq('seller_id', profile.id)
      else if (role === 'gerente' || role === 'dono') query = query.eq('store_id', storeId)
      else if (role === 'admin' && storeIdOverride) query = query.eq('store_id', storeId)

      const { data } = await query.order('created_at', { ascending: false })
      if (data) {
        const validated = parsePDIArray(data.map(({ seller, ...rest }: Record<string, unknown>) => rest))
        return (data as (PDI & { seller?: { name?: string } })[]).map((p, i) => ({
          ...validated[i],
          seller_name: p.seller?.name,
        }))
      }
      return [] as (PDI & { seller_name?: string })[]
    },
    enabled: !!profile,
  })

  const fetchReviews = (pdiId: string) => {
    queryClient.invalidateQueries({ queryKey: ['pdi-reviews', pdiId] })
  }

  const createPDIMut = useMutation({
    mutationFn: async (data: PDIFormData) => {
      if (!profile || !storeId) return { error: 'Não autenticado' }
      if (role !== 'admin' && role !== 'gerente') return { error: 'Seu papel permite acompanhar PDIs, mas não criar ou editar.' }
      const { error } = await supabase.from('pdis').insert({
        store_id: storeId, manager_id: profile.id, seller_id: data.seller_id,
        objective: data.meta_6m,
        action: data.action_1,
        meta_6m: data.meta_6m, meta_12m: data.meta_12m, meta_24m: data.meta_24m,
        comp_prospeccao: data.comp_prospeccao, comp_abordagem: data.comp_abordagem,
        comp_demonstracao: data.comp_demonstracao, comp_fechamento: data.comp_fechamento,
        comp_crm: data.comp_crm, comp_digital: data.comp_digital,
        comp_disciplina: data.comp_disciplina, comp_organizacao: data.comp_organizacao,
        comp_negociacao: data.comp_negociacao, comp_produto: data.comp_produto,
        action_1: data.action_1, action_2: data.action_2 || null,
        action_3: data.action_3 || null, action_4: data.action_4 || null,
        action_5: data.action_5 || null,
        due_date: data.due_date || null,
      })
      return { error: error?.message || null }
    },
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ['pdis'] })
      }
    },
  })

  const acknowledgeMut = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'seller' | 'manager' }) => {
      const field = type === 'seller' ? 'seller_acknowledged_at' : 'manager_acknowledged_at'
      await supabase.from('pdis').update({ 
        [field]: new Date().toISOString(),
        acknowledged: type === 'seller' ? true : undefined
      }).eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdis'] })
    },
  })

  const updateStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (role !== 'admin' && role !== 'gerente') return
      await supabase.from('pdis').update({ status }).eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdis'] })
    },
  })

  const usePDIReviews = (pdiId: string) => {
    const { data } = useQuery({
      queryKey: ['pdi-reviews', pdiId],
      queryFn: async () => {
        const { data } = await supabase.from('pdi_reviews').select('*').eq('pdi_id', pdiId).order('created_at', { ascending: false })
        return parsePDIReviewArray(data || [])
      },
      enabled: !!pdiId,
    })
    return data || []
  }

  const createReviewMut = useMutation({
    mutationFn: async ({ pdiId, data }: { pdiId: string; data: Record<string, unknown> }) => {
      if (role !== 'admin' && role !== 'gerente') return { error: new Error('Seu papel permite acompanhar PDIs, mas não revisar.') }
      const sanitized = sanitizeReviewPayload(data)
      const { error } = await supabase.from('pdi_reviews').insert({ pdi_id: pdiId, ...sanitized })
      return { error }
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pdis'] })
      queryClient.invalidateQueries({ queryKey: ['pdi-reviews', variables.pdiId] })
    },
  })

  return {
    pdis: pdis || [],
    usePDIReviews,
    loading,
    createPDI: (data: PDIFormData) => createPDIMut.mutateAsync(data),
    updateStatus: (id: string, status: string) => updateStatusMut.mutateAsync({ id, status }),
    acknowledge: (id: string, type: 'seller' | 'manager') => acknowledgeMut.mutateAsync({ id, type }),
    createReview: (pdiId: string, data: Record<string, unknown>) => createReviewMut.mutateAsync({ pdiId, data }),
    fetchReviews,
    refetch,
  }
}

export function useMyPDIs() {
  const { profile, storeId: authStoreId } = useAuth()

  const { data: pdis, isLoading: loading, refetch } = useQuery({
    queryKey: ['my-pdis', profile?.id],
    queryFn: async () => {
      if (!profile || !authStoreId) return []
      const { data } = await supabase.from('pdis').select('*').eq('seller_id', profile.id).order('created_at', { ascending: false })
      return parsePDIArray(data || []) as (PDI & { seller_name?: string })[]
    },
    enabled: !!profile && !!authStoreId,
  })

  return {
    pdis: pdis || [],
    loading,
    refetch,
  }
}
