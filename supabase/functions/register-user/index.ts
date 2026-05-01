// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

interface RegisterUserPayload {
  email: string
  password?: string
  name: string
  role: 'administrador_geral' | 'administrador_mx' | 'consultor_mx' | 'dono' | 'gerente' | 'vendedor'
  store_id?: string
  phone?: string
}

const PASSWORD_POLICY_MESSAGE = 'Password must be at least 10 characters and include uppercase, lowercase, number, and symbol'

function isStrongPassword(password: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/.test(password)
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ success: false, error: 'Service is misconfigured (missing env)' }, 500)
  }

  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    return jsonResponse({ success: false, error: 'Missing Authorization header' }, 401)
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: caller, error: callerError } = await userClient.auth.getUser()
  if (callerError || !caller?.user) {
    return jsonResponse({ success: false, error: 'Invalid session' }, 401)
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: callerProfile } = await adminClient
    .from('usuarios')
    .select('role')
    .eq('id', caller.user.id)
    .maybeSingle()

  const callerRole = (callerProfile?.role || '').toLowerCase()
  if (!['administrador_geral', 'administrador_mx', 'dono', 'gerente'].includes(callerRole)) {
    return jsonResponse({ success: false, error: 'Insufficient privileges' }, 403)
  }

  let payload: RegisterUserPayload
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400)
  }

  const { email, password, name, role, store_id, phone } = payload

  if (!email || !name || !role) {
    return jsonResponse({ success: false, error: 'Missing required fields (email, name, role)' }, 400)
  }

  if (!password || !isStrongPassword(password)) {
    return jsonResponse({ success: false, error: PASSWORD_POLICY_MESSAGE }, 400)
  }

  if (!['administrador_geral', 'administrador_mx', 'consultor_mx'].includes(role) && !store_id) {
    return jsonResponse({ success: false, error: 'store_id is required for store-scoped roles' }, 400)
  }

  const allowedRolesByCaller: Record<string, string[]> = {
    administrador_geral: ['administrador_mx', 'consultor_mx', 'dono', 'gerente', 'vendedor'],
    administrador_mx: ['consultor_mx', 'dono', 'gerente', 'vendedor'],
    dono: ['gerente', 'vendedor'],
    gerente: ['vendedor'],
  }
  if (!allowedRolesByCaller[callerRole]?.includes(role)) {
    return jsonResponse({ success: false, error: `Caller role "${callerRole}" cannot create role "${role}"` }, 403)
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role,
      phone: phone || null,
      must_change_password: true,
    },
  })

  if (createError || !created?.user) {
    return jsonResponse({ success: false, error: createError?.message || 'Failed to create auth user' }, 400)
  }

  const newUserId = created.user.id

  const { error: profileError } = await adminClient
    .from('usuarios')
    .upsert(
      {
        id: newUserId,
        email: email.trim().toLowerCase(),
        name,
        role,
        phone: phone || null,
        active: true,
        must_change_password: true,
      },
      { onConflict: 'id' },
    )

  if (profileError) {
    return jsonResponse({ success: false, error: `User created but profile insert failed: ${profileError.message}` }, 500)
  }

  let membershipCreated = false
  if (!['administrador_geral', 'administrador_mx', 'consultor_mx'].includes(role) && store_id) {
    const { error: membershipError } = await adminClient
      .from('vinculos_loja')
      .upsert(
        { user_id: newUserId, store_id, role },
        { onConflict: 'user_id,store_id' },
      )

    if (membershipError) {
      return jsonResponse({ success: false, error: `Profile created but membership insert failed: ${membershipError.message}` }, 500)
    }
    membershipCreated = true
  }

  return jsonResponse({
    success: true,
    user_id: newUserId,
    email: email.trim().toLowerCase(),
    must_change_password: true,
    membership_created: membershipCreated,
  })
})
