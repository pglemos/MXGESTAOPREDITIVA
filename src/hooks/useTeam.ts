import { useState, useEffect, useCallback } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { isAdministradorMx, isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { calculateReferenceDate } from '@/hooks/useCheckins'
import type { User, Store, StoreSeller, UserRole } from '@/types/database'

export type StoreUpdateFields = Pick<Store, 'name' | 'manager_email' | 'active'>
export type TeamMemberUpdateFields = Partial<Pick<User, 'name' | 'email' | 'phone' | 'active'>> & {
    role?: UserRole
    store_id?: string | null
    started_at?: string | null
    ended_at?: string | null
    is_active?: boolean
    closing_month_grace?: boolean
}

const normalizeStoreName = (name: string) => name.trim().toLocaleUpperCase('pt-BR')
const isInternalRole = (role?: string | null) => role === 'administrador_geral' || role === 'administrador_mx' || role === 'consultor_mx'
const todayISO = () => new Date().toISOString().slice(0, 10)

const storeUpdateSchema = z.object({
    name: z.string().trim().min(2, 'Nome da loja deve ter pelo menos 2 caracteres.').max(120, 'Nome da loja muito longo.').optional(),
    manager_email: z.union([
        z.string().trim().email('E-mail do gestor inválido.'),
        z.literal(''),
        z.null(),
    ]).optional(),
    active: z.boolean().optional(),
}).strict()

export function useTeam(storeIdOverride?: string) {
    const { storeId: authStoreId, role } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [sellers, setSellers] = useState<(User & { checkin_today: boolean; started_at?: string; ended_at?: string; is_active?: boolean; closing_month_grace?: boolean; store_name?: string })[]>([])
    const [loading, setLoading] = useState(true)

    const referenceDate = calculateReferenceDate()

    const fetchTeam = useCallback(async () => {
        setLoading(true)

        try {
            let teamData: any[] = []
            let tenureMap = new Map()
            let checkedIn = new Set()

            // 1. Fetch Users & Memberships
            if (storeId && storeId !== 'all') {
                const { data: members } = await supabase
                    .from('vinculos_loja')
                    .select('user_id, store_id, role, users:usuarios(*), store:lojas(name)')
                    .eq('store_id', storeId)
                teamData = members || []
            } else {
                // Global view for Admins
                const { data: members } = await supabase
                    .from('vinculos_loja')
                    .select('user_id, store_id, role, users:usuarios(*), store:lojas(name)')
                
                // Also get users WITHOUT vinculos_loja (like some Donos or Admins)
                const { data: allUsers } = await supabase
                    .from('usuarios')
                    .select('*')
                
                // Map to handle users with multiple lojas or no lojas
                const userMap = new Map()
                
                // Process vinculos_loja first
                ;(members || []).forEach((m: any) => {
                    if (!userMap.has(m.user_id)) {
                        userMap.set(m.user_id, {
                            ...m.users,
                            role: m.role,
                            store_id: m.store_id,
                            store_name: m.store?.name || 'MULTI-LOJA'
                        })
                    } else {
                        // Concatenate store names for global view
                        const existing = userMap.get(m.user_id)
                        if (!existing.store_name.includes(m.store?.name)) {
                            existing.store_name += `, ${m.store?.name}`
                        }
                    }
                })

                // Add users who have no membership record
                ;(allUsers || []).forEach((u: any) => {
                    if (!userMap.has(u.id)) {
                        userMap.set(u.id, {
                            ...u,
                            role: u.role,
                            store_name: 'SEM LOJA'
                        })
                    }
                })

                teamData = Array.from(userMap.values()).map(u => ({ users: u, role: u.role, store: { name: u.store_name } }))
            }

            // 2. Fetch Tenures (Vigência)
            let tenuresQuery = supabase.from('vendedores_loja').select('seller_user_id, started_at, ended_at, is_active, closing_month_grace')
            if (storeId && storeId !== 'all') {
                tenuresQuery = tenuresQuery.eq('store_id', storeId)
            }
            const { data: tenures } = await tenuresQuery
            tenureMap = new Map((tenures || []).map(t => [t.seller_user_id, t]))

            // 3. Fetch Checkins
            let checkinsQuery = supabase.from('lancamentos_diarios').select('seller_user_id').eq('reference_date', referenceDate).eq('metric_scope', 'daily')
            if (storeId && storeId !== 'all') {
                checkinsQuery = checkinsQuery.eq('store_id', storeId)
            }
            const { data: todayCheckins } = await checkinsQuery
            checkedIn = new Set((todayCheckins || []).map(c => c.seller_user_id))

            // 4. Assemble Final Team
            setSellers(teamData.map((m: any) => {
                const u = m.users
                const tenure = tenureMap.get(u.id)
                return {
                    ...u,
                    role: m.role || u.role, 
                    store_id: m.store_id || u.store_id,
                    store_name: m.store?.name,
                    checkin_today: checkedIn.has(u.id),
                    started_at: tenure?.started_at,
                    ended_at: tenure?.ended_at,
                    is_active: tenure?.is_active ?? u?.active ?? true,
                    closing_month_grace: tenure?.closing_month_grace ?? false,
                }
            }))

        } catch (err) {
            console.error('Audit Error [useTeam]: fetchTeam fail ->', err)
        } finally {
            setLoading(false)
        }
    }, [storeId, referenceDate])

    const updateVigencia = async (userId: string, data: Record<string, unknown>) => {
        if (!storeId) return { error: 'Loja não identificada' }
        const { error } = await supabase.from('vendedores_loja').upsert({
            store_id: storeId,
            seller_user_id: userId,
            ...data
        }, { onConflict: 'store_id, seller_user_id' })
        if (!error) await fetchTeam()
        return { error: error?.message || null }
    }

    const updateTeamMember = async (userId: string, updates: TeamMemberUpdateFields) => {
        if (!isAdministradorMx(role)) return { error: 'Apenas Admin Master e Admin MX podem editar integrantes.' }

        const nextRole = updates.role
        const targetStoreId = updates.store_id || (storeId && storeId !== 'all' ? storeId : null)
        if (nextRole && !isInternalRole(nextRole) && !targetStoreId) {
            return { error: 'Selecione a loja do integrante.' }
        }

        const userPayload: Record<string, unknown> = {}
        if (typeof updates.name !== 'undefined') userPayload.name = updates.name.trim().toLocaleUpperCase('pt-BR')
        if (typeof updates.email !== 'undefined') userPayload.email = updates.email.trim().toLowerCase()
        if (typeof updates.phone !== 'undefined') userPayload.phone = updates.phone || null
        if (typeof updates.active !== 'undefined') userPayload.active = updates.active
        if (nextRole) userPayload.role = nextRole

        if (Object.keys(userPayload).length) {
            const { error } = await supabase.from('usuarios').update(userPayload).eq('id', userId)
            if (error) return { error: error.message }
        }

        if (nextRole && targetStoreId && !isInternalRole(nextRole)) {
            const { error: membershipError } = await supabase
                .from('vinculos_loja')
                .upsert({ user_id: userId, store_id: targetStoreId, role: nextRole }, { onConflict: 'user_id,store_id' })
            if (membershipError) return { error: membershipError.message }

            if (nextRole === 'vendedor') {
                const { error: tenureError } = await supabase
                    .from('vendedores_loja')
                    .upsert({
                        store_id: targetStoreId,
                        seller_user_id: userId,
                        started_at: updates.started_at || todayISO(),
                        ended_at: updates.ended_at || null,
                        is_active: updates.is_active ?? updates.active ?? true,
                        closing_month_grace: updates.closing_month_grace ?? false,
                    }, { onConflict: 'store_id,seller_user_id' })
                if (tenureError) return { error: tenureError.message }
            } else {
                const { error: tenureError } = await supabase
                    .from('vendedores_loja')
                    .update({ is_active: false, ended_at: updates.ended_at || todayISO() })
                    .eq('store_id', targetStoreId)
                    .eq('seller_user_id', userId)
                if (tenureError) return { error: tenureError.message }
            }
        }

        await fetchTeam()
        return { error: null }
    }

    const deleteTeamMember = async (userId: string, targetStoreId?: string | null) => {
        if (!isAdministradorMx(role)) return { error: 'Apenas Admin Master e Admin MX podem excluir integrantes.' }

        const scopedStoreId = targetStoreId || (storeId && storeId !== 'all' ? storeId : null)
        const endedAt = todayISO()

        if (scopedStoreId) {
            const { error: tenureError } = await supabase
                .from('vendedores_loja')
                .update({ is_active: false, ended_at: endedAt })
                .eq('store_id', scopedStoreId)
                .eq('seller_user_id', userId)
            if (tenureError) return { error: tenureError.message }

            const { error: membershipError } = await supabase
                .from('vinculos_loja')
                .delete()
                .eq('store_id', scopedStoreId)
                .eq('user_id', userId)
            if (membershipError) return { error: membershipError.message }

            const { data: remainingMemberships, error: remainingError } = await supabase
                .from('vinculos_loja')
                .select('id')
                .eq('user_id', userId)
                .limit(1)
            if (remainingError) return { error: remainingError.message }

            if (!remainingMemberships?.length) {
                const { error: userError } = await supabase.from('usuarios').update({ active: false }).eq('id', userId)
                if (userError) return { error: userError.message }
            }
        } else {
            const { error: tenureError } = await supabase
                .from('vendedores_loja')
                .update({ is_active: false, ended_at: endedAt })
                .eq('seller_user_id', userId)
            if (tenureError) return { error: tenureError.message }

            const { error: membershipError } = await supabase.from('vinculos_loja').delete().eq('user_id', userId)
            if (membershipError) return { error: membershipError.message }

            const { error: userError } = await supabase.from('usuarios').update({ active: false }).eq('id', userId)
            if (userError) return { error: userError.message }
        }

        await fetchTeam()
        return { error: null }
    }

    const registerUser = async (userData: { 
        email: string; 
        password?: string; 
        name: string; 
        role: string; 
        store_id: string;
        phone?: string;
    }) => {
        const { data, error } = await supabase.functions.invoke('register-user', {
            body: { 
                ...userData, 
                password: userData.password || 'Mx#2026!'
            }
        })
        if (!error && data?.success) {
            await fetchTeam()
            return { success: true }
        }
        return { error: error?.message || data?.error || 'Erro desconhecido' }
    }

    useEffect(() => { fetchTeam() }, [fetchTeam])
    return { 
        sellers, 
        team: sellers, // Alias para consistência MX
        loading, 
        refetch: fetchTeam,
        updateVigencia,
        updateTeamMember,
        deleteTeamMember,
        registerUser
    }
}

export function useStores() {
    const { role, vinculos_loja, storeId } = useAuth()
    const [lojas, setStores] = useState<Store[]>([])
    const [loading, setLoading] = useState(true)

    const fetchStores = useCallback(async () => {
        setLoading(true)
        let query = supabase.from('lojas').select('*').order('name')
        
        if (role === 'dono' || role === 'gerente') {
            const storeIds = vinculos_loja.map(m => m.store_id)
            if (!storeIds.length) {
                setStores([])
                setLoading(false)
                return
            }
            query = query.in('id', storeIds)
        } else if (role === 'vendedor' && storeId) {
            query = query.eq('id', storeId)
        }

        if (!isPerfilInternoMx(role)) {
            query = query.eq('active', true)
        }

        const { data } = await query
        if (data) {
            setStores(data)
        }
        setLoading(false)
    }, [role, vinculos_loja, storeId])

    const createStore = async (name: string, managerEmail?: string) => {
        if (!isAdministradorMx(role)) return { error: 'Apenas administradores MX podem criar lojas.' }
        const normalizedName = normalizeStoreName(name)
        const { data: store, error } = await supabase
            .from('lojas')
            .insert({ name: normalizedName, manager_email: managerEmail || null })
            .select('id')
            .single()

        if (error) return { error: error.message }

        if (store?.id) {
            const recipients = managerEmail ? [managerEmail] : []
            const [deliveryResult, metaRulesResult, benchmarksResult] = await Promise.all([
                supabase.from('regras_entrega_loja').upsert({
                    store_id: store.id,
                    matinal_recipients: recipients,
                    weekly_recipients: recipients,
                    monthly_recipients: recipients,
                    timezone: 'America/Sao_Paulo',
                    active: true,
                }, { onConflict: 'store_id' }),
                supabase.from('regras_metas_loja').upsert({
                    store_id: store.id,
                    monthly_goal: 0,
                    individual_goal_mode: 'even',
                    include_venda_loja_in_store_total: true,
                    include_venda_loja_in_individual_goal: false,
                    bench_lead_agd: 20,
                    bench_agd_visita: 60,
                    bench_visita_vnd: 33,
                    projection_mode: 'calendar',
                }, { onConflict: 'store_id' }),
                supabase.from('benchmarks_loja').upsert({
                    store_id: store.id,
                    lead_to_agend: 20,
                    agend_to_visit: 60,
                    visit_to_sale: 33,
                }, { onConflict: 'store_id' }),
            ])

            const setupError = deliveryResult.error || metaRulesResult.error || benchmarksResult.error
            if (setupError) return { error: setupError.message }
        }

        await fetchStores()
        return { error: null }
    }

    const updateStore = async (id: string, updates: Partial<StoreUpdateFields>) => {
        if (!isAdministradorMx(role)) return { error: 'Apenas administradores MX podem editar lojas.' }

        const validation = storeUpdateSchema.safeParse(updates)
        if (!validation.success) {
            const message = validation.error.issues[0]?.message || 'Dados da loja inválidos.'
            toast.error(message)
            return { error: message }
        }

        const payload: Partial<StoreUpdateFields> = {}
        if (typeof validation.data.name !== 'undefined') payload.name = normalizeStoreName(validation.data.name)
        if (typeof validation.data.manager_email !== 'undefined') {
            payload.manager_email = validation.data.manager_email ? validation.data.manager_email : null
        }
        if (typeof validation.data.active !== 'undefined') payload.active = validation.data.active

        const { error } = await supabase.from('lojas').update(payload).eq('id', id)
        if (error) {
            toast.error(error.message)
            return { error: error.message }
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'manager_email')) {
            const recipients = payload.manager_email ? [payload.manager_email] : []
            const { error: deliveryError } = await supabase.from('regras_entrega_loja').upsert({
                store_id: id,
                matinal_recipients: recipients,
                weekly_recipients: recipients,
                monthly_recipients: recipients,
                timezone: 'America/Sao_Paulo',
                active: true,
            }, { onConflict: 'store_id' })

            if (deliveryError) {
                toast.error(deliveryError.message)
                return { error: deliveryError.message }
            }
        }

        await fetchStores()
        toast.success('Loja atualizada com sucesso.')
        return { error: null }
    }

    const deleteStore = async (id: string) => {
        if (!isAdministradorMx(role)) return { error: 'Apenas administradores MX podem excluir lojas.' }
        const { error } = await supabase.from('lojas').delete().eq('id', id)
        if (error) return { error: error.message }
        await fetchStores()
        return { error: null }
    }

    const toggleStoreStatus = async (id: string, active: boolean) => updateStore(id, { active })

    useEffect(() => { fetchStores() }, [fetchStores])
    return { lojas, loading, createStore, updateStore, deleteStore, toggleStoreStatus, refetch: fetchStores }
}

