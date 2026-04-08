import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!)

const LOGINS = [
    'admin@mxperformance.com.br',
    'dono@mxperformance.com.br',
    'gerente@mxperformance.com.br',
    'vendedor@mxperformance.com.br'
]
const NEW_PASSWORD = 'Mx#2026!'

async function resetPasswords() {
    console.log('--- Force Resetting Passwords for @mxperformance.com.br ---')
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    
    for (const email of LOGINS) {
        const user = authUsers?.users.find(u => u.email === email)
        if (user) {
            console.log(`Resetting password for ${email} (ID: ${user.id})...`)
            const { error } = await supabase.auth.admin.updateUserById(user.id, {
                password: NEW_PASSWORD,
                email_confirm: true
            })
            if (error) console.error(`Error resetting ${email}:`, error.message)
            else console.log(`Successfully reset ${email}`)
        } else {
            console.warn(`User ${email} not found in Auth. Creating...`)
            const { error: createError } = await supabase.auth.admin.createUser({
                email,
                password: NEW_PASSWORD,
                email_confirm: true
            })
            if (createError) console.error(`Error creating ${email}:`, createError.message)
            else console.log(`Successfully created ${email}`)
        }
    }
}

resetPasswords().catch(console.error)
