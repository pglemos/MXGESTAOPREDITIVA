import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
  if (lines.length === 0) return { headers: [], records: [] }
  const headers = lines[0].split(',').map(h => h.trim())
  const records = []
  for (let i = 1; i < lines.length; i++) {
    const values = []
    let curVal = ''
    let inQuotes = false
    for (let char of lines[i]) {
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
  if (dateStr.includes('/')) {
    const parts = dateStr.split(' ')[0].split('/')
    if (parts.length === 3) {
      let [d, m, y] = parts
      if (y.startsWith('002')) y = '202' + y.slice(3)
      if (y.length === 2) y = '20' + y
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
  }
  return null
}

async function run() {
  console.log('--- FINAL DATA SYNC & FIX ---\n')

  // 1. Get Stores and Users
  const { data: stores } = await supabase.from('stores').select('*')
  const { data: users } = await supabase.from('users').select('*')

  const storeMap = new Map()
  stores.forEach(s => storeMap.set(s.name.toUpperCase().trim(), s.id))

  const userMap = new Map()
  users.forEach(u => {
    userMap.set(u.name.toUpperCase().trim(), u.id)
    if (u.email) userMap.set(u.email.toLowerCase().trim(), u.id)
  })

  // 2. Sync Manager Emails (Fixing store managers)
  const managerData = {
    'BROTHERS CAR': 'luzdirecaoconsultoria@gmail.com,danieljsvendas@gmail.com,caiio.ce@hotmail.com,anderson.c.evangelista@hotmail.com,',
    'LIAL VEICULOS': 'luzdirecaoconsultoria@gmail.com,danieljsvendas@gmail.com,davi@lialveiculos.com.br,jessica@lialveiculos.com.br,',
    'PISCAR VEICULOS': 'luzdirecaoconsultoria@gmail.com,danieljsvendas@gmail.com,gabrieldcsamp@gmail.com, goncalvesleitevinicius@gmail.com, igor.r97@hotmail.com, gabrieldepaula337@gmail.com, Iago_rm@hotmail.com , adm@piscarveiculos.com.br,'
  }

  console.log('Syncing manager emails...')
  for (const [storeName, emails] of Object.entries(managerData)) {
    const storeId = storeMap.get(storeName)
    if (storeId) {
      await supabase.from('stores').update({ manager_email: emails }).eq('id', storeId)
    }
  }

  // 3. Parse CSV and import checkins
  console.log('Reading import_data.csv...')
  const fileContentRaw = fs.readFileSync('import_data.csv', 'utf-8')
  const lines = fileContentRaw.split(/\r?\n/)
  const startIdx = lines.findIndex(l => l.includes('Carimbo de data/hora') || l.includes('DATA,'))
  const fileContent = startIdx !== -1 ? lines.slice(startIdx).join('\n') : fileContentRaw
  const { headers, records } = parseCSV(fileContent)

  const getIdx = (name) => {
    const idxs = []
    headers.forEach((h, i) => { if (h.toUpperCase().includes(name.toUpperCase())) idxs.push(i) })
    return idxs
  }

  const storeIdxs = [...getIdx('Qual a sua Loja?'), ...getIdx('LOJA')]
  const nameIdxs = [...getIdx('Selecione seu Nome'), ...getIdx('VENDEDOR')]
  const dateIdxs = [...getIdx('Carimbo de data/hora'), ...getIdx('DATA')]
  const refDateIdxs = [...getIdx('DATA DE REFERÊNCIA'), ...getIdx('Data de Referência')]
  
  const leadsIdxs = [...getIdx('LEADS NOVOS RECEBIDOS NO DIA ANTERIOR'), ...getIdx('LEADS NOVOS DIA'), ...getIdx('LEADS')]
  const agdCartIdxs = [...getIdx('AGENDAMENTOS CARTEIRA ( HOJE )'), ...getIdx('Agendamentos Carteira (Hoje)'), ...getIdx('AGD_CART')]
  const agdNetIdxs = [...getIdx('AGENDAMENTOS INTERNET ( HOJE )'), ...getIdx('Agendamentos Internet (Hoje)'), ...getIdx('AGD_NET')]
  const vndPortaIdxs = [...getIdx('VENDAS PORTA ( ONTEM )'), ...getIdx('Vendas Porta (Ontem)'), ...getIdx('VND_PORTA')]
  const vndCartIdxs = [...getIdx('VENDAS CARTEIRA VENDEDOR ( ONTEM )'), ...getIdx('Vendas Carteira (Ontem)'), ...getIdx('VND_CART')]
  const vndNetIdxs = [...getIdx('VENDAS INTERNET ( ONTEM )'), ...getIdx('Vendas Internet (Ontem)'), ...getIdx('VND_NET')]
  const visitasIdxs = [...getIdx('COMPARECIMENTO DE VISITAS ( ONTEM )'), ...getIdx('VISITA')]

  const getValue = (row, idxs) => {
    for (const idx of idxs) { if (row[idx] && row[idx].trim()) return row[idx].trim() }
    return null
  }

  const checkinsToInsert = []
  const nameSubstitutions = {
    'LEANDRO': 'LEANDRO',
    'DAVID': 'DAVID RADES',
    'RYAN FELIPE': 'RYAN FELIPE ANDRADE',
    'EVERTON LUIZ': 'EVERTON LUIZ DA SILVA',
    'NATHAN ALVES': 'NATHAN ALVES CHAGAS',
    'BRUNO': 'BRUNO SANTOS',
    'DIELE': 'DIELLE',
    'JAMES': 'JAMES OLIVEIRA THOMAS',
    'ANTÔNIO PEREIRA': 'ANTÔNIO PEREIRA DA SILVA NETO',
    'CRISTINA DO CARMO': 'CRISTINA'
  }

  console.log('Processing records...')
  let sampleLogged = 0
  for (const row of records) {
    const storeName = getValue(row, storeIdxs)?.toUpperCase().trim()
    let rawName = getValue(row, nameIdxs)?.toUpperCase().trim()
    
    if (sampleLogged < 5) {
       console.log(`Sample Row: Store=${storeName}, Name=${rawName}`)
       sampleLogged++
    }
    
    if (!storeName || !rawName) continue

    const sellerName = nameSubstitutions[rawName] || rawName
    const storeId = storeMap.get(storeName)
    const userId = userMap.get(sellerName)

    if (!storeId || !userId) continue

    const refDateCsv = getValue(row, refDateIdxs) || getValue(row, dateIdxs)
    const dateStr = parseDate(refDateCsv)
    if (!dateStr) continue

    const leads = Math.max(0, parseInt(getValue(row, leadsIdxs) || '0') || 0)
    const agd_cart = Math.max(0, parseInt(getValue(row, agdCartIdxs) || '0') || 0)
    const agd_net = Math.max(0, parseInt(getValue(row, agdNetIdxs) || '0') || 0)
    const vnd_porta = Math.max(0, parseInt(getValue(row, vndPortaIdxs) || '0') || 0)
    const vnd_cart = Math.max(0, parseInt(getValue(row, vndCartIdxs) || '0') || 0)
    const vnd_net = Math.max(0, parseInt(getValue(row, vndNetIdxs) || '0') || 0)
    const visitas = Math.max(0, parseInt(getValue(row, visitasIdxs) || '0') || 0)

    checkinsToInsert.push({
      seller_user_id: userId,
      user_id: userId, // for legacy
      store_id: storeId,
      reference_date: dateStr,
      date: dateStr, // for legacy
      metric_scope: 'historical',
      submission_status: 'approved',
      submitted_late: true,
      
      // New columns
      leads_prev_day: leads,
      agd_cart_prev_day: agd_cart,
      agd_net_prev_day: agd_net,
      agd_cart_today: 0,
      agd_net_today: 0,
      vnd_porta_prev_day: vnd_porta,
      vnd_cart_prev_day: vnd_cart,
      vnd_net_prev_day: vnd_net,
      visit_prev_day: visitas,
      
      // Legacy columns
      leads, agd_cart, agd_net, vnd_porta, vnd_cart, vnd_net, visitas
    })
  }

  // Deduplicate by seller_user_id + storeId + referenceDate
  const uniqueMap = new Map()
  checkinsToInsert.forEach(c => {
    const key = `${c.seller_user_id}:${c.store_id}:${c.reference_date}`
    uniqueMap.set(key, c)
  })
  const finalRecords = Array.from(uniqueMap.values())

  console.log(`Syncing ${finalRecords.length} unique checkins (Delete + Insert)...`)
  const CHUNK = 100
  for (let i = 0; i < finalRecords.length; i += CHUNK) {
    const chunk = finalRecords.slice(i, i + CHUNK)
    
    for (const record of chunk) {
       // Delete potential conflicts on both constraints
       await supabase.from('daily_checkins').delete()
         .eq('seller_user_id', record.seller_user_id)
         .eq('store_id', record.store_id)
         .eq('reference_date', record.reference_date)
         
       await supabase.from('daily_checkins').delete()
         .eq('user_id', record.user_id)
         .eq('store_id', record.store_id)
         .eq('date', record.date)
    }

    const { error } = await supabase.from('daily_checkins').insert(chunk)
    if (error) console.error('Error at index', i, ':', error.message)
    else console.log(`Processed ${i + chunk.length}/${finalRecords.length}`)
  }

  console.log('\n--- SYNC COMPLETED ---')
}

run()
