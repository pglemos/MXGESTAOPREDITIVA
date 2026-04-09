import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sellersData = `
LEANDRO	ESPINDOLA AUTOMOVEIS	CONSULTOR DE VENDAS	leandrorudolfo1@gmail.com
DAVID RADES	ESPINDOLA AUTOMOVEIS	CONSULTOR DE VENDAS	davidgundam081@gmail.com
RYAN FELIPE ANDRADE	GANDINI AUTOMOVEIS	CONSULTOR DE VENDAS	feliperyan00@gmail.com
EVERTON LUIZ DA SILVA	GANDINI AUTOMOVEIS	CONSULTOR DE VENDAS	evertonmitoyo@hotmail.com
LUIZ HENRIQUE	GANDINI AUTOMOVEIS	CONSULTOR DE VENDAS	henriqueavilaconsultor@outlook.com
NATHAN ALVES CHAGAS	GANDINI AUTOMOVEIS	CONSULTOR DE VENDAS	nathan.alveschagas@yahoo.com
BRUNO SANTOS	LIAL VEICULOS	CONSULTOR DE VENDAS	gestaobrunosantos@gmail.com
DIELLE	LIAL VEICULOS	CONSULTOR DE VENDAS	Loja35114255@gmail.com 
JOÃO DANIEL VON DER HEIDE FREITAS	LIAL VEICULOS	CONSULTOR DE VENDAS	joaodanielvdhf@gmail.com
JAMES OLIVEIRA THOMAS	PAAY MOTORS	CONSULTOR DE VENDAS	jamesthomasolv@gmail.com
GUILHERME DUARTE CARDOSO SAMPAIO	PISCAR VEICULOS	CONSULTOR DE VENDAS	guilhermeduartesamp@gmail.com
EMERSON	RK2 MOTORS	CONSULTOR DE VENDAS	emersonnantonnio@hotmail.com
ANTÔNIO PEREIRA DA SILVA NETO	DNA VEICULOS 	CONSULTOR DE VENDAS	approntaresposta@gmail.com
CRISTINA	DNA VEICULOS 	CONSULTOR DE VENDAS	cristinacarmodesouza83@gmail.com
`.trim().split('\n')

async function run() {
  console.log('Fetching stores...')
  const { data: stores, error: storesError } = await supabase.from('stores').select('*')
  
  if (storesError) {
    console.error('Error fetching stores:', storesError)
    return
  }

  const storeMap = new Map()
  for (const store of stores) {
    const normalizedName = store.name.trim().toUpperCase().replace(/\s+/g, ' ')
    storeMap.set(normalizedName, store.id)
  }

  for (const line of sellersData) {
    const parts = line.split('\t').map(p => p.trim())
    if (parts.length < 4) continue
    
    const [name, storeNameRaw, role, email] = parts
    const storeName = storeNameRaw.toUpperCase().replace(/\s+/g, ' ')
    const emailLower = email.toLowerCase()

    const storeId = storeMap.get(storeName)
    if (!storeId) {
      console.warn(`⚠️ Store not found for "${storeNameRaw}" (Seller: ${name})`)
      continue
    }

    console.log(`Linking ${name} (${emailLower}) to ${storeNameRaw} (${storeId})...`)

    // First find user by email
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', emailLower)

    if (fetchError) {
      console.error(`❌ Error fetching ${emailLower}:`, fetchError)
      continue
    }

    let userId = null

    if (users && users.length > 0) {
      userId = users[0].id
      console.log(`✅ Found user ${name} in users table with ID ${userId}.`)
    } else {
      console.log(`⚠️ User ${emailLower} not found. Creating a new auth user and public.user record...`)
      
      // Let's create an auth user via Admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: emailLower,
        email_confirm: true,
        user_metadata: { name: name }
      })

      if (authError) {
        console.error(`❌ Error creating auth user for ${emailLower}:`, authError)
        continue
      }
      
      userId = authData.user.id
      console.log(`✅ Auth user created with ID ${userId}`)
      
      // Upsert into users just in case trigger didn't fire immediately
      const { error: insertError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: emailLower,
          name: name,
          role: 'vendedor',
          is_venda_loja: false,
          active: true
        })
        
      if (insertError) {
         console.error(`❌ Error upserting ${emailLower}:`, insertError)
         continue
      } else {
         console.log(`✅ Successfully upserted ${name} into users table.`)
      }
    }
    
    // Now ensure the store link exists in store_sellers
    const { data: existingLink, error: checkLinkError } = await supabase
      .from('store_sellers')
      .select('*')
      .eq('store_id', storeId)
      .eq('seller_user_id', userId)

    if (checkLinkError) {
       console.error(`❌ Error checking store_sellers link for ${emailLower}:`, checkLinkError)
       continue
    }
    
    if (existingLink && existingLink.length > 0) {
      console.log(`✅ User ${name} is already linked to ${storeNameRaw}.`)
    } else {
      const { error: linkError } = await supabase
        .from('store_sellers')
        .insert({
          store_id: storeId,
          seller_user_id: userId,
          is_active: true,
          started_at: new Date().toISOString()
        })
        
      if (linkError) {
         console.error(`❌ Error linking ${emailLower} to store_sellers:`, linkError)
      } else {
         console.log(`✅ Successfully linked ${name} to ${storeNameRaw} in store_sellers.`)
      }
    }
  }
}

run()
