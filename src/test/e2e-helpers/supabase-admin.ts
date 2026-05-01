import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

loadEnv()

export const E2E_DEFAULT_PASSWORD = 'Mx#2026!E2E'

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
  name?: string
  password?: string
  mustChangePassword?: boolean
  role?: 'administrador_geral' | 'administrador_mx' | 'consultor_mx'
}) {
  const admin = getSupabaseAdmin()
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const email = `${options?.prefix || 'e2e-admin'}-${suffix}@mxperformance.test`
  const password = options?.password || E2E_DEFAULT_PASSWORD
  const mustChangePassword = options?.mustChangePassword ?? false
  const name = options?.name || 'E2E Admin'
  const role = options?.role || 'administrador_geral'

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role,
      must_change_password: mustChangePassword,
    },
  })

  if (createError || !created.user) {
    throw new Error(`Failed to create E2E auth user: ${createError?.message || 'missing user'}`)
  }

  const { error: profileError } = await admin.from('usuarios').upsert(
    {
      id: created.user.id,
      email,
      name,
      role,
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

export async function createE2EConsultingClient(options: {
  name: string
  createdBy: string
}) {
  const admin = getSupabaseAdmin()
  const slug = options.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const { data, error } = await admin
    .from('clientes_consultoria')
    .insert({
      name: options.name,
      slug,
      status: 'ativo',
      current_visit_step: 0,
      modality: 'Presencial',
      created_by: options.createdBy,
    })
    .select('id, slug, name')
    .single()

  if (error || !data) throw new Error(`Failed to create E2E consulting client: ${error?.message || 'missing row'}`)
  return data as { id: string; slug: string; name: string }
}

export async function createE2EConsultingVisit(options: {
  clientId: string
  consultantId: string
  scheduledAt: Date
  visitNumber?: number
  objective?: string
}) {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('visitas_consultoria')
    .insert({
      client_id: options.clientId,
      visit_number: options.visitNumber || 1,
      scheduled_at: options.scheduledAt.toISOString(),
      duration_hours: 3,
      modality: 'Presencial',
      status: 'agendada',
      consultant_id: options.consultantId,
      auxiliary_consultant_id: null,
      objective: options.objective || 'E2E agenda filter validation',
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Failed to create E2E consulting visit: ${error?.message || 'missing row'}`)
  return data as { id: string }
}

export async function deleteE2EConsultingData(clientIds: string[]) {
  if (!clientIds.length) return
  const admin = getSupabaseAdmin()
  await admin.from('visitas_consultoria').delete().in('client_id', clientIds)
  await admin.from('clientes_consultoria').delete().in('id', clientIds)
}

export async function deleteE2EUser(userId: string) {
  const admin = getSupabaseAdmin()
  await admin.from('usuarios').delete().eq('id', userId)
  await admin.auth.admin.deleteUser(userId)
}

export async function getMustChangePassword(userId: string) {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('usuarios')
    .select('must_change_password')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data?.must_change_password ?? null
}

export async function getFirstRankingStoreName() {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('vendedores_loja')
    .select('store:store_id(name)')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  const row = data as unknown as { store?: { name?: string } } | null
  return row?.store?.name || null
}
