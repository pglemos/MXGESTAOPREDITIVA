import { useState, useEffect, useCallback, createContext, useContext, useRef, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as AppUser, UserRole, Membership, Store } from '@/types/database'
import type { User as SupabaseUser } from '@supabase/supabase-js'

type StoreMembership = Membership & { store: Store }
const DEV_BYPASS_STORAGE_KEY = 'mx_auth_profile'

interface AuthState {
    initialized: boolean
    supabaseUser: SupabaseUser | null
    profile: AppUser | null
    membership: StoreMembership | null
    vinculos_loja: StoreMembership[]
    role: UserRole | null
    storeId: string | null
    activeStoreId: string | null
    setActiveStoreId: (storeId: string | null) => void
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
    updateProfile: (updates: Partial<Pick<AppUser, 'name' | 'phone' | 'avatar_url'>>) => Promise<{ error: string | null }>
    changePassword: (newPassword: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthState>({
    supabaseUser: null, 
    profile: null, 
    membership: null, 
    vinculos_loja: [],
    role: null, 
    storeId: null, 
    activeStoreId: null,
    setActiveStoreId: () => { },
    initialized: false, 
    loading: true,
    signIn: async () => ({ error: null }), 
    signOut: async () => { },
    updateProfile: async () => ({ error: 'Not initialized' }),
    changePassword: async () => ({ error: 'Not initialized' })
})

export function isPerfilInternoMx(role: UserRole | string | null | undefined): boolean {
    return role === 'administrador_geral' || role === 'administrador_mx' || role === 'consultor_mx'
}

export function isAdministradorMx(role: UserRole | string | null | undefined): boolean {
    return role === 'administrador_geral' || role === 'administrador_mx'
}

function normalizeRole(rawRole: string | null | undefined): UserRole {
    const role = (rawRole || '').toLowerCase().trim()
    if (role === 'administrador_geral' || role === 'admin_master') return 'administrador_geral'
    if (role === 'administrador_mx' || role === 'admin') return 'administrador_mx'
    if (role === 'consultor_mx' || role === 'consultor') return 'consultor_mx'
    if (role === 'dono' || role === 'owner') return 'dono'
    if (role === 'gerente' || role === 'manager') return 'gerente'
    return 'vendedor'
}

function isTransientFetchError(error: { message?: string } | null) {
    return error?.message?.includes('Failed to fetch') || false
}

function readDevBypassProfile(): AppUser | null {
    if (!import.meta.env.DEV || typeof window === 'undefined') return null

    try {
        const raw = window.localStorage.getItem(DEV_BYPASS_STORAGE_KEY)
        if (!raw) return null

        const parsed = JSON.parse(raw) as Partial<AppUser>
        if (!parsed.id || !parsed.email) return null

        return {
            id: parsed.id,
            name: parsed.name || 'Admin MX',
            email: parsed.email,
            role: normalizeRole(parsed.role),
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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
    const [profile, setProfile] = useState<AppUser | null>(null)
    const [vinculos_loja, setMemberships] = useState<StoreMembership[]>([])
    const [activeStoreId, setActiveStoreId] = useState<string | null>(null)
    const [fallbackStoreId, setFallbackStoreId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [initialized, setInitialized] = useState(false)
    const authBootstrapCompleteRef = useRef(false)
    const lastLoadedUserIdRef = useRef<string | null>(null)
    const devBypassRef = useRef(false)

    const fetchProfile = useCallback(async (userId: string): Promise<AppUser | null> => {
        const { data, error } = await supabase.from('usuarios').select('*').eq('id', userId).maybeSingle()
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
            .select('*, store:lojas(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
        
        if (error && !isTransientFetchError(error)) {
            console.error('Audit Error [useAuth]: fetchMemberships fail ->', error.message)
        }

        // Isolamento de Estado (Soft Delete): Lojas inativas não são exibidas na rede
        const result = (data || []).filter((m: any) => m.store?.active) as StoreMembership[]

        setMemberships(result)
        setActiveStoreId(current => {
            if (current && result.some(m => m.store_id === current)) return current
            return result[0]?.store_id || null
        })
        return result
    }, [])

    const fetchFallbackStoreId = useCallback(async () => {
        const { data, error } = await supabase
            .from('lojas')
            .select('id')
            .eq('active', true)
            .order('name')
            .limit(1)
            .maybeSingle()
            
        if (error && !isTransientFetchError(error)) {
            console.error('Audit Error [useAuth]: fetchFallbackStoreId fail ->', error.message)
        }
        
        const storeId = data?.id || null
        setFallbackStoreId(storeId)
        return storeId
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
                setFallbackStoreId(null)
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
                    setFallbackStoreId(null);
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
        let timeoutId: any;

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
                
                const currentRole = loadedProfile ? normalizeRole(loadedProfile.role) : 'vendedor'
                
                // Ejeção Ativa (Sessões Existentes): Se o usuário perder a loja ativada enquanto logado
                if (!isPerfilInternoMx(currentRole) && loadedMemberships.length === 0) {
                    await supabase.auth.signOut()
                    setSupabaseUser(null)
                    setProfile(null)
                    setMemberships([])
                    return // Aborta o carregamento
                }

                if (!loadedMemberships.length && isPerfilInternoMx(currentRole)) {
                    await fetchFallbackStoreId()
                } else {
                    setFallbackStoreId(null)
                }
                lastLoadedUserIdRef.current = userId
            } catch (err) {
                console.error("Audit Error [useAuth]: loadUserData fail ->", err)
            } finally {
                if (mounted) {
                    clearTimeout(timeoutId)
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
    }, [supabaseUser, initialized, fetchProfile, fetchMemberships, fetchFallbackStoreId])

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        
        if (error) {
            return { error: error.message }
        }

        if (data?.user) {
            
            // Trava Zero Trust: Validar acesso operacional antes de liberar a interface
            const [loadedProfile, loadedMemberships] = await Promise.all([
                fetchProfile(data.user.id),
                fetchMemberships(data.user.id)
            ])
            
            const currentRole = loadedProfile ? normalizeRole(loadedProfile.role) : 'vendedor'
            
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
        if (devBypassRef.current && typeof window !== 'undefined') {
            window.localStorage.removeItem(DEV_BYPASS_STORAGE_KEY)
            devBypassRef.current = false
        }
        await supabase.auth.signOut()
        setSupabaseUser(null)
        setProfile(null)
        setMemberships([])
        setActiveStoreId(null)
        setFallbackStoreId(null)
    }

    const role = profile ? normalizeRole(profile.role) : null
    const membership = vinculos_loja.find(m => m.store_id === activeStoreId) || vinculos_loja[0] || null
    const storeId = activeStoreId || membership?.store_id || fallbackStoreId || null

    return (
        <AuthContext.Provider value={{
            supabaseUser,
            profile,
            membership,
            vinculos_loja,
            role,
            storeId,
            activeStoreId,
            setActiveStoreId,
            initialized,
            loading,
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
