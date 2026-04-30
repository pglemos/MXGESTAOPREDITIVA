import { useState, useEffect, useCallback } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { calculateReferenceDate } from '@/hooks/useCheckins'
import type { User, Store, StoreSeller } from '@/types/database'

export type StoreUpdateFields = Pick<Store, 'name' | 'manager_email' | 'active'>

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
    const { storeId: authStoreId } = useAuth()
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
                    .select('user_id, role, users:usuarios(*), store:lojas(name)')
                    .eq('store_id', storeId)
                teamData = members || []
            } else {
                // Global view for Admins
                const { data: members } = await supabase
                    .from('vinculos_loja')
                    .select('user_id, role, users:usuarios(*), store:lojas(name)')
                
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
            let checkinsQuery = supabase.from('lancamentos_diarios').select('seller_user_id').eq('reference_date', referenceDate)
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
        if (!isPerfilInternoMx(role)) return { error: 'Apenas perfis MX podem criar lojas.' }
        const { data: store, error } = await supabase
            .from('lojas')
            .insert({ name, manager_email: managerEmail || null })
            .select('id')
            .single()

        if (error) return { error: error.message }

        if (store?.id) {
            const recipients = managerEmail ? [managerEmail] : []
            const { error: deliveryError } = await supabase.from('regras_entrega_loja').upsert({
                store_id: store.id,
                matinal_recipients: recipients,
                weekly_recipients: recipients,
                monthly_recipients: recipients,
                timezone: 'America/Sao_Paulo',
                active: true,
            }, { onConflict: 'store_id' })

            if (deliveryError) return { error: deliveryError.message }
        }

        await fetchStores()
        return { error: null }
    }

    const updateStore = async (id: string, updates: Partial<StoreUpdateFields>) => {
        if (!isPerfilInternoMx(role)) return { error: 'Apenas perfis MX podem editar lojas.' }

        const validation = storeUpdateSchema.safeParse(updates)
        if (!validation.success) {
            const message = validation.error.issues[0]?.message || 'Dados da loja inválidos.'
            toast.error(message)
            return { error: message }
        }

        const payload: Partial<StoreUpdateFields> = {}
        if (typeof validation.data.name !== 'undefined') payload.name = validation.data.name
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
        if (!isPerfilInternoMx(role)) return { error: 'Apenas perfis MX podem excluir lojas.' }
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
            let checkinsQuery = supabase.from('lancamentos_diarios').select('store_id').eq('reference_date', referenceDate)

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
