import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const apply = process.argv.includes('--apply')
const newPassword = process.env.MX_RESET_PASSWORD

if (!apply) {
    console.log('DRY-RUN: senha do admin nao sera alterada. Reexecute com --apply e MX_RESET_PASSWORD definido para aplicar.')
    process.exit(0)
}

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios.')
}

if (!newPassword || newPassword.length < 10) {
    throw new Error('MX_RESET_PASSWORD deve ser definido com pelo menos 10 caracteres.')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function resetAdmin() {
    const email = 'admin@mxgestaopreditiva.com.br'
    const authUsersResponse = await supabase.auth.admin.listUsers()
    const authUsers = (authUsersResponse.data?.users ?? []) as Array<{ id: string; email?: string | null }>
    const user = authUsers.find((u) => u.email === email)
    if (user) {
        console.log('Resetting admin...')
        const { error } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })
        console.log('Result:', error ? error.message : 'Success')
    }
}

resetAdmin().catch(console.error)
