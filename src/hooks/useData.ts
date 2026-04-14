import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Training, TrainingProgress, Feedback, FeedbackFormData, WeeklyFeedbackReport, PDI, PDIReview, PDIFormData, Notification as AppNotification, DailyCheckin } from '@/types/database'
import { startOfWeek } from 'date-fns'
import { calcularFunil, gerarDiagnosticoMX } from '@/lib/calculations'

// ============ TRAININGS ============
export function useTrainings() {
    const { profile, role } = useAuth()
    const [trainings, setTrainings] = useState<(Training & { watched: boolean })[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchTrainings = useCallback(async () => {
        if (!profile) return
        setLoading(true)
        setError(null)
        try {
            const { data: all, error: allErr } = await supabase.from('trainings').select('*').eq('active', true).order('created_at', { ascending: false })
            if (allErr) throw allErr
            const { data: progress, error: progErr } = await supabase.from('training_progress').select('training_id').eq('user_id', profile.id)
            if (progErr) throw progErr
            
            const watchedSet = new Set((progress || []).map(p => p.training_id))
            if (all) {
                const filtered = role === 'admin'
                    ? all
                    : all.filter(t => t.target_audience === 'todos' || t.target_audience === role)
                setTrainings(filtered.map(t => ({ ...t, watched: watchedSet.has(t.id) })))
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [profile, role])

    const markWatched = async (trainingId: string) => {
        if (!profile) return
        await supabase.from('training_progress').upsert({ user_id: profile.id, training_id: trainingId })
        await fetchTrainings()
    }

    const createTraining = async (data: any) => {
        if (!profile) return { error: 'Não autenticado' }
        const { error } = await supabase.from('trainings').insert(data)
        if (!error) await fetchTrainings()
        return { error: error?.message || null }
    }

    useEffect(() => { fetchTrainings() }, [fetchTrainings])
    return { trainings, loading, error, markWatched, createTraining, refetch: fetchTrainings }
}

// ============ FEEDBACKS ============
export function useFeedbacks(filters?: { storeId?: string; sellerId?: string }) {
    const { profile, storeId: authStoreId, role } = useAuth()
    const storeId = filters?.storeId || authStoreId
    const [feedbacks, setFeedbacks] = useState<(Feedback & { seller_name?: string; manager_name?: string })[]>([])
    const [loading, setLoading] = useState(true)

    const fetchFeedbacks = useCallback(async () => {
        if (!profile || (!storeId && role !== 'admin')) {
            setFeedbacks([])
            setLoading(false)
            return
        }
        setLoading(true)
        let query = supabase.from('feedbacks').select('*, seller:users!feedbacks_seller_id_fkey(name), manager:users!feedbacks_manager_id_fkey(name)')
        
        if (role === 'vendedor') {
            query = query.eq('seller_id', profile.id)
        } else if (role === 'gerente' || role === 'dono') {
            if (storeId) query = query.eq('store_id', storeId)
            if (filters?.sellerId) {
                query = query.eq('seller_id', filters.sellerId)
            }
        } else if (role === 'admin') {
            if (filters?.storeId) query = query.eq('store_id', filters.storeId)
            if (filters?.sellerId) {
                query = query.eq('seller_id', filters.sellerId)
            }
        }

        const { data } = await query.order('created_at', { ascending: false })
        if (data) setFeedbacks(data.map((f: any) => ({ ...f, seller_name: f.seller?.name, manager_name: f.manager?.name })))
        setLoading(false)
    }, [profile, storeId, role, filters?.storeId, filters?.sellerId])


    const createFeedback = async (data: FeedbackFormData) => {
        if (!profile || !storeId) return { error: 'Não autenticado' }
        if (role !== 'admin' && role !== 'gerente') return { error: 'Seu papel permite acompanhar feedbacks, mas não criar ou editar.' }
        
        // Usamos upsert com base na constraint UNIQUE (seller_id, week_reference)
        const { error } = await supabase.from('feedbacks').upsert({
            store_id: storeId, 
            manager_id: profile.id, 
            seller_id: data.seller_id,
            week_reference: data.week_reference,
            leads_week: data.leads_week, 
            agd_week: data.agd_week,
            visit_week: data.visit_week, 
            vnd_week: data.vnd_week,
            tx_lead_agd: data.tx_lead_agd, 
            tx_agd_visita: data.tx_agd_visita,
            tx_visita_vnd: data.tx_visita_vnd,
            meta_compromisso: data.meta_compromisso,
            team_avg_json: data.team_avg_json || {},
            diagnostic_json: data.diagnostic_json || {},
            commitment_suggested: data.commitment_suggested ?? data.meta_compromisso,
            positives: data.positives, 
            attention_points: data.attention_points,
            action: data.action, 
            notes: data.notes || null,
            acknowledged: false, // Resetar ciência se for atualização
            acknowledged_at: null
        }, {
            onConflict: 'seller_id, week_reference'
        })
        
        if (!error) await fetchFeedbacks()
        return { error: error?.message || null }
    }

    const acknowledge = async (id: string) => {
        await supabase.from('feedbacks').update({ acknowledged: true, acknowledged_at: new Date().toISOString() }).eq('id', id)
        await fetchFeedbacks()
    }

    useEffect(() => { fetchFeedbacks() }, [fetchFeedbacks])
    return { feedbacks, loading, createFeedback, acknowledge, acknowledgeFeedback: acknowledge, refetch: fetchFeedbacks }
}

export function useMyPDIs() {
    const { profile, storeId: authStoreId } = useAuth()
    const [pdis, setPdis] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetch = useCallback(async () => {
        if (!profile || !authStoreId) return
        setLoading(true)
        const { data } = await supabase.from('pdis').select('*').eq('seller_id', profile.id).order('created_at', { ascending: false })
        if (data) setPdis(data)
        setLoading(false)
    }, [profile, authStoreId])

    useEffect(() => { fetch() }, [fetch])
    return { pdis, loading, refetch: fetch }
}

export function useWeeklyFeedbackReports(filters?: { storeId?: string }) {
    const { profile, storeId: authStoreId, role } = useAuth()
    const storeId = filters?.storeId || authStoreId
    const [reports, setReports] = useState<WeeklyFeedbackReport[]>([])
    const [loading, setLoading] = useState(true)

    const fetchReports = useCallback(async () => {
        if (!profile || (!storeId && role !== 'admin')) {
            setReports([])
            setLoading(false)
            return
        }

        setLoading(true)
        let query = supabase.from('weekly_feedback_reports').select('*')
        if (storeId) query = query.eq('store_id', storeId)
        const { data } = await query.order('week_start', { ascending: false }).limit(12)
        setReports((data || []) as WeeklyFeedbackReport[])
        setLoading(false)
    }, [profile, storeId, role])

    useEffect(() => { fetchReports() }, [fetchReports])
    return { reports, loading, refetch: fetchReports }
}

// ============ PDIs ============
export function usePDIs(storeIdOverride?: string) {
    const { profile, storeId: authStoreId, role } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [pdis, setPdis] = useState<(PDI & { seller_name?: string })[]>([])
    const [reviews, setReviews] = useState<Record<string, PDIReview[]>>({})
    const [loading, setLoading] = useState(true)

    const fetchPDIs = useCallback(async () => {
        if (!profile || (!storeId && role !== 'admin')) {
            setPdis([])
            setLoading(false)
            return
        }
        setLoading(true)
        let query = supabase.from('pdis').select('*, seller:users!pdis_seller_id_fkey(name)')
        if (role === 'vendedor') query = query.eq('seller_id', profile.id)
        else if (role === 'gerente' || role === 'dono') query = query.eq('store_id', storeId)
        else if (role === 'admin' && storeIdOverride) query = query.eq('store_id', storeId)
        const { data } = await query.order('created_at', { ascending: false })
        if (data) setPdis(data.map((p: any) => ({ ...p, seller_name: p.seller?.name })))
        setLoading(false)
    }, [profile, storeId, role])

    const fetchReviews = async (pdiId: string) => {
        const { data } = await supabase.from('pdi_reviews').select('*').eq('pdi_id', pdiId).order('created_at', { ascending: false })
        if (data) setReviews(prev => ({ ...prev, [pdiId]: data }))
    }

    const createPDI = async (data: PDIFormData) => {
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
        if (!error) await fetchPDIs()
        return { error: error?.message || null }
    }

    const acknowledge = async (id: string) => {
        await supabase.from('pdis').update({ acknowledged: true }).eq('id', id)
        await fetchPDIs()
    }

    const updateStatus = async (id: string, status: string) => {
        if (role !== 'admin' && role !== 'gerente') return
        await supabase.from('pdis').update({ status }).eq('id', id)
        await fetchPDIs()
    }

    const createReview = async (pdiId: string, data: any) => {
        if (role !== 'admin' && role !== 'gerente') return { error: new Error('Seu papel permite acompanhar PDIs, mas não revisar.') }
        const { error } = await supabase.from('pdi_reviews').insert({ pdi_id: pdiId, ...data })
        if (!error) {
            await fetchPDIs()
            await fetchReviews(pdiId)
        }
        return { error }
    }

    useEffect(() => { fetchPDIs() }, [fetchPDIs])
    return { pdis, reviews, loading, createPDI, updateStatus, acknowledge, createReview, fetchReviews, refetch: fetchPDIs }
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
        
        // Simulação de latência para resiliência de UI (apenas em desenvolvimento se necessário)
        // const delay = (ms: number) => new Promise(res => setTimeout(ms, res))
        // await delay(1000)

        const { data, error } = await supabase.from('notifications')
            .select('*')
            .eq('recipient_id', profile.id)
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(50)
            
        if (!error && data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.read).length)
        } else if (error) {
            console.error('Audit Error [useNotifications]: fetch fail ->', error.message)
        }
        setLoading(false)
    }, [profile])

    const markRead = async (notificationId: string) => {
        if (!profile) return
        await supabase.from('notifications').update({ read: true }).eq('id', notificationId).eq('recipient_id', profile.id)
        await fetchNotifications()
    }

    const markAllAsRead = async () => {
        if (!profile) return
        await supabase.from('notifications').update({ read: true }).eq('recipient_id', profile.id)
        await fetchNotifications()
    }

    const deleteNotification = async (id: string) => {
        if (!profile) return
        await supabase.from('notifications').delete().eq('id', id).eq('recipient_id', profile.id)
        await fetchNotifications()
    }

    const sendNotification = async (data: any) => {
        if (!profile) return { error: 'Não autenticado' }
        
        // Se não houver destinatário direto, é um broadcast
        if (!data.recipient_id && (data.target_role || data.store_id || !data.store_id)) {
            const { error } = await supabase.rpc('send_broadcast_notification', {
                p_title: data.title,
                p_message: data.message,
                p_type: data.type || 'system',
                p_priority: data.priority || 'medium',
                p_store_id: data.store_id || null,
                p_target_role: data.target_role || 'todos',
                p_link: data.link || null,
                p_sender_id: profile.id
            })
            if (!error) await fetchNotifications()
            return { error: error?.message || null }
        }

        const { error } = await supabase.from('notifications').insert({ ...data, sender_id: profile.id, read: false })
        if (!error) await fetchNotifications()
        return { error: error?.message || null }
    }

    useEffect(() => { fetchNotifications() }, [fetchNotifications])
    return { 
        notifications, 
        unreadCount, 
        loading, 
        markRead, 
        markAllAsRead, 
        deleteNotification, 
        sendNotification, 
        fetchNotifications,
        refetch: fetchNotifications 
    }
}

