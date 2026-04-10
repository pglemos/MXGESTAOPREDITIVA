import { execSync } from 'child_process'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const csvSellers = [
  {"name":"ADRIANA T","store":"RK2 MOTORS"},
  {"name":"ALEX","store":"ESPINDOLA AUTOMOVEIS"},
  {"name":"AMANDA SANTIAGO","store":"RK2 MOTORS"},
  {"name":"ANDREIA","store":"RK2 MOTORS"},
  {"name":"ANTÔNIO PEREIRA","store":"DNA VEICULOS"},
  {"name":"BRENDA SENA","store":"SEMINOVOS BHZ"},
  {"name":"BRENO AUGUSTO","store":"PISCAR VEICULOS"},
  {"name":"BRUNO ALVES","store":"RK2 MOTORS"},
  {"name":"BRUNO HENRIQUE","store":"DNA VEICULOS"},
  {"name":"BRUNO","store":"LIAL VEICULOS"},
  {"name":"CAROLINNE RODRIGUES","store":"SEMINOVOS BHZ"},
  {"name":"CHARLES","store":"ACERTTCAR"},
  {"name":"CLEITON","store":"ACERTTCAR"},
  {"name":"CRISTIAN","store":"RK2 MOTORS"},
  {"name":"CRISTINA DO CARMO","store":"DNA VEICULOS"},
  {"name":"DANIEL ALAN","store":"SEMINOVOS BHZ"},
  {"name":"DANILO CARMO","store":"SEMINOVOS BHZ"},
  {"name":"DAVID","store":"ESPINDOLA AUTOMOVEIS"},
  {"name":"DIELE","store":"LIAL VEICULOS"},
  {"name":"DOUGLAS DO SANTOS","store":"DNA VEICULOS"},
  {"name":"EMERSON","store":"RK2 MOTORS"},
  {"name":"EVERTON LUIZ","store":"GANDINI AUTOMOVEIS"},
  {"name":"FERNANDO","store":"RK2 MOTORS"},
  {"name":"FLAVIO","store":"RK2 MOTORS"},
  {"name":"FREDERICO","store":"PAAY MOTORS"},
  {"name":"GABRIEL FELIX RODRIGUES SOUZA","store":"PISCAR VEICULOS"},
  {"name":"GEISON","store":"RK2 MOTORS"},
  {"name":"GUILHERME CRISTIAN DA SILVA","store":"PISCAR VEICULOS"},
  {"name":"GUILHERME DUARTE CARDOSO SAMPAIO","store":"PISCAR VEICULOS"},
  {"name":"GUILHERME","store":"RK2 MOTORS"},
  {"name":"GUSTAVO ALVARENGA","store":"DNA VEICULOS"},
  {"name":"HUDSON","store":"PAAY MOTORS"},
  {"name":"IGOR B","store":"RK2 MOTORS"},
  {"name":"IGOR DANIEL POLICARPO","store":"PISCAR VEICULOS"},
  {"name":"INGRIDY VITORIA","store":"SEMINOVOS BHZ"},
  {"name":"JAMES","store":"PAAY MOTORS"},
  {"name":"JOAO PEDRO","store":"BROTHERS CAR"},
  {"name":"JOAO RICARDO VENTURA DE ANDRADE","store":"PISCAR VEICULOS"},
  {"name":"JOAO VICTOR DE SOUZA","store":"PISCAR VEICULOS"},
  {"name":"JOAO VICTOR","store":"BROTHERS CAR"},
  {"name":"JOAO","store":"LIAL VEICULOS"},
  {"name":"JOÃO PINHEIRO","store":"DNA VEICULOS"},
  {"name":"JUAN","store":"RK2 MOTORS"},
  {"name":"JULIANA TALITA SILVA MORATO","store":"PISCAR VEICULOS"},
  {"name":"KEISY","store":"SEMINOVOS BHZ"},
  {"name":"KELTON","store":"DNA VEICULOS"},
  {"name":"LEANDRO DO SANTOS","store":"SEMINOVOS BHZ"},
  {"name":"LEANDRO","store":"ESPINDOLA AUTOMOVEIS"},
  {"name":"LEONARDO","store":"RK2 MOTORS"},
  {"name":"LUCAS ARAÚJO","store":"RK2 MOTORS"},
  {"name":"LUCAS ARTHUR SILVESTRE SOUZA","store":"PISCAR VEICULOS"},
  {"name":"LUCAS CAMPELLO","store":"SEMINOVOS BHZ"},
  {"name":"LUCAS HENRIQUE","store":"RK2 MOTORS"},
  {"name":"LUCAS ROSSI","store":"BROTHERS CAR"},
  {"name":"LUCAS","store":"RK2 MOTORS"},
  {"name":"LUIZ HENRIQUE","store":"GANDINI AUTOMOVEIS"},
  {"name":"MARCOS PAULO SOUSA DA SILVA","store":"PISCAR VEICULOS"},
  {"name":"MONICA","store":"DNA VEICULOS"},
  {"name":"NATHALIA RODRIGUES","store":"SEMINOVOS BHZ"},
  {"name":"NATHAN ALVES","store":"GANDINI AUTOMOVEIS"},
  {"name":"OTAVIO GOMES DE LIMA","store":"PISCAR VEICULOS"},
  {"name":"PAULO CESAR","store":"RK2 MOTORS"},
  {"name":"RAFAEL JOSÉ","store":"RK2 MOTORS"},
  {"name":"RYAN FELIPE","store":"GANDINI AUTOMOVEIS"},
  {"name":"SALMON ROCHA ALMEIDA","store":"PISCAR VEICULOS"},
  {"name":"SIDNEI NASCIMENTO","store":"BROTHERS CAR"},
  {"name":"SIMONE","store":"ACERTTCAR"},
  {"name":"TIAGO","store":"PAAY MOTORS"},
  {"name":"VENDA LOJA CRISTIANO MACHADO","store":"SEMINOVOS BHZ"},
  {"name":"VENDA LOJA","store":"ESPINDOLA AUTOMOVEIS"},
  {"name":"VENDAS LOJA","store":"PAAY MOTORS"},
  {"name":"VERONICA","store":"SEMINOVOS BHZ"},
  {"name":"VINICIUS","store":"RK2 MOTORS"},
  {"name":"VITOR GABRIEL DE OLIVEIRA","store":"PISCAR VEICULOS"},
  {"name":"WANDER","store":"DNA VEICULOS"},
  {"name":"WANDREY LIMA","store":"DNA VEICULOS"},
  {"name":"WASHINGTON SANTANA DE SOUZA","store":"PISCAR VEICULOS"},
  {"name":"WELLINGTON","store":"ACERTTCAR"},
  {"name":"WENDER LUCIO","store":"DNA VEICULOS"},
  {"name":"WESLEY BARBOSA DOS SANTOS LIMA","store":"PISCAR VEICULOS"}
]

