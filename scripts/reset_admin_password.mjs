import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  const email = 'admin@mxperformance.com.br'
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    
  if (fetchError || !users || users.length === 0) {
    console.error(`Erro ao encontrar o usuário ${email}:`, fetchError?.message || 'Não encontrado')
    return
  }
  
  const userId = users[0].id
  const newPassword = 'AdminPassword123!'
  
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  )
  
  if (updateError) {
    console.error(`Erro ao atualizar senha de ${email}:`, updateError.message)
    return
  }
  
  console.log(`Senha do admin atualizada para: ${newPassword}`)
}

run()
