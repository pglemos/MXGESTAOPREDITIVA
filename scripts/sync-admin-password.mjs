import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function resetAdminPassword() {
  console.log('🔄 Resetando senha do admin localmente...')
  
  const email = 'admin@mxperformance.com.br'
  const newPassword = 'Jose20161@'

  // Buscar ID do usuário pelo email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error('Erro ao listar usuários:', listError)
    return
  }

  const user = users.find(u => u.email === email)
  
  if (!user) {
    console.log('❌ Usuário não encontrado no Auth do Supabase.')
    return
  }

  console.log(`Usuário encontrado: ${user.id}`)

  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  )

  if (error) {
    console.error('❌ Erro ao atualizar senha:', error.message)
  } else {
    console.log('✅ Senha do admin sincronizada com sucesso para: Jose20161@')
  }
}

resetAdminPassword()