const officialUsers = [
  { name: 'LEANDRO', email: 'leandrorudolfo1@gmail.com' },
  { name: 'DAVID RADES', email: 'davidgundam081@gmail.com' },
  { name: 'RYAN FELIPE ANDRADE', email: 'feliperyan00@gmail.com' },
  { name: 'EVERTON LUIZ DA SILVA', email: 'evertonmitoyo@hotmail.com' },
  { name: 'LUIZ HENRIQUE', email: 'henriqueavilaconsultor@outlook.com' },
  { name: 'NATHAN ALVES CHAGAS', email: 'nathan.alveschagas@yahoo.com' },
  { name: 'BRUNO SANTOS', email: 'gestaobrunosantos@gmail.com' },
  { name: 'DIELLE', email: 'loja35114255@gmail.com' },
  { name: 'JOÃO DANIEL VON DER HEIDE FREITAS', email: 'joaodanielvdhf@gmail.com' },
  { name: 'JAMES OLIVEIRA THOMAS', email: 'jamesthomasolv@gmail.com' },
  { name: 'GUILHERME DUARTE CARDOSO SAMPAIO', email: 'guilhermeduartesamp@gmail.com' },
  { name: 'EMERSON', email: 'emersonnantonnio@hotmail.com' },
  { name: 'ANTÔNIO PEREIRA DA SILVA NETO', email: 'approntaresposta@gmail.com' },
  { name: 'CRISTINA', email: 'cristinacarmodesouza83@gmail.com' }
]

function runCurl(method, path, body = null) {
  const url = `${supabaseUrl}${path}`
  let cmd = `curl -s -X ${method} "${url}" -H "apikey: ${serviceKey}" -H "Authorization: Bearer ${serviceKey}"`
  if (body) cmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(body)}'`
  const out = execSync(cmd).toString()
  try { return JSON.parse(out) } catch (e) { return out }
}

async function run() {
  console.log('--- RESTAURANDO TODOS OS VENDEDORES ---')
  
  const stores = runCurl('GET', '/rest/v1/stores?select=id,name')
  const storeMap = new Map()
  stores.forEach(s => storeMap.set(s.name.toUpperCase().trim(), s.id))

  const existingUsers = runCurl('GET', '/rest/v1/users?select=id,email,name')
  
  for (const s of csvSellers) {
    const isVendaLoja = s.name.includes('VENDA LOJA') || s.name.includes('VENDAS LOJA')
    let email = officialUsers.find(u => u.name === s.name || u.name === s.name.replace(' DO SANTOS', ''))?.email
    
    if (!email) {
      email = `${s.name.toLowerCase().replace(/\s+/g, '.')}.${s.store.toLowerCase().split(' ')[0]}@mxperformance.com.br`
    }

    const existing = existingUsers.find(u => u.email === email || u.name === s.name)
    
    let userId
    if (existing) {
      userId = existing.id
      console.log(`User existing: ${s.name} (${userId})`)
    } else {
      // Create a dummy ID for public.users if not official (since we don't have Auth)
      // Actually, better create an Auth user via curl to be safe
      const res = runCurl('POST', '/auth/v1/admin/users', {
        email: email,
        password: 'MX@' + Math.random().toString(36).substring(7).toUpperCase(),
        email_confirm: true,
        user_metadata: { name: s.name }
      })
      if (res.id) {
        userId = res.id
        console.log(`Auth User created: ${s.name} (${userId})`)
      } else {
        console.error(`Error creating ${s.name}:`, res)
        continue
      }
    }

    // Upsert public user
    runCurl('POST', '/rest/v1/users', {
      id: userId,
      email: email,
      name: s.name,
      role: 'vendedor',
      is_venda_loja: isVendaLoja,
      active: true
    })

    const storeId = storeMap.get(s.store.toUpperCase()) || storeMap.get(s.store.replace('MOTORS', 'Motors').toUpperCase())
    if (storeId) {
      runCurl('POST', '/rest/v1/store_sellers', {
        store_id: storeId,
        seller_user_id: userId,
        is_active: true
      })
    }
  }
  console.log('✅ VENDEDORES RESTAURADOS.')
}

run()
