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
  try { return JSON.parse(out) } catch (e) { return out }
}

async function run() {
  console.log('--- LIMPANDO TODAS AS DUPLICATAS DE CHECK-IN ---\n')
  
  let allCheckins = []
  let offset = 0
  while (true) {
    console.log(`Fetching batch at offset ${offset}...`)
    const batch = runCurl('GET', `/rest/v1/daily_checkins?select=id,seller_user_id,store_id,reference_date&order=reference_date.desc&limit=1000&offset=${offset}`)
    if (!batch || batch.length === 0) break
    allCheckins = allCheckins.concat(batch)
    if (batch.length < 1000) break
    offset += 1000
  }

  console.log(`Total de registros para analisar: ${allCheckins.length}`)
  
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

  console.log(`Encontrados ${toDelete.length} duplicados.`)

  if (toDelete.length > 0) {
    console.log('Iniciando deleção...')
    for (let i = 0; i < toDelete.length; i += 50) {
      const chunk = toDelete.slice(i, i + 50)
      const filter = chunk.map(id => `id.eq.${id}`).join(',')
      // Use or filter for batch delete if possible, or individual calls
      for (const id of chunk) {
        runCurl('DELETE', `/rest/v1/daily_checkins?id=eq.${id}`)
      }
      console.log(`Progresso: ${i + chunk.length}/${toDelete.length}`)
    }
  }

  console.log('\n--- LIMPEZA CONCLUÍDA ---')
}

run()
