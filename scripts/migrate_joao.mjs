import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
    const newEmail = 'joaodanielvdhf@gmail.com'
    const oldName = 'JOAO'
    
    const { data: users } = await supabase.from('users').select('*')
    const newRecord = users.find(u => u.email === newEmail)
    const oldRecord = users.find(u => u.name === oldName && u.id !== newRecord?.id)
    
    if (newRecord && oldRecord) {
        const newId = newRecord.id
        const oldId = oldRecord.id
        console.log(`Migrating data for ${newEmail} from old ID ${oldId} (${oldRecord.name}) to new ID ${newId}`)
        
        const tablesWithSellerUserId = ['daily_checkins', 'store_sellers']
        const tablesWithSellerId = ['pdis', 'feedbacks']
        
        for (const table of tablesWithSellerUserId) {
            if (table === 'store_sellers') {
                await supabase.from('store_sellers').delete().eq('seller_user_id', newId)
            }
            await supabase.from(table).update({ seller_user_id: newId }).eq('seller_user_id', oldId)
            console.log(`  - Migrated ${table}`)
        }
        
        for (const table of tablesWithSellerId) {
            await supabase.from(table).update({ seller_id: newId }).eq('seller_id', oldId)
            console.log(`  - Migrated ${table}`)
        }
        
        await supabase.from('rankings').update({ user_id: newId }).eq('user_id', oldId)
        console.log('  - Migrated rankings')
    } else {
        console.log('Could not find records for Joao migration.')
    }
}

run()
