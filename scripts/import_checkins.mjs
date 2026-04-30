import { execSync } from 'child_process'
import dotenv from 'dotenv'
import fs from 'fs'
dotenv.config({ override: false })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function runCurl(method, path, body = null, extraHeaders = {}) {
  const url = `${supabaseUrl}${path}`
  let cmd = `curl -s -X ${method} "${url}" -H "apikey: ${serviceKey}" -H "Authorization: Bearer ${serviceKey}"`
  for (const [k, v] of Object.entries(extraHeaders)) {
    cmd += ` -H "${k}: ${v}"`
  }
  if (body) cmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(body)}'`
  const out = execSync(cmd, { timeout: 30000 }).toString()
  try { return JSON.parse(out) } catch (e) { return out }
}

function normalize(str) {
  return str.toUpperCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const rawData = fs.readFileSync('scripts/import_data.txt', 'utf-8')
const lines = rawData.trim().split('\n')
const header = lines[0]
const dataLines = lines.slice(1)

console.log(`Total lines: ${dataLines.length}`)

const lojas = runCurl('GET', '/rest/v1/lojas?select=id,name')
const storeMap = new Map()
lojas.forEach(s => storeMap.set(normalize(s.name), s.id))

const users = runCurl('GET', '/rest/v1/usuarios?select=id,name,email,active')
const userByName = new Map()
users.forEach(u => {
  const key = normalize(u.name)
  if (!userByName.has(key)) userByName.set(key, u)
})

console.log('Stores:', [...storeMap.keys()].join(', '))
console.log('Users loaded:', userByName.size)

const aggregated = new Map()

for (const line of dataLines) {
  const parts = line.split('\t')
  if (parts.length < 10) continue

  const [dateStr, storeName, sellerName, leads, vndPorta, agdCart, vndCart, agdNet, vndNet, visita] = parts

  const dateParts = dateStr.split('/')
  const isoDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`

  const storeId = storeMap.get(normalize(storeName))
  const user = userByName.get(normalize(sellerName))

  if (!storeId) {
    console.log(`SKIP store not found: ${storeName}`)
    continue
  }
  if (!user) {
    console.log(`SKIP user not found: ${sellerName}`)
    continue
  }

  const key = `${isoDate}|${storeId}|${user.id}`

  if (!aggregated.has(key)) {
    aggregated.set(key, {
      reference_date: isoDate,
      store_id: storeId,
      seller_user_id: user.id,
      user_id: user.id,
      date: isoDate,
      leads: 0, vnd_porta: 0, agd_cart: 0, vnd_cart: 0, agd_net: 0, vnd_net: 0, visitas: 0,
      metric_scope: 'daily',
      submission_status: 'on_time'
    })
  }

  const entry = aggregated.get(key)
  entry.leads += parseInt(leads) || 0
  entry.vnd_porta += parseInt(vndPorta) || 0
  entry.agd_cart += parseInt(agdCart) || 0
  entry.vnd_cart += parseInt(vndCart) || 0
  entry.agd_net += parseInt(agdNet) || 0
  entry.vnd_net += parseInt(vndNet) || 0
  entry.visitas += parseInt(visita) || 0
}

const entries = [...aggregated.values()]

for (const e of entries) {
  e.leads = Math.max(0, e.leads)
  e.vnd_porta = Math.max(0, e.vnd_porta)
  e.agd_cart = Math.max(0, e.agd_cart)
  e.vnd_cart = Math.max(0, e.vnd_cart)
  e.agd_net = Math.max(0, e.agd_net)
  e.vnd_net = Math.max(0, e.vnd_net)
  e.visitas = Math.max(0, e.visitas)
}

console.log(`\nAggregated entries: ${entries.length}`)

const UPSERT_PATH = '/rest/v1/lancamentos_diarios?on_conflict=seller_user_id,store_id,reference_date'
const UPSERT_HEADERS = { 'Prefer': 'resolution=merge-duplicates,return=representation' }

const BATCH_SIZE = 50
let upserted = 0
let errors = 0

for (let i = 0; i < entries.length; i += BATCH_SIZE) {
  const batch = entries.slice(i, i + BATCH_SIZE)
  const res = runCurl('POST', UPSERT_PATH, batch, UPSERT_HEADERS)

  if (Array.isArray(res) && res.length > 0) {
    upserted += batch.length
  } else {
    for (const entry of batch) {
      const single = runCurl('POST', UPSERT_PATH, entry, UPSERT_HEADERS)
      if (Array.isArray(single) && single.length > 0) {
        upserted++
      } else {
        const userName = [...userByName.entries()].find(([, u]) => u.id === entry.seller_user_id)?.[1]?.name || entry.seller_user_id
        const storeName2 = [...storeMap.entries()].find(([, v]) => v === entry.store_id)?.[0] || entry.store_id
        console.log(`ERROR ${entry.reference_date} ${storeName2} ${userName}:`, JSON.stringify(single).substring(0, 200))
        errors++
      }
    }
  }

  const pct = Math.round(((i + BATCH_SIZE) / entries.length) * 100)
  process.stdout.write(`\rProgress: ${Math.min(pct, 100)}% (${upserted} ok, ${errors} err)`)
}

console.log(`\n\n=== RESULTADO ===`)
console.log(`Upserted (inseridos + atualizados): ${upserted}`)
console.log(`Erros: ${errors}`)

const verify = runCurl('GET', '/rest/v1/lancamentos_diarios?select=reference_date&reference_date=gte.2026-01-01&reference_date=lt.2026-05-01')
console.log(`Total checkins no periodo Jan-Abr 2026: ${verify?.length || 'N/A'}`)
