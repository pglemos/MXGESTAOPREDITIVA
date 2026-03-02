import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Training, TrainingProgress, Feedback, FeedbackFormData, PDI, PDIFormData, Notification as AppNotification } from '@/types/database'

// ============ TRAININGS ============
export function useTrainings() {
    const { profile, role } = useAuth()
    const [trainings, setTrainings] = useState<(Training & { watched: boolean })[]>([])
    const [loading, setLoading] = useState(true)

    const fetchTrainings = useCallback(async () => {
        if (!profile) return
        setLoading(true)
        const { data: all } = await supabase.from('trainings').select('*').eq('active', true).order('created_at', { ascending: false })
        const { data: progress } = await supabase.from('training_progress').select('training_id').eq('user_id', profile.id)
        const watchedSet = new Set((progress || []).map(p => p.training_id))
        if (all) {
            const filtered = role === 'consultor' ? all : all.filter(t => t.target_audience === 'todos' || t.target_audience === role)
            setTrainings(filtered.map(t => ({ ...t, watched: watchedSet.has(t.id) })))
        }
        setLoading(false)
    }, [profile, role])

    const markWatched = async (trainingId: string) => {
        if (!profile) return
        await supabase.from('training_progress').upsert({ user_id: profile.id, training_id: trainingId })
        await fetchTrainings()
    }

    const createTraining = async (data: { title: string; description: string; type: string; video_url: string; target_audience: string }) => {
        const { error } = await supabase.from('trainings').insert(data)
        if (!error) await fetchTrainings()
        return { error: error?.message || null }
    }

    useEffect(() => { fetchTrainings() }, [fetchTrainings])
    return { trainings, loading, markWatched, createTraining, refetch: fetchTrainings }
}

// ============ FEEDBACKS ============
export function useFeedbacks(storeIdOverride?: string) {
    const { profile, storeId: authStoreId, role } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [feedbacks, setFeedbacks] = useState<(Feedback & { seller_name?: string; manager_name?: string })[]>([])
    const [loading, setLoading] = useState(true)

    const fetchFeedbacks = useCallback(async () => {
        if (!profile || !storeId) return
        setLoading(true)
        let query = supabase.from('feedbacks').select('*, seller:users!feedbacks_seller_id_fkey(name), manager:users!feedbacks_manager_id_fkey(name)')
        if (role === 'vendedor') query = query.eq('seller_id', profile.id)
        else if (role === 'gerente') query = query.eq('store_id', storeId)
        const { data } = await query.order('created_at', { ascending: false })
        if (data) setFeedbacks(data.map((f: any) => ({ ...f, seller_name: f.seller?.name, manager_name: f.manager?.name })))
        setLoading(false)
    }, [profile, storeId, role])

    const createFeedback = async (data: FeedbackFormData) => {
        if (!profile || !storeId) return { error: 'Não autenticado' }
        const { error } = await supabase.from('feedbacks').insert({
            store_id: storeId, manager_id: profile.id, seller_id: data.seller_id,
            positives: data.positives, attention_points: data.attention_points,
            action: data.action, notes: data.notes || null,
        })
        if (!error) await fetchFeedbacks()
        return { error: error?.message || null }
    }

    const acknowledge = async (id: string) => {
        await supabase.from('feedbacks').update({ acknowledged: true }).eq('id', id)
        await fetchFeedbacks()
    }

    useEffect(() => { fetchFeedbacks() }, [fetchFeedbacks])
    return { feedbacks, loading, createFeedback, acknowledge, refetch: fetchFeedbacks }
}

