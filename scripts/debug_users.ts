import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Error: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function checkUsers() {
    console.log('--- Checking public.usuarios ---')
    const { data: users, error: userError } = await supabase.from('usuarios').select('*')
    if (userError) console.error('Error fetching usuarios', userError)
    else console.table(users)

    console.log('\n--- Checking auth.users via admin API ---')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) console.error('Error fetching auth.users', authError)
    else {
        console.table(authUsers.users.map(u => ({ id: u.id, email: u.email, last_login: u.last_sign_in_at })))
    }
}

checkUsers().catch(console.error)
