import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  const { data: users, error } = await supabase.from('users').select('*')
  
  const groups = {
     admin: users.filter(u => u.role === 'admin' || u.role === 'master' || u.role === 'admin_mx'),
     manager: users.filter(u => u.role === 'manager' || u.role === 'gerente' || u.role === 'supervisor'),
     owner: users.filter(u => u.role === 'owner' || u.role === 'dono' || u.role === 'diretor'),
     vendedor: users.filter(u => u.role === 'vendedor')
  }
  
  console.log(`Admins: ${groups.admin.length}`, groups.admin.map(u => ({ name: u.name, email: u.email, role: u.role, store: u.store_id })))
  console.log(`Managers: ${groups.manager.length}`, groups.manager.map(u => ({ name: u.name, email: u.email, role: u.role, store: u.store_id })))
  console.log(`Owners: ${groups.owner.length}`, groups.owner.map(u => ({ name: u.name, email: u.email, role: u.role, store: u.store_id })))
  
  const { data: stores } = await supabase.from('stores').select('*')
  console.log('Stores:')
  stores.forEach(s => {
      console.log(`- ${s.name} (manager_email: ${s.manager_email})`)
  })
}

run()
