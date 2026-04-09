import { execSync } from 'child_process'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const data = JSON.parse(fs.readFileSync('final_payload.json', 'utf8'))

async function run() {
  console.log(`Importando ${data.length} registros UM POR UM para segurança total...`)
  
  let success = 0
  let error = 0

  for (let i = 0; i < data.length; i++) {
    const record = data[i]
    const cmd = `curl -s -X POST "${supabaseUrl}/rest/v1/daily_checkins" \
      -H "apikey: ${serviceKey}" \
      -H "Authorization: Bearer ${serviceKey}" \
      -H "Content-Type: application/json" \
      -H "Prefer: resolution=merge-duplicates" \
      -d '${JSON.stringify(record)}'`
    
    try {
      execSync(cmd)
      success++
      if (success % 50 === 0) console.log(`Progresso: ${success}/${data.length}`)
    } catch (e) {
      error++
      // console.error(`\nErro no registro ${i}: ${e.message}`)
    }
  }
  console.log(`\n\n✅ CONCLUÍDO! Sucessos: ${success}, Erros: ${error}`)
}

run()
