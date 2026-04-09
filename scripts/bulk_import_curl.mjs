import { execSync } from 'child_process'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const data = JSON.parse(fs.readFileSync('final_payload.json', 'utf8'))

async function run() {
  console.log(`Importando ${data.length} registros em lotes de 10...`)
  
  for (let i = 0; i < data.length; i += 10) {
    const chunk = data.slice(i, i + 10)
    const cmd = `curl -s -X POST "${supabaseUrl}/rest/v1/daily_checkins" \
      -H "apikey: ${serviceKey}" \
      -H "Authorization: Bearer ${serviceKey}" \
      -H "Content-Type: application/json" \
      -H "Prefer: resolution=merge-duplicates" \
      -d '${JSON.stringify(chunk)}'`
    
    try {
      execSync(cmd)
      process.stdout.write('.')
      if ((i + 10) % 100 === 0) console.log(` ${i + 10}/${data.length}`)
    } catch (e) {
      console.error(`\nErro no lote ${i}: ${e.message}`)
    }
  }
  console.log('\n\n✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!')
}

run()
