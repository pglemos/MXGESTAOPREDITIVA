import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type {
    Store,
    StoreBenchmark,
    StoreDeliveryRules,
    StoreMetaRules,
    StoreSeller,
    StoreSourceMode,
    User,
} from '@/types/database'

type SellerTenure = StoreSeller & { user?: Pick<User, 'id' | 'name' | 'email' | 'role' | 'active' | 'is_venda_loja'> | null }

export type StoreSettingsPayload = {
    store: Pick<Store, 'id' | 'manager_email' | 'source_mode' | 'active'>
    delivery: Pick<StoreDeliveryRules, 'store_id' | 'matinal_recipients' | 'weekly_recipients' | 'monthly_recipients' | 'whatsapp_group_ref' | 'timezone' | 'active'>
    benchmark: Pick<StoreBenchmark, 'store_id' | 'lead_to_agend' | 'agend_to_visit' | 'visit_to_sale'>
    meta: Pick<StoreMetaRules, 'store_id' | 'monthly_goal' | 'individual_goal_mode' | 'include_venda_loja_in_store_total' | 'include_venda_loja_in_individual_goal' | 'bench_lead_agd' | 'bench_agd_visita' | 'bench_visita_vnd'>
}

export function useOperationalSettings(storeId: string | null) {
    const { role, profile } = useAuth()
    const [store, setStore] = useState<Store | null>(null)
    const [deliveryRules, setDeliveryRules] = useState<StoreDeliveryRules | null>(null)
    const [benchmark, setBenchmark] = useState<StoreBenchmark | null>(null)
    const [metaRules, setMetaRules] = useState<StoreMetaRules | null>(null)
    const [sellerTenures, setSellerTenures] = useState<SellerTenure[]>([])
    const [sellerUsers, setSellerUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)

    const canManage = role === 'admin'

    const fetchSettings = useCallback(async () => {
        if (!storeId || !canManage) {
            setStore(null)
            setDeliveryRules(null)
            setBenchmark(null)
            setMetaRules(null)
            setSellerTenures([])
            setLoading(false)
            return
        }

        setLoading(true)
        const [storeRes, deliveryRes, benchmarkRes, metaRes, tenuresRes, usersRes] = await Promise.all([
            supabase.from('stores').select('*').eq('id', storeId).maybeSingle(),
            supabase.from('store_delivery_rules').select('*').eq('store_id', storeId).maybeSingle(),
            supabase.from('store_benchmarks').select('*').eq('store_id', storeId).maybeSingle(),
            supabase.from('store_meta_rules').select('*').eq('store_id', storeId).maybeSingle(),
            supabase
                .from('store_sellers')
                .select('*, user:users!store_sellers_seller_user_id_fkey(id,name,email,role,active,is_venda_loja)')
                .eq('store_id', storeId)
                .order('is_active', { ascending: false })
                .order('started_at', { ascending: false }),
            supabase
                .from('users')
                .select('*')
                .eq('role', 'vendedor')
                .eq('active', true)
                .order('name'),
        ])

        if (storeRes.error) console.error('Audit Error [useOperationalSettings]: store ->', storeRes.error.message)
        if (deliveryRes.error) console.error('Audit Error [useOperationalSettings]: delivery ->', deliveryRes.error.message)
        if (benchmarkRes.error) console.error('Audit Error [useOperationalSettings]: benchmark ->', benchmarkRes.error.message)
        if (metaRes.error) console.error('Audit Error [useOperationalSettings]: meta ->', metaRes.error.message)
        if (tenuresRes.error) console.error('Audit Error [useOperationalSettings]: tenures ->', tenuresRes.error.message)
        if (usersRes.error) console.error('Audit Error [useOperationalSettings]: users ->', usersRes.error.message)

        const storeData = (storeRes.data as Store) || null
        const deliveryData = (deliveryRes.data as StoreDeliveryRules) || null
        const derivedManagerEmail = deliveryData?.matinal_recipients?.[0] || storeData?.manager_email || null

        setStore(storeData ? { ...storeData, manager_email: derivedManagerEmail } : null)
        setDeliveryRules(deliveryData)
        setBenchmark((benchmarkRes.data as StoreBenchmark) || null)
        setMetaRules((metaRes.data as StoreMetaRules) || null)
        setSellerTenures((tenuresRes.data as SellerTenure[]) || [])
        setSellerUsers((usersRes.data as User[]) || [])
        setLoading(false)
    }, [storeId, canManage])

    const saveSettings = async (payload: StoreSettingsPayload) => {
        if (!storeId || !profile || !canManage) return { error: 'Apenas admin pode alterar configuração operacional.' }

        const [storeRes, deliveryRes, benchmarkRes, metaRes] = await Promise.all([
            supabase
                .from('stores')
                .update({
                    manager_email: payload.delivery.matinal_recipients[0] || payload.store.manager_email || null,
                    source_mode: payload.store.source_mode,
                    active: payload.store.active,
                })
                .eq('id', storeId),
            supabase
                .from('store_delivery_rules')
                .upsert({
                    ...payload.delivery,
                    store_id: storeId,
                    updated_by: profile.id,
                }, { onConflict: 'store_id' }),
            supabase
                .from('store_benchmarks')
                .upsert({
                    ...payload.benchmark,
                    store_id: storeId,
                    updated_by: profile.id,
                }, { onConflict: 'store_id' }),
            supabase
                .from('store_meta_rules')
                .upsert({
                    ...payload.meta,
                    store_id: storeId,
                    updated_by: profile.id,
                }, { onConflict: 'store_id' }),
        ])

        const error = storeRes.error || deliveryRes.error || benchmarkRes.error || metaRes.error
        if (error) return { error: error.message }

        await fetchSettings()
        return { error: null }
    }

    const addSellerTenure = async (sellerUserId: string, startedAt: string, closingMonthGrace: boolean) => {
        if (!storeId || !canManage) return { error: 'Apenas admin pode alterar vigência.' }
        const { error } = await supabase.from('store_sellers').insert({
            store_id: storeId,
            seller_user_id: sellerUserId,
            started_at: startedAt,
            closing_month_grace: closingMonthGrace,
            is_active: true,
        })
        if (error) return { error: error.message }
        await fetchSettings()
        return { error: null }
    }

    const endSellerTenure = async (tenureId: string, endedAt: string) => {
        if (!canManage) return { error: 'Apenas admin pode alterar vigência.' }
        const { error } = await supabase
            .from('store_sellers')
            .update({ ended_at: endedAt, is_active: false })
            .eq('id', tenureId)
        if (error) return { error: error.message }
        await fetchSettings()
        return { error: null }
    }

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    return {
        store,
        deliveryRules,
        benchmark,
        metaRules,
        sellerTenures,
        sellerUsers,
        loading,
        canManage,
        fetchSettings,
        saveSettings,
        addSellerTenure,
        endSellerTenure,
    }
}

export function normalizeSourceMode(value: string | null | undefined): StoreSourceMode {
    if (value === 'legacy_forms' || value === 'hybrid') return value
    return 'native_app'
}
