import { useState, useEffect, useCallback, createContext, useContext, useRef, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as AppUser, UserRole, Membership, Store } from '@/types/database'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { isAdministradorMx, isPerfilInternoMx, normalizeRole } from '@/lib/auth/roles'

export { isAdministradorMx, isPerfilInternoMx, normalizeRole } from '@/lib/auth/roles'

type StoreMembership = Membership & { store: Store }
type StoreMembershipRow = Membership & { store: Store | null }
type SimulationRole = Extract<UserRole, 'dono' | 'gerente' | 'vendedor'>
type SimulationMembershipRow = Membership & { store: Store | null; users: AppUser | null }
const DEV_BYPASS_STORAGE_KEY = 'mx_auth_profile'
const ROLE_SIMULATION_STORAGE_KEY = 'mx_role_simulation'
const DEV_BYPASS_ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])
const PROFILE_SELECT = 'id, name, email, role, avatar_url, is_venda_loja, active, created_at, phone, must_change_password, notification_preferences'
const MEMBERSHIP_SELECT = 'id, user_id, store_id, role, created_at, store:lojas(id, name, manager_email, legal_name, cnpj, address, administrative_phone, partners, active, source_mode, created_at, updated_at)'
const SIMULATION_STORE_NAMES = ['LOJA MX', 'MX CONSULTORIA']
const SIMULATION_ROLE_LABELS: Record<SimulationRole, string> = {
    dono: 'Dono',
    gerente: 'Gerente',
    vendedor: 'Vendedor',
}

