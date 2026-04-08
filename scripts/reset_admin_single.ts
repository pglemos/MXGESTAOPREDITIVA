import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!)

async function resetAdmin() {
    const email = 'admin@mxgestaopreditiva.com.br'
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const user = authUsers?.users.find(u => u.email === email)
    if (user) {
        console.log('Resetting admin...')
        const { error } = await supabase.auth.admin.updateUserById(user.id, { password: 'Mx#2026!' })
        console.log('Result:', error ? error.message : 'Success')
    }
}

resetAdmin().catch(console.error)
