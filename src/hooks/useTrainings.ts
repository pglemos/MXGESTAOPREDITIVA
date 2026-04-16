import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Training } from '@/types/database'

export function useTrainings() {
  const { profile, role } = useAuth()
  const queryClient = useQueryClient()

  const { data: trainings, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['trainings', profile?.id, role],
    queryFn: async () => {
      if (!profile) return []

      const { data: all, error: allErr } = await supabase
        .from('trainings')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
      if (allErr) throw allErr

      const { data: progress, error: progErr } = await supabase
        .from('training_progress')
        .select('training_id')
        .eq('user_id', profile.id)
      if (progErr) throw progErr

      const watchedSet = new Set((progress || []).map(p => p.training_id))
      if (all) {
        const filtered = role === 'admin'
          ? all
          : all.filter(t => t.target_audience === 'todos' || t.target_audience === role)
        return filtered.map(t => ({ ...t, watched: watchedSet.has(t.id) })) as (Training & { watched: boolean })[]
      }
      return [] as (Training & { watched: boolean })[]
    },
    enabled: !!profile,
  })

  const markWatchedMut = useMutation({
    mutationFn: async (trainingId: string) => {
      if (!profile) return
      await supabase.from('training_progress').upsert({ user_id: profile.id, training_id: trainingId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] })
    },
  })

  const createTrainingMut = useMutation({
    mutationFn: async (data: { title: string; description?: string; type?: string; video_url?: string; target_audience?: string; active?: boolean }) => {
      if (!profile) return { error: 'Não autenticado' }
      const { error } = await supabase.from('trainings').insert(data)
      return { error: error?.message || null }
    },
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ['trainings'] })
      }
    },
  })

  return {
    trainings: trainings || [],
    loading,
    error: queryError?.message || null,
    markWatched: (trainingId: string) => markWatchedMut.mutateAsync(trainingId),
    createTraining: (data: Parameters<typeof createTrainingMut.mutateAsync>[0]) => createTrainingMut.mutateAsync(data),
    refetch,
  }
}
