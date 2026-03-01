import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as AppUser, UserRole, Membership, Store } from '@/types/database'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

interface AuthState {
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
    supabaseUser: null, profile: null, membership: null, role: null, storeId: null, loading: true,
    signIn: async () => ({ error: null }), signOut: async () => { },
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
    const [profile, setProfile] = useState<AppUser | null>(null)
    const [membership, setMembership] = useState<(Membership & { store: Store }) | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = useCallback(async (userId: string) => {
        const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()
        if (error) console.error('fetchProfile error:', error.message)
        if (data) setProfile(data)
        return data
    }, [])

    const fetchMembership = useCallback(async (userId: string) => {
        const { data, error } = await supabase
            .from('memberships')
            .select('*, store:stores(*)')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle()
        if (error) console.error('fetchMembership error:', error.message)
        if (data) setMembership(data as Membership & { store: Store })
        return data
    }, [])

    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) {
                setSupabaseUser(session?.user || null)
                if (!session?.user) setLoading(false)
            }
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSupabaseUser(session?.user || null)
                if (!session?.user) setLoading(false)
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
                await Promise.all([
                    fetchProfile(userId),
                    fetchMembership(userId)
                ])
            } catch (err) {
                console.error("Error loading user data:", err)
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        if (supabaseUser) {
            setLoading(true) // ensure we show spinner while loading profile
            loadUserData(supabaseUser.id)
        } else {
            setProfile(null)
            setMembership(null)
            setLoading(false)
        }

        return () => {
            mounted = false;
        }
    }, [supabaseUser, fetchProfile, fetchMembership])

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error?.message || null }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setSupabaseUser(null)
        setProfile(null)
        setMembership(null)
    }

    const role = profile?.role || null
    const storeId = membership?.store_id || null

    return (
        <AuthContext.Provider value={{ supabaseUser, profile, membership, role, storeId, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
