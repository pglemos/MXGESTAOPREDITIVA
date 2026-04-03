import { useState, useEffect, useCallback, createContext, useContext, useRef, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as AppUser, UserRole, Membership, Store } from '@/types/database'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AuthState {
    initialized: boolean
    supabaseUser: SupabaseUser | null
    profile: AppUser | null
    membership: (Membership & { store: Store }) | null
    role: UserRole | null
    storeId: string | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
    supabaseUser: null, 
    profile: null, 
    membership: null, 
    role: null, 
    storeId: null, 
    initialized: false, 
    loading: true,
    signIn: async () => ({ error: null }), 
    signOut: async () => { },
})

function normalizeRole(rawRole: string | null | undefined): UserRole {
    const role = (rawRole || '').toLowerCase()
    if (role === 'admin') return 'admin'
    if (role === 'consultor' || role === 'owner') return 'consultor'
    if (role === 'gerente' || role === 'manager') return 'gerente'
    return 'vendedor'
}

function isTransientFetchError(error: { message?: string } | null) {
    return error?.message?.includes('Failed to fetch') || false
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
    const [profile, setProfile] = useState<AppUser | null>(null)
    const [membership, setMembership] = useState<(Membership & { store: Store }) | null>(null)
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

    const fetchMembership = useCallback(async (userId: string): Promise<(Membership & { store: Store }) | null> => {
        const { data, error } = await supabase
            .from('memberships')
            .select('*, store:stores(*)')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle()
        
        if (error && !isTransientFetchError(error)) {
            console.error('Audit Error [useAuth]: fetchMembership fail ->', error.message)
        }
        
        const result = data as (Membership & { store: Store }) | null
        setMembership(result)
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
                    setMembership(null)
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

        async function loadUserData(userId: string) {
            try {
                const [loadedProfile, loadedMembership] = await Promise.all([
                    fetchProfile(userId),
                    fetchMembership(userId)
                ])
                
                const currentRole = loadedProfile ? normalizeRole(loadedProfile.role) : 'vendedor'
                
                if (!loadedMembership && (currentRole === 'consultor' || currentRole === 'admin')) {
                    await fetchFallbackStoreId()
                } else {
                    setFallbackStoreId(null)
                }
            } catch (err) {
                console.error("Audit Error [useAuth]: loadUserData fail ->", err)
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        if (supabaseUser) {
            setLoading(true)
            loadUserData(supabaseUser.id)
        } else if (initialized) {
            setProfile(null)
            setMembership(null)
            setFallbackStoreId(null)
            setLoading(false)
        }

        return () => {
            mounted = false;
        }
    }, [supabaseUser, initialized, fetchProfile, fetchMembership, fetchFallbackStoreId])

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error?.message || null }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setSupabaseUser(null)
        setProfile(null)
        setMembership(null)
        setFallbackStoreId(null)
    }

    const role = profile ? normalizeRole(profile.role) : null
    const storeId = membership?.store_id || fallbackStoreId || null

    return (
        <AuthContext.Provider value={{ 
            supabaseUser, 
            profile, 
            membership, 
            role, 
            storeId, 
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
