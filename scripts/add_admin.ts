import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
    const { data: user, error } = await supabase.auth.admin.createUser({
        email: 'admin@mxperformance.com.br',
        password: 'Mx#2026!',
        email_confirm: true,
        user_metadata: { name: 'Admin MX' }
    })
    
    if (user) {
        await supabase.from('users').upsert({
            id: user.user?.id,
            name: 'Admin MX',
            email: 'admin@mxperformance.com.br',
            role: 'admin'
        })
        console.log('Admin created successfully.')
    } else {
        console.log('Error creating admin:', error?.message)
    }
}
run()
