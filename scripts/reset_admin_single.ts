import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '../src/lib/auth/passwordPolicy'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const apply = process.argv.includes('--apply')
const newPassword = process.env.MX_RESET_PASSWORD
const resetEmail = process.env.MX_RESET_EMAIL || 'admin@mxgestaopreditiva.com.br'

if (!apply) {
    console.log('DRY-RUN: senha do admin nao sera alterada. Reexecute com --apply e MX_RESET_PASSWORD definido para aplicar.')
    process.exit(0)
}

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios.')
}

if (!newPassword || !isStrongPassword(newPassword)) {
    throw new Error(PASSWORD_POLICY_MESSAGE)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function resetAdmin() {
    const email = resetEmail.trim().toLowerCase()
    const authUsersResponse = await supabase.auth.admin.listUsers()
    const authUsers = (authUsersResponse.data?.users ?? []) as Array<{ id: string; email?: string | null; user_metadata?: Record<string, unknown> }>
    const user = authUsers.find((u) => u.email === email)
    if (user) {
        console.log(`Resetting ${email}...`)
        const { error } = await supabase.auth.admin.updateUserById(user.id, {
            password: newPassword,
            email_confirm: true,
            user_metadata: {
                ...(user.user_metadata || {}),
                must_change_password: true,
            },
        })
        if (!error) {
            const { error: profileError } = await supabase
                .from('usuarios')
                .update({ active: true, must_change_password: true, updated_at: new Date().toISOString() })
                .eq('id', user.id)
            if (profileError) console.error('Profile update error:', profileError.message)
        }
        console.log('Result:', error ? error.message : 'Success')
    } else {
        console.warn(`User ${email} not found in Auth.`)
    }
}

resetAdmin().catch(console.error)
