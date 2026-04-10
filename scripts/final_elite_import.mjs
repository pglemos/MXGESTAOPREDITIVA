import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
  if (lines.length === 0) return { headers: [], records: [] }
  const headers = lines[lines.findIndex(l => l.includes('Carimbo'))].split(',').map(h => h.trim())
  const records = []
  const dataLines = lines.slice(lines.findIndex(l => l.includes('Carimbo')) + 1)
  for (let line of dataLines) {
    const values = []
    let curVal = ''
    let inQuotes = false
    for (let char of line) {
      if (char === '"') inQuotes = !inQuotes
      else if (char === ',' && !inQuotes) {
        values.push(curVal.trim())
        curVal = ''
      } else {
        curVal += char
      }
    }
    values.push(curVal.trim())
    records.push(values)
  }
  return { headers, records }
}

function parseDate(dateStr) {
  if (!dateStr) return null
  const parts = dateStr.split(' ')[0].split('/')
  if (parts.length === 3) {
    let [d, m, y] = parts
    if (y.startsWith('002')) y = '202' + y.slice(3)
    if (y.length === 2) y = '20' + y
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return null
}

async function run() {
  console.log('--- RE-IMPORTAÇÃO TOTAL (MODO ROBUSTO) ---\n')

  const stores = JSON.parse(fs.readFileSync('stores_for_import.json', 'utf8'))
  const users = JSON.parse(fs.readFileSync('users_for_import.json', 'utf8'))
  
  const storeMap = new Map()
  stores.forEach(s => storeMap.set(s.name.toUpperCase().trim(), s.id))

  const userMap = new Map()
  users.forEach(u => {
    userMap.set(u.name.toUpperCase().trim(), u.id)
    // Map variations
    if (u.name.includes(' ')) {
       const first = u.name.split(' ')[0].toUpperCase()
       if (!userMap.has(first)) userMap.set(first, u.id)
    }
  })

  const fileContent = fs.readFileSync('import_data.csv', 'utf-8')
  const { headers, records } = parseCSV(fileContent)

  const consolidated = new Map()

  for (const row of records) {
    const storeNameRaw = (row[1] || '').toUpperCase().trim()
    const storeId = storeMap.get(storeNameRaw) || storeMap.get(storeNameRaw.replace('MOTORS', 'Motors'))
    
    let rawName = (row[2] || row[3] || row[4] || row[5] || row[6] || row[15] || row[16] || row[17] || row[18] || row[19] || row[20]).toUpperCase().trim()
    if (!rawName) continue

    const userId = userMap.get(rawName)
    if (!userId || !storeId) continue

    const refDate = parseDate(row[7]) || parseDate(row[22])
    if (!refDate || !refDate.startsWith('2026')) continue

    const key = `${userId}:${storeId}:${refDate}`
    
    if (!consolidated.has(key)) {
      consolidated.set(key, {
        seller_user_id: userId,
        user_id: userId,
        store_id: storeId,
        reference_date: refDate,
        date: refDate,
        metric_scope: 'daily',
        leads: 0, agd_cart: 0, agd_net: 0, vnd_porta: 0, vnd_cart: 0, vnd_net: 0, visitas: 0
      })
    }

    const data = consolidated.get(key)
    data.leads += Math.max(0, parseInt(row[8]) || parseInt(row[23]) || 0)
    data.vnd_porta += Math.max(0, parseInt(row[9]) || parseInt(row[24]) || 0)
    data.agd_cart += Math.max(0, parseInt(row[10]) || parseInt(row[25]) || 0)
    data.vnd_cart += Math.max(0, parseInt(row[11]) || parseInt(row[26]) || 0)
    data.agd_net += Math.max(0, parseInt(row[12]) || parseInt(row[27]) || 0)
    data.vnd_net += Math.max(0, parseInt(row[13]) || parseInt(row[28]) || 0)
    data.visitas += Math.max(0, parseInt(row[14]) || 0)
  }

  const finalRecords = Array.from(consolidated.values()).map(r => ({
    ...r,
    leads_prev_day: r.leads,
    agd_cart_prev_day: 0,
    agd_net_prev_day: 0,
    agd_cart_today: r.agd_cart,
    agd_net_today: r.agd_net,
    vnd_porta_prev_day: r.vnd_porta,
    vnd_cart_prev_day: r.vnd_cart,
    vnd_net_prev_day: r.vnd_net,
    visit_prev_day: r.visitas,
    submission_status: 'approved',
    submitted_at: new Date().toISOString()
  }))

  console.log(`Generating payload for ${finalRecords.length} records...`)
  fs.writeFileSync('final_payload.json', JSON.stringify(finalRecords, null, 2))
  console.log('✅ Payload gerado.')
}

run()
