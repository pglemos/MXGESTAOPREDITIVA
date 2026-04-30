import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!)

async function checkMemberships() {
    console.log('--- Checking vinculos_loja ---')
    const { data: users, error: userErr } = await supabase.from('usuarios').select('id, email, name')
    if (userErr) console.error('Users error:', userErr)

    const { data: vinculos_loja, error: memErr } = await supabase.from('vinculos_loja').select('*, store:lojas(name)')
    if (memErr) console.error('Memberships error:', memErr)

    console.log('\nUsers found:', users?.length)
    console.table(users)

    console.log('Memberships found:', vinculos_loja?.length)
    if (vinculos_loja) {
        console.table(vinculos_loja.map(m => ({
            user_id: m.user_id,
            store: (m as any).store?.name,
            role: m.role
        })))
    }
}

checkMemberships().catch(console.error)
