import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
  const { data: users, error } = await supabase.from('users').select('*')
  
  const sellersData = [
    { name: 'LEANDRO', email: 'leandrorudolfo1@gmail.com' },
    { name: 'DAVID RADES', email: 'davidgundam081@gmail.com', oldName: 'DAVID' },
    { name: 'RYAN FELIPE ANDRADE', email: 'feliperyan00@gmail.com', oldName: 'RYAN FELIPE' },
    { name: 'EVERTON LUIZ DA SILVA', email: 'evertonmitoyo@hotmail.com', oldName: 'EVERTON LUIZ' },
    { name: 'LUIZ HENRIQUE', email: 'henriqueavilaconsultor@outlook.com' },
    { name: 'NATHAN ALVES CHAGAS', email: 'nathan.alveschagas@yahoo.com', oldName: 'NATHAN ALVES' },
    { name: 'BRUNO SANTOS', email: 'gestaobrunosantos@gmail.com', oldName: 'BRUNO' },
    { name: 'DIELLE', email: 'loja35114255@gmail.com', oldName: 'DIELE' },
    { name: 'JOÃO DANIEL VON DER HEIDE FREITAS', email: 'joaodanielvdhf@gmail.com' },
    { name: 'JAMES OLIVEIRA THOMAS', email: 'jamesthomasolv@gmail.com', oldName: 'JAMES' },
    { name: 'GUILHERME DUARTE CARDOSO SAMPAIO', email: 'guilhermeduartesamp@gmail.com' },
    { name: 'EMERSON', email: 'emersonnantonnio@hotmail.com' },
    { name: 'ANTÔNIO PEREIRA DA SILVA NETO', email: 'approntaresposta@gmail.com', oldName: 'ANTÔNIO PEREIRA' },
    { name: 'CRISTINA', email: 'cristinacarmodesouza83@gmail.com', oldName: 'CRISTINA DO CARMO' }
  ]
  
  for (const seller of sellersData) {
    const newRecord = users.find(u => u.email === seller.email)
    if (!newRecord) {
      console.log(`Could not find new record for ${seller.email}`)
      continue
    }
    
    const newId = newRecord.id
    
    const oldRecordCandidates = users.filter(u => 
      u.id !== newId && 
      (
        u.name.toUpperCase().includes(seller.name.toUpperCase()) || 
        (seller.oldName && u.name.toUpperCase().includes(seller.oldName.toUpperCase()))
      )
    )
    
    if (oldRecordCandidates.length === 0) {
      console.log(`No old record found for ${seller.name} (${seller.email})`)
      continue
    }
    
    const oldId = oldRecordCandidates[0].id
    console.log(`Migrating data for ${seller.name} from old ID ${oldId} (${oldRecordCandidates[0].name}) to new ID ${newId}`)
    
    const tablesWithSellerUserId = ['daily_checkins', 'store_sellers']
    const tablesWithSellerId = ['pdis', 'feedbacks']
    
    for (const table of tablesWithSellerUserId) {
       if (table === 'store_sellers') {
         await supabase.from('store_sellers').delete().eq('seller_user_id', newId)
       }
       
       const { error: updateError } = await supabase
         .from(table)
         .update({ seller_user_id: newId })
         .eq('seller_user_id', oldId)
         
       if (updateError) {
         console.log(`  ! Error migrating ${table}: ${updateError.message}`)
       } else {
         console.log(`  - Migrated ${table}`)
       }
    }
    
    for (const table of tablesWithSellerId) {
       const { error: updateError } = await supabase
         .from(table)
         .update({ seller_id: newId })
         .eq('seller_id', oldId)
         
       if (updateError) {
         console.log(`  ! Error migrating ${table}: ${updateError.message}`)
       } else {
         console.log(`  - Migrated ${table}`)
       }
    }
    
    const { error: rankingErr } = await supabase.from('rankings').update({ user_id: newId }).eq('user_id', oldId)
    if (!rankingErr) console.log('  - Migrated rankings')
    
    console.log(`  - Data migrated. Old user ${oldId} can be deleted manually.`)
  }
}

run()
