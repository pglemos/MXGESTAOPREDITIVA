import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const managerEmails = [
    'luzdirecaoconsultoria@gmail.com',
    'danieljsvendas@gmail.com',
    'caiio.ce@hotmail.com',
    'anderson.c.evangelista@hotmail.com',
    'davi@lialveiculos.com.br',
    'jessica@lialveiculos.com.br',
    'gabrieldcsamp@gmail.com',
    'goncalvesleitevinicius@gmail.com',
    'igor.r97@hotmail.com',
    'gabrieldepaula337@gmail.com',
    'iago_rm@hotmail.com',
    'adm@piscarveiculos.com.br'
  ]

  console.log('--- CREATING MANAGER ACCOUNTS ---\n')

  for (const email of managerEmails) {
    console.log(`Processing manager: ${email}`)
    
    // Check if auth user exists
    const { data: listData } = await supabase.auth.admin.listUsers()
    const existingAuth = listData?.users?.find(u => u.email === email)
    
    let userId
    if (existingAuth) {
      userId = existingAuth.id
      console.log(`  - Auth user already exists: ${userId}`)
    } else {
      const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'MX@' + Math.random().toString(36).substring(7).toUpperCase(),
        email_confirm: true,
        user_metadata: { role: 'manager' }
      })
      
      if (authError) {
        console.error(`  ! Error creating auth user ${email}: ${authError.message}`)
        continue
      }
      userId = newUser.user.id
      console.log(`  - Auth user created: ${userId}`)
    }
    
    // Upsert public.users record
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email,
        name: email.split('@')[0].toUpperCase().replace('.', ' '),
        role: 'manager',
        active: true
      })
      
    if (upsertError) {
      console.error(`  ! Error upserting public user ${email}: ${upsertError.message}`)
    } else {
      console.log(`  - Public user profile synced.`)
    }
  }
}

run()
