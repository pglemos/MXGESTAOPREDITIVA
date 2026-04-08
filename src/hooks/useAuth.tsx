import { useState, useEffect, useCallback, createContext, useContext, useRef, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as AppUser, UserRole, Membership, Store } from '@/types/database'
import type { User as SupabaseUser } from '@supabase/supabase-js'

type StoreMembership = Membership & { store: Store }

interface AuthState {
    initialized: boolean
    supabaseUser: SupabaseUser | null
    profile: AppUser | null
    membership: StoreMembership | null
    memberships: StoreMembership[]
    role: UserRole | null
    storeId: string | null
    activeStoreId: string | null
    setActiveStoreId: (storeId: string | null) => void
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
    supabaseUser: null, 
    profile: null, 
    membership: null, 
    memberships: [],
    role: null, 
    storeId: null, 
    activeStoreId: null,
    setActiveStoreId: () => { },
    initialized: false, 
    loading: true,
    signIn: async () => ({ error: null }), 
    signOut: async () => { },
})

function normalizeRole(rawRole: string | null | undefined): UserRole {
    const role = (rawRole || '').toLowerCase()
    if (role === 'admin' || role === 'consultor') return 'admin'
    if (role === 'dono' || role === 'owner') return 'dono'
    if (role === 'gerente' || role === 'manager') return 'gerente'
    return 'vendedor'
}

function isTransientFetchError(error: { message?: string } | null) {
    return error?.message?.includes('Failed to fetch') || false
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
    const [profile, setProfile] = useState<AppUser | null>(null)
    const [memberships, setMemberships] = useState<StoreMembership[]>([])
    const [activeStoreId, setActiveStoreId] = useState<string | null>(null)
    const [fallbackStoreId, setFallbackStoreId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [initialized, setInitialized] = useState(false)
    const authBootstrapCompleteRef = useRef(false)

    const fetchProfile = useCallback(async (userId: string): Promise<AppUser | null> => {
        const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()
        if (error && !isTransientFetchError(error)) {
            console.error('Audit Error [useAuth]: fetchProfile fail ->', error.message)
        }
        if (data) setProfile(data as AppUser)
        return (data as AppUser) || null
    }, [])

    const fetchMemberships = useCallback(async (userId: string): Promise<StoreMembership[]> => {
        const { data, error } = await supabase
            .from('memberships')
            .select('*, store:stores(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
        
        if (error && !isTransientFetchError(error)) {
            console.error('Audit Error [useAuth]: fetchMemberships fail ->', error.message)
        }
        
        const result = (data || []) as StoreMembership[]
        setMemberships(result)
        setActiveStoreId(current => {
            if (current && result.some(m => m.store_id === current)) return current
            return result[0]?.store_id || null
        })
        return result
    }, [])

    const fetchFallbackStoreId = useCallback(async () => {
        const { data, error } = await supabase
            .from('stores')
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

            const { data: { session } } = await supabase.auth.getSession()
            let nextUser = session?.user || null

            if (!nextUser) {
                const { data, error } = await supabase.auth.getUser()
                if (!error) nextUser = data.user || null
            }

            if (!mounted) return

            setSupabaseUser(nextUser)
            authBootstrapCompleteRef.current = true
            setInitialized(true)
            if (!nextUser) setLoading(false)
        }

        bootstrapAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                const nextUser = session?.user || null
                setSupabaseUser(nextUser)
                if (nextUser) {
                    setInitialized(true)
                    setLoading(true)
                } else if (authBootstrapCompleteRef.current) {
                    // Force state cleanup on logout
                    setProfile(null)
                    setMemberships([])
                    setActiveStoreId(null)
                    setFallbackStoreId(null)
                    setLoading(false)
                }
            }
        })

        return () => {
            mounted = false;
            subscription.unsubscribe()
        }
    }, [])

    useEffect(() => {
        let mounted = true;
        let timeoutId: any;

        async function loadUserData(userId: string) {
            // Safety timeout: force stop loading after 10s even if query hangs
            timeoutId = setTimeout(() => {
                if (mounted) {
                    console.warn("Audit Warn [useAuth]: loadUserData timeout reached. Forcing loading false.")
                    setLoading(false)
                }
            }, 10000);

            try {
                console.log(`Audit Info [useAuth]: loading data for user ${userId}...`)
                const [loadedProfile, loadedMemberships] = await Promise.all([
                    fetchProfile(userId),
                    fetchMemberships(userId)
                ])
                
                const currentRole = loadedProfile ? normalizeRole(loadedProfile.role) : 'vendedor'
                console.log(`Audit Info [useAuth]: data loaded. Role: ${currentRole}, Memberships: ${loadedMemberships.length}`)
                
                if (!loadedMemberships.length && currentRole === 'admin') {
                    await fetchFallbackStoreId()
                } else {
                    setFallbackStoreId(null)
                }
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
            setLoading(true)
            loadUserData(supabaseUser.id)
        } else if (initialized) {
            setProfile(null)
            setMemberships([])
            setActiveStoreId(null)
            setFallbackStoreId(null)
            setLoading(false)
        }

        return () => {
            mounted = false;
            if (timeoutId) clearTimeout(timeoutId)
        }
    }, [supabaseUser, initialized, fetchProfile, fetchMemberships, fetchFallbackStoreId])

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error?.message || null }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setSupabaseUser(null)
        setProfile(null)
        setMemberships([])
        setActiveStoreId(null)
        setFallbackStoreId(null)
    }

    const role = profile ? normalizeRole(profile.role) : null
    const membership = memberships.find(m => m.store_id === activeStoreId) || memberships[0] || null
    const storeId = activeStoreId || membership?.store_id || fallbackStoreId || null

    return (
        <AuthContext.Provider value={{ 
            supabaseUser, 
            profile, 
            membership, 
            memberships,
            role, 
            storeId, 
            activeStoreId,
            setActiveStoreId,
            initialized, 
            loading, 
            signIn, 
            signOut 
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