interface AuthState {
    initialized: boolean
    supabaseUser: SupabaseUser | null
    profile: AppUser | null
    baseProfile: AppUser | null
    membership: StoreMembership | null
    baseMembership: StoreMembership | null
    vinculos_loja: StoreMembership[]
    role: UserRole | null
    baseRole: UserRole | null
    storeId: string | null
    activeStoreId: string | null
    setActiveStoreId: (storeId: string | null) => void
    isSimulating: boolean
    simulationRole: SimulationRole | null
    simulationLoading: boolean
    startSimulation: (role: SimulationRole) => void
    stopSimulation: () => void
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
    updateProfile: (updates: Partial<Pick<AppUser, 'name' | 'phone' | 'avatar_url'>>) => Promise<{ error: string | null }>
    changePassword: (newPassword: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthState>({
    supabaseUser: null, 
    profile: null, 
    baseProfile: null,
    membership: null, 
    baseMembership: null,
    vinculos_loja: [],
    role: null, 
    baseRole: null,
    storeId: null, 
    activeStoreId: null,
    setActiveStoreId: () => { },
    isSimulating: false,
    simulationRole: null,
    simulationLoading: false,
    startSimulation: () => { },
    stopSimulation: () => { },
    initialized: false, 
    loading: true,
    signIn: async () => ({ error: null }), 
    signOut: async () => { },
    updateProfile: async () => ({ error: 'Not initialized' }),
    changePassword: async () => ({ error: 'Not initialized' })
})

function isTransientFetchError(error: { message?: string } | null) {
    return error?.message?.includes('Failed to fetch') || false
}

function isDevBypassAllowed() {
    if (!import.meta.env.DEV || typeof window === 'undefined') return false
    return DEV_BYPASS_ALLOWED_HOSTS.has(window.location.hostname)
}

function readDevBypassProfile(): AppUser | null {
    if (!isDevBypassAllowed()) {
        if (typeof window !== 'undefined') window.localStorage.removeItem(DEV_BYPASS_STORAGE_KEY)
        return null
    }

    try {
        const raw = window.localStorage.getItem(DEV_BYPASS_STORAGE_KEY)
        if (!raw) return null

        const parsed = JSON.parse(raw) as Partial<AppUser>
        if (!parsed.id || !parsed.email) return null

        const role = normalizeRole(parsed.role)
        if (!role) return null

        return {
            id: parsed.id,
            name: parsed.name || 'Admin MX',
            email: parsed.email,
            role,
            avatar_url: null,
            is_venda_loja: false,
            active: true,
            created_at: parsed.created_at || new Date().toISOString(),
            phone: parsed.phone,
            store_id: parsed.store_id,
        }
    } catch {
        window.localStorage.removeItem(DEV_BYPASS_STORAGE_KEY)
        return null
    }
}

function readSimulationRole(): SimulationRole | null {
    if (typeof window === 'undefined') return null
    const stored = window.sessionStorage.getItem(ROLE_SIMULATION_STORAGE_KEY)
    return stored === 'dono' || stored === 'gerente' || stored === 'vendedor' ? stored : null
}

function pickSimulationStore(stores: Store[]) {
    const activeStores = stores.filter(store => store.active)
    const exactMatch = activeStores.find(store => SIMULATION_STORE_NAMES.includes(store.name.trim().toLocaleUpperCase('pt-BR')))
    if (exactMatch) return exactMatch
    return activeStores.find(store => store.name.toLocaleUpperCase('pt-BR').includes('MX')) || activeStores[0] || null
}

function buildFallbackSimulationUser(role: SimulationRole, storeId: string): AppUser {
    return {
        id: `simulation-${role}`,
        name: `MX ${SIMULATION_ROLE_LABELS[role]}`,
        email: `${role}@mxperformance.local`,
        role,
        avatar_url: null,
        is_venda_loja: false,
        active: true,
        created_at: new Date().toISOString(),
        store_id: storeId,
        must_change_password: false,
        notification_preferences: null,
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
    const [profile, setProfile] = useState<AppUser | null>(null)
    const [vinculos_loja, setMemberships] = useState<StoreMembership[]>([])
    const [activeStoreId, setActiveStoreId] = useState<string | null>(null)
    const [simulationRole, setSimulationRole] = useState<SimulationRole | null>(() => readSimulationRole())
    const [simulationProfile, setSimulationProfile] = useState<AppUser | null>(null)
    const [simulationMemberships, setSimulationMemberships] = useState<StoreMembership[]>([])
    const [simulationLoading, setSimulationLoading] = useState(false)
    const [loading, setLoading] = useState(true)
    const [initialized, setInitialized] = useState(false)
    const authBootstrapCompleteRef = useRef(false)
    const lastLoadedUserIdRef = useRef<string | null>(null)
    const devBypassRef = useRef(false)
    const baseRole = profile ? normalizeRole(profile.role) : null
    const baseMembership = vinculos_loja.find(m => m.store_id === activeStoreId) || vinculos_loja[0] || null
    const canSimulate = isPerfilInternoMx(baseRole)

    const stopSimulation = useCallback(() => {
        if (typeof window !== 'undefined') window.sessionStorage.removeItem(ROLE_SIMULATION_STORAGE_KEY)
        setSimulationRole(null)
        setSimulationProfile(null)
        setSimulationMemberships([])
        setSimulationLoading(false)
    }, [])

    const startSimulation = useCallback((role: SimulationRole) => {
        if (typeof window !== 'undefined') window.sessionStorage.setItem(ROLE_SIMULATION_STORAGE_KEY, role)
        setSimulationRole(role)
        setSimulationLoading(true)
    }, [])

    const fetchProfile = useCallback(async (userId: string): Promise<AppUser | null> => {
        const { data, error } = await supabase.from('usuarios').select(PROFILE_SELECT).eq('id', userId).maybeSingle()
        if (error && !isTransientFetchError(error)) {
            console.error('Audit Error [useAuth]: fetchProfile fail ->', error.message)
        }
        if (data) setProfile(data as AppUser)
        else setProfile(null)
        return (data as AppUser) || null
    }, [])

    const fetchMemberships = useCallback(async (userId: string): Promise<StoreMembership[]> => {
        const { data, error } = await supabase
            .from('vinculos_loja')
            .select(MEMBERSHIP_SELECT)
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
        
        if (error && !isTransientFetchError(error)) {
            console.error('Audit Error [useAuth]: fetchMemberships fail ->', error.message)
        }

        // Isolamento de Estado (Soft Delete): Lojas inativas não são exibidas na rede
        const result = ((data || []) as unknown as StoreMembershipRow[])
            .filter((membership): membership is StoreMembership => Boolean(membership.store?.active))

        setMemberships(result)
        setActiveStoreId(current => {
            if (current && result.some(m => m.store_id === current)) return current
            return result[0]?.store_id || null
        })
        return result
    }, [])

    useEffect(() => {
        let mounted = true;

        async function bootstrapAuth() {
            authBootstrapCompleteRef.current = false
            setInitialized(false)
            setLoading(true)

            const devProfile = readDevBypassProfile()
            if (devProfile && mounted) {
                devBypassRef.current = true
                setSupabaseUser({ id: devProfile.id, email: devProfile.email } as SupabaseUser)
                setProfile(devProfile)
                setMemberships([])
                setActiveStoreId(null)
                lastLoadedUserIdRef.current = devProfile.id
                authBootstrapCompleteRef.current = true
                setInitialized(true)
                setLoading(false)
                return
            }

            devBypassRef.current = false
            const { data: { session } } = await supabase.auth.getSession()
            const nextUser = session?.user || null

            if (!mounted) return

            setSupabaseUser(nextUser)
            authBootstrapCompleteRef.current = true
            setInitialized(true)
            if (!nextUser) setLoading(false)
        }

        bootstrapAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (devBypassRef.current) return

            if (mounted) {
                const nextUser = session?.user || null;
                setSupabaseUser(nextUser);
                if (nextUser) {
                    setInitialized(true);
                    if (nextUser.id !== lastLoadedUserIdRef.current) {
                        setLoading(true);
                    }
                } else if (authBootstrapCompleteRef.current) {
                    setProfile(null);
                    setMemberships([]);
                    setActiveStoreId(null);
                    setLoading(false);
                    lastLoadedUserIdRef.current = null;
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        }
    }, [])

    useEffect(() => {
        let mounted = true;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        async function loadUserData(userId: string) {
            if (devBypassRef.current) {
                setLoading(false)
                return
            }

            if (userId === lastLoadedUserIdRef.current && profile) {
                setLoading(false)
                return
            }

            timeoutId = setTimeout(() => {
                if (mounted) {
                    setLoading(false)
                }
            }, 10000);

            try {
                const [loadedProfile, loadedMemberships] = await Promise.all([
                    fetchProfile(userId),
                    fetchMemberships(userId)
                ])
                
                const currentRole = loadedProfile ? normalizeRole(loadedProfile.role) : null

                if (!currentRole) {
                    await supabase.auth.signOut()
                    setSupabaseUser(null)
                    setProfile(null)
                    setMemberships([])
                    setActiveStoreId(null)
                    return
                }

                if (loadedProfile?.active === false) {
                    await supabase.auth.signOut()
                    setSupabaseUser(null)
                    setProfile(null)
                    setMemberships([])
                    setActiveStoreId(null)
                    return
                }
                
                // Ejeção Ativa (Sessões Existentes): Se o usuário perder a loja ativada enquanto logado
                if (!isPerfilInternoMx(currentRole) && loadedMemberships.length === 0) {
                    await supabase.auth.signOut()
                    setSupabaseUser(null)
                    setProfile(null)
                    setMemberships([])
                    return // Aborta o carregamento
                }

                if (!loadedMemberships.length && isPerfilInternoMx(currentRole)) setActiveStoreId(null)
                lastLoadedUserIdRef.current = userId
            } catch (err) {
                console.error("Audit Error [useAuth]: loadUserData fail ->", err)
            } finally {
                if (mounted) {
                    if (timeoutId) clearTimeout(timeoutId)
                    setLoading(false)
                }
            }
        }

        if (supabaseUser) {
            loadUserData(supabaseUser.id)
        } else if (initialized) {
            setLoading(false)
        }

        return () => {
            mounted = false;
            if (timeoutId) clearTimeout(timeoutId)
        }
    }, [supabaseUser, initialized, fetchProfile, fetchMemberships])

    useEffect(() => {
        let mounted = true

        async function loadSimulationIdentity(role: SimulationRole) {
            if (!canSimulate) {
                if (!profile && loading) return
                stopSimulation()
                return
            }

            setSimulationLoading(true)
            try {
                const { data: stores, error: storesError } = await supabase
                    .from('lojas')
                    .select('id, name, manager_email, legal_name, cnpj, address, administrative_phone, partners, active, source_mode, created_at, updated_at')
                    .eq('active', true)

                if (storesError) throw storesError

                const store = pickSimulationStore((stores || []) as Store[])
                if (!store) throw new Error('Nenhuma loja ativa disponível para simulação.')

                const { data: memberships, error: membershipError } = await supabase
                    .from('vinculos_loja')
                    .select(`${MEMBERSHIP_SELECT}, users:usuarios(${PROFILE_SELECT})`)
                    .eq('store_id', store.id)
                    .eq('role', role)

                if (membershipError) throw membershipError

                const rows = (memberships || []) as unknown as SimulationMembershipRow[]
                const selected = rows.find(row => row.users?.active && (role !== 'vendedor' || !row.users.is_venda_loja)) || rows.find(row => row.users?.active) || rows[0]
                const user = selected?.users ? { ...selected.users, role, store_id: store.id, must_change_password: false } : buildFallbackSimulationUser(role, store.id)
                const membership: StoreMembership = {
                    id: selected?.id || `simulation-membership-${role}`,
                    user_id: user.id,
                    store_id: store.id,
                    role,
                    created_at: selected?.created_at || new Date().toISOString(),
                    store: selected?.store || store,
                }

                if (!mounted) return

                setSimulationProfile(user)
                setSimulationMemberships([membership])
                setActiveStoreId(store.id)
            } catch (err) {
                console.error('Audit Error [useAuth]: simulation identity fail ->', err)
                if (mounted) {
                    setSimulationProfile(null)
                    setSimulationMemberships([])
                }
            } finally {
                if (mounted) setSimulationLoading(false)
            }
        }

        if (!simulationRole) {
            setSimulationProfile(null)
            setSimulationMemberships([])
            setSimulationLoading(false)
            return () => { mounted = false }
        }

        loadSimulationIdentity(simulationRole)

        return () => {
            mounted = false
        }
    }, [canSimulate, loading, profile, simulationRole, stopSimulation])

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        
        if (error) {
            return { error: 'E-mail ou senha inválidos.' }
        }

        if (data?.user) {
            
            // Trava Zero Trust: Validar acesso operacional antes de liberar a interface
            const [loadedProfile, loadedMemberships] = await Promise.all([
                fetchProfile(data.user.id),
                fetchMemberships(data.user.id)
            ])
            
            const currentRole = loadedProfile ? normalizeRole(loadedProfile.role) : null

            if (!currentRole) {
                await supabase.auth.signOut()
                setSupabaseUser(null)
                setProfile(null)
                setMemberships([])
                return { error: 'ACESSO BLOQUEADO: Perfil operacional inválido.' }
            }

            if (loadedProfile?.active === false) {
                await supabase.auth.signOut()
                setSupabaseUser(null)
                setProfile(null)
                setMemberships([])
                return { error: 'LOGIN PENDENTE: Seu acesso foi criado e aguarda aprovação do Admin MX.' }
            }
            
            if (!isPerfilInternoMx(currentRole) && loadedMemberships.length === 0) {
                await supabase.auth.signOut()
                setSupabaseUser(null)
                setProfile(null)
                setMemberships([])
                return { error: 'ACESSO BLOQUEADO: Sua unidade operacional foi desativada da Malha MX.' }
            }
        }
        
        return { error: null }
    }

    const updateProfile = async (updates: Partial<Pick<AppUser, 'name' | 'phone' | 'avatar_url'>>): Promise<{ error: string | null }> => {
        if (simulationRole) return { error: 'Edição de perfil bloqueada durante a simulação.' }
        if (!supabaseUser?.id) return { error: 'Não autenticado' }

        const { error } = await supabase
            .from('usuarios')
            .update(updates)
            .eq('id', supabaseUser.id)

        if (error) return { error: error.message }

        const updatedProfile = { ...profile, ...updates } as AppUser
        setProfile(updatedProfile)
        return { error: null }
    }

    const changePassword = async (newPassword: string): Promise<{ error: string | null }> => {
        if (simulationRole) return { error: 'Troca de senha bloqueada durante a simulação.' }
        if (!supabaseUser) return { error: 'Usuário não autenticado' }
        
        const { error: authError } = await supabase.auth.updateUser({ password: newPassword })
        if (authError) return { error: authError.message }
        
        const { error: dbError } = await supabase
            .from('usuarios')
            .update({ must_change_password: false })
            .eq('id', supabaseUser.id)
            
        if (!dbError) {
            setProfile(prev => prev ? { ...prev, must_change_password: false } : null)
        }
        
        return { error: dbError?.message || null }
    }

    const signOut = async () => {
        if (simulationRole) {
            stopSimulation()
            return
        }
        if (devBypassRef.current && typeof window !== 'undefined') {
            window.localStorage.removeItem(DEV_BYPASS_STORAGE_KEY)
            devBypassRef.current = false
        }
        await supabase.auth.signOut()
        setSupabaseUser(null)
        setProfile(null)
        setMemberships([])
        setActiveStoreId(null)
    }

    const isSimulating = Boolean(canSimulate && simulationRole && simulationProfile)
    const effectiveProfile = isSimulating ? simulationProfile : profile
    const effectiveMemberships = isSimulating ? simulationMemberships : vinculos_loja
    const role = isSimulating ? simulationRole : baseRole
    const membership = effectiveMemberships.find(m => m.store_id === activeStoreId) || effectiveMemberships[0] || null
    const storeId = activeStoreId || membership?.store_id || (!isPerfilInternoMx(role) ? effectiveProfile?.store_id : null) || null

    return (
        <AuthContext.Provider value={{
            supabaseUser,
            profile: effectiveProfile,
            baseProfile: profile,
            membership,
            baseMembership,
            vinculos_loja: effectiveMemberships,
            role,
            baseRole,
            storeId,
            activeStoreId,
            setActiveStoreId,
            isSimulating,
            simulationRole: isSimulating ? simulationRole : null,
            simulationLoading,
            startSimulation,
            stopSimulation,
            initialized,
            loading: loading || (Boolean(simulationRole) && simulationLoading),
            signIn,
            signOut,
            updateProfile,
            changePassword
        }}>            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
