import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function getEmail() {
    const { data: users } = await supabase.auth.admin.listUsers()
    const user = users?.users.find(u => u.id === '51633d5e-9d0c-44fa-a6a0-df50e871f0cc')
    console.log(user?.email)
}
getEmail()
