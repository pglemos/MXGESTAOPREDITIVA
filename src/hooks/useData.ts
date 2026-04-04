import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Training, TrainingProgress, Feedback, FeedbackFormData, PDI, PDIReview, PDIFormData, Notification as AppNotification, DailyCheckin } from '@/types/database'
import { startOfWeek } from 'date-fns'
import { calcularFunil, gerarDiagnosticoMX } from '@/lib/calculations'

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
            const filtered = role === 'consultor' || role === 'admin'
                ? all
                : all.filter(t => t.target_audience === 'todos' || t.target_audience === role)
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
export function useFeedbacks(filters?: { storeId?: string; sellerId?: string }) {
    const { profile, storeId: authStoreId, role } = useAuth()
    const storeId = filters?.storeId || authStoreId
    const [feedbacks, setFeedbacks] = useState<(Feedback & { seller_name?: string; manager_name?: string })[]>([])
    const [loading, setLoading] = useState(true)

    const fetchFeedbacks = useCallback(async () => {
        if (!profile || !storeId) {
            setFeedbacks([])
            setLoading(false)
            return
        }
        setLoading(true)
        let query = supabase.from('feedbacks').select('*, seller:users!feedbacks_seller_id_fkey(name), manager:users!feedbacks_manager_id_fkey(name)')
        
        if (role === 'vendedor') {
            query = query.eq('seller_id', profile.id)
        } else if (role === 'gerente' || role === 'consultor' || role === 'admin') {
            query = query.eq('store_id', storeId)
            if (filters?.sellerId) {
                query = query.eq('seller_id', filters.sellerId)
            }
        }

        const { data } = await query.order('created_at', { ascending: false })
        if (data) setFeedbacks(data.map((f: any) => ({ ...f, seller_name: f.seller?.name, manager_name: f.manager?.name })))
        setLoading(false)
    }, [profile, storeId, role, filters?.sellerId])

    const createFeedback = async (data: FeedbackFormData) => {
        if (!profile || !storeId) return { error: 'Não autenticado' }
        const { error } = await supabase.from('feedbacks').insert({
            store_id: storeId, manager_id: profile.id, seller_id: data.seller_id,
            week_reference: data.week_reference,
            leads_week: data.leads_week, agd_week: data.agd_week,
            visit_week: data.visit_week, vnd_week: data.vnd_week,
            tx_lead_agd: data.tx_lead_agd, tx_agd_visita: data.tx_agd_visita,
            tx_visita_vnd: data.tx_visita_vnd,
            meta_compromisso: data.meta_compromisso,
            positives: data.positives, attention_points: data.attention_points,
            action: data.action, notes: data.notes || null,
        })
        
        if (!error) {
            // Gatilho: Notificar Vendedor
            await supabase.from('notifications').insert({
                recipient_id: data.seller_id,
                store_id: storeId,
                title: 'Novo Feedback Estruturado',
                message: `Seu gestor ${profile.name} enviou o feedback da semana. Clique para revisar seu diagnóstico 20/60/33.`,
                type: 'performance',
                priority: 'medium',
                link: '/vendedor/feedback'
            })
            await fetchFeedbacks()
        }
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
    const [reviews, setReviews] = useState<Record<string, PDIReview[]>>({})
    const [loading, setLoading] = useState(true)

    const fetchPDIs = useCallback(async () => {
        if (!profile || !storeId) {
            setPdis([])
            setLoading(false)
            return
        }
        setLoading(true)
        let query = supabase.from('pdis').select('*, seller:users!pdis_seller_id_fkey(name)')
        if (role === 'vendedor') query = query.eq('seller_id', profile.id)
        else if (role === 'gerente') query = query.eq('store_id', storeId)
        const { data } = await query.order('created_at', { ascending: false })
        if (data) setPdis(data.map((p: any) => ({ ...p, seller_name: p.seller?.name })))
        setLoading(false)
    }, [profile, storeId, role])

    const fetchReviews = async (pdiId: string) => {
        const { data } = await supabase.from('pdi_reviews').select('*').eq('pdi_id', pdiId).order('created_at', { ascending: false })
        if (data) setReviews(prev => ({ ...prev, [pdiId]: data }))
    }

    const createReview = async (pdiId: string, data: Partial<PDIReview>) => {
        const { error } = await supabase.from('pdi_reviews').insert({ ...data, pdi_id: pdiId })
        if (!error) await fetchReviews(pdiId)
        return { error }
    }

    const createPDI = async (data: PDIFormData) => {
        if (!profile || !storeId) return { error: 'Não autenticado' }
        const { error } = await supabase.from('pdis').insert({
            store_id: storeId, manager_id: profile.id, seller_id: data.seller_id,
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
        
        if (!error) {
            // Gatilho: Notificar Vendedor
            await supabase.from('notifications').insert({
                recipient_id: data.seller_id,
                store_id: storeId,
                title: 'Novo Plano de Carreira (PDI)',
                message: `Seu PDI Oficial MX foi atualizado por ${profile.name}. Clique para assinar o compromisso.`,
                type: 'performance',
                priority: 'high',
                link: '/vendedor/pdi'
            })
            await fetchPDIs()
        }
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

    return { pdis, reviews, loading, createPDI, updateStatus, acknowledge, fetchReviews, createReview, refetch: fetchPDIs }
    }


// ============ NOTIFICATIONS ============
export function useNotifications() {
    const { profile } = useAuth()
    const [notifications, setNotifications] = useState<AppNotification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)

    const fetchNotifications = useCallback(async () => {
        if (!profile) return
        setLoading(true)
        
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('recipient_id', profile.id)
            .order('priority', { ascending: false }) // High first
            .order('created_at', { ascending: false })
            .limit(50)

        if (!error && data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.read).length)
        }
        setLoading(false)
    }, [profile])

    const markRead = async (notificationId: string) => {
        if (!profile) return
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)
            .eq('recipient_id', profile.id)
        
        if (!error) await fetchNotifications()
    }

    const markAllAsRead = async () => {
        if (!profile || notifications.length === 0) return
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('recipient_id', profile.id)
            .eq('read', false)
        
        if (!error) await fetchNotifications()
    }

    const sendNotification = async (data: { 
        recipient_id?: string; 
        store_id?: string;
        target_role?: 'todos' | 'gerente' | 'vendedor';
        title: string; 
        message: string; 
        type: 'discipline' | 'alert' | 'performance' | 'system';
        priority: 'high' | 'medium' | 'low';
        link?: string;
    }) => {
        if (!profile) return { error: 'Não autenticado' }

        // Se houver um recipient_id específico, envia direto
        if (data.recipient_id) {
            const { error } = await supabase.from('notifications').insert({
                recipient_id: data.recipient_id,
                store_id: data.store_id || null,
                title: data.title,
                message: data.message,
                type: data.type,
                priority: data.priority,
                link: data.link || null,
                read: false
            })
            if (!error) await fetchNotifications()
            return { error: error?.message || null }
        }

        // Lógica de Broadcast (Simplificada para o MVP)
        let query = supabase.from('memberships').select('user_id')
        if (data.store_id) query = query.eq('store_id', data.store_id)
        if (data.target_role && data.target_role !== 'todos') query = query.eq('role', data.target_role)
        
        const { data: members, error: mError } = await query
        if (mError) return { error: mError.message }

        if (members && members.length > 0) {
            const batch = members.map(m => ({
                recipient_id: m.user_id,
                store_id: data.store_id || null,
                title: data.title,
                message: data.message,
                type: data.type,
                priority: data.priority,
                link: data.link || null,
                read: false
            }))
            const { error } = await supabase.from('notifications').insert(batch)
            if (!error) await fetchNotifications()
            return { error: error?.message || null }
        }

        return { error: 'Nenhum destinatário localizado.' }
    }

    const deleteNotification = async (id: string) => {
        if (!profile) return
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('recipient_id', profile.id)
        
        if (!error) await fetchNotifications()
    }

    useEffect(() => { fetchNotifications() }, [fetchNotifications])
    
    return { 
        notifications, unreadCount, loading, 
        markRead, markAllAsRead, deleteNotification, sendNotification,
        refetch: fetchNotifications 
    }
}