export function useSystemBroadcasts() {
    const { profile, role } = useAuth()
    const [broadcasts, setBroadcasts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchBroadcasts = useCallback(async () => {
        if (!profile || role !== 'admin') {
            setBroadcasts([])
            setLoading(false)
            return
        }
        setLoading(true)
        // Busca notificações únicas por broadcast_id enviadas pelo sistema ou admins
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .not('broadcast_id', 'is', null)
            .order('created_at', { ascending: false })
        
        if (!error && data) {
            // Agrupar por broadcast_id no client-side para simplicidade
            const unique = new Map()
            data.forEach(n => {
                if (!unique.has(n.broadcast_id)) unique.set(n.broadcast_id, n)
            })
            setBroadcasts(Array.from(unique.values()))
        }
        setLoading(false)
    }, [profile, role])

    useEffect(() => { fetchBroadcasts() }, [fetchBroadcasts])
    return { broadcasts, loading, refetch: fetchBroadcasts }
}

// ============ TEAM TRAININGS (GERENTE) ============
export function useTeamTrainings() {
    const { storeId } = useAuth()
    const [teamProgress, setTeamProgress] = useState<{ seller_id: string, seller_name: string, watched: string[], total_trainings: number, percentage: number, current_gap: string | null, gap_training_completed: boolean }[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchProgress = useCallback(async () => {
        if (!storeId) {
            setTeamProgress([])
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0]
            const [ { data: members }, { data: trainings }, { data: checkins } ] = await Promise.all([
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
                    const percentage = totalTrainings > 0 ? (p.length / totalTrainings) * 100 : 0
                    const sellerCheckins = (checkins || []).filter(c => c.seller_user_id === m.user_id) as DailyCheckin[]
                    const funil = calcularFunil(sellerCheckins)
                    const diag = gerarDiagnosticoMX(funil)
                    const categoryMap: any = { 'LEAD_AGD': 'prospeccao', 'AGD_VISITA': 'atendimento', 'VISITA_VND': 'fechamento' }
                    const gapCategory = diag.gargalo ? categoryMap[diag.gargalo] : null
                    const gapTrainings = (trainings || []).filter(t => t.type === gapCategory)
                    const gapCompleted = gapTrainings.length > 0 ? gapTrainings.every(t => watchedIds.includes(t.id)) : true
                    return { seller_id: m.user_id, seller_name: m.users?.name || 'Vendedor', watched: watchedIds, total_trainings: totalTrainings, percentage, current_gap: diag.gargalo, gap_training_completed: gapCompleted }
                }).sort((a, b) => b.percentage - a.percentage)
                setTeamProgress(stats)
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [storeId])

    useEffect(() => { fetchProgress() }, [fetchProgress])
    return { teamProgress, loading, error, refetch: fetchProgress }
}

// ============ DELIVERY RULES ============
export function useStoreDeliveryRules(storeIdOverride?: string) {
    const { storeId: authStoreId } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [deliveryRules, setDeliveryRules] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchRules = useCallback(async () => {
        if (!storeId) {
            setDeliveryRules(null)
            setLoading(false)
            return
        }
        setLoading(true)
        const { data } = await supabase.from('store_delivery_rules').select('*').eq('store_id', storeId).maybeSingle()
        setDeliveryRules(data)
        setLoading(false)
    }, [storeId])

    const updateDeliveryRules = async (data: any) => {
        if (!storeId) return { error: 'Loja não identificada' }
        const { error } = await supabase.from('store_delivery_rules').upsert({
            store_id: storeId,
            ...data
        }, { onConflict: 'store_id' })
        if (!error) await fetchRules()
        return { error: error?.message || null }
    }

    useEffect(() => { fetchRules() }, [fetchRules])
    return { deliveryRules, loading, refetch: fetchRules, updateDeliveryRules }
}
