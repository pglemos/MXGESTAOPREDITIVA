import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import type { Training } from '@/types/database'
import { calculateAverageRating, shouldReviewContent, type DevelopmentContentSuggestion } from '@/lib/development-content'

export type TrainingWithProgress = Training & {
  watched: boolean
  user_rating: number | null
  user_comment: string | null
  average_rating: number
  rating_count: number
  needs_review: boolean
}

export type ContentSuggestionRow = {
  id: string
  requester_id: string
  store_id: string | null
  theme: string
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'received' | 'planned' | 'recording' | 'published' | 'rejected'
  linked_training_id: string | null
  curator_notes: string | null
  created_at: string
}

export type DevelopmentRecommendationRow = {
  id: string
  seller_id: string
  store_id: string | null
  source_type: 'feedback' | 'pdi' | 'manual' | 'rotina'
  source_id: string | null
  theme: string
  training_id: string | null
  reason: string
  status: 'recommended' | 'assigned' | 'in_progress' | 'completed' | 'dismissed'
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  created_at: string
  training?: Training | null
}

type TrainingRatingRow = {
  training_id: string
  user_id: string
  rating: number
  comment: string | null
}

export function useTrainings() {
  const { profile, role, storeId } = useAuth()
  const queryClient = useQueryClient()

  const { data: treinamentos, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['treinamentos', profile?.id, role, storeId],
    queryFn: async () => {
      if (!profile) return []

      const { data: all, error: allErr } = await supabase
        .from('treinamentos')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
      if (allErr) throw allErr

      const { data: progress, error: progErr } = await supabase
        .from('progresso_treinamentos')
        .select('training_id,status,completed_at,watched_at')
        .eq('user_id', profile.id)
      if (progErr) throw progErr

      const trainingIds = (all || []).map(item => item.id)
      const { data: ratings, error: ratingsErr } = trainingIds.length
        ? await supabase
          .from('treinamento_avaliacoes')
          .select('training_id,user_id,rating,comment')
          .in('training_id', trainingIds)
        : { data: [], error: null }
      if (ratingsErr) throw ratingsErr

      const watchedSet = new Set((progress || []).map(p => p.training_id))
      const ratingsByTraining = new Map<string, TrainingRatingRow[]>()
      ;((ratings || []) as TrainingRatingRow[]).forEach((rating) => {
        const list = ratingsByTraining.get(rating.training_id) || []
        list.push(rating)
        ratingsByTraining.set(rating.training_id, list)
      })
      if (all) {
        const filtered = isPerfilInternoMx(role)
          ? all
          : all.filter(t => (t.target_audience === 'todos' || t.target_audience === role) && (!t.store_id || t.store_id === storeId) && (t.editorial_status ?? 'active') === 'active')
        return filtered.map(t => {
          const trainingRatings = ratingsByTraining.get(t.id) || []
          const ownRating = trainingRatings.find(rating => rating.user_id === profile.id) || null
          const ratingStats = calculateAverageRating(trainingRatings)
          return {
            ...t,
            watched: watchedSet.has(t.id),
            user_rating: ownRating?.rating ?? null,
            user_comment: ownRating?.comment ?? null,
            average_rating: ratingStats.average,
            rating_count: ratingStats.count,
            needs_review: shouldReviewContent({
              averageRating: ratingStats.average,
              ratingCount: ratingStats.count,
              reviewAfter: t.review_after,
              editorialStatus: t.editorial_status,
            }),
          }
        }) as TrainingWithProgress[]
      }
      return [] as TrainingWithProgress[]
    },
    enabled: !!profile,
  })

  const markWatchedMut = useMutation({
    mutationFn: async (trainingId: string) => {
      if (!profile) return
      await supabase.from('progresso_treinamentos').upsert({
        user_id: profile.id,
        training_id: trainingId,
        status: 'concluido',
        progress_percent: 100,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,training_id' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treinamentos'] })
    },
  })

  const rateTrainingMut = useMutation({
    mutationFn: async (input: { trainingId: string; rating: number; comment?: string | null }) => {
      if (!profile) return { error: 'Não autenticado' }
      const rating = Math.max(1, Math.min(5, Math.round(input.rating)))
      const { error } = await supabase.from('treinamento_avaliacoes').upsert({
        user_id: profile.id,
        training_id: input.trainingId,
        rating,
        comment: input.comment || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'training_id,user_id' })
      return { error: error?.message || null }
    },
    onSuccess: (result) => {
      if (!result.error) queryClient.invalidateQueries({ queryKey: ['treinamentos'] })
    },
  })

  const suggestContentMut = useMutation({
    mutationFn: async (input: DevelopmentContentSuggestion) => {
      if (!profile) return { error: 'Não autenticado' }
      const { error } = await supabase.from('sugestoes_conteudo').insert({
        requester_id: profile.id,
        store_id: storeId || null,
        title: input.title,
        description: input.description || null,
        theme: input.theme,
        priority: input.priority || 'medium',
      })
      return { error: error?.message || null }
    },
    onSuccess: (result) => {
      if (!result.error) queryClient.invalidateQueries({ queryKey: ['content-suggestions'] })
    },
  })

  const createTrainingMut = useMutation({
    mutationFn: async (data: {
      title: string
      description?: string
      type?: string
      video_url?: string
      target_audience?: string
      active?: boolean
      source_kind?: string
      editorial_status?: string
      store_id?: string | null
      review_after?: string | null
      duration_minutes?: number
      xp_reward?: number
      curation_notes?: string | null
    }) => {
      if (!profile) return { error: 'Não autenticado' }
      const effectiveStoreId = data.store_id ?? (!isPerfilInternoMx(role) && data.source_kind === 'loja_institucional' ? storeId : null)
      const { error } = await supabase.from('treinamentos').insert({
        ...data,
        store_id: effectiveStoreId,
        curator_id: profile.id,
      })
      return { error: error?.message || null }
    },
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ['treinamentos'] })
      }
    },
  })

  return {
    treinamentos: treinamentos || [],
    loading,
    error: queryError?.message || null,
    markWatched: (trainingId: string) => markWatchedMut.mutateAsync(trainingId),
    rateTraining: (input: Parameters<typeof rateTrainingMut.mutateAsync>[0]) => rateTrainingMut.mutateAsync(input),
    suggestContent: (input: Parameters<typeof suggestContentMut.mutateAsync>[0]) => suggestContentMut.mutateAsync(input),
    createTraining: (data: Parameters<typeof createTrainingMut.mutateAsync>[0]) => createTrainingMut.mutateAsync(data),
    refetch,
  }
}

