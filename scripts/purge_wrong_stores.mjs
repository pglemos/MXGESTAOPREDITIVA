import { execSync } from 'child_process'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const officialMappings = [
  { email: 'leandrorudolfo1@gmail.com', store: 'ESPINDOLA AUTOMOVEIS' },
  { email: 'davidgundam081@gmail.com', store: 'ESPINDOLA AUTOMOVEIS' },
  { email: 'feliperyan00@gmail.com', store: 'GANDINI AUTOMOVEIS' },
  { email: 'evertonmitoyo@hotmail.com', store: 'GANDINI AUTOMOVEIS' },
  { email: 'henriqueavilaconsultor@outlook.com', store: 'GANDINI AUTOMOVEIS' },
  { email: 'nathan.alveschagas@yahoo.com', store: 'GANDINI AUTOMOVEIS' },
  { email: 'gestaobrunosantos@gmail.com', store: 'LIAL VEICULOS' },
  { email: 'loja35114255@gmail.com', store: 'LIAL VEICULOS' },
  { email: 'joaodanielvdhf@gmail.com', store: 'LIAL VEICULOS' },
  { email: 'jamesthomasolv@gmail.com', store: 'PAAY MOTORS' },
  { email: 'guilhermeduartesamp@gmail.com', store: 'PISCAR VEICULOS' },
  { email: 'emersonnantonnio@hotmail.com', store: 'RK2 MOTORS' },
  { email: 'approntaresposta@gmail.com', store: 'DNA VEICULOS' },
  { email: 'cristinacarmodesouza83@gmail.com', store: 'DNA VEICULOS' }
]

function runCurl(method, path, body = null) {
  const url = `${supabaseUrl}${path}`
  let cmd = `curl -s -X ${method} "${url}" -H "apikey: ${serviceKey}" -H "Authorization: Bearer ${serviceKey}"`
  if (body) cmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(body)}'`
  const out = execSync(cmd).toString()
  try { return JSON.parse(out) } catch (e) { return out }
}

async function run() {
  console.log('--- PURGE DATA FROM WRONG STORES ---\n')
  
  const stores = runCurl('GET', '/rest/v1/stores?select=id,name')
  const storeMap = new Map()
  stores.forEach(s => storeMap.set(s.name.toUpperCase().trim(), s.id))

  const users = runCurl('GET', '/rest/v1/users?select=id,email')

  for (const m of officialMappings) {
    const user = users.find(u => u.email === m.email)
    if (!user) continue

    const officialStoreId = storeMap.get(m.store.toUpperCase())
    if (!officialStoreId) {
      console.log(`! Store not found: ${m.store}`)
      continue
    }

    console.log(`Fixing: ${m.email} -> Official Store: ${m.store}`)

    // 1. Delete checkins from OTHER stores
    const delCheckins = runCurl('DELETE', `/rest/v1/daily_checkins?seller_user_id=eq.${user.id}&store_id=neq.${officialStoreId}`)
    console.log(`  - Deleted checkins from wrong stores.`)

    // 2. Delete store_sellers from OTHER stores
    runCurl('DELETE', `/rest/v1/store_sellers?seller_user_id=eq.${user.id}&store_id=neq.${officialStoreId}`)
    console.log(`  - Deleted store links from wrong stores.`)
    
    // 3. Ensure official store link exists
    runCurl('POST', '/rest/v1/store_sellers', {
      seller_user_id: user.id,
      store_id: officialStoreId,
      is_active: true
    })
  }

  console.log('\n--- LIMPEZA DE LOJAS FINALIZADA ---')
}

run()