// ============ PDIs ============
export function usePDIs(storeIdOverride?: string) {
    const { profile, storeId: authStoreId, role } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [pdis, setPdis] = useState<(PDI & { seller_name?: string })[]>([])
    const [loading, setLoading] = useState(true)

    const fetchPDIs = useCallback(async () => {
        if (!profile || !storeId) return
        setLoading(true)
        let query = supabase.from('pdis').select('*, seller:users!pdis_seller_id_fkey(name)')
        if (role === 'vendedor') query = query.eq('seller_id', profile.id)
        else if (role === 'gerente') query = query.eq('store_id', storeId)
        const { data } = await query.order('created_at', { ascending: false })
        if (data) setPdis(data.map((p: any) => ({ ...p, seller_name: p.seller?.name })))
        setLoading(false)
    }, [profile, storeId, role])

    const createPDI = async (data: PDIFormData) => {
        if (!profile || !storeId) return { error: 'Não autenticado' }
        const { error } = await supabase.from('pdis').insert({
            store_id: storeId, manager_id: profile.id, seller_id: data.seller_id,
            objective: data.objective, action: data.action, due_date: data.due_date || null,
        })
        if (!error) await fetchPDIs()
        return { error: error?.message || null }
    }

    const updateStatus = async (id: string, status: string) => {
        await supabase.from('pdis').update({ status }).eq('id', id)
        await fetchPDIs()
    }

    const acknowledge = async (id: string) => {
        await supabase.from('pdis').update({ acknowledged: true }).eq('id', id)
        await fetchPDIs()
    }

    useEffect(() => { fetchPDIs() }, [fetchPDIs])
    return { pdis, loading, createPDI, updateStatus, acknowledge, refetch: fetchPDIs }
}

// ============ NOTIFICATIONS ============
export function useNotifications() {
    const { profile } = useAuth()
    const [notifications, setNotifications] = useState<(AppNotification & { read: boolean })[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)

    const fetchNotifications = useCallback(async () => {
        if (!profile) return
        setLoading(true)
        const { data: notifs } = await supabase.from('notifications').select('*').order('sent_at', { ascending: false }).limit(50)
        const { data: reads } = await supabase.from('notification_reads').select('notification_id').eq('user_id', profile.id)
        const readSet = new Set((reads || []).map(r => r.notification_id))
        if (notifs) {
            const enriched = notifs.map(n => ({ ...n, read: readSet.has(n.id) }))
            setNotifications(enriched)
            setUnreadCount(enriched.filter(n => !n.read).length)
        }
        setLoading(false)
    }, [profile])

    const markRead = async (notificationId: string) => {
        if (!profile) return
        await supabase.from('notification_reads').upsert({ notification_id: notificationId, user_id: profile.id })
        await fetchNotifications()
    }

    const sendNotification = async (data: { title: string; message: string; target_type: 'all' | 'store'; target_store_id?: string }) => {
        if (!profile) return { error: 'Não autenticado' }
        const { error } = await supabase.from('notifications').insert({
            sender_id: profile.id, title: data.title, message: data.message,
            target_type: data.target_type, target_store_id: data.target_store_id || null,
        })
        if (!error) await fetchNotifications()
        return { error: error?.message || null }
    }

    useEffect(() => { fetchNotifications() }, [fetchNotifications])
    return { notifications, unreadCount, loading, markRead, sendNotification, refetch: fetchNotifications }
}

// ============ TEAM TRAININGS (GERENTE) ============
export function useTeamTrainings() {
    const { storeId } = useAuth()
    const [teamProgress, setTeamProgress] = useState<{ seller_id: string, seller_name: string, watched: string[], total_trainings: number, percentage: number }[]>([])
    const [loading, setLoading] = useState(true)

    const fetchProgress = useCallback(async () => {
        if (!storeId) return
        setLoading(true)

        const { data: members } = await supabase.from('memberships').select('user_id, users(name)').eq('store_id', storeId).eq('role', 'vendedor')
        const { data: trainings } = await supabase.from('trainings').select('id').eq('active', true).in('target_audience', ['todos', 'vendedor'])

        const totalTrainings = trainings?.length || 0

        if (members && members.length > 0) {
            const userIds = members.map(m => m.user_id)
            const { data: progress } = await supabase.from('training_progress').select('user_id, training_id').in('user_id', userIds)

            const stats = members.map((m: any) => {
                const p = (progress || []).filter(pr => pr.user_id === m.user_id)
                const watchedCount = p.length
                const percentage = totalTrainings > 0 ? (watchedCount / totalTrainings) * 100 : 0
                return {
                    seller_id: m.user_id,
                    seller_name: m.users?.name || 'Vendedor',
                    watched: p.map(pr => pr.training_id),
                    total_trainings: totalTrainings,
                    percentage
                }
            }).sort((a, b) => b.percentage - a.percentage)

            setTeamProgress(stats)
        } else {
            setTeamProgress([])
        }

        setLoading(false)
    }, [storeId])

    useEffect(() => { fetchProgress() }, [fetchProgress])
    return { teamProgress, loading, refetch: fetchProgress }
}
