import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import * as fs from 'fs'
dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function exportData() {
    const { data: stores } = await supabase.from('stores').select('name')
    const { data: sellers } = await supabase.from('users').select('name, email')
    fs.writeFileSync('stores_db.json', JSON.stringify(stores, null, 2))
    fs.writeFileSync('sellers_db.json', JSON.stringify(sellers, null, 2))
}
exportData()
