import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  const { data: users, error } = await supabase.from('users').select('name, email, role').order('role')
  if (error) { console.log(error); return; }
  console.log(users.map(u => u.role + ': ' + u.name + ' - ' + u.email))
}

run()