export function useMemberships() {
    const { role } = useAuth()
    const [vinculos_loja, setMemberships] = useState<{ id: string; user_id: string; store_id: string; role: string; store?: { name?: string } }[]>([])
    const [loading, setLoading] = useState(true)

    const fetch = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase.from('vinculos_loja').select('*, store:lojas(name)')
        if (data) setMemberships(data)
        setLoading(false)
    }, [])

    useEffect(() => { fetch() }, [fetch])
    return { vinculos_loja, loading, refetch: fetch }
}

export function useStoresStats() {
    const { role, vinculos_loja, storeId: authStoreId } = useAuth()
    const [stats, setStats] = useState<Record<string, { sellers: number; checkedIn: number; disciplinePct: number }>>({})
    const [loading, setLoading] = useState(true)
    const referenceDate = calculateReferenceDate()

    const fetchStats = useCallback(async () => {
        setLoading(true)
        try {
            let authorizedStoreIds: string[] | null = null
            if (role === 'dono') {
                authorizedStoreIds = vinculos_loja.map(m => m.store_id)
            } else if ((role === 'gerente' || role === 'vendedor') && authStoreId) {
                authorizedStoreIds = [authStoreId]
            }

            let sellersQuery = supabase.from('vendedores_loja').select('store_id').eq('is_active', true)
            let checkinsQuery = supabase.from('lancamentos_diarios').select('store_id').eq('reference_date', referenceDate).eq('metric_scope', 'daily')

            if (authorizedStoreIds) {
                sellersQuery = sellersQuery.in('store_id', authorizedStoreIds)
                checkinsQuery = checkinsQuery.in('store_id', authorizedStoreIds)
            }

            const [sellersRes, checkinsRes] = await Promise.all([
                sellersQuery,
                checkinsQuery
            ])

            const newStats: Record<string, { sellers: number; checkedIn: number; disciplinePct: number }> = {}

            if (sellersRes.data) {
                sellersRes.data.forEach((s: { store_id: string }) => {
                    if (!newStats[s.store_id]) newStats[s.store_id] = { sellers: 0, checkedIn: 0, disciplinePct: 0 }
                    newStats[s.store_id].sellers++
                })
            }

            if (checkinsRes.data) {
                checkinsRes.data.forEach((c: { store_id: string }) => {
                    if (!newStats[c.store_id]) newStats[c.store_id] = { sellers: 0, checkedIn: 0, disciplinePct: 0 }
                    newStats[c.store_id].checkedIn++
                })
            }

            Object.keys(newStats).forEach(sid => {
                const s = newStats[sid]
                s.disciplinePct = s.sellers > 0 ? Math.round((s.checkedIn / s.sellers) * 100) : 100
            })

            setStats(newStats)
        } catch (err) {
            console.error('Error fetching lojas stats:', err)
        } finally {
            setLoading(false)
        }
    }, [referenceDate, role, vinculos_loja, authStoreId])

    useEffect(() => { fetchStats() }, [fetchStats])

    return { stats, loading, refetch: fetchStats }
}

