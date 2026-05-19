/**
 * useAuthSession — owns Supabase session lifecycle.
 *
 * Story 2.9 / ADR-0052. Responsibilities:
 *  - Bootstrap session on mount (getSession)
 *  - Apply dev-bypass when allowed
 *  - Subscribe to onAuthStateChange and propagate user changes
 *  - Expose refs that downstream hooks (profile/RBAC) read from
 */
import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User as AppUser } from '@/types/database'
import { readDevBypassProfile } from './authHelpers'

export interface UseAuthSessionResult {
  supabaseUser: SupabaseUser | null
  setSupabaseUser: React.Dispatch<React.SetStateAction<SupabaseUser | null>>
  devProfile: AppUser | null
  setDevProfile: React.Dispatch<React.SetStateAction<AppUser | null>>
  initialized: boolean
  setInitialized: React.Dispatch<React.SetStateAction<boolean>>
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  devBypassRef: MutableRefObject<boolean>
  authBootstrapCompleteRef: MutableRefObject<boolean>
  lastLoadedUserIdRef: MutableRefObject<string | null>
  onUserCleared: () => void
}

/**
 * Configures session bootstrap + auth-change subscription.
 * `onUserCleared` is invoked when the auth listener detects a sign-out
 * after bootstrap (downstream hooks reset profile/membership state).
 */
export function useAuthSession(onUserCleared: () => void): UseAuthSessionResult {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [devProfile, setDevProfile] = useState<AppUser | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [loading, setLoading] = useState(true)
  const devBypassRef = useRef(false)
  const authBootstrapCompleteRef = useRef(false)
  const lastLoadedUserIdRef = useRef<string | null>(null)
  const onUserClearedRef = useRef(onUserCleared)
  onUserClearedRef.current = onUserCleared

  useEffect(() => {
    let mounted = true

    async function bootstrapAuth() {
      authBootstrapCompleteRef.current = false
      setInitialized(false)
      setLoading(true)

      const profile = readDevBypassProfile()
      if (profile && mounted) {
        devBypassRef.current = true
        setSupabaseUser({ id: profile.id, email: profile.email } as SupabaseUser)
        setDevProfile(profile)
        lastLoadedUserIdRef.current = profile.id
        authBootstrapCompleteRef.current = true
        setInitialized(true)
        setLoading(false)
        return
      }

      devBypassRef.current = false
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const nextUser = session?.user || null

      if (!mounted) return

      setSupabaseUser(nextUser)
      authBootstrapCompleteRef.current = true
      setInitialized(true)
      if (!nextUser) setLoading(false)
    }

    bootstrapAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (devBypassRef.current) return

      if (mounted) {
        const nextUser = session?.user || null
        setSupabaseUser(nextUser)
        if (nextUser) {
          setInitialized(true)
          if (nextUser.id !== lastLoadedUserIdRef.current) {
            setLoading(true)
          }
        } else if (authBootstrapCompleteRef.current) {
          onUserClearedRef.current()
          setLoading(false)
          lastLoadedUserIdRef.current = null
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    supabaseUser,
    setSupabaseUser,
    devProfile,
    setDevProfile,
    initialized,
    setInitialized,
    loading,
    setLoading,
    devBypassRef,
    authBootstrapCompleteRef,
    lastLoadedUserIdRef,
    onUserCleared,
  }
}
