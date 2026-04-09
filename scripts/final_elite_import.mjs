import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const officialUsers = [
  { id: "4a8658af-e555-44ac-8591-e976fd9b5408", name: "LEANDRO", email: "leandrorudolfo1@gmail.com", store: "ESPINDOLA AUTOMOVEIS" },
  { id: "f9cc4a50-d992-4241-a9bd-85b056b43625", name: "DAVID RADES", email: "davidgundam081@gmail.com", store: "ESPINDOLA AUTOMOVEIS" },
  { id: "5189ad9e-a11e-4928-89f9-5ccc148aaa8e", name: "RYAN FELIPE ANDRADE", email: "feliperyan00@gmail.com", store: "GANDINI AUTOMOVEIS" },
  { id: "bfee92a4-1940-4295-bb89-6094586901e7", name: "EVERTON LUIZ DA SILVA", email: "evertonmitoyo@hotmail.com", store: "GANDINI AUTOMOVEIS" },
  { id: "ab31d2a5-9471-4152-83e2-88c96c50e19e", name: "LUIZ HENRIQUE", email: "henriqueavilaconsultor@outlook.com", store: "GANDINI AUTOMOVEIS" },
  { id: "0aa67515-7077-4284-b0c9-1bf630cbb3a0", name: "NATHAN ALVES CHAGAS", email: "nathan.alveschagas@yahoo.com", store: "GANDINI AUTOMOVEIS" },
  { id: "205de015-e498-48a0-a7d7-723ca812529d", name: "BRUNO SANTOS", email: "gestaobrunosantos@gmail.com", store: "LIAL VEICULOS" },
  { id: "0a479d55-cdd8-4d53-8d25-7f08dfb31fcd", name: "DIELLE", email: "loja35114255@gmail.com", store: "LIAL VEICULOS" },
  { id: "ca25ede2-fda5-4213-b013-c74e32de432d", name: "JOÃO DANIEL VON DER HEIDE FREITAS", email: "joaodanielvdhf@gmail.com", store: "LIAL VEICULOS" },
  { id: "efa27765-a4ea-4015-b82b-b0767732aef1", name: "JAMES OLIVEIRA THOMAS", email: "jamesthomasolv@gmail.com", store: "PAAY MOTORS" },
  { id: "05a89d50-35b5-419d-909e-e1edff76a07d", name: "GUILHERME DUARTE CARDOSO SAMPAIO", email: "guilhermeduartesamp@gmail.com", store: "PISCAR VEICULOS" },
  { id: "255df7a8-b5c1-4294-81d9-285746e7b262", name: "EMERSON", email: "emersonnantonnio@hotmail.com", store: "RK2 MOTORS" },
  { id: "ef409437-fe1d-4bcc-8adb-adfdf19e5ca0", name: "ANTÔNIO PEREIRA DA SILVA NETO", email: "approntaresposta@gmail.com", store: "DNA VEICULOS" },
  { id: "014c105e-2ec9-4ce1-b982-04dd176f3808", name: "CRISTINA", email: "cristinacarmodesouza83@gmail.com", store: "DNA VEICULOS" }
]

const nameVariations = {
  'LEANDRO': 'LEANDRO',
  'LEANDRO DO SANTOS': 'LEANDRO',
  'DAVID': 'DAVID RADES',
  'RYAN FELIPE': 'RYAN FELIPE ANDRADE',
  'EVERTON LUIZ': 'EVERTON LUIZ DA SILVA',
  'LUIZ HENRIQUE': 'LUIZ HENRIQUE',
  'NATHAN ALVES': 'NATHAN ALVES CHAGAS',
  'BRUNO': 'BRUNO SANTOS',
  'DIELE': 'DIELLE',
  'JOÃO': 'JOÃO DANIEL VON DER HEIDE FREITAS',
  'JOÃO PINHEIRO': 'JOÃO DANIEL VON DER HEIDE FREITAS',
  'JAMES': 'JAMES OLIVEIRA THOMAS',
  'GUILHERME': 'GUILHERME DUARTE CARDOSO SAMPAIO',
  'GUILHERME DUARTE CARDOSO SAMPAIO': 'GUILHERME DUARTE CARDOSO SAMPAIO',
  'GUILHERME CRISTIAN DA SILVA': 'GUILHERME DUARTE CARDOSO SAMPAIO',
  'EMERSON': 'EMERSON',
  'ANTÔNIO PEREIRA': 'ANTÔNIO PEREIRA DA SILVA NETO',
  'CRISTINA': 'CRISTINA',
  'CRISTINA DO CARMO': 'CRISTINA'
}

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
  console.log('--- RE-IMPORTAÇÃO FINAL DE ELITE (MODO ROBUSTO) ---\n')

  const stores = JSON.parse(fs.readFileSync('stores_for_import.json', 'utf8'))
  const storeMap = new Map()
  stores.forEach(s => storeMap.set(s.name.toUpperCase().trim(), s.id))

  const fileContent = fs.readFileSync('import_data.csv', 'utf-8')
  const { headers, records } = parseCSV(fileContent)

  const consolidated = new Map() // Key: userId:storeId:date

  for (const row of records) {
    const storeNameRaw = (row[1] || '').toUpperCase().trim()
    const storeId = storeMap.get(storeNameRaw) || storeMap.get(storeNameRaw.replace('MOTORS', 'Motors'))
    
    let rawName = (row[2] || row[3] || row[4] || row[5] || row[6] || row[15] || row[16] || row[17] || row[18] || row[19] || row[20]).toUpperCase().trim()
    const officialName = nameVariations[rawName] || rawName
    const user = officialUsers.find(u => u.name === officialName)

    if (!user || !storeId) continue

    const refDate = parseDate(row[7]) || parseDate(row[22])
    if (!refDate || !refDate.startsWith('2026')) continue

    const key = `${user.id}:${storeId}:${refDate}`
    
    if (!consolidated.has(key)) {
      consolidated.set(key, {
        seller_user_id: user.id,
        user_id: user.id,
        store_id: storeId,
        reference_date: refDate,
        date: refDate,
        metric_scope: 'daily', // Set to daily so it shows in dashboard
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
    agd_cart_prev_day: 0, // In CSV, these are usually what they reported as 'today' in the form
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

  console.log(`Writing ${finalRecords.length} records to final_payload.json...`)
  fs.writeFileSync('final_payload.json', JSON.stringify(finalRecords, null, 2))
  console.log('\n--- PAYLOAD GERADO ---')
}

run()