export function useContentSuggestions() {
  const { profile, role, storeId } = useAuth()

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['content-suggestions', role, profile?.id, storeId],
    queryFn: async () => {
      if (!profile) return [] as ContentSuggestionRow[]
      let query = supabase.from('sugestoes_conteudo').select('*').order('created_at', { ascending: false })
      if (!isPerfilInternoMx(role)) {
        query = query.or(`requester_id.eq.${profile.id},store_id.eq.${storeId}`)
      }
      const { data, error } = await query
      if (error) throw error
      return (data || []) as ContentSuggestionRow[]
    },
    enabled: !!profile,
  })

  return { suggestions: data || [], loading, refetch }
}

export function useDevelopmentRecommendations() {
  const { profile, role, storeId } = useAuth()
  const queryClient = useQueryClient()

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['development-recommendations', role, profile?.id, storeId],
    queryFn: async () => {
      if (!profile) return [] as DevelopmentRecommendationRow[]
      let query = supabase
        .from('recomendacoes_desenvolvimento')
        .select('*, training:treinamentos(*)')
        .order('created_at', { ascending: false })
      if (role === 'vendedor') query = query.eq('seller_id', profile.id)
      else if ((role === 'gerente' || role === 'dono') && storeId) query = query.eq('store_id', storeId)
      const { data, error } = await query
      if (error) throw error
      return (data || []) as DevelopmentRecommendationRow[]
    },
    enabled: !!profile,
  })

  const updateRecommendationMut = useMutation({
    mutationFn: async (input: { id: string; status: DevelopmentRecommendationRow['status'] }) => {
      const { error } = await supabase
        .from('recomendacoes_desenvolvimento')
        .update({ status: input.status, updated_at: new Date().toISOString() })
        .eq('id', input.id)
      return { error: error?.message || null }
    },
    onSuccess: (result) => {
      if (!result.error) queryClient.invalidateQueries({ queryKey: ['development-recommendations'] })
    },
  })

  return {
    recommendations: data || [],
    loading,
    updateRecommendation: (input: Parameters<typeof updateRecommendationMut.mutateAsync>[0]) => updateRecommendationMut.mutateAsync(input),
    refetch,
  }
}

