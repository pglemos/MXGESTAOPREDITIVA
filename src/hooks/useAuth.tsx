/**
 * useAuth — AuthProvider shim composing 4 sub-hooks.
 *
 * Story 2.9 / ADR-0052 — Auth Provider split.
 *
 * Public API (STABLE — zero breaking change vs pre-split):
 *  - `AuthProvider`     — React Provider component
 *  - `useAuth()`        — consumer hook returning the full {@link AuthState}
 *  - `pickSimulationStore` (re-export from helpers)
 *  - `isAdministradorMx`, `isPerfilInternoMx`, `normalizeRole` (re-export from roles)
 *
 * Internal composition:
 *  - useAuthSession  → session bootstrap + onAuthStateChange
 *  - useAuthProfile  → profile + memberships fetch + zero-trust guard
 *  - useAuthRBAC     → role derivation + simulation logic
 *  - useAuthActions  → signIn / signOut / updateProfile / changePassword
 *
 * @deprecated — Do NOT add new logic here. Compose sub-hooks under
 * `src/hooks/auth/` and merge into the context value.
 */
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useAuthSession } from './auth/useAuthSession'
import { useAuthProfile } from './auth/useAuthProfile'
import { useAuthRBAC } from './auth/useAuthRBAC'
import { useAuthActions } from './auth/useAuthActions'
import type { AuthState } from './auth/authTypes'

export { isAdministradorMx, isPerfilInternoMx, normalizeRole } from '@/lib/auth/roles'
export { pickSimulationStore } from './auth/authHelpers'

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
  setActiveStoreId: () => {},
  isSimulating: false,
  simulationRole: null,
  simulationLoading: false,
  startSimulation: () => {},
  stopSimulation: () => {},
  initialized: false,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  updateProfile: async () => ({ error: 'Not initialized' }),
  changePassword: async () => ({ error: 'Not initialized' }),
})

export function AuthProvider({ children }: { children: ReactNode }) {
  // 1) Session: bootstrap + auth state subscription.
  const session = useAuthSession(() => {
    // onUserCleared (auth listener sign-out post-bootstrap) — propagated below
    // via the profile/membership setters.
  })

  // 2) Profile + memberships: reactive on session.supabaseUser.
  const profileState = useAuthProfile({
    supabaseUser: session.supabaseUser,
    initialized: session.initialized,
    setLoading: session.setLoading,
    devBypassRef: session.devBypassRef,
    lastLoadedUserIdRef: session.lastLoadedUserIdRef,
    devProfile: session.devProfile,
  })

  useEffect(() => {
    if (!session.initialized || session.supabaseUser || session.devProfile) return

    // Do not leave a stale operational profile mounted after Supabase emits
    // SIGNED_OUT. Otherwise Layout still renders ForcePasswordChange while
    // actions correctly see that there is no authenticated user.
    profileState.setProfile(null)
    profileState.setMemberships([])
    profileState.setActiveStoreId(null)
  }, [session.initialized, session.supabaseUser, session.devProfile, profileState.setProfile, profileState.setMemberships, profileState.setActiveStoreId])

  // 3) RBAC + simulation.
  const rbac = useAuthRBAC({
    profile: profileState.profile,
    vinculos_loja: profileState.vinculos_loja,
    activeStoreId: profileState.activeStoreId,
    setActiveStoreId: profileState.setActiveStoreId,
    loading: session.loading,
  })

  // 4) Actions: signIn / signOut / updateProfile / changePassword.
  const actions = useAuthActions({
    supabaseUser: session.supabaseUser,
    profile: profileState.profile,
    simulationRole: rbac.simulationRole,
    setSupabaseUser: session.setSupabaseUser,
    setProfile: profileState.setProfile,
    setMemberships: profileState.setMemberships,
    setActiveStoreId: profileState.setActiveStoreId,
    fetchProfile: profileState.fetchProfile,
    fetchMemberships: profileState.fetchMemberships,
    stopSimulation: rbac.stopSimulation,
    devBypassRef: session.devBypassRef,
  })

  const value = useMemo<AuthState>(
    () => ({
      supabaseUser: session.supabaseUser,
      profile: rbac.effectiveProfile,
      baseProfile: profileState.profile,
      membership: rbac.effectiveMembership,
      baseMembership: rbac.baseMembership,
      vinculos_loja: rbac.effectiveMemberships,
      role: rbac.effectiveRole,
      baseRole: rbac.baseRole,
      storeId: rbac.effectiveStoreId,
      activeStoreId: profileState.activeStoreId,
      setActiveStoreId: profileState.setActiveStoreId,
      isSimulating: rbac.isSimulating,
      simulationRole: rbac.isSimulating ? rbac.simulationRole : null,
      simulationLoading: rbac.simulationLoading,
      startSimulation: rbac.startSimulation,
      stopSimulation: rbac.stopSimulation,
      initialized: session.initialized,
      loading: session.loading || (Boolean(rbac.simulationRole) && rbac.simulationLoading),
      signIn: actions.signIn,
      signOut: actions.signOut,
      updateProfile: actions.updateProfile,
      changePassword: actions.changePassword,
    }),
    [
      session.supabaseUser,
      session.initialized,
      session.loading,
      profileState.profile,
      profileState.activeStoreId,
      profileState.setActiveStoreId,
      rbac.effectiveProfile,
      rbac.effectiveMembership,
      rbac.baseMembership,
      rbac.effectiveMemberships,
      rbac.effectiveRole,
      rbac.baseRole,
      rbac.effectiveStoreId,
      rbac.isSimulating,
      rbac.simulationRole,
      rbac.simulationLoading,
      rbac.startSimulation,
      rbac.stopSimulation,
      actions.signIn,
      actions.signOut,
      actions.updateProfile,
      actions.changePassword,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Consumer hook — returns the entire {@link AuthState}.
 *
 * @example
 * const { profile, role, signOut } = useAuth()
 */
export function useAuth() {
  return useContext(AuthContext)
}
