import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  console.log('--- AUDITORIA DE DUPLICATAS ---\n')
  
  const { data, error } = await supabase.from('daily_checkins').select('id, seller_user_id, user_id, reference_date, date, store_id')
  
  if (error) {
    console.error(error)
    return
  }

  const map = new Map()
  const duplicates = []

  for (const c of data) {
    const key = `${c.seller_user_id || c.user_id}:${c.reference_date || c.date}:${c.store_id}`
    if (map.has(key)) {
      duplicates.push({ original: map.get(key), duplicate: c })
    } else {
      map.set(key, c)
    }
  }

  console.log(`Total de registros: ${data.length}`)
  console.log(`Total de duplicados detectados: ${duplicates.length}`)

  if (duplicates.length > 0) {
    console.log('\nExemplos de duplicados (IDs):')
    duplicates.slice(0, 10).forEach(d => {
      console.log(`- ${d.original.id} vs ${d.duplicate.id} [Date: ${d.original.reference_date}]`)
    })
  }
  
  // Check for records with mismatched user_id and seller_user_id
  const mismatches = data.filter(c => c.user_id && c.seller_user_id && c.user_id !== c.seller_user_id)
  console.log(`\nRegistros com user_id != seller_user_id: ${mismatches.length}`)
  if (mismatches.length > 0) {
      console.log('Exemplos de mismatch:')
      mismatches.slice(0, 5).forEach(m => console.log(`- ID: ${m.id}, UserID: ${m.user_id}, SellerUserID: ${m.seller_user_id}`))
  }
}

run()