export function useDevelopmentTracks() {
  const { profile, role, storeId } = useAuth()
  const queryClient = useQueryClient()

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['development-tracks', role, profile?.id, storeId],
    queryFn: async () => {
      if (!profile) return { assignments: [], progress: [] }
      let assignmentQuery = supabase
        .from('atribuicoes_trilha_desenvolvimento')
        .select('*, track:trilhas_desenvolvimento(*), seller:usuarios!atribuicoes_trilha_desenvolvimento_seller_id_fkey(id,name,avatar_url)')
        .order('created_at', { ascending: false })

      if (role === 'vendedor') assignmentQuery = assignmentQuery.eq('seller_id', profile.id)
      else if ((role === 'gerente' || role === 'dono') && storeId) assignmentQuery = assignmentQuery.eq('store_id', storeId)

      const { data: assignments, error } = await assignmentQuery
      if (error) throw error
      const assignmentIds = (assignments || []).map(item => item.id)
      const { data: progress, error: progressError } = assignmentIds.length
        ? await supabase
          .from('progresso_etapa_trilha')
          .select('*, step:etapas_trilha_desenvolvimento(*)')
          .in('assignment_id', assignmentIds)
          .order('created_at', { ascending: true })
        : { data: [], error: null }
      if (progressError) throw progressError

      return { assignments: assignments || [], progress: progress || [] }
    },
    enabled: !!profile,
  })

  const assignDefaultTrackMut = useMutation({
    mutationFn: async (input: { sellerId: string; targetStoreId?: string | null }) => {
      if (!profile) return { error: 'Não autenticado' }
      const effectiveStoreId = input.targetStoreId || storeId
      if (!effectiveStoreId) return { error: 'Loja não encontrada para atribuir trilha.' }
      const { data: track, error: trackError } = await supabase
        .from('trilhas_desenvolvimento')
        .select('id')
        .eq('track_type', 'novo_colaborador')
        .is('store_id', null)
        .eq('active', true)
        .limit(1)
        .maybeSingle()
      if (trackError || !track) return { error: trackError?.message || 'Trilha padrão não encontrada.' }

      const { data: assignment, error } = await supabase
        .from('atribuicoes_trilha_desenvolvimento')
        .upsert({
          track_id: track.id,
          seller_id: input.sellerId,
          store_id: effectiveStoreId,
          assigned_by: profile.id,
          status: 'active',
          current_month: 1,
        }, { onConflict: 'track_id,seller_id' })
        .select('id')
        .maybeSingle()
      if (error || !assignment) return { error: error?.message || 'Atribuição não criada.' }

      await supabase.rpc('inicializar_progresso_trilha', { p_assignment_id: assignment.id })
      await supabase.from('notificacoes').insert({
        recipient_id: input.sellerId,
        sender_id: profile.id,
        store_id: effectiveStoreId,
        title: 'Trilha de entrada liberada',
        message: 'Sua trilha de novo colaborador foi iniciada. Conclua as etapas em ordem para avançar até a liberação do gestor.',
        target_type: 'all',
        type: 'training',
        priority: 'high',
        link: '/vendedor/treinamentos',
        read: false,
      })
      return { error: null }
    },
    onSuccess: (result) => {
      if (!result.error) queryClient.invalidateQueries({ queryKey: ['development-tracks'] })
    },
  })

  const completeStepMut = useMutation({
    mutationFn: async (input: { progressId: string; feedback?: string | null }) => {
      const { error } = await supabase.rpc('concluir_etapa_trilha', {
        p_progress_id: input.progressId,
        p_feedback: input.feedback || null,
      })
      return { error: error?.message || null }
    },
    onSuccess: (result) => {
      if (!result.error) queryClient.invalidateQueries({ queryKey: ['development-tracks'] })
    },
  })

  return {
    assignments: data?.assignments || [],
    progress: data?.progress || [],
    loading,
    assignDefaultTrack: (input: Parameters<typeof assignDefaultTrackMut.mutateAsync>[0]) => assignDefaultTrackMut.mutateAsync(input),
    completeTrackStep: (input: Parameters<typeof completeStepMut.mutateAsync>[0]) => completeStepMut.mutateAsync(input),
    refetch,
  }
}
