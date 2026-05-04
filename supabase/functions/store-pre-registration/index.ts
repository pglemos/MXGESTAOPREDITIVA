// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

const allowedRoles = ['dono', 'gerente', 'vendedor']

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

  if (!storeId || !fullName || !email || !phone || !role || !segment || !storeTenure || !marketExperience) {
    return jsonResponse({ success: false, error: 'Preencha todos os campos obrigatórios.' }, 400)
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ success: false, error: 'E-mail inválido.' }, 400)
  }

  if (!allowedRoles.includes(role)) {
    return jsonResponse({ success: false, error: 'Papel inválido.' }, 400)
  }

  const { data: store, error: storeError } = await adminClient
    .from('lojas')
    .select('id, name, active')
    .eq('id', storeId)
    .eq('active', true)
    .maybeSingle()

  if (storeError) return jsonResponse({ success: false, error: storeError.message }, 500)
  if (!store) return jsonResponse({ success: false, error: 'Loja não localizada ou inativa.' }, 404)

  const { error: insertError } = await adminClient
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
      ip_address: clientIp(req),
      user_agent: req.headers.get('user-agent') || null,
    })

  if (insertError) return jsonResponse({ success: false, error: insertError.message }, 500)

  return jsonResponse({ success: true })
})
