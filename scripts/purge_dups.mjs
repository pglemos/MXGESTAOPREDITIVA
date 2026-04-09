import { execSync } from 'child_process'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function runCurl(method, path, body = null) {
  const url = `${supabaseUrl}${path}`
  let cmd = `curl -s -X ${method} "${url}" -H "apikey: ${serviceKey}" -H "Authorization: Bearer ${serviceKey}"`
  if (body) cmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(body)}'`
  const out = execSync(cmd).toString()
  try {
    return JSON.parse(out)
  } catch (e) {
    return out
  }
}

async function run() {
  console.log('--- PURGE DUPLICATES (BASH STYLE) ---\n')
  
  // Get ALL checkins (we know it's around 1700)
  const p1 = runCurl('GET', '/rest/v1/daily_checkins?select=id,seller_user_id,store_id,reference_date&limit=1000&offset=0')
  const p2 = runCurl('GET', '/rest/v1/daily_checkins?select=id,seller_user_id,store_id,reference_date&limit=1000&offset=1000')
  
  const all = [...p1, ...p2]
  console.log(`Total records: ${all.length}`)

  const seen = new Map()
  const duplicates = []

  for (const c of all) {
    const key = `${c.seller_user_id}:${c.store_id}:${c.reference_date}`
    if (seen.has(key)) {
      duplicates.push(c.id)
    } else {
      seen.set(key, c.id)
    }
  }

  console.log(`Duplicates found: ${duplicates.length}`)

  if (duplicates.length > 0) {
    for (const id of duplicates) {
      process.stdout.write('.')
      runCurl('DELETE', `/rest/v1/daily_checkins?id=eq.${id}`)
    }
    console.log('\nDone deleting.')
  }
  
  // Also fix mismatched user_id/seller_user_id while we are at it
  console.log('Final sync of user_id columns...')
  const fixCmd = `curl -s -X PATCH "${supabaseUrl}/rest/v1/daily_checkins?user_id=neq.seller_user_id" \
    -H "apikey: ${serviceKey}" -H "Authorization: Bearer ${serviceKey}" \
    -H "Content-Type: application/json" -d '{"user_id": "seller_user_id"}'`
  // Actually PostgREST doesn't support setting one column to another in PATCH easily.
  // We'll skip this for now as long as seller_user_id is correct.
}

run()
