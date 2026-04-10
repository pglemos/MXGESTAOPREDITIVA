import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import dotenv from 'dotenv'
import { execSync } from 'child_process'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceKey)

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function parseDate(dateStr) {
  if (!dateStr) return null
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    let [d, m, y] = parts
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return null
}

async function run() {
  console.log('--- PROCESSANDO FONTE DA VERDADE (MODO ROBUSTO) ---\n')

  const content = fs.readFileSync('fonte_da_verdade.csv', 'utf8')
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0)
  const dataLines = lines.slice(2)

  const storesDB = JSON.parse(fs.readFileSync('stores_truth.json', 'utf8'))
  const storeMap = new Map()
  storesDB.forEach(s => storeMap.set(s.name.toUpperCase().trim(), s.id))

  const sellersMap = new Map()
  const checkins = []

  for (const line of dataLines) {
    const values = line.split(',').map(v => v.trim())
    if (values.length < 10) continue

    const [dateRaw, storeNameRaw, sellerNameRaw, leads, vndPorta, agdCart, vndCart, agdNet, vndNet, visita, emailRaw, loginRaw, senhaRaw] = values
    
    const storeName = storeNameRaw.toUpperCase().trim()
    const sellerName = sellerNameRaw.toUpperCase().trim()
    const storeId = storeMap.get(storeName) || storeMap.get(storeName.replace('MOTORS', 'Motors'))

    if (!storeId) continue

    if (!sellersMap.has(sellerName)) {
      let email = emailRaw || loginRaw
      if (!email || !email.includes('@')) {
        email = `${sellerName.toLowerCase().replace(/\s+/g, '.')}.${storeName.toLowerCase().split(' ')[0]}@mxperformance.com.br`
      }
      
      sellersMap.set(sellerName, {
        name: sellerName,
        email: email.toLowerCase(),
        password: senhaRaw || generatePassword(),
        storeId: storeId,
        storeName: storeName
      })
    }

    const refDate = parseDate(dateRaw)
    if (refDate && refDate.startsWith('2026')) {
      checkins.push({
        sellerName: sellerName,
        storeId: storeId,
        date: refDate,
        leads: parseInt(leads) || 0,
        vnd_porta: parseInt(vndPorta) || 0,
        agd_cart: parseInt(agdCart) || 0,
        vnd_cart: parseInt(vndCart) || 0,
        agd_net: parseInt(agdNet) || 0,
        vnd_net: parseInt(vndNet) || 0,
        visitas: parseInt(visita) || 0
      })
    }
  }

  const finalSellers = []
  console.log('Sincronizando vendedores...')

  for (const seller of sellersMap.values()) {
    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: seller.email,
        password: seller.password,
        email_confirm: true,
        user_metadata: { name: seller.name }
      })

      let userId
      if (authError) {
        const { data: list } = await supabase.auth.admin.listUsers()
        userId = list.users.find(u => u.email === seller.email)?.id
        if (userId) await supabase.auth.admin.updateUserById(userId, { password: seller.password })
      } else {
        userId = authUser.user.id
      }

      if (userId) {
        await supabase.from('users').upsert({ id: userId, name: seller.name, email: seller.email, role: 'vendedor', active: true })
        await supabase.from('store_sellers').upsert({ store_id: seller.storeId, seller_user_id: userId, is_active: true }, { onConflict: 'store_id,seller_user_id' })
        finalSellers.push({ ...seller, id: userId })
        process.stdout.write('.')
      }
    } catch (e) {
      console.error(`Error processing ${seller.name}: ${e.message}`)
    }
  }

  console.log('\nConsolidando performance...')
  const consolidated = new Map()
  for (const c of checkins) {
    const user = finalSellers.find(s => s.name === c.sellerName)
    if (!user) continue
    const key = `${user.id}:${c.storeId}:${c.date}`
    if (!consolidated.has(key)) {
      consolidated.set(key, {
        seller_user_id: user.id, user_id: user.id, store_id: c.storeId, reference_date: c.date, date: c.date, metric_scope: 'daily',
        leads: 0, agd_cart: 0, agd_net: 0, vnd_porta: 0, vnd_cart: 0, vnd_net: 0, visitas: 0
      })
    }
    const r = consolidated.get(key)
    r.leads += c.leads; r.agd_cart += c.agd_cart; r.agd_net += c.agd_net; r.vnd_porta += c.vnd_porta; r.vnd_cart += c.vnd_cart; r.vnd_net += c.vnd_net; r.visitas += c.visitas
  }

  const payload = Array.from(consolidated.values()).map(r => ({
    ...r, leads_prev_day: r.leads, agd_cart_today: r.agd_cart, agd_net_today: r.agd_net,
    vnd_porta_prev_day: r.vnd_porta, vnd_cart_prev_day: r.vnd_cart, vnd_net_prev_day: r.vnd_net,
    visit_prev_day: r.visitas, submission_status: 'approved', submitted_at: new Date().toISOString()
  }))

  console.log(`Payload gerado: ${payload.length} registros.`)
  fs.writeFileSync('truth_payload.json', JSON.stringify(payload, null, 2))
  
  console.log('\n--- RELATÓRIO DE ACESSOS ---')
  finalSellers.forEach(s => {
    console.log(`VENDEDOR: ${s.name} | LOJA: ${s.storeName} | LOGIN: ${s.email} | SENHA: ${s.password}`)
  })
}

run()
