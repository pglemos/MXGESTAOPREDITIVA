#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const [k, ...rest] = l.split('=')
      return [k.trim(), rest.join('=').trim().replace(/^["']|["']$/g, '')]
    })
)

const SUPABASE_URL = env.VITE_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const ADMINS = [
  { name: 'Gedson Freire', email: 'gedson.freire.localiza@gmail.com', role: 'admin' },
  { name: 'João Augusto Câmara', email: 'camarajoaoaugusto@gmail.com', role: 'admin' },
  { name: 'Mariane', email: 'marianedcs@gmail.com', role: 'admin' },
]

const DEFAULT_PASSWORD = 'Mx@2026*'

async function upsertAdmin({ name, email, role }) {
  const { data: list, error: listErr } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (listErr) throw listErr
  const existing = list.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

  let userId
  if (existing) {
    userId = existing.id
    const { error: updErr } = await sb.auth.admin.updateUserById(userId, {
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { name, role },
    })
    if (updErr) throw updErr
    console.log(`✓ Updated auth user ${email} (${userId})`)
  } else {
    const { data: created, error: createErr } = await sb.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { name, role },
    })
    if (createErr) throw createErr
    userId = created.user.id
    console.log(`✓ Created auth user ${email} (${userId})`)
  }

  const { error: profileErr } = await sb
    .from('users')
    .upsert(
      {
        id: userId,
        email,
        name,
        role,
        active: true,
      },
      { onConflict: 'id' }
    )
  if (profileErr) throw profileErr
  console.log(`  ↳ public.users row upserted`)
}

;(async () => {
  for (const admin of ADMINS) {
    try {
      await upsertAdmin(admin)
    } catch (err) {
      console.error(`✗ Failed for ${admin.email}:`, err.message)
    }
  }
  console.log('\nSeed complete.')
})()
