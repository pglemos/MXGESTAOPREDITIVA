import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  const { data: users, error: usersError } = await supabase.from('users').select('id, name, email')
  
  const { data: checkins, error: checkinsError } = await supabase
    .from('daily_checkins')
    .select('id, seller_user_id, store_id, reference_date')
    .limit(10)
    
  if (checkinsError) {
    console.log(checkinsError)
    return
  }

  console.log('Sample checkins:', checkins)
  
  // Get counts of checkins per seller_user_id
  const { data: checkinCounts, error: countsError } = await supabase
    .rpc('get_checkins_count_by_seller') // If it exists. Else we will do it manually.
    
  if (countsError) {
      // Let's just group manually from a limited fetch
      const { data: allCheckins, error: allErr } = await supabase.from('daily_checkins').select('seller_user_id')
      const counts = {}
      for (const c of allCheckins) {
         counts[c.seller_user_id] = (counts[c.seller_user_id] || 0) + 1
      }
      
      console.log('Checkins count per user_id:')
      for (const [uid, count] of Object.entries(counts)) {
          const user = users.find(u => u.id === uid)
          console.log(`- ${uid} (${user ? user.name : 'Unknown User'}): ${count} checkins`)
      }
  }
}

run()
