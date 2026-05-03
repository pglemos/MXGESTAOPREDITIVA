// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

const internalRoles = ['administrador_geral', 'administrador_mx', 'consultor_mx']
const storeRoles = ['dono', 'gerente', 'vendedor']

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return jsonResponse({ success: false, error: 'Service is misconfigured (missing env)' }, 500)
  }

  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    return jsonResponse({ success: false, error: 'Missing Authorization header' }, 401)
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: caller, error: callerError } = await userClient.auth.getUser()
  if (callerError || !caller?.user) return jsonResponse({ success: false, error: 'Invalid session' }, 401)

  const { data: callerProfile } = await adminClient
    .from('usuarios')
    .select('role')
    .eq('id', caller.user.id)
    .maybeSingle()

  const callerRole = (callerProfile?.role || '').toLowerCase()
  if (!['administrador_geral', 'administrador_mx', 'dono', 'gerente'].includes(callerRole)) {
    return jsonResponse({ success: false, error: 'Insufficient privileges' }, 403)
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400)
  }

  const action = payload.action
  const userId = payload.user_id
  const targetStoreId = payload.store_id
  const previousStoreId = payload.previous_store_id || targetStoreId
  if (!['update', 'delete'].includes(action) || !userId || !targetStoreId) {
    return jsonResponse({ success: false, error: 'Missing required fields (action, user_id, store_id)' }, 400)
  }

  const isAdmin = callerRole === 'administrador_geral' || callerRole === 'administrador_mx'
  if (!isAdmin) {
    const { data: managerMembership } = await adminClient
      .from('vinculos_loja')
      .select('role')
      .eq('user_id', caller.user.id)
      .eq('store_id', targetStoreId)
      .in('role', ['dono', 'gerente'])
      .maybeSingle()

    if (!managerMembership) {
      return jsonResponse({ success: false, error: 'Caller cannot manage this store' }, 403)
    }
  }

  if (action === 'delete') {
    const endedAt = todayISO()
    const { error: tenureError } = await adminClient
      .from('vendedores_loja')
      .update({ is_active: false, ended_at: endedAt })
      .eq('store_id', targetStoreId)
      .eq('seller_user_id', userId)
    if (tenureError) return jsonResponse({ success: false, error: tenureError.message }, 500)

    const { error: membershipError } = await adminClient
      .from('vinculos_loja')
      .delete()
      .eq('store_id', targetStoreId)
      .eq('user_id', userId)
    if (membershipError) return jsonResponse({ success: false, error: membershipError.message }, 500)

    const { data: remainingMemberships, error: remainingError } = await adminClient
      .from('vinculos_loja')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    if (remainingError) return jsonResponse({ success: false, error: remainingError.message }, 500)

    if (!remainingMemberships?.length) {
      const { error: userError } = await adminClient.from('usuarios').update({ active: false }).eq('id', userId)
      if (userError) return jsonResponse({ success: false, error: userError.message }, 500)
    }

    return jsonResponse({ success: true })
  }

  const updates = payload.updates || {}
  const nextRole = updates.role || 'vendedor'
  if (!storeRoles.includes(nextRole) || (!isAdmin && callerRole === 'gerente' && nextRole !== 'vendedor')) {
    return jsonResponse({ success: false, error: `Caller role "${callerRole}" cannot set role "${nextRole}"` }, 403)
  }

  const userPayload: Record<string, unknown> = {}
  if (typeof updates.name !== 'undefined') userPayload.name = String(updates.name).trim().toLocaleUpperCase('pt-BR')
  if (typeof updates.email !== 'undefined') userPayload.email = String(updates.email).trim().toLowerCase()
  if (typeof updates.phone !== 'undefined') userPayload.phone = updates.phone || null
  if (typeof updates.active !== 'undefined') userPayload.active = Boolean(updates.active)
  if (typeof updates.is_venda_loja !== 'undefined') userPayload.is_venda_loja = Boolean(updates.is_venda_loja)
  userPayload.role = nextRole

  if (Object.keys(userPayload).length) {
    const { error: userError } = await adminClient.from('usuarios').update(userPayload).eq('id', userId)
    if (userError) return jsonResponse({ success: false, error: userError.message }, 500)
  }

  if (previousStoreId && previousStoreId !== targetStoreId) {
    const { error: previousMembershipError } = await adminClient
      .from('vinculos_loja')
      .delete()
      .eq('user_id', userId)
      .eq('store_id', previousStoreId)
    if (previousMembershipError) return jsonResponse({ success: false, error: previousMembershipError.message }, 500)

    await adminClient
      .from('vendedores_loja')
      .update({ is_active: false, ended_at: updates.ended_at || todayISO() })
      .eq('store_id', previousStoreId)
      .eq('seller_user_id', userId)
  }

  const { error: membershipError } = await adminClient
    .from('vinculos_loja')
    .upsert({ user_id: userId, store_id: targetStoreId, role: nextRole }, { onConflict: 'user_id,store_id' })
  if (membershipError) return jsonResponse({ success: false, error: membershipError.message }, 500)

  if (nextRole === 'vendedor') {
    const { error: tenureError } = await adminClient
      .from('vendedores_loja')
      .upsert({
        store_id: targetStoreId,
        seller_user_id: userId,
        started_at: updates.started_at || todayISO(),
        ended_at: updates.ended_at || null,
        is_active: updates.is_active ?? updates.active ?? true,
        closing_month_grace: updates.closing_month_grace ?? false,
      }, { onConflict: 'store_id,seller_user_id' })
    if (tenureError) return jsonResponse({ success: false, error: tenureError.message }, 500)
  } else {
    await adminClient
      .from('vendedores_loja')
      .update({ is_active: false, ended_at: updates.ended_at || todayISO() })
      .eq('store_id', targetStoreId)
      .eq('seller_user_id', userId)
  }

  if (internalRoles.includes(nextRole)) {
    return jsonResponse({ success: false, error: 'Internal MX roles are not valid store team roles' }, 400)
  }

  return jsonResponse({ success: true })
})
