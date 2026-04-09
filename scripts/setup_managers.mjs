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

const managerMappings = [
  { store: 'BROTHERS CAR', email: 'caiio.ce@hotmail.com', name: 'CAIIO' },
  { store: 'BROTHERS CAR', email: 'anderson.c.evangelista@hotmail.com', name: 'ANDERSON' },
  { store: 'LIAL VEICULOS', email: 'davi@lialveiculos.com.br', name: 'DAVI' },
  { store: 'LIAL VEICULOS', email: 'jessica@lialveiculos.com.br', name: 'JESSICA' },
  { store: 'PISCAR VEICULOS', email: 'gabrieldcsamp@gmail.com', name: 'GABRIEL DUARTE' },
  { store: 'PISCAR VEICULOS', email: 'goncalvesleitevinicius@gmail.com', name: 'VINICIUS' },
  { store: 'PISCAR VEICULOS', email: 'igor.r97@hotmail.com', name: 'IGOR' },
  { store: 'PISCAR VEICULOS', email: 'gabrieldepaula337@gmail.com', name: 'GABRIEL DE PAULA' },
  { store: 'PISCAR VEICULOS', email: 'iago_rm@hotmail.com', name: 'IAGO' },
  { store: 'PISCAR VEICULOS', email: 'adm@piscarveiculos.com.br', name: 'ADM PISCAR' },
  { store: 'PAAY MOTORS', email: 'paaymotors@gmail.com', name: 'PAAY ADMIN' },
  { store: 'SEMINOVOS BHZ', email: 'vendasbhz3@gmail.com', name: 'VENDAS BHZ' },
  { store: 'SEMINOVOS BHZ', email: 'agenciaseminovosbhz@gmail.com', name: 'AGENCIA BHZ' },
  { store: 'SEMINOVOS BHZ', email: 'washington2610@icloud.com', name: 'WASHINGTON' },
  { store: 'ACERTTCAR', email: 'brunohenriqueemi@gmail.com', name: 'BRUNO HENRIQUE' },
  { store: 'ACERTTCAR', email: 'acerttcar@gmail.com', name: 'ACERTTCAR ADMIN' },
  { store: 'RK2 MOTORS', email: 'marcelohnogueira@yahoo.com.br', name: 'MARCELO' },
  { store: 'RK2 MOTORS', email: 'valmir.jjnunes@gmail.com', name: 'VALMIR' },
  { store: 'RK2 MOTORS', email: 'tavinhobh2@hotmail.com', name: 'TAVINHO' },
  { store: 'RK2 MOTORS', email: 'isabellaxpratique@gmail.com', name: 'ISABELLA' },
  { store: 'RK2 MOTORS', email: 'Thiagodpaul10@gmail.com', name: 'THIAGO' },
  { store: 'GANDINI AUTOMOVEIS', email: 'regandini@gmail.com', name: 'REGANDINI' },
  { store: 'GANDINI AUTOMOVEIS', email: 'gandini.antonio@gmail.com', name: 'ANTONIO GANDINI' },
  { store: 'ESPINDOLA AUTOMOVEIS', email: 'espindolacarros@gmail.com', name: 'ESPINDOLA ADMIN' },
  { store: 'DNA VEICULOS', email: 'mr.rodrigo@outlook.com.br', name: 'RODRIGO' },
  { store: 'DNA VEICULOS', email: 'pedrosantana784a@gmail.com', name: 'PEDRO SANTANA' },
  { store: 'DNA VEICULOS', email: 'theomorato77@gmail.com', name: 'THEO MORATO' },
  { store: 'DNA VEICULOS', email: 'leiladias85@icloud.com', name: 'LEILA DIAS' },
  { store: 'MX PERFORMANCE', email: 'luzdirecaoconsultoria@gmail.com', name: 'LUZ DIRECAO' },
  { store: 'MX PERFORMANCE', email: 'danieljsvendas@gmail.com', name: 'DANIEL JS' }
]

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

const sleep = (ms) => new Map().set('t', setTimeout(() => {}, ms)) && new Promise(resolve => setTimeout(resolve, ms))

async function run() {
  console.log('--- PROCESSANDO CREDENCIAIS DE GERENTES (MODO ROBUSTO) ---\n')
  
  const { data: storesDB } = await supabase.from('stores').select('id, name')
  const storeMap = new Map()
  storesDB?.forEach(s => storeMap.set(s.name.toUpperCase().trim(), s.id))

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error('Error listing users:', listError.message)
    return
  }
  const allAuthUsers = listData.users

  const results = []

  for (const m of managerMappings) {
    try {
      const password = generatePassword()
      const emailLower = m.email.toLowerCase().trim()
      
      console.log(`Processing: ${m.name} (${emailLower})...`)

      const existingAuth = allAuthUsers.find(u => u.email === emailLower)
      
      let userId
      if (existingAuth) {
        userId = existingAuth.id
        await supabase.auth.admin.updateUserById(userId, { password })
      } else {
        const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
          email: emailLower,
          password: password,
          email_confirm: true,
          user_metadata: { name: m.name, role: 'manager' }
        })
        if (authError) throw new Error(authError.message)
        userId = newUser.user.id
      }

      const role = (m.store === 'MX PERFORMANCE') ? 'admin' : 'manager'
      const storeId = storeMap.get(m.store.toUpperCase())

      await supabase.from('users').upsert({
        id: userId,
        email: emailLower,
        name: m.name,
        role: role,
        active: true
      })

      if (storeId) {
         await supabase.from('store_sellers').upsert({
           store_id: storeId,
           seller_user_id: userId,
           is_active: true
         }, { onConflict: 'store_id,seller_user_id' })
      }

      results.push({
        nome: m.name,
        loja: m.store,
        email: emailLower,
        senha: password
      })
      
      console.log(`  - OK`)
      await sleep(200) // Small delay to avoid ECONNRESET
    } catch (e) {
      console.error(`  ! Error: ${e.message}`)
    }
  }

  console.log('\n--- LISTA FINAL DE GERENTES ---\n')
  results.forEach(r => {
    console.log(`${r.nome} | ${r.loja} | ${r.email} | ${r.senha}`)
  })
}

run()
