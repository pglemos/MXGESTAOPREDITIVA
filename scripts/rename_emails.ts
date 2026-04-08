import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!)

async function renameEmails() {
    console.log('--- RENAMING EMAILS TO mxperformance.com.br ---')
    
    // 1. Get all auth users
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    if (!authUsers) return

    for (const u of authUsers.users) {
        if (u.email && u.email.endsWith('@mxgestaopreditiva.com.br')) {
            const newEmail = u.email.replace('@mxgestaopreditiva.com.br', '@mxperformance.com.br')
            console.log(`Renaming ${u.email} -> ${newEmail}`)
            
            // 2. Update Auth email
            const { error: authError } = await supabase.auth.admin.updateUserById(u.id, { email: newEmail })
            if (authError) console.error('Error renaming auth user:', authError)
            
            // 3. Update public.users record
            const { error: userError } = await supabase.from('users').update({ email: newEmail }).eq('id', u.id)
            if (userError) console.error('Error renaming public user:', userError)
        }
    }
    console.log('Renaming complete.')
}

renameEmails().catch(console.error)
