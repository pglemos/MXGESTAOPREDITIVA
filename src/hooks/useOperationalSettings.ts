import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
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

const STORE_SETTINGS_SELECT = 'id, name, manager_email, legal_name, cnpj, address, administrative_phone, partners, active, source_mode, created_at, updated_at'
const DELIVERY_RULES_SELECT = 'store_id, matinal_recipients, weekly_recipients, monthly_recipients, whatsapp_group_ref, timezone, active, updated_by, updated_at'
const BENCHMARK_SELECT = 'store_id, lead_to_agend, agend_to_visit, visit_to_sale, updated_by, updated_at'
const META_RULES_SELECT = 'store_id, monthly_goal, individual_goal_mode, include_venda_loja_in_store_total, include_venda_loja_in_individual_goal, bench_lead_agd, bench_agd_visita, bench_visita_vnd, projection_mode, updated_by, updated_at'
const SELLER_TENURES_SELECT = 'id, store_id, seller_user_id, started_at, ended_at, closing_month_grace, is_active, created_at, updated_at, user:usuarios(id, name, email, role, active, is_venda_loja)'
const SELLER_USERS_SELECT = 'id, name, email, role, avatar_url, is_venda_loja, active, created_at, phone, must_change_password, notification_preferences'

export type StoreSettingsPayload = {
    store: Pick<Store, 'id' | 'manager_email' | 'source_mode' | 'active'>
    delivery: Pick<StoreDeliveryRules, 'store_id' | 'matinal_recipients' | 'weekly_recipients' | 'monthly_recipients' | 'whatsapp_group_ref' | 'timezone' | 'active'>
    benchmark: Pick<StoreBenchmark, 'store_id' | 'lead_to_agend' | 'agend_to_visit' | 'visit_to_sale'>
    meta: Pick<StoreMetaRules, 'store_id' | 'monthly_goal' | 'individual_goal_mode' | 'include_venda_loja_in_store_total' | 'include_venda_loja_in_individual_goal' | 'bench_lead_agd' | 'bench_agd_visita' | 'bench_visita_vnd' | 'projection_mode'>
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
    const [error, setError] = useState<string | null>(null)

    const canManage = isPerfilInternoMx(role)
    const canReadSettings = canManage || role === 'dono' || role === 'gerente'

    const fetchSettings = useCallback(async () => {
        if (!storeId) {
            setStore(null)
            setDeliveryRules(null)
            setBenchmark(null)
            setMetaRules(null)
            setSellerTenures([])
            setSellerUsers([])
            setError(null)
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        // A loja em si é necessária para identificação operacional (dono/gerente/admin):
        // sem store.id, a Central MX da loja não habilita ações (criar plano, etc.).
        // As configurações administrativas (entrega/metas/benchmark/tenures) permanecem
        // restritas a quem pode gerenciar (perfis internos MX).
        const storeRes = await supabase.from('lojas').select(STORE_SETTINGS_SELECT).eq('id', storeId).maybeSingle()
        if (storeRes.error) console.error('Audit Error [useOperationalSettings]: store ->', storeRes.error.message)

        let deliveryData: StoreDeliveryRules | null = null
        if (canReadSettings) {
            const [deliveryRes, benchmarkRes, metaRes, tenuresRes, usersRes] = await Promise.all([
                supabase.from('regras_entrega_loja').select(DELIVERY_RULES_SELECT).eq('store_id', storeId).maybeSingle(),
                supabase.from('benchmarks_loja').select(BENCHMARK_SELECT).eq('store_id', storeId).maybeSingle(),
                supabase.from('regras_metas_loja').select(META_RULES_SELECT).eq('store_id', storeId).maybeSingle(),
                supabase
                    .from('vendedores_loja')
                    .select(SELLER_TENURES_SELECT)
                    .eq('store_id', storeId)
                    .order('is_active', { ascending: false })
                    .order('started_at', { ascending: false }),
                supabase
                    .from('usuarios')
                    .select(SELLER_USERS_SELECT)
                    .eq('role', 'vendedor')
                    .eq('active', true)
                    .order('name'),
            ])

            if (deliveryRes.error) console.error('Audit Error [useOperationalSettings]: delivery ->', deliveryRes.error.message)
            if (benchmarkRes.error) console.error('Audit Error [useOperationalSettings]: benchmark ->', benchmarkRes.error.message)
            if (metaRes.error) console.error('Audit Error [useOperationalSettings]: meta ->', metaRes.error.message)
            if (tenuresRes.error) console.error('Audit Error [useOperationalSettings]: tenures ->', tenuresRes.error.message)
            if (usersRes.error) console.error('Audit Error [useOperationalSettings]: users ->', usersRes.error.message)

            const firstError = [storeRes.error, deliveryRes.error, benchmarkRes.error, metaRes.error, tenuresRes.error, usersRes.error].find(Boolean)
            setError(firstError?.message || null)

            deliveryData = (deliveryRes.data as StoreDeliveryRules) || null
            setDeliveryRules(deliveryData)
            setBenchmark((benchmarkRes.data as StoreBenchmark) || null)
            setMetaRules((metaRes.data as StoreMetaRules) || null)
            setSellerTenures((tenuresRes.data as unknown as SellerTenure[]) || [])
            setSellerUsers((usersRes.data as User[]) || [])
        } else {
            setDeliveryRules(null)
            setBenchmark(null)
            setMetaRules(null)
            setSellerTenures([])
            setSellerUsers([])
        }

        const storeData = (storeRes.data as Store) || null
        if (storeRes.error) setError(storeRes.error.message)
        const derivedManagerEmail = deliveryData?.matinal_recipients?.[0] || storeData?.manager_email || null

        setStore(storeData ? { ...storeData, manager_email: derivedManagerEmail } : null)
        setLoading(false)
    }, [storeId, canManage, canReadSettings])

    const saveSettings = async (payload: StoreSettingsPayload) => {
        if (!storeId || !profile || !canManage) return { error: 'Apenas perfis MX podem alterar configuração operacional.' }

        const [storeRes, deliveryRes, benchmarkRes, metaRes] = await Promise.all([
            supabase
                .from('lojas')
                .update({
                    manager_email: payload.delivery.matinal_recipients[0] || payload.store.manager_email || null,
                    source_mode: payload.store.source_mode,
                    active: payload.store.active,
                })
                .eq('id', storeId),
            supabase
                .from('regras_entrega_loja')
                .upsert({
                    ...payload.delivery,
                    store_id: storeId,
                    updated_by: profile.id,
                }, { onConflict: 'store_id' }),
            supabase
                .from('benchmarks_loja')
                .upsert({
                    ...payload.benchmark,
                    store_id: storeId,
                    updated_by: profile.id,
                }, { onConflict: 'store_id' }),
            supabase
                .from('regras_metas_loja')
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
        if (!storeId || !canManage) return { error: 'Apenas perfis MX podem alterar vigência.' }
        const { error } = await supabase.from('vendedores_loja').insert({
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
        if (!canManage) return { error: 'Apenas perfis MX podem alterar vigência.' }
        const { error } = await supabase
            .from('vendedores_loja')
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
        error,
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
