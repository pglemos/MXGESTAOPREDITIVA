import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  console.log('--- INICIANDO VERIFICAÇÃO DE INTEGRIDADE ---\n')
  
  const testEmail = 'leandrorudolfo1@gmail.com'
  const testPassword = 'CRLGR2' // A senha que geramos para ele

  console.log(`1. Verificando cadastro de ${testEmail}...`)
  
  // A. Verifica Admin Auth
  const { data: authUsers, error: authError } = await adminSupabase.auth.admin.listUsers()
  if (authError) {
    console.error('❌ Erro ao listar usuários Auth:', authError.message)
  } else {
    const authUser = authUsers.users.find(u => u.email === testEmail)
    if (authUser) {
      console.log('✅ Usuário encontrado na tabela de Auth.')
    } else {
      console.error('❌ Usuário NÃO encontrado na tabela de Auth.')
    }
  }

  // B. Verifica public.users
  const { data: publicUser, error: publicError } = await adminSupabase
    .from('users')
    .select('*')
    .eq('email', testEmail)
    .single()

  if (publicError) {
    console.error('❌ Erro ao buscar usuário em public.users:', publicError.message)
  } else if (publicUser) {
    console.log(`✅ Usuário encontrado em public.users. Role: ${publicUser.role}`)
    if (!publicUser.store_id) {
       console.log('⚠️ Aviso: store_id está nulo em public.users (pode ser esperado se o sistema usa store_sellers exclusivamente).')
    } else {
       console.log(`✅ store_id em public.users: ${publicUser.store_id}`)
    }
  }

  // C. Verifica public.store_sellers
  if (publicUser) {
    const { data: storeSeller, error: ssError } = await adminSupabase
      .from('store_sellers')
      .select('*, stores(name)')
      .eq('seller_user_id', publicUser.id)
  
    if (ssError) {
      console.error('❌ Erro ao buscar em store_sellers:', ssError.message)
    } else if (storeSeller && storeSeller.length > 0) {
      console.log(`✅ Vínculo encontrado em store_sellers! Loja: ${storeSeller[0].stores?.name}`)
    } else {
      console.error('❌ Vínculo NÃO encontrado em store_sellers.')
    }
  }

  console.log('\n2. Simulando Login de Vendedor (Testando RLS)...')
  // Cria cliente anônimo (como o app faz)
  const clientSupabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data: loginData, error: loginError } = await clientSupabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  })

  if (loginError) {
    console.error('❌ Falha ao fazer login:', loginError.message)
  } else {
    console.log('✅ Login realizado com sucesso! Token JWT obtido.')
    
    // Testa leitura do próprio perfil
    const { data: myProfile, error: profileError } = await clientSupabase
      .from('users')
      .select('*')
      .eq('id', loginData.user.id)
      .single()
      
    if (profileError) {
       console.error('❌ Falha ao ler próprio perfil:', profileError.message)
    } else {
       console.log('✅ Leitura do próprio perfil feita com sucesso.')
    }

    // Testa leitura de lojas vinculadas
    const { data: myStores, error: myStoresError } = await clientSupabase
      .from('store_sellers')
      .select('stores(name)')
      .eq('seller_user_id', loginData.user.id)

    if (myStoresError) {
       console.error('❌ Falha ao ler lojas vinculadas (store_sellers):', myStoresError.message)
    } else {
       console.log(`✅ Leitura de lojas vinculadas feita com sucesso. Lojas encontradas: ${myStores.length}`)
    }
  }
  
  console.log('\n--- VERIFICAÇÃO CONCLUÍDA ---')
}

run()
