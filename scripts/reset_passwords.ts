import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '../src/lib/auth/passwordPolicy'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const apply = process.argv.includes('--apply')
const newPassword = process.env.MX_RESET_PASSWORD

if (!apply) {
    console.log('DRY-RUN: nenhuma senha sera alterada. Reexecute com --apply e MX_RESET_PASSWORD definido para aplicar.')
    process.exit(0)
}

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios.')
}

if (!newPassword || !isStrongPassword(newPassword)) {
    throw new Error(PASSWORD_POLICY_MESSAGE)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

const LOGINS = [
    'admin@mxgestaopreditiva.com.br',
    'dono@mxgestaopreditiva.com.br',
    'gerente@mxgestaopreditiva.com.br',
    'vendedor@mxgestaopreditiva.com.br'
]

async function resetPasswords() {
    console.log('--- Resetting Passwords ---')
    const authUsersResponse = await supabase.auth.admin.listUsers()
    const authUsers = (authUsersResponse.data?.users ?? []) as Array<{ id: string; email?: string | null }>

    for (const email of LOGINS) {
        const user = authUsers.find((u) => u.email === email)
        if (user) {
            console.log(`Resetting password for ${email} (ID: ${user.id})...`)
            const { error } = await supabase.auth.admin.updateUserById(user.id, {
                password: newPassword
            })
            if (error) console.error(`Error resetting ${email}:`, error.message)
            else console.log(`Successfully reset ${email}`)
        } else {
            console.warn(`User ${email} not found in Auth.`)
        }
    }
}

resetPasswords().catch(console.error)
