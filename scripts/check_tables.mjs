import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  const { data, error } = await supabase.rpc('get_tables_names')
  
  if (error) {
    console.log('Cant use RPC. Trying to query typical tables: checkins, leads, agendamentos, vendas, diarias')
    
    const tables = ['checkins', 'leads', 'vendas', 'atendimentos', 'diarias']
    for (const table of tables) {
       const { data: tbData, error: tbError } = await supabase.from(table).select('*').limit(1)
       if (!tbError) {
         console.log(`Table '${table}' exists.`)
       }
    }
  } else {
    console.log(data)
  }
}

run()