// ============ TEAM TRAININGS (GERENTE) ============
export function useTeamTrainings() {
    const { storeId } = useAuth()
    const [teamProgress, setTeamProgress] = useState<{ 
        seller_id: string, 
        seller_name: string, 
        watched: string[], 
        total_trainings: number, 
        percentage: number,
        current_gap: string | null,
        gap_training_completed: boolean
    }[]>([])
    const [loading, setLoading] = useState(true)

    const fetchProgress = useCallback(async () => {
        if (!storeId) {
            setTeamProgress([])
            setLoading(false)
            return
        }
        setLoading(true)

        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0]

        const [
            { data: members }, 
            { data: trainings },
            { data: checkins }
        ] = await Promise.all([
            supabase.from('memberships').select('user_id, users(name)').eq('store_id', storeId).eq('role', 'vendedor'),
            supabase.from('trainings').select('*').eq('active', true).in('target_audience', ['todos', 'vendedor']),
            supabase.from('daily_checkins').select('*').eq('store_id', storeId).gte('reference_date', weekStart)
        ])

        const totalTrainings = trainings?.length || 0

        if (members && members.length > 0) {
            const userIds = members.map(m => m.user_id)
            const { data: progress } = await supabase.from('training_progress').select('user_id, training_id').in('user_id', userIds)

            const stats = members.map((m: any) => {
                const p = (progress || []).filter(pr => pr.user_id === m.user_id)
                const watchedIds = p.map(pr => pr.training_id)
                const watchedCount = p.length
                const percentage = totalTrainings > 0 ? (watchedCount / totalTrainings) * 100 : 0
                
                // Análise de Gap em tempo real para o gerente
                const sellerCheckins = (checkins || []).filter(c => c.seller_user_id === m.user_id) as DailyCheckin[]
                const funil = calcularFunil(sellerCheckins)
                const diag = gerarDiagnosticoMX(funil)
                
                const categoryMap: Record<string, string> = {
                    'LEAD_AGD': 'prospeccao',
                    'AGD_VISITA': 'atendimento',
                    'VISITA_VND': 'fechamento'
                }
                const gapCategory = diag.gargalo ? categoryMap[diag.gargalo] : null
                const gapTrainings = (trainings || []).filter(t => t.type === gapCategory)
                const gapCompleted = gapTrainings.length > 0 ? gapTrainings.every(t => watchedIds.includes(t.id)) : true

                return {
                    seller_id: m.user_id,
                    seller_name: m.users?.name || 'Vendedor',
                    watched: watchedIds,
                    total_trainings: totalTrainings,
                    percentage,
                    current_gap: diag.gargalo,
                    gap_training_completed: gapCompleted
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
