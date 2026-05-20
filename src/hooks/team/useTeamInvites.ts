import { supabase } from '@/lib/supabase'
import { isAdministradorMx, useAuth } from '@/hooks/useAuth'
import type { RegisterUserInput } from './types'

export type UseTeamInvitesInput = {
  refetchMembers: () => Promise<void>
}

export type UseTeamInvitesReturn = {
  registerUser: (
    userData: RegisterUserInput,
  ) => Promise<{ success?: boolean; error?: string }>
}

/**
 * Sub-hook: criação de integrantes (pré-cadastro + onboarding via edge function).
 */
export function useTeamInvites({ refetchMembers }: UseTeamInvitesInput): UseTeamInvitesReturn {
  const { role } = useAuth()

  const registerUser = async (userData: RegisterUserInput) => {
    if (!isAdministradorMx(role) && role !== 'gerente')
      return { error: 'Apenas Admin MX ou gerente podem criar integrantes.' }
    const { data, error } = await supabase.functions.invoke('register-user', {
      body: userData,
    })
    if (!error && data?.success) {
      await refetchMembers()
      return { success: true }
    }
    return { error: error?.message || data?.error || 'Erro desconhecido' }
  }

  return { registerUser }
}
