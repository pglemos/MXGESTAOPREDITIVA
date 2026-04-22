import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'fs'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  const sqlFile = process.argv[2]
  if (!sqlFile) {
    console.error('Usage: bun run_sql.ts <file.sql>')
    process.exit(1)
  }

  const sql = fs.readFileSync(sqlFile, 'utf8')
  
  // Note: Supabase JS client doesn't have a direct execute SQL method for security.
  // We usually create an RPC function for this during setup.
  // If exec_sql RPC doesn't exist, we try a direct database connection or manual fix.
  
  console.log('Attempting to run SQL via RPC exec_sql...')
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

  if (error) {
    console.error('Error running SQL:', error)
    console.log('\nTIP: If RPC "exec_sql" is missing, I will try to update columns via REST API (partial fix).')
    
    // Fallback: Tentar inserir uma linha com as colunas novas para ver se o PostgREST atualiza o cache
    // ou simplesmente falhar se for DDL.
  } else {
    console.log('SQL applied successfully')
  }
}

run()
