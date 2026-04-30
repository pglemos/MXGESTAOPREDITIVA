import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!)

async function debugStores() {
    console.log('--- DEBUG STORES ---')
    const { data, error } = await supabase.from('lojas').select('*')
    if (error) console.error('Error:', error)
    else console.log('Stores found:', data?.length, data)
}

debugStores().catch(console.error)
