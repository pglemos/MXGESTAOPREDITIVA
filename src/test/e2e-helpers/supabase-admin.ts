import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

loadEnv()

export const E2E_DEFAULT_PASSWORD = '123456'

export interface E2EUser {
  id: string
  email: string
  password: string
}

let cachedAdmin: SupabaseClient | null = null

export function getSupabaseAdmin() {
  if (cachedAdmin) return cachedAdmin

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for E2E setup.')
  }

  cachedAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return cachedAdmin
}

export async function createE2EAdminUser(options?: {
  prefix?: string
  password?: string
  mustChangePassword?: boolean
}) {
  const admin = getSupabaseAdmin()
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const email = `${options?.prefix || 'e2e-admin'}-${suffix}@mxperformance.test`
  const password = options?.password || E2E_DEFAULT_PASSWORD
  const mustChangePassword = options?.mustChangePassword ?? false

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: 'E2E Admin',
      role: 'admin',
      must_change_password: mustChangePassword,
    },
  })

  if (createError || !created.user) {
    throw new Error(`Failed to create E2E auth user: ${createError?.message || 'missing user'}`)
  }

  const { error: profileError } = await admin.from('users').upsert(
    {
      id: created.user.id,
      email,
      name: 'E2E Admin',
      role: 'admin',
      active: true,
      must_change_password: mustChangePassword,
    },
    { onConflict: 'id' },
  )

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id)
    throw new Error(`Failed to create E2E public profile: ${profileError.message}`)
  }

  return {
    id: created.user.id,
    email,
    password,
  } satisfies E2EUser
}

export async function deleteE2EUser(userId: string) {
  const admin = getSupabaseAdmin()
  await admin.from('users').delete().eq('id', userId)
  await admin.auth.admin.deleteUser(userId)
}

export async function getMustChangePassword(userId: string) {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('users')
    .select('must_change_password')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data?.must_change_password ?? null
}

export async function getFirstRankingStoreName() {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('store_sellers')
    .select('store:store_id(name)')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  const row = data as unknown as { store?: { name?: string } } | null
  return row?.store?.name || null
}
