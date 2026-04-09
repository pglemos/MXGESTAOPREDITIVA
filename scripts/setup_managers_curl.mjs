import { execSync } from 'child_process'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

function runCurl(method, path, body = null) {
  const url = `${supabaseUrl}${path}`
  let cmd = `curl -s -X ${method} "${url}" -H "apikey: ${serviceKey}" -H "Authorization: Bearer ${serviceKey}"`
  if (body) {
    cmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(body)}'`
  }
  const out = execSync(cmd).toString()
  try {
    return JSON.parse(out)
  } catch (e) {
    return out
  }
}

async function run() {
  console.log('--- SETUP GERENTES VIA CURL ---\n')
  
  const stores = runCurl('GET', '/rest/v1/stores?select=id,name')
  const storeMap = new Map()
  stores.forEach(s => storeMap.set(s.name.toUpperCase().trim(), s.id))

  const authData = runCurl('GET', '/auth/v1/admin/users')
  const allAuthUsers = authData.users || []

  const results = []

  for (const m of managerMappings) {
    const password = generatePassword()
    const emailLower = m.email.toLowerCase().trim()
    console.log(`Processing ${m.name}...`)

    const existing = allAuthUsers.find(u => u.email === emailLower)
    let userId

    if (existing) {
      userId = existing.id
      runCurl('PUT', `/auth/v1/admin/users/${userId}`, { password })
    } else {
      const res = runCurl('POST', '/auth/v1/admin/users', {
        email: emailLower,
        password: password,
        email_confirm: true,
        user_metadata: { name: m.name }
      })
      if (res.id) {
        userId = res.id
      } else {
        console.error(`  ! Error creating ${emailLower}:`, res)
        continue
      }
    }

    const role = (m.store === 'MX PERFORMANCE') ? 'admin' : 'manager'
    runCurl('POST', '/rest/v1/users', {
      id: userId,
      email: emailLower,
      name: m.name,
      role: role,
      active: true
    })

    const storeId = storeMap.get(m.store.toUpperCase())
    if (storeId) {
       // Check if link exists
       const link = runCurl('GET', `/rest/v1/store_sellers?store_id=eq.${storeId}&seller_user_id=eq.${userId}`)
       if (link.length === 0) {
         runCurl('POST', '/rest/v1/store_sellers', { store_id: storeId, seller_user_id: userId, is_active: true })
       }
    }

    results.push({ nome: m.name, loja: m.store, email: emailLower, senha: password })
    console.log('  - OK')
  }

  console.log('\n--- LISTA FINAL DE GERENTES ---\n')
  results.forEach(r => {
    console.log(`${r.nome} | ${r.loja} | ${r.email} | ${r.senha}`)
  })
}

run()
