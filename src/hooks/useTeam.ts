import { useState, useEffect, useCallback } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { isAdministradorMx, isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { calculateReferenceDate } from '@/hooks/useCheckins'
import { isLancamentosViaRpcEnabled } from '@/lib/feature-flags'
import type { User, Store, StoreSeller, UserRole, StorePartner } from '@/types/database'

const STORES_SELECT = 'id, name, manager_email, legal_name, cnpj, address, administrative_phone, partners, active, source_mode, created_at, updated_at'

export type StoreUpdateFields = Pick<Store, 'name' | 'manager_email' | 'legal_name' | 'cnpj' | 'address' | 'administrative_phone' | 'partners' | 'active'>
export type TeamMemberUpdateFields = Partial<Pick<User, 'name' | 'email' | 'phone' | 'active'>> & {
    role?: UserRole
    store_id?: string | null
    previous_store_id?: string | null
    started_at?: string | null
    ended_at?: string | null
    is_active?: boolean
    closing_month_grace?: boolean
    is_venda_loja?: boolean
}

export type TeamMember = User & {
    checkin_today: boolean
    started_at?: string
    ended_at?: string
    is_active?: boolean
    closing_month_grace?: boolean
    store_name?: string
}

type TeamMembershipRow = {
    id?: string
    user_id: string
    store_id: string
    role: UserRole
    is_active?: boolean | null
    ended_at?: string | null
    users: User | null
    store?: { name?: string | null } | null
}

type SellerTenureRow = {
    seller_user_id: string
    store_id: string
    started_at?: string | null
    ended_at?: string | null
    is_active?: boolean | null
    closing_month_grace?: boolean | null
}

type SellerTenureWithUserRow = SellerTenureRow & {
    users: User | null
    store?: { name?: string | null } | null
}

type SellerTenureUpdateFields = Partial<Pick<SellerTenureRow, 'started_at' | 'ended_at' | 'is_active' | 'closing_month_grace'>>

export interface RegisterUserInput {
    email: string
    password?: string
    name: string
    role: UserRole
    store_id?: string
    phone?: string
    started_at?: string
    ended_at?: string | null
    is_active?: boolean
    closing_month_grace?: boolean
    is_venda_loja?: boolean
}

function hasStoreTeamUser(row: TeamMembershipRow): row is TeamMembershipRow & { users: User } {
    return Boolean(row.users && row.users.active !== false && isStoreTeamRole(row.role || row.users.role))
}

const normalizeStoreName = (name: string) => name.trim().toLocaleUpperCase('pt-BR')
const isInternalRole = (role?: string | null) => role === 'administrador_geral' || role === 'administrador_mx' || role === 'consultor_mx'
const isStoreTeamRole = (role?: string | null) => role === 'dono' || role === 'gerente' || role === 'vendedor'
const todayISO = () => new Date().toISOString().slice(0, 10)
const DEFAULT_INITIAL_MONTHLY_GOAL = 0
const TEAM_USER_SELECT = 'id, name, email, role, avatar_url, is_venda_loja, active, created_at, phone, must_change_password, notification_preferences'
const TEAM_MEMBERSHIP_SELECT = `id, user_id, store_id, role, is_active, ended_at, users:usuarios(${TEAM_USER_SELECT}), store:lojas(name)`
const TEAM_SELLER_TENURE_SELECT = `seller_user_id, store_id, started_at, ended_at, is_active, closing_month_grace, users:usuarios(${TEAM_USER_SELECT}), store:lojas(name)`

const storeUpdateSchema = z.object({
    name: z.string().trim().min(2, 'Nome da loja deve ter pelo menos 2 caracteres.').max(120, 'Nome da loja muito longo.').optional(),
    manager_email: z.union([
        z.string().trim().email('E-mail do gestor inválido.'),
        z.literal(''),
        z.null(),
    ]).optional(),
    legal_name: z.union([z.string().trim().max(180, 'Razão social muito longa.'), z.literal(''), z.null()]).optional(),
    cnpj: z.union([z.string().trim().max(32, 'CNPJ muito longo.'), z.literal(''), z.null()]).optional(),
    address: z.union([z.string().trim().max(300, 'Endereço muito longo.'), z.literal(''), z.null()]).optional(),
    administrative_phone: z.union([z.string().trim().max(60, 'Telefone administrativo muito longo.'), z.literal(''), z.null()]).optional(),
    partners: z.array(z.object({
        name: z.string().trim().min(1, 'Nome do sócio é obrigatório.').max(160, 'Nome do sócio muito longo.'),
        document: z.union([z.string().trim().max(60), z.literal(''), z.null()]).optional(),
        phone: z.union([z.string().trim().max(60), z.literal(''), z.null()]).optional(),
        email: z.union([z.string().trim().email('E-mail do sócio inválido.'), z.literal(''), z.null()]).optional(),
    })).max(12, 'Limite de 12 sócios por loja.').optional(),
    active: z.boolean().optional(),
}).strict()

const normalizeOptionalText = (value?: string | null) => {
    const trimmed = (value || '').trim()
    return trimmed ? trimmed : null
}

const normalizeOptionalEmail = (value?: string | null) => normalizeOptionalText(value)?.toLowerCase() || null

const normalizePartners = (partners?: StorePartner[]) => {
    return (partners || [])
        .map(partner => ({
            name: partner.name.trim().toLocaleUpperCase('pt-BR'),
            document: normalizeOptionalText(partner.document),
            phone: normalizeOptionalText(partner.phone),
            email: normalizeOptionalText(partner.email)?.toLowerCase() || null,
        }))
        .filter(partner => partner.name)
}

export function useTeam(storeIdOverride?: string) {
    const { storeId: authStoreId, role } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [sellers, setSellers] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const referenceDate = calculateReferenceDate()

    const fetchTeam = useCallback(async () => {
        setLoading(true)

        try {
            let teamData: TeamMembershipRow[] = []
            let tenureRows: SellerTenureWithUserRow[] = []
            let tenureMap = new Map<string, SellerTenureRow>()
            let checkedIn = new Set<string>()
            const isGlobalView = !storeId || storeId === 'all'

            if (isGlobalView && !isAdministradorMx(role)) {
                setSellers([])
                setError(null)
                return
            }

            // 1. Fetch Users & Memberships
            if (storeId && storeId !== 'all') {
                const { data: members, error: membersError } = await supabase
                    .from('vinculos_loja')
                    .select(TEAM_MEMBERSHIP_SELECT)
                    .eq('store_id', storeId)
                    .eq('is_active', true)
                if (membersError) throw membersError
                teamData = (members || []) as unknown as TeamMembershipRow[]
            } else {
                // Global view for Admins: only store-linked operational roles belong in this team list.
                const { data: members, error: membersError } = await supabase
                    .from('vinculos_loja')
                    .select(TEAM_MEMBERSHIP_SELECT)
                    .eq('is_active', true)
                if (membersError) throw membersError

                teamData = ((members || []) as unknown as TeamMembershipRow[]).filter(hasStoreTeamUser)
            }

            // 2. Fetch Tenures (Vigência)
            let tenuresQuery = supabase.from('vendedores_loja').select(TEAM_SELLER_TENURE_SELECT)
            if (storeId && storeId !== 'all') {
                tenuresQuery = tenuresQuery.eq('store_id', storeId)
            }
            const { data: tenures, error: tenuresError } = await tenuresQuery
            if (tenuresError) throw tenuresError
            tenureRows = (tenures || []) as unknown as SellerTenureWithUserRow[]
            tenureMap = new Map(tenureRows.map(t => [`${t.store_id}:${t.seller_user_id}`, t]))

            // 3. Fetch Checkins
            let todayCheckins: { seller_user_id: string }[] | null = null
            if (isLancamentosViaRpcEnabled() && storeId && storeId !== 'all') {
                const { data: rpcData, error: rpcErr } = await supabase.rpc('get_lancamentos_por_loja_periodo', {
                    p_store_id: storeId,
                    p_start_date: referenceDate,
                    p_end_date: referenceDate,
                    p_scope: 'daily',
                })
                if (rpcErr) throw rpcErr
                todayCheckins = (rpcData as { seller_user_id: string }[] | null) || []
            } else if (isLancamentosViaRpcEnabled() && isGlobalView) {
                const { data: rpcData, error: rpcErr } = await supabase.rpc('get_lancamentos_referencia_dia', {
                    p_reference_date: referenceDate,
                    p_scope: 'daily',
                })
                if (rpcErr) throw rpcErr
                todayCheckins = (rpcData as { seller_user_id: string }[] | null) || []
            } else {
                let checkinsQuery = supabase.from('lancamentos_diarios').select('seller_user_id').eq('reference_date', referenceDate).eq('metric_scope', 'daily')
                if (storeId && storeId !== 'all') {
                    checkinsQuery = checkinsQuery.eq('store_id', storeId)
                }
                const { data, error: checkinsError } = await checkinsQuery
                if (checkinsError) throw checkinsError
                todayCheckins = data || []
            }
            checkedIn = new Set((todayCheckins || []).map(c => c.seller_user_id))

            // 4. Assemble Final Team
            setSellers(teamData.filter(hasStoreTeamUser).map((m) => {
                const u = m.users
                const memberStoreId = m.store_id
                const tenure = tenureMap.get(`${memberStoreId}:${u.id}`)
                return {
                    ...u,
                    role: m.role || u.role,
                    store_id: memberStoreId,
                    store_name: m.store?.name || undefined,
                    checkin_today: checkedIn.has(u.id),
                    started_at: tenure?.started_at ?? undefined,
                    ended_at: tenure?.ended_at ?? undefined,
                    is_active: tenure?.is_active ?? u?.active ?? true,
                    closing_month_grace: tenure?.closing_month_grace ?? false,
                }
            }))
            setError(null)

        } catch (err) {
            console.error('Audit Error [useTeam]: fetchTeam fail ->', err)
            setSellers([])
            setError('Não foi possível carregar os vínculos da equipe desta loja.')
        } finally {
            setLoading(false)
        }
    }, [storeId, referenceDate, role])

    const updateVigencia = async (userId: string, data: SellerTenureUpdateFields) => {
        if (!isAdministradorMx(role) && role !== 'dono' && role !== 'gerente') {
            return { error: 'Apenas gestores da loja podem alterar vigência.' }
        }
        const scopedStoreId = storeId && storeId !== 'all' ? storeId : null
        if (!scopedStoreId) return { error: 'Selecione uma loja para alterar a vigência.' }
        const target = sellers.find(member => member.id === userId)
        if (target && target.role !== 'vendedor') {
            return { error: 'Vigência operacional só pode ser alterada para vendedores.' }
        }
        const payload: SellerTenureUpdateFields = {
            started_at: data.started_at || todayISO(),
            ended_at: data.ended_at ?? null,
            is_active: data.is_active ?? true,
            closing_month_grace: data.closing_month_grace ?? false,
        }
        const { data: response, error } = await supabase.functions.invoke('manage-store-team', {
            body: {
                action: 'update',
                user_id: userId,
                store_id: scopedStoreId,
                updates: { role: 'vendedor', ...payload },
            },
        })
        if (!error && response?.success) {
            await fetchTeam()
            return { error: null }
        }
        return { error: error?.message || response?.error || 'Erro ao alterar vigência.' }
    }

    const updateTeamMember = async (userId: string, updates: TeamMemberUpdateFields) => {
        if (!isAdministradorMx(role) && role !== 'dono' && role !== 'gerente') {
            return { error: 'Apenas gestores da loja podem editar integrantes.' }
        }
        const targetStoreId = updates.store_id || (storeId && storeId !== 'all' ? storeId : null)
        if (!targetStoreId) {
            return { error: 'Selecione a loja do integrante.' }
        }

        if (updates.role && isInternalRole(updates.role)) {
            return { error: 'Papéis internos MX não podem ser geridos pelo painel de equipe da loja.' }
        }

        const { data, error } = await supabase.functions.invoke('manage-store-team', {
            body: {
                action: 'update',
                user_id: userId,
                store_id: targetStoreId,
                previous_store_id: updates.previous_store_id || (storeId && storeId !== 'all' ? storeId : targetStoreId),
                updates,
            },
        })
        if (!error && data?.success) {
            await fetchTeam()
            return { error: null }
        }
        return { error: error?.message || data?.error || 'Erro ao editar integrante.' }
    }

    const deleteTeamMember = async (userId: string, targetStoreId?: string | null) => {
        if (!isAdministradorMx(role) && role !== 'dono' && role !== 'gerente') return { error: 'Apenas gestores da loja podem excluir integrantes.' }
        const scopedStoreId = targetStoreId || (storeId && storeId !== 'all' ? storeId : null)
        if (!scopedStoreId) return { error: 'Selecione a loja do integrante.' }

        const { data, error } = await supabase.functions.invoke('manage-store-team', {
            body: {
                action: 'delete',
                user_id: userId,
                store_id: scopedStoreId,
            },
        })
        if (!error && data?.success) {
            await fetchTeam()
            return { error: null }
        }
        return { error: error?.message || data?.error || 'Erro ao excluir integrante.' }
    }

    const registerUser = async (userData: RegisterUserInput) => {
        const { data, error } = await supabase.functions.invoke('register-user', {
            body: userData
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
        error,
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
        try {
            let query = supabase.from('lojas').select(STORES_SELECT).order('name')

            if (role === 'dono' || role === 'gerente') {
                const storeIds = vinculos_loja.map(m => m.store_id)
                if (!storeIds.length) {
                    setStores([])
                    return
                }
                query = query.in('id', storeIds)
            } else if (role === 'vendedor' && storeId) {
                query = query.eq('id', storeId)
            }

            if (!isPerfilInternoMx(role)) {
                query = query.eq('active', true)
            }

            const { data, error } = await query
            if (error) throw error
            setStores(data || [])
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro desconhecido'
            console.error('Audit Error [useStores]: fetchStores fail ->', message)
            toast.error('Não foi possível carregar as lojas.')
            setStores([])
        } finally {
            setLoading(false)
        }
    }, [role, vinculos_loja, storeId])

    const createStore = async (name: string, managerEmail?: string, details?: Partial<Pick<StoreUpdateFields, 'legal_name' | 'cnpj' | 'address' | 'administrative_phone' | 'partners'>>) => {
        if (!isAdministradorMx(role)) return { error: 'Apenas administradores MX podem criar lojas.' }
        const validation = storeUpdateSchema.pick({ name: true, manager_email: true, legal_name: true, cnpj: true, address: true, administrative_phone: true, partners: true }).safeParse({
            name,
            manager_email: managerEmail || null,
            ...details,
        })
        if (!validation.success) {
            const message = validation.error.issues[0]?.message || 'Dados da loja inválidos.'
            toast.error(message)
            return { error: message }
        }
        const normalizedName = normalizeStoreName(name)
        const storePayload = {
            name: normalizedName,
            manager_email: normalizeOptionalEmail(managerEmail),
            legal_name: normalizeOptionalText(details?.legal_name),
            cnpj: normalizeOptionalText(details?.cnpj),
            address: normalizeOptionalText(details?.address),
            administrative_phone: normalizeOptionalText(details?.administrative_phone),
            partners: normalizePartners(details?.partners),
            monthly_goal: DEFAULT_INITIAL_MONTHLY_GOAL,
        }
        const { data, error } = await supabase.rpc('admin_create_store', { p_payload: storePayload })
        const payload = data as { ok?: boolean; error?: string } | null

        if (error) return { error: error.message }
        if (!payload?.ok) return { error: payload?.error || 'Não foi possível criar a loja.' }

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
            payload.manager_email = normalizeOptionalEmail(validation.data.manager_email)
        }
        if (typeof validation.data.legal_name !== 'undefined') payload.legal_name = normalizeOptionalText(validation.data.legal_name)
        if (typeof validation.data.cnpj !== 'undefined') payload.cnpj = normalizeOptionalText(validation.data.cnpj)
        if (typeof validation.data.address !== 'undefined') payload.address = normalizeOptionalText(validation.data.address)
        if (typeof validation.data.administrative_phone !== 'undefined') payload.administrative_phone = normalizeOptionalText(validation.data.administrative_phone)
        if (typeof validation.data.partners !== 'undefined') payload.partners = normalizePartners(validation.data.partners)
        if (typeof validation.data.active !== 'undefined') payload.active = validation.data.active

        const { data, error } = await supabase.rpc('admin_update_store', { p_store_id: id, p_payload: payload })
        const result = data as { ok?: boolean; error?: string } | null
        if (error || !result?.ok) {
            const message = error?.message || result?.error || 'Não foi possível atualizar a loja.'
            toast.error(message)
            return { error: message }
        }

        await fetchStores()
        toast.success('Loja atualizada com sucesso.')
        return { error: null }
    }

    const deleteStore = async (id: string) => {
        if (!isAdministradorMx(role)) return { error: 'Apenas administradores MX podem arquivar lojas.' }
        const { data, error } = await supabase.rpc('admin_archive_store', { p_store_id: id })
        const result = data as { ok?: boolean; error?: string } | null
        if (error || !result?.ok) return { error: error?.message || result?.error || 'Não foi possível arquivar a loja.' }
        await fetchStores()
        return { error: null }
    }

    const toggleStoreStatus = async (id: string, active: boolean) => {
        if (!active) return deleteStore(id)
        if (!isAdministradorMx(role)) return { error: 'Apenas administradores MX podem restaurar lojas.' }
        const { data, error } = await supabase.rpc('admin_restore_store', { p_store_id: id })
        const result = data as { ok?: boolean; error?: string } | null
        if (error || !result?.ok) return { error: error?.message || result?.error || 'Não foi possível restaurar a loja.' }
        await fetchStores()
        return { error: null }
    }

    useEffect(() => { fetchStores() }, [fetchStores])
    return { lojas, loading, createStore, updateStore, deleteStore, toggleStoreStatus, refetch: fetchStores }
}

export function useMemberships() {
    const { role } = useAuth()
    const [vinculos_loja, setMemberships] = useState<{ id: string; user_id: string; store_id: string; role: string; store?: { name?: string } }[]>([])
    const [loading, setLoading] = useState(true)

    const fetch = useCallback(async () => {
        setLoading(true)
        try {
            if (!isAdministradorMx(role)) {
                setMemberships([])
                return
            }
            const { data, error } = await supabase
                .from('vinculos_loja')
                .select('id, user_id, store_id, role, is_active, ended_at, store:lojas(name)')
                .eq('is_active', true)
            if (error) throw error
            setMemberships((data || []) as unknown as { id: string; user_id: string; store_id: string; role: string; store?: { name?: string } }[])
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro desconhecido'
            console.error('Audit Error [useMemberships]: fetch fail ->', message)
            setMemberships([])
        } finally {
            setLoading(false)
        }
    }, [role])

    useEffect(() => { fetch() }, [fetch])
    return { vinculos_loja, loading, refetch: fetch }
}

export function useStoresStats() {
    const { role, vinculos_loja, storeId: authStoreId } = useAuth()
    const [stats, setStats] = useState<Record<string, { sellers: number; teamMembers: number; checkedIn: number; disciplinePct: number }>>({})
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

            let sellersQuery = supabase.from('vendedores_loja').select('store_id, seller_user_id, users:usuarios(id, active, role)').eq('is_active', true)
            let membersQuery = supabase.from('vinculos_loja').select('store_id, user_id, role, users:usuarios(id, active, role)').eq('is_active', true)
            if (authorizedStoreIds) {
                sellersQuery = sellersQuery.in('store_id', authorizedStoreIds)
                membersQuery = membersQuery.in('store_id', authorizedStoreIds)
            }

            // RPC path: rede admin OU loja única; lista de N lojas autorizadas (dono multi-loja) volta ao SELECT direto.
            const canUseRpcRede = isLancamentosViaRpcEnabled() && !authorizedStoreIds
            const canUseRpcSingleStore = isLancamentosViaRpcEnabled() && authorizedStoreIds && authorizedStoreIds.length === 1
            const checkinsPromise = canUseRpcRede
                ? supabase.rpc('get_lancamentos_referencia_dia', {
                    p_reference_date: referenceDate,
                    p_scope: 'daily',
                })
                : canUseRpcSingleStore
                    ? supabase.rpc('get_lancamentos_por_loja_periodo', {
                        p_store_id: authorizedStoreIds![0],
                        p_start_date: referenceDate,
                        p_end_date: referenceDate,
                        p_scope: 'daily',
                    })
                    : (() => {
                        let q = supabase.from('lancamentos_diarios').select('store_id,seller_user_id').eq('reference_date', referenceDate).eq('metric_scope', 'daily')
                        if (authorizedStoreIds) q = q.in('store_id', authorizedStoreIds)
                        return q
                    })()

            const [sellersRes, membersRes, checkinsRes] = await Promise.all([
                sellersQuery,
                membersQuery,
                checkinsPromise
            ])

            if (sellersRes.error) throw sellersRes.error
            if (membersRes.error) throw membersRes.error
            if (checkinsRes.error) throw checkinsRes.error

            const newStats: Record<string, { sellers: number; teamMembers: number; checkedIn: number; disciplinePct: number }> = {}
            const memberStatsRows = (membersRes.data || []) as unknown as Array<{ store_id: string; user_id: string; role?: string | null; users?: { active?: boolean | null; role?: string | null } | null }>
            const teamMemberKeys = new Set<string>()
            const activeSellerMembershipKeys = new Set<string>()

            if (memberStatsRows.length) {
                memberStatsRows.forEach((m) => {
                    const memberRole = m.role || m.users?.role
                    if (m.users?.active === false) return
                    if (!isStoreTeamRole(memberRole)) return
                    if (!newStats[m.store_id]) newStats[m.store_id] = { sellers: 0, teamMembers: 0, checkedIn: 0, disciplinePct: 0 }
                    const key = `${m.store_id}:${m.user_id}`
                    if (teamMemberKeys.has(key)) return
                    teamMemberKeys.add(key)
                    newStats[m.store_id].teamMembers++
                    if (memberRole === 'vendedor') activeSellerMembershipKeys.add(key)
                })
            }

            const validSellerKeys = new Set<string>()
            const sellerStatsRows = (sellersRes.data || []) as unknown as Array<{ store_id: string; seller_user_id: string; users?: { active?: boolean | null; role?: string | null } | null }>
            if (sellerStatsRows.length) {
                sellerStatsRows.forEach((s) => {
                    const key = `${s.store_id}:${s.seller_user_id}`
                    if (!activeSellerMembershipKeys.has(key)) return
                    if (s.users?.active === false || s.users?.role !== 'vendedor') return
                    if (!newStats[s.store_id]) newStats[s.store_id] = { sellers: 0, teamMembers: 0, checkedIn: 0, disciplinePct: 0 }
                    newStats[s.store_id].sellers++
                    validSellerKeys.add(key)
                })
            }

            if (checkinsRes.data) {
                const checkinStoreSellerKeys = new Set<string>()
                checkinsRes.data.forEach((c: { store_id: string; seller_user_id?: string }) => {
                    const key = `${c.store_id}:${c.seller_user_id || 'unknown'}`
                    if (!validSellerKeys.has(key)) return
                    if (checkinStoreSellerKeys.has(key)) return
                    checkinStoreSellerKeys.add(key)
                    if (!newStats[c.store_id]) newStats[c.store_id] = { sellers: 0, teamMembers: 0, checkedIn: 0, disciplinePct: 0 }
                    newStats[c.store_id].checkedIn++
                })
            }

            Object.keys(newStats).forEach(sid => {
                const s = newStats[sid]
                s.disciplinePct = s.sellers > 0 ? Math.min(100, Math.round((s.checkedIn / s.sellers) * 100)) : 0
            })

            setStats(newStats)
        } catch (err) {
            console.error('Audit Error [useStoresStats]: fetchStats fail ->', err)
            toast.error('Não foi possível carregar as métricas das lojas.')
            setStats({})
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
        const [sellersRes, membershipsRes] = await Promise.all([
            supabase
                .from('vendedores_loja')
                .select('*, users:usuarios(*)')
                .eq('store_id', storeId)
                .eq('is_active', true),
            supabase
                .from('vinculos_loja')
                .select('user_id, users:usuarios(id, active, role)')
                .eq('store_id', storeId)
                .eq('role', 'vendedor')
                .eq('is_active', true),
        ])

        const sellersData = sellersRes.data
        const sellersError = sellersRes.error
        const membershipsData = membershipsRes.data
        const membershipsError = membershipsRes.error

        if (sellersError) {
            console.error('Audit Error [useSellersByStore]: sellers fail ->', sellersError.message)
            setSellers([])
            setLoading(false)
            return
        }
        if (membershipsError) {
            console.error('Audit Error [useSellersByStore]: memberships fail ->', membershipsError.message)
            setSellers([])
            setLoading(false)
            return
        }

        let checkins: { seller_user_id: string }[] | null = null
        let checkinsError: { message: string } | null = null
        if (isLancamentosViaRpcEnabled()) {
            const { data: rpcData, error: rpcErr } = await supabase.rpc('get_lancamentos_por_loja_periodo', {
                p_store_id: storeId,
                p_start_date: referenceDate,
                p_end_date: referenceDate,
                p_scope: 'daily',
            })
            checkins = (rpcData as { seller_user_id: string }[] | null) || []
            checkinsError = rpcErr
        } else {
            const res = await supabase
                .from('lancamentos_diarios')
                .select('seller_user_id')
                .eq('store_id', storeId)
                .eq('reference_date', referenceDate)
                .eq('metric_scope', 'daily')
            checkins = res.data
            checkinsError = res.error
        }
        if (checkinsError) console.error('Audit Error [useSellersByStore]: checkins fail ->', checkinsError.message)

        const checkedIn = new Set(checkins?.map(c => c.seller_user_id) || [])
        const activeSellerMemberships = new Set(((membershipsData || []) as unknown as Array<{ user_id: string; users?: { active?: boolean | null; role?: string | null } | null }>)
            .filter(m => m.users?.active !== false && m.users?.role === 'vendedor')
            .map(m => m.user_id))

        if (sellersData) {
            setSellers(sellersData
                .filter((s: { seller_user_id: string; users?: User | null }) => Boolean(s.users && activeSellerMemberships.has(s.seller_user_id)))
                .map((s: { seller_user_id: string; users?: User | null }) => ({
                    ...(s.users as User),
                    checkin_today: checkedIn.has(s.seller_user_id)
                })))
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
        try {
            const [tenuresRes, lojasRes] = await Promise.all([
                supabase.from('vendedores_loja')
                    .select('seller_user_id, store_id, users:usuarios(id, name, email, role)')
                    .eq('is_active', true),
                supabase.from('lojas').select('id, name').eq('active', true),
            ])
            if (tenuresRes.error) throw tenuresRes.error
            if (lojasRes.error) throw lojasRes.error

            const storeMap = new Map((lojasRes.data || []).map(s => [s.id, s.name]))
            const storeIds = (lojasRes.data || []).map(s => s.id)
            const { data: membershipsData, error: membershipsError } = storeIds.length
                ? await supabase
                    .from('vinculos_loja')
                    .select('store_id, user_id, users:usuarios(id, active, role)')
                    .in('store_id', storeIds)
                    .eq('role', 'vendedor')
                    .eq('is_active', true)
                : { data: [], error: null }
            if (membershipsError) throw membershipsError

            const activeSellerMemberships = new Set(((membershipsData || []) as unknown as Array<{ store_id: string; user_id: string; users?: { active?: boolean | null; role?: string | null } | null }>)
                .filter(m => m.users?.active !== false && m.users?.role === 'vendedor')
                .map(m => `${m.store_id}:${m.user_id}`))
            const typedTenures = (tenuresRes.data || []) as unknown as Array<{ store_id: string; users?: User | null }>
            setSellers(typedTenures
                .filter(t => t.users?.role === 'vendedor' && activeSellerMemberships.has(`${t.store_id}:${t.users.id}`))
                .map(t => ({
                    ...t.users as User,
                    store_id: t.store_id,
                    store_name: storeMap.get(t.store_id) || '',
                }))
            )
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro desconhecido'
            console.error('Audit Error [useAllSellers]: fetch fail ->', message)
            setSellers([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetch() }, [fetch])
    return { sellers, loading, refetch: fetch }
}
