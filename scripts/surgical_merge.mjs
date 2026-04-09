import { execSync } from 'child_process'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const mergeMap = [
  // FROM_ID -> TO_ID
  { from: '0c40fb2c-5480-4fcb-bcee-c9ec7a2861f2', to: '4a8658af-e555-44ac-8591-e976fd9b5408' }, // Leandro
  { from: '14427366-bf8b-4c63-bb12-dff76f7ac1a0', to: '4a8658af-e555-44ac-8591-e976fd9b5408' }, // Leandro
  { from: '82b3660b-43f5-444f-b71e-e1f624fb8997', to: 'f9cc4a50-d992-4241-a9bd-85b056b43625' }, // David
  { from: '97a1d2a1-980a-481c-a69f-306aaad30ce0', to: '5189ad9e-a11e-4928-89f9-5ccc148aaa8e' }, // Ryan
  { from: 'f4758b36-3e5c-4aeb-a0ae-0bb87f0ed24d', to: 'bfee92a4-1940-4295-bb89-6094586901e7' }, // Everton
  { from: '0fd9917e-e4ba-469a-815e-39df033520b7', to: 'ab31d2a5-9471-4152-83e2-88c96c50e19e' }, // Luiz
  { from: '3820b1c4-99f0-4741-b43c-bcc2bc8c8595', to: '0aa67515-7077-4284-b0c9-1bf630cbb3a0' }, // Nathan
  { from: '3ec6bef0-2196-4d51-9655-76395c61bdd1', to: '205de015-e498-48a0-a7d7-723ca812529d' }, // Bruno
  { from: '75a0a774-579b-4528-8481-1613298af779', to: '205de015-e498-48a0-a7d7-723ca812529d' }, // Bruno
  { from: 'b9320c7e-7f6c-4814-892d-ce46dba6e371', to: '205de015-e498-48a0-a7d7-723ca812529d' }, // Bruno
  { from: '1a96445e-031c-47c3-8087-230a454741a7', to: 'ca25ede2-fda5-4213-b013-c74e32de432d' }, // Joao Pinheiro to Joao Daniel
  { from: 'c9045473-352a-49af-9699-5a47d94274db', to: 'ca25ede2-fda5-4213-b013-c74e32de432d' }, // JOAO to Joao Daniel
  { from: 'fd1f62b5-d951-4f9c-b4ea-b6368c80369c', to: 'efa27765-a4ea-4015-b82b-b0767732aef1' }, // James
  { from: 'd579c0f7-c96e-41fa-90f7-c3981fa07adc', to: '05a89d50-35b5-419d-909e-e1edff76a07d' }, // Guilherme
  { from: 'f8058fe8-bd11-424c-8141-594500a0e10c', to: '05a89d50-35b5-419d-909e-e1edff76a07d' }, // Guilherme
  { from: '287ccbad-4194-4d8d-916e-e4b262e98e13', to: '255df7a8-b5c1-4294-81d9-285746e7b262' }, // Emerson
  { from: 'e1eb9a1a-3238-4757-9db8-037cf33e6435', to: 'ef409437-fe1d-4bcc-8adb-adfdf19e5ca0' }, // Antonio
  { from: '56c38502-16df-4d2f-a54a-afd4422e6559', to: '014c105e-2ec9-4ce1-b982-04dd176f3808' }  // Cristina
]

function runCurl(method, path, body = null) {
  const url = `${supabaseUrl}${path}`
  let cmd = `curl -s -X ${method} "${url}" -H "apikey: ${serviceKey}" -H "Authorization: Bearer ${serviceKey}"`
  if (body) cmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(body)}'`
  return execSync(cmd).toString()
}

async function run() {
  console.log('--- CONSOLIDAÇÃO CIRÚRGICA ---\n')
  
  for (const m of mergeMap) {
    console.log(`Merging ${m.from} into ${m.to}...`)
    
    // Move daily_checkins
    runCurl('PATCH', `/rest/v1/daily_checkins?seller_user_id=eq.${m.from}`, { seller_user_id: m.to, user_id: m.to })
    runCurl('PATCH', `/rest/v1/daily_checkins?user_id=eq.${m.from}`, { seller_user_id: m.to, user_id: m.to })
    
    // Move pdis and feedbacks
    runCurl('PATCH', `/rest/v1/pdis?seller_id=eq.${m.from}`, { seller_id: m.to })
    runCurl('PATCH', `/rest/v1/feedbacks?seller_id=eq.${m.from}`, { seller_id: m.to })
    
    // Move rankings
    runCurl('PATCH', `/rest/v1/rankings?user_id=eq.${m.from}`, { user_id: m.to })
    
    // Move store_sellers
    runCurl('PATCH', `/rest/v1/store_sellers?seller_user_id=eq.${m.from}`, { seller_user_id: m.to })
    
    // Delete old user
    runCurl('DELETE', `/rest/v1/users?id=eq.${m.from}`)
    
    console.log('  - OK')
  }

  console.log('\n--- LIMPANDO DUPLICATAS DE DATAS ---\n')
  // This is the most important part to avoid "wrong" (summed) data
  const checkins = JSON.parse(runCurl('GET', '/rest/v1/daily_checkins?select=id,seller_user_id,store_id,reference_date&order=reference_date.desc'))
  const seen = new Set()
  for (const c of checkins) {
    const key = `${c.seller_user_id}:${c.store_id}:${c.reference_date}`
    if (seen.has(key)) {
      console.log(`Deleting duplicate: ${c.id} (${key})`)
      runCurl('DELETE', `/rest/v1/daily_checkins?id=eq.${c.id}`)
    } else {
      seen.add(key)
    }
  }

  console.log('\n--- CONSOLIDAÇÃO FINALIZADA ---')
}

run()
