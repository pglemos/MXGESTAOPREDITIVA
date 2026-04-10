import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { calculateReferenceDate } from '@/hooks/useCheckins'

/**
 * Hook para buscar hierarquia completa da rede: Lojas, Membros, Papéis e Status de Check-in (hoje)
 */
export function useNetworkHierarchy() {
    const { role } = useAuth()
    const [networkData, setNetworkData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const referenceDate = calculateReferenceDate()

    const fetchNetwork = useCallback(async () => {
        if (role !== 'admin') {
            setLoading(false)
            return
        }
        
        setLoading(true)

        // 1. Buscar todas as lojas
        const { data: stores } = await supabase.from('stores').select('id, name').eq('active', true)
        
        // 2. Buscar todas as memberships com dados dos usuários
        const { data: memberships } = await supabase
            .from('memberships')
            .select('user_id, store_id, role, users:user_id(*)')

        // 3. Buscar check-ins de hoje em toda a rede
        const { data: todayCheckins } = await supabase
            .from('daily_checkins')
            .select('seller_user_id, store_id')
            .eq('reference_date', referenceDate)

        if (stores && memberships) {
            const checkedInSet = new Set((todayCheckins || []).map(c => `${c.store_id}-${c.seller_user_id}`))

            const aggregated = stores.map(store => {
                const storeMembers = memberships
                    .filter(m => m.store_id === store.id)
                    .map(m => ({
                        ...m.users,
                        role: m.role,
                        checkin_today: checkedInSet.has(`${store.id}-${m.user_id}`)
                    }))

                return {
                    store_id: store.id,
                    store_name: store.name,
                    members: storeMembers
                }
            })
            setNetworkData(aggregated)
        }
        setLoading(false)
    }, [role, referenceDate])

    const updateRole = async (userId: string, storeId: string, newRole: string) => {
        const { error } = await supabase
            .from('memberships')
            .update({ role: newRole })
            .eq('user_id', userId)
            .eq('store_id', storeId)
        
        if (!error) await fetchNetwork()
        return { error: error?.message || null }
    }

    const removeMember = async (userId: string, storeId: string) => {
        const { error } = await supabase
            .from('memberships')
            .delete()
            .eq('user_id', userId)
            .eq('store_id', storeId)
            
        if (!error) await fetchNetwork()
        return { error: error?.message || null }
    }

    useEffect(() => { fetchNetwork() }, [fetchNetwork])
    
    return { networkData, loading, refetch: fetchNetwork, updateRole, removeMember }
}
