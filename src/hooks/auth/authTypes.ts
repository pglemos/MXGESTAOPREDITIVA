/**
 * Auth Types — shared type definitions for the auth subsystem.
 * Story 2.9 / ADR-0052.
 */
import type { User as AppUser, UserRole, Membership, Store } from '@/types/database'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { SimulationRole } from './authHelpers'

export type StoreMembership = Membership & { store: Store }
export type StoreMembershipRow = Membership & { store: Store | null }
export type SimulationMembershipRow = Membership & { store: Store | null; users: AppUser | null }

export type { SimulationRole } from './authHelpers'

/**
 * Public shape of the AuthContext — consumed via `useAuth()`.
 * MUST remain stable across refactors (shim contract).
 */
export interface AuthState {
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
  updateProfile: (
    updates: Partial<Pick<AppUser, 'name' | 'phone' | 'avatar_url'>>,
  ) => Promise<{ error: string | null }>
  changePassword: (newPassword: string) => Promise<{ error: string | null }>
}
