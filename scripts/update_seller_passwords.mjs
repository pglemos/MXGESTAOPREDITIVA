import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sellersData = `
LEANDRO	ESPINDOLA AUTOMOVEIS	CONSULTOR DE VENDAS	leandrorudolfo1@gmail.com
DAVID RADES	ESPINDOLA AUTOMOVEIS	CONSULTOR DE VENDAS	davidgundam081@gmail.com
RYAN FELIPE ANDRADE	GANDINI AUTOMOVEIS	CONSULTOR DE VENDAS	feliperyan00@gmail.com
EVERTON LUIZ DA SILVA	GANDINI AUTOMOVEIS	CONSULTOR DE VENDAS	evertonmitoyo@hotmail.com
LUIZ HENRIQUE	GANDINI AUTOMOVEIS	CONSULTOR DE VENDAS	henriqueavilaconsultor@outlook.com
NATHAN ALVES CHAGAS	GANDINI AUTOMOVEIS	CONSULTOR DE VENDAS	nathan.alveschagas@yahoo.com
BRUNO SANTOS	LIAL VEICULOS	CONSULTOR DE VENDAS	gestaobrunosantos@gmail.com
DIELLE	LIAL VEICULOS	CONSULTOR DE VENDAS	Loja35114255@gmail.com 
JOÃO DANIEL VON DER HEIDE FREITAS	LIAL VEICULOS	CONSULTOR DE VENDAS	joaodanielvdhf@gmail.com
JAMES OLIVEIRA THOMAS	PAAY MOTORS	CONSULTOR DE VENDAS	jamesthomasolv@gmail.com
GUILHERME DUARTE CARDOSO SAMPAIO	PISCAR VEICULOS	CONSULTOR DE VENDAS	guilhermeduartesamp@gmail.com
EMERSON	RK2 MOTORS	CONSULTOR DE VENDAS	emersonnantonnio@hotmail.com
ANTÔNIO PEREIRA DA SILVA NETO	DNA VEICULOS 	CONSULTOR DE VENDAS	approntaresposta@gmail.com
CRISTINA	DNA VEICULOS 	CONSULTOR DE VENDAS	cristinacarmodesouza83@gmail.com
`.trim().split('\n')

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let password = ''
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

async function run() {
  console.log('--- CREDENCIAIS DOS VENDEDORES ---\\n')
  
  for (const line of sellersData) {
    const parts = line.split('\t').map(p => p.trim())
    if (parts.length < 4) continue
    
    const [name, storeNameRaw, role, email] = parts
    const emailLower = email.toLowerCase()

    // 1. Encontrar o usuário no public.users para pegar o ID
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', emailLower)
      
    if (fetchError || !users || users.length === 0) {
      console.error(`Erro ao encontrar o usuário ${emailLower}:`, fetchError?.message || 'Não encontrado')
      continue
    }
    
    const userId = users[0].id
    const newPassword = generatePassword()
    
    // 2. Atualizar a senha via Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )
    
    if (updateError) {
      console.error(`Erro ao atualizar senha de ${emailLower}:`, updateError.message)
      continue
    }
    
    console.log(`Nome:  ${name}`)
    console.log(`Loja:  ${storeNameRaw}`)
    console.log(`Email: ${emailLower}`)
    console.log(`Senha: ${newPassword}`)
    console.log('-----------------------------------')
  }
}

run()
