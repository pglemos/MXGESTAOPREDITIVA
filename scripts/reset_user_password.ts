#!/usr/bin/env tsx
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import { generateStrongTemporaryPassword, isStrongPassword, PASSWORD_POLICY_MESSAGE } from '../src/lib/auth/passwordPolicy'

loadEnv()

function readArg(name: string) {
  const index = process.argv.indexOf(name)
  if (index === -1) return null
  return process.argv[index + 1] || null
}

const apply = process.argv.includes('--apply')
const generate = process.argv.includes('--generate')
const email = (readArg('--email') || process.env.MX_RESET_EMAIL || '').trim().toLowerCase()
const providedPassword = readArg('--password') || process.env.MX_RESET_PASSWORD || ''
const password = generate ? generateStrongTemporaryPassword() : providedPassword
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!email) {
  throw new Error('Informe --email ou MX_RESET_EMAIL.')
}

if (!generate && !providedPassword) {
  throw new Error('Informe --password, MX_RESET_PASSWORD ou use --generate.')
}

if (!isStrongPassword(password)) {
  throw new Error(PASSWORD_POLICY_MESSAGE)
}

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL/VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios.')
}

async function findAuthUserByEmail(admin: SupabaseClient, targetEmail: string) {
  let page = 1
  const perPage = 1000

  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const found = data.users.find((user) => (user.email || '').toLowerCase() === targetEmail)
    if (found) return found
    if (data.users.length < perPage) return null
    page += 1
  }

  return null
}

async function main() {
  const admin = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const authUser = await findAuthUserByEmail(admin, email)
  if (!authUser) throw new Error(`Usuario Auth nao encontrado para ${email}.`)

  const { data: profile, error: profileError } = await admin
    .from('usuarios')
    .select('id, email, name, role, active, must_change_password')
    .eq('id', authUser.id)
    .maybeSingle()

  if (profileError) throw profileError
  if (!profile) throw new Error(`Perfil operacional nao encontrado em usuarios para ${email}.`)

  if (!apply) {
    console.log(`DRY-RUN: resetaria ${email}, confirmaria e-mail e marcaria must_change_password=true.`)
    console.log('Reexecute com --apply para aplicar.')
    return
  }

  const { error: authError } = await admin.auth.admin.updateUserById(authUser.id, {
    password,
    email_confirm: true,
    user_metadata: {
      ...(authUser.user_metadata || {}),
      must_change_password: true,
    },
  })
  if (authError) throw authError

  const { error: updateProfileError } = await admin
    .from('usuarios')
    .update({
      active: true,
      must_change_password: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', authUser.id)
  if (updateProfileError) throw updateProfileError

  if (anonKey) {
    const anon = createClient(supabaseUrl!, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error: signInError } = await anon.auth.signInWithPassword({ email, password })
    if (signInError) throw new Error(`Senha gravada, mas validacao de login falhou: ${signInError.message}`)
    await anon.auth.signOut()
  }

  console.log(`Senha redefinida e validada para ${email}. must_change_password=true.`)
  if (generate) {
    console.log(`Senha temporaria gerada: ${password}`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
