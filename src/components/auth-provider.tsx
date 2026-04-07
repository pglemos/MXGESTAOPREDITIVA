import { createContext, useContext, type ReactNode } from 'react'
import { useAuth as useCurrentAuth, type AuthProvider as CurrentAuthProvider } from '@/hooks/useAuth'

export type Role = 'Owner' | 'Manager' | 'Seller' | 'RH' | 'Admin'

type LegacyAuthContext = {
    user: any
    session: null
    role: Role | null
    agencyId: string | null
    loading: boolean
    setRole: (_role: Role) => void
    signOut: () => Promise<void>
}

const LegacyContext = createContext<LegacyAuthContext | undefined>(undefined)

function mapRole(role: string | null): Role | null {
    if (role === 'admin') return 'Admin'
    if (role === 'dono') return 'Owner'
    if (role === 'gerente') return 'Manager'
    if (role === 'vendedor') return 'Seller'
    return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const auth = useCurrentAuth()

    return (
        <LegacyContext.Provider
            value={{
                user: auth.supabaseUser,
                session: null,
                role: mapRole(auth.role),
                agencyId: null,
                loading: auth.loading,
                setRole: () => { },
                signOut: auth.signOut,
            }}
        >
            {children}
        </LegacyContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(LegacyContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
