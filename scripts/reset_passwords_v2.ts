import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!)

const LOGINS = [
    'admin@mxgestaopreditiva.com.br',
    'dono@mxgestaopreditiva.com.br',
    'gerente@mxgestaopreditiva.com.br',
    'vendedor@mxgestaopreditiva.com.br'
]
const NEW_PASSWORD = 'Mx#2026!'

async function resetPasswords() {
    console.log('--- Resetting Passwords ---')
    
    for (const email of LOGINS) {
        try {
            console.log(`Searching for ${email}...`)
            const { data: userData, error: listError } = await supabase.auth.admin.listUsers()
            if (listError) throw listError
            
            const user = userData?.users.find(u => u.email === email)
            if (user) {
                console.log(`Resetting ${email}...`)
                const { error } = await supabase.auth.admin.updateUserById(user.id, {
                    password: NEW_PASSWORD
                })
                if (error) console.error(`Error resetting ${email}:`, error.message)
                else console.log(`Successfully reset ${email}`)
            } else {
                console.warn(`${email} not found.`)
            }
        } catch (err: any) {
            console.error(`Fatal error for ${email}:`, err.message)
        }
    }
}

resetPasswords().catch(console.error)
