import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!)

async function checkRLS() {
    const { data, error } = await supabase.rpc('get_table_rls_info', { p_table_name: 'usuarios' })
    // If the RPC doesn't exist, we can't check this way.
    // Vamos tentar selecionar de usuarios com chave não service role, se houver.
    // But I only have the service role key.

    console.log('Checking usuarios table RLS...')
    const { data: users, error: err } = await supabase.from('usuarios').select('id').limit(1)
    console.log('Query result:', users, err)
}

// Since I can't easily check RLS without a standard user token,
// I will instead create a migration to ENSURE usuarios table has RLS and correct policies.

checkRLS()
