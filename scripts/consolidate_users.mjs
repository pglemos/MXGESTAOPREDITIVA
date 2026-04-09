import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const primaryVendors = [
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

async function run() {
  console.log('--- INICIANDO CONSOLIDAÇÃO TOTAL DE VENDEDORES ---\n')
  
  const { data: allUsers } = await supabase.from('users').select('*')
  if (!allUsers) return

  for (const primary of primaryVendors) {
    const mainUser = allUsers.find(u => u.email === primary.email)
    if (!mainUser) {
      console.log(`! Primary user not found: ${primary.email}`)
      continue
    }

    console.log(`Consolidating for: ${mainUser.name} (${mainUser.id})`)

    // Find candidates to merge (same name or similar)
    const candidates = allUsers.filter(u => 
      u.id !== mainUser.id && 
      (
        u.name.toUpperCase().includes(primary.name.split(' ')[0]) || 
        (u.email && u.email.includes(primary.name.split(' ')[0].toLowerCase()))
      )
    )

    for (const old of candidates) {
      console.log(`  -> Merging from ${old.name} (${old.id})...`)
      
      // Move all related data
      const tables = [
        { name: 'daily_checkins', col: 'seller_user_id' },
        { name: 'daily_checkins', col: 'user_id' },
        { name: 'pdis', col: 'seller_id' },
        { name: 'feedbacks', col: 'seller_id' },
        { name: 'rankings', col: 'user_id' },
        { name: 'store_sellers', col: 'seller_user_id' }
      ]

      for (const t of tables) {
        const { error } = await supabase.from(t.name).update({ [t.col]: mainUser.id }).eq(t.col, old.id)
        if (error) {
           // Ignore errors if data exists for both (will handle duplicates later)
        }
      }
      
      // Delete old store_sellers records that might conflict
      await supabase.from('store_sellers').delete().eq('seller_user_id', old.id)
      
      // Delete old user record
      const { error: delError } = await supabase.from('users').delete().eq('id', old.id)
      if (delError) {
        console.error(`    ! Could not delete user ${old.id}: ${delError.message}`)
      } else {
        console.log(`    ✅ Deleted old user record.`)
      }
    }
  }

  console.log('\n--- LIMPANDO DUPLICATAS EM DAILY_CHECKINS ---\n')
  
  const { data: allCheckins } = await supabase.from('daily_checkins').select('*').order('reference_date', { ascending: false })
  
  const seen = new Map()
  const toDelete = []

  for (const c of allCheckins) {
    const key = `${c.seller_user_id}:${c.store_id}:${c.reference_date}`
    if (seen.has(key)) {
      toDelete.push(c.id)
    } else {
      seen.set(key, c.id)
    }
  }

  console.log(`Encontrados ${toDelete.length} registros duplicados para deletar.`)
  
  if (toDelete.length > 0) {
    for (let i = 0; i < toDelete.length; i += 100) {
      const chunk = toDelete.slice(i, i + 100)
      await supabase.from('daily_checkins').delete().in('id', chunk)
      console.log(`Deletados ${i + chunk.length}/${toDelete.length}`)
    }
  }

  console.log('\n--- CONSOLIDAÇÃO CONCLUÍDA ---')
}

run()
