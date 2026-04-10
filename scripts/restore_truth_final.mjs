import fs from 'fs'
import dotenv from 'dotenv'
import { execSync } from 'child_process'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let password = ''
  for (let i = 0; i < 8; i++) password += chars.charAt(Math.floor(Math.random() * chars.length))
  return password
}

function parseDate(dateStr) {
  if (!dateStr) return null
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    let [d, m, y] = parts
    if (y.startsWith('00')) y = '20' + y.slice(2)
    if (y.length === 2) y = '20' + y
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return null
}

function runCurl(method, path, body = null) {
  const url = `${supabaseUrl}${path}`
  let cmd = `curl -s -X ${method} "${url}" -H "apikey: ${serviceKey}" -H "Authorization: Bearer ${serviceKey}"`
  if (body) cmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(body).replace(/'/g, "'\\''")}'`
  const out = execSync(cmd).toString()
  try { return JSON.parse(out) } catch (e) { return out }
}

async function run() {
  console.log('--- RESTAURAÇÃO DEFINITIVA (MÉTODO BASH/CURL) ---\n')

  console.log('Zerando base de dados...')
  runCurl('DELETE', '/rest/v1/daily_checkins?id=neq.00000000-0000-0000-0000-000000000000')

  const content = fs.readFileSync('fonte_da_verdade.csv', 'utf8')
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0)
  const dataLines = lines.slice(2)

  const storesDB = JSON.parse(fs.readFileSync('stores_truth.json', 'utf8'))
  const storeMap = new Map()
  storesDB.forEach(s => storeMap.set(s.name.toUpperCase().trim(), s.id))

  const authData = JSON.parse(fs.readFileSync('auth_users_truth.json', 'utf8'))
  const allAuthUsers = authData.users || []

  const sellersMap = new Map() 
  const checkinData = []

  console.log(`Lendo ${dataLines.length} registros...`)

  for (const line of dataLines) {
    const values = []
    let cur = ''
    let inQuotes = false
    for (let char of line) {
      if (char === '"') inQuotes = !inQuotes
      else if (char === ',' && !inQuotes) { values.push(cur.trim()); cur = '' }
      else cur += char
    }
    values.push(cur.trim())

    const [dateRaw, storeNameRaw, sellerNameRaw, leads, vp, ac, vc, ai, vi, vis, emailRaw, loginRaw, senhaRaw] = values
    
    const storeName = (storeNameRaw || '').toUpperCase().trim()
    let sellerName = (sellerNameRaw || '').toUpperCase().trim()
    
    // Normalização estrita
    if (sellerName.includes('LEANDRO')) sellerName = 'LEANDRO'
    if (sellerName === 'DAVID RADES') sellerName = 'DAVID'
    if (sellerName === 'DIELE') sellerName = 'DIELLE'
    if (sellerName === 'ANTONIO PEREIRA') sellerName = 'ANTÔNIO PEREIRA'
    if (sellerName === 'CRISTINA DO CARMO') sellerName = 'CRISTINA'

    const storeId = storeMap.get(storeName) || storeMap.get(storeName.replace('MOTORS', 'Motors'))
    if (!sellerName || !storeId) continue

    if (!sellersMap.has(sellerName)) {
      let email = (emailRaw || loginRaw || '').toLowerCase()
      if (!email || !email.includes('@')) {
        email = `${sellerName.toLowerCase().replace(/\s+/g, '.')}.${storeName.toLowerCase().split(' ')[0]}@mxperformance.com.br`
      }
      sellersMap.set(sellerName, {
        name: sellerName, email, password: senhaRaw || generatePassword(), storeId, storeName
      })
    }

    const refDate = parseDate(dateRaw)
    if (refDate && refDate.startsWith('2026')) {
      checkinData.push({
        sellerName, storeId, date: refDate,
        l: parseInt(leads) || 0, vp: parseInt(vp) || 0, ac: parseInt(ac) || 0, vc: parseInt(vc) || 0,
        ai: parseInt(ai) || 0, vi: parseInt(vi) || 0, vis: parseInt(vis) || 0
      })
    }
  }

  const sellerIdMap = new Map()
  console.log(`Sincronizando ${sellersMap.size} vendedores...`)

  for (const s of sellersMap.values()) {
    let userId = allAuthUsers.find(u => u.email === s.email)?.id
    
    if (!userId) {
      const res = runCurl('POST', '/auth/v1/admin/users', { email: s.email, password: s.password, email_confirm: true, user_metadata: { name: s.name } })
      userId = res.id
    } else {
      runCurl('PUT', `/auth/v1/admin/users/${userId}`, { password: s.password })
    }

    if (userId) {
      runCurl('POST', '/rest/v1/users', { id: userId, name: s.name, email: s.email, role: 'vendedor', active: true })
      runCurl('POST', '/rest/v1/store_sellers', { store_id: s.storeId, seller_user_id: userId, is_active: true })
      sellerIdMap.set(s.name, userId)
      process.stdout.write('.')
    }
  }

  console.log('\nConsolidando performance...')
  const consolidated = new Map()
  for (const d of checkinData) {
    const uid = sellerIdMap.get(d.sellerName)
    const key = `${uid}:${d.storeId}:${d.date}`
    if (!consolidated.has(key)) {
      consolidated.set(key, {
        seller_user_id: uid, user_id: uid, store_id: d.storeId, reference_date: d.date, date: d.date, metric_scope: 'daily',
        leads: 0, agd_cart: 0, agd_net: 0, vnd_porta: 0, vnd_cart: 0, vnd_net: 0, visitas: 0
      })
    }
    const r = consolidated.get(key)
    r.leads = Math.max(0, r.leads + d.l)
    r.agd_cart = Math.max(0, r.agd_cart + d.ac)
    r.agd_net = Math.max(0, r.agd_net + d.ai)
    r.vnd_porta = Math.max(0, r.vnd_porta + d.vp)
    r.vnd_cart = Math.max(0, r.vnd_cart + d.vc)
    r.vnd_net = Math.max(0, r.vnd_net + d.vi)
    r.visitas = Math.max(0, r.visitas + d.vis)
  }

  const finalPayload = Array.from(consolidated.values()).map(r => ({
    ...r, leads_prev_day: r.leads, agd_cart_today: r.agd_cart, agd_net_today: r.agd_net,
    vnd_porta_prev_day: r.vnd_porta, vnd_cart_prev_day: r.vnd_cart, vnd_net_prev_day: r.vnd_net,
    visit_prev_day: r.visitas, submission_status: 'approved', submitted_at: new Date().toISOString()
  }))

  console.log(`Subindo ${finalPayload.length} registros um por um...`)
  let successes = 0
  for (let i = 0; i < finalPayload.length; i++) {
    const record = finalPayload[i]
    try {
      runCurl('POST', '/rest/v1/daily_checkins', record)
      successes++
      if (successes % 100 === 0) process.stdout.write(`${successes} `)
    } catch (e) {}
  }

  console.log('\n\n--- AUDITORIA DE CONFERÊNCIA (ABRIL 2026) ---')
  const audit = {}
  finalPayload.forEach(p => {
    if (!p.reference_date.startsWith('2026-04')) return
    const sName = storesDB.find(s => s.id === p.store_id)?.name
    if (!audit[sName]) audit[sName] = { leads: 0, vendas: 0 }
    audit[sName].leads += p.leads
    audit[sName].vendas += (p.vnd_porta + p.vnd_cart + p.vnd_net)
  })
  console.table(audit)

  console.log('\n--- LISTA DE ACESSOS ---')
  for (const s of sellersMap.values()) console.log(`${s.name} | ${s.storeName} | ${s.email} | ${s.password}`)
  console.log('\n✅ OK.')
}

run()
