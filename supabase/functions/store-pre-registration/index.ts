// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

const allowedRoles = ['dono', 'gerente', 'vendedor']
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const temporaryPassword = 'Mx@123456!'

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function clean(value: unknown, max = 240) {
  return String(value || '').trim().slice(0, max)
}

function normalizeEmail(value: unknown) {
  return clean(value, 180).toLowerCase()
}

function clientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for') || ''
  return forwarded.split(',')[0]?.trim() || null
}

function imageExtension(mimeType: string) {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  return 'jpg'
}

function decodeBase64Image(base64: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function cleanupPendingUser(adminClient: any, userId: string, storeId: string, avatarStoragePath: string | null) {
  await adminClient.from('vendedores_loja').delete().eq('seller_user_id', userId).eq('store_id', storeId)
  await adminClient.from('vinculos_loja').delete().eq('user_id', userId).eq('store_id', storeId)
  await adminClient.from('usuarios').delete().eq('id', userId)
  if (avatarStoragePath) await adminClient.storage.from('pre-cadastro-avatares').remove([avatarStoragePath])
  await adminClient.auth.admin.deleteUser(userId)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ success: false, error: 'Service is misconfigured' }, 500)
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const storeSlug = clean(url.searchParams.get('store_slug'), 160)
    if (!storeSlug) return jsonResponse({ success: false, error: 'store_slug is required' }, 400)

    const { data: stores, error } = await adminClient
      .from('lojas')
      .select('id, name, active, legal_name, cnpj, address')
      .eq('active', true)

    if (error) return jsonResponse({ success: false, error: error.message }, 500)

    const store = (stores || []).find((item: any) => slugify(item.name) === storeSlug)
    if (!store) return jsonResponse({ success: false, error: 'Loja não localizada' }, 404)

    return jsonResponse({
      success: true,
      store: {
        id: store.id,
        name: store.name,
        legal_name: store.legal_name,
        cnpj: store.cnpj,
        address: store.address,
      },
    })
  }

  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Method not allowed' }, 405)

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400)
  }

  const storeId = clean(payload.store_id, 80)
  const fullName = clean(payload.full_name, 180).toLocaleUpperCase('pt-BR')
  const email = normalizeEmail(payload.email)
  const phone = clean(payload.phone, 80)
  const role = clean(payload.role, 40)
  const segment = clean(payload.segment, 120)
  const storeTenure = clean(payload.store_tenure, 120)
  const marketExperience = clean(payload.market_experience, 120)
  const notes = clean(payload.notes, 800)
  const avatarBase64 = clean(payload.avatar_base64, 7_200_000)
  const avatarMimeType = clean(payload.avatar_mime_type, 80)

  if (!storeId || !fullName || !email || !phone || !role || !segment || !storeTenure || !marketExperience || !avatarBase64 || !avatarMimeType) {
    return jsonResponse({ success: false, error: 'Preencha todos os campos obrigatórios.' }, 400)
  }

  if (fullName.split(/\s+/).filter(Boolean).length < 2) {
    return jsonResponse({ success: false, error: 'Informe nome e sobrenome.' }, 400)
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ success: false, error: 'E-mail inválido.' }, 400)
  }

  if (phone.replace(/\D/g, '').length < 10) {
    return jsonResponse({ success: false, error: 'Telefone inválido.' }, 400)
  }

  if (!allowedRoles.includes(role)) {
    return jsonResponse({ success: false, error: 'Papel inválido.' }, 400)
  }

  if (!allowedImageTypes.includes(avatarMimeType)) {
    return jsonResponse({ success: false, error: 'Envie uma foto JPG, PNG ou WEBP.' }, 400)
  }

  if (avatarBase64.length > 7_000_000) {
    return jsonResponse({ success: false, error: 'A foto deve ter no máximo 5MB.' }, 400)
  }

  const { data: store, error: storeError } = await adminClient
    .from('lojas')
    .select('id, name, active')
    .eq('id', storeId)
    .eq('active', true)
    .maybeSingle()

  if (storeError) return jsonResponse({ success: false, error: storeError.message }, 500)
  if (!store) return jsonResponse({ success: false, error: 'Loja não localizada ou inativa.' }, 404)

  const { data: existingUser, error: existingUserError } = await adminClient
    .from('usuarios')
    .select('id, active')
    .eq('email', email)
    .maybeSingle()

  if (existingUserError) return jsonResponse({ success: false, error: existingUserError.message }, 500)
  if (existingUser) {
    return jsonResponse({
      success: false,
      error: existingUser.active ? 'Este e-mail já possui login ativo no sistema.' : 'Este e-mail já possui login pendente de aprovação.',
    }, 409)
  }

  const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      name: fullName,
      role,
      phone,
      store_id: store.id,
      must_change_password: true,
    },
  })

  if (createUserError || !createdUser.user) {
    return jsonResponse({ success: false, error: createUserError?.message || 'Não foi possível criar o login provisório.' }, 500)
  }

  const userId = createdUser.user.id
  let avatarUrl: string | null = null
  let avatarStoragePath: string | null = null

  try {
    const imageBytes = decodeBase64Image(avatarBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, ''))
    avatarStoragePath = `pre-cadastros/${store.id}/${userId}.${imageExtension(avatarMimeType)}`
    const { error: uploadError } = await adminClient.storage
      .from('pre-cadastro-avatares')
      .upload(avatarStoragePath, imageBytes, {
        contentType: avatarMimeType,
        upsert: true,
      })

    if (uploadError) throw uploadError
    const { data: publicUrlData } = adminClient.storage.from('pre-cadastro-avatares').getPublicUrl(avatarStoragePath)
    avatarUrl = publicUrlData.publicUrl
  } catch (err) {
    await cleanupPendingUser(adminClient, userId, store.id, avatarStoragePath)
    return jsonResponse({ success: false, error: err instanceof Error ? err.message : 'Não foi possível salvar a foto.' }, 500)
  }

  const { error: profileError } = await adminClient.from('usuarios').upsert({
    id: userId,
    email,
    name: fullName,
    phone,
    role,
    avatar_url: avatarUrl,
    active: false,
    must_change_password: true,
    is_venda_loja: role === 'vendedor',
  }, { onConflict: 'id' })

  if (profileError) {
    await cleanupPendingUser(adminClient, userId, store.id, avatarStoragePath)
    return jsonResponse({ success: false, error: profileError.message }, 500)
  }

  const { error: membershipError } = await adminClient.from('vinculos_loja').upsert({
    user_id: userId,
    store_id: store.id,
    role,
  }, { onConflict: 'user_id,store_id' })

  if (membershipError) {
    await cleanupPendingUser(adminClient, userId, store.id, avatarStoragePath)
    return jsonResponse({ success: false, error: membershipError.message }, 500)
  }

  const { data: preRegistration, error: insertError } = await adminClient
    .from('pre_cadastros_loja')
    .insert({
      store_id: store.id,
      store_name_snapshot: store.name,
      full_name: fullName,
      email,
      phone,
      role,
      segment,
      store_tenure: storeTenure,
      market_experience: marketExperience,
      notes: notes || null,
      auth_user_id: userId,
      avatar_url: avatarUrl,
      avatar_storage_path: avatarStoragePath,
      temporary_password: temporaryPassword,
      ip_address: clientIp(req),
      user_agent: req.headers.get('user-agent') || null,
    })
    .select('id')
    .single()

  if (insertError) {
    await cleanupPendingUser(adminClient, userId, store.id, avatarStoragePath)
    return jsonResponse({ success: false, error: insertError.message }, 500)
  }

  const { data: admins } = await adminClient
    .from('usuarios')
    .select('id')
    .in('role', ['administrador_geral', 'administrador_mx'])
    .eq('active', true)

  if (admins?.length) {
    const senderId = admins[0].id
    const link = `/lojas/${slugify(store.name)}?tab=equipe`
    await adminClient.from('notificacoes').insert(admins.map((admin: { id: string }) => ({
      recipient_id: admin.id,
      sender_id: senderId,
      store_id: store.id,
      target_type: 'admin',
      target_store_id: store.id,
      title: 'Novo login pendente',
      message: `${fullName} solicitou acesso como ${role} na loja ${store.name}. Valide a hierarquia antes de liberar.`,
      type: 'approval',
      priority: 'high',
      link,
      read: false,
    })))
  }

  return jsonResponse({
    success: true,
    pre_registration_id: preRegistration.id,
    login_email: email,
    temporary_password: temporaryPassword,
    status: 'pending_approval',
  })
})