export function useSellersByStore(storeId: string | null) {
    const [sellers, setSellers] = useState<(User & { checkin_today: boolean })[]>([])
    const [loading, setLoading] = useState(true)
    const referenceDate = calculateReferenceDate()

    const fetch = useCallback(async () => {
        if (!storeId) {
            setSellers([])
            setLoading(false)
            return
        }
        setLoading(true)
        const { data: sellersData } = await supabase
            .from('vendedores_loja')
            .select('*, users:usuarios(*)')
            .eq('store_id', storeId)
            .eq('is_active', true)

        const { data: checkins } = await supabase
            .from('lancamentos_diarios')
            .select('seller_user_id')
            .eq('store_id', storeId)
            .eq('reference_date', referenceDate)
            .eq('metric_scope', 'daily')

        const checkedIn = new Set(checkins?.map(c => c.seller_user_id) || [])

        if (sellersData) {
            setSellers(sellersData.map((s: { seller_user_id: string; users?: User }) => ({
                ...s.users,
                checkin_today: checkedIn.has(s.seller_user_id)
            } as User & { checkin_today: boolean })))
        }
        setLoading(false)
    }, [storeId, referenceDate])

    useEffect(() => { fetch() }, [fetch])
    return { sellers, loading, refetch: fetch }
}

export function useAllSellers() {
    const [sellers, setSellers] = useState<(User & { store_id: string; store_name: string })[]>([])
    const [loading, setLoading] = useState(true)

    const fetch = useCallback(async () => {
        setLoading(true)
        const [{ data: tenures }, { data: lojas }] = await Promise.all([
            supabase.from('vendedores_loja')
                .select('seller_user_id, store_id, users:usuarios(id, name, email, role), stores:lojas(name)')
                .eq('is_active', true),
            supabase.from('lojas').select('id, name'),
        ])

        const storeMap = new Map((lojas || []).map(s => [s.id, s.name]))
        if (tenures) {
            setSellers(tenures
                .filter(t => (t as any).users?.role === 'vendedor')
                .map(t => ({
                    ...(t as any).users as User,
                    store_id: t.store_id,
                    store_name: storeMap.get(t.store_id) || '',
                }))
            )
        }
        setLoading(false)
    }, [])

    useEffect(() => { fetch() }, [fetch])
    return { sellers, loading, refetch: fetch }
}
