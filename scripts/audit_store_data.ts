import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env') })
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function auditStores() {
    const { data: stores } = await supabase.from('stores').select('id, name')
    for (const store of stores || []) {
        const { data: stats } = await supabase
            .from('view_store_daily_production')
            .select('*')
            .eq('store_id', store.id)
            .order('reference_date', { ascending: false })
            .limit(1)
        console.log(`LOJA: ${store.name} | DADOS: ${JSON.stringify(stats)}`)
    }
}
auditStores()
