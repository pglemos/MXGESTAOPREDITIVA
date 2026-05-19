/**
 * useAuthActions — action factory for auth mutations.
 *
 * Story 2.9 / ADR-0052. Responsibilities:
 *  - signIn (with Zero-Trust validation)
 *  - signOut (with simulation + dev-bypass cleanup)
 *  - updateProfile (RPC + local state sync)
 *  - changePassword (Supabase auth + complete_password_change RPC)
 */
import { useMemo, type MutableRefObject } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User as AppUser } from '@/types/database'
import { normalizeRole, isPerfilInternoMx } from '@/lib/auth/roles'
import {
  isTransientFetchError,
  AUTH_NETWORK_ERROR_MESSAGE,
  DEV_BYPASS_STORAGE_KEY,
  type SimulationRole,
} from './authHelpers'
import type { StoreMembership } from './authTypes'

interface UseAuthActionsOptions {
  supabaseUser: SupabaseUser | null
  profile: AppUser | null
  simulationRole: SimulationRole | null
  setSupabaseUser: React.Dispatch<React.SetStateAction<SupabaseUser | null>>
  setProfile: React.Dispatch<React.SetStateAction<AppUser | null>>
  setMemberships: React.Dispatch<React.SetStateAction<StoreMembership[]>>
  setActiveStoreId: React.Dispatch<React.SetStateAction<string | null>>
  fetchProfile: (userId: string) => Promise<AppUser | null>
  fetchMemberships: (userId: string) => Promise<StoreMembership[]>
  stopSimulation: () => void
  devBypassRef: MutableRefObject<boolean>
}

export interface UseAuthActionsResult {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (
    updates: Partial<Pick<AppUser, 'name' | 'phone' | 'avatar_url'>>,
  ) => Promise<{ error: string | null }>
  changePassword: (newPassword: string) => Promise<{ error: string | null }>
}

export function useAuthActions(options: UseAuthActionsOptions): UseAuthActionsResult {
  const {
    supabaseUser,
    profile,
    simulationRole,
    setSupabaseUser,
    setProfile,
    setMemberships,
    setActiveStoreId,
    fetchProfile,
    fetchMemberships,
    stopSimulation,
    devBypassRef,
  } = options

  return useMemo<UseAuthActionsResult>(() => {
    const signIn = async (email: string, password: string) => {
      let data: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data']
      let error: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['error']

      try {
        const response = await supabase.auth.signInWithPassword({ email, password })
        data = response.data
        error = response.error
      } catch (err) {
        if (isTransientFetchError(err)) return { error: AUTH_NETWORK_ERROR_MESSAGE }
        return { error: 'Erro inesperado ao realizar login.' }
      }

      if (error) {
        if (isTransientFetchError(error)) return { error: AUTH_NETWORK_ERROR_MESSAGE }
        return { error: 'E-mail ou senha inválidos.' }
      }

      if (data?.user) {
        // Trava Zero Trust: validar acesso operacional antes de liberar a UI
        const [loadedProfile, loadedMemberships] = await Promise.all([
          fetchProfile(data.user.id),
          fetchMemberships(data.user.id),
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
          return {
            error:
              'LOGIN PENDENTE: Seu acesso foi criado e aguarda aprovação do Admin MX.',
          }
        }

        if (
          currentRole !== 'dono' &&
          !isPerfilInternoMx(currentRole) &&
          loadedMemberships.length === 0
        ) {
          await supabase.auth.signOut()
          setSupabaseUser(null)
          setProfile(null)
          setMemberships([])
          return {
            error: 'ACESSO BLOQUEADO: Sua unidade operacional foi desativada da Malha MX.',
          }
        }
      }

      return { error: null }
    }

    const updateProfile = async (
      updates: Partial<Pick<AppUser, 'name' | 'phone' | 'avatar_url'>>,
    ): Promise<{ error: string | null }> => {
      if (simulationRole) return { error: 'Edição de perfil bloqueada durante a simulação.' }
      if (!supabaseUser?.id) return { error: 'Não autenticado' }

      try {
        const { data, error } = await supabase.rpc('update_my_profile', { p_updates: updates })

        if (error) return { error: error.message }
        const result = data as { ok?: boolean; error?: string } | null
        if (!result?.ok) return { error: result?.error || 'Não foi possível atualizar o perfil.' }

        const updatedProfile = { ...profile, ...updates } as AppUser
        setProfile(updatedProfile)
        return { error: null }
      } catch (err) {
        if (isTransientFetchError(err)) return { error: AUTH_NETWORK_ERROR_MESSAGE }
        return { error: 'Não foi possível atualizar o perfil.' }
      }
    }

    const changePassword = async (newPassword: string): Promise<{ error: string | null }> => {
      if (simulationRole) return { error: 'Troca de senha bloqueada durante a simulação.' }
      if (!supabaseUser) return { error: 'Usuário não autenticado' }

      try {
        const { error: authError } = await supabase.auth.updateUser({ password: newPassword })
        if (authError) return { error: authError.message }

        const { data, error: dbError } = await supabase.rpc('complete_password_change')
        const result = data as { ok?: boolean; error?: string } | null

        if (!dbError && result?.ok) {
          setProfile(prev => (prev ? { ...prev, must_change_password: false } : null))
        }

        return { error: dbError?.message || result?.error || null }
      } catch (err) {
        if (isTransientFetchError(err)) return { error: AUTH_NETWORK_ERROR_MESSAGE }
        return { error: 'Não foi possível concluir a troca de senha.' }
      }
    }

    const signOut = async () => {
      if (simulationRole) stopSimulation()
      if (devBypassRef.current && typeof window !== 'undefined') {
        window.localStorage.removeItem(DEV_BYPASS_STORAGE_KEY)
        devBypassRef.current = false
      }
      try {
        await supabase.auth.signOut()
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('Audit Warn [useAuth]: signOut failed locally.', err)
        }
      }
      setSupabaseUser(null)
      setProfile(null)
      setMemberships([])
      setActiveStoreId(null)
    }

    return { signIn, signOut, updateProfile, changePassword }
  }, [
    supabaseUser,
    profile,
    simulationRole,
    setSupabaseUser,
    setProfile,
    setMemberships,
    setActiveStoreId,
    fetchProfile,
    fetchMemberships,
    stopSimulation,
    devBypassRef,
  ])
}
