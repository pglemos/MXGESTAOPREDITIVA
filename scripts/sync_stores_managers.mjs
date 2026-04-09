import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  const storesToUpdate = JSON.parse(fs.readFileSync('stores_to_update.json', 'utf8'))
  const { data: storesDB } = await supabase.from('stores').select('*')
  
  for (const store of storesToUpdate) {
     const dbStore = storesDB.find(s => s.name.toUpperCase() === store.name.toUpperCase())
     if (dbStore) {
        console.log(`Updating store ${dbStore.name} with manager_email: ${store.manager_email}`)
        const { error } = await supabase
           .from('stores')
           .update({ manager_email: store.manager_email })
           .eq('id', dbStore.id)
           
        if (error) {
           console.error(`Error updating store ${dbStore.name}: ${error.message}`)
        }
     } else {
        console.warn(`Store ${store.name} not found in database.`)
     }
  }
}

run()
