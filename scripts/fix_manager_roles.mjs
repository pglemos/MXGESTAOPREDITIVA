import { execSync } from 'child_process'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const managerEmails = [
  'caiio.ce@hotmail.com', 'anderson.c.evangelista@hotmail.com',
  'davi@lialveiculos.com.br', 'jessica@lialveiculos.com.br',
  'gabrieldcsamp@gmail.com', 'goncalvesleitevinicius@gmail.com',
  'igor.r97@hotmail.com', 'gabrieldepaula337@gmail.com',
  'iago_rm@hotmail.com', 'adm@piscarveiculos.com.br',
  'paaymotors@gmail.com', 'vendasbhz3@gmail.com',
  'agenciaseminovosbhz@gmail.com', 'washington2610@icloud.com',
  'brunohenriqueemi@gmail.com', 'acerttcar@gmail.com',
  'marcelohnogueira@yahoo.com.br', 'valmir.jjnunes@gmail.com',
  'tavinhobh2@hotmail.com', 'isabellaxpratique@gmail.com',
  'thiagodpaul10@gmail.com', 'regandini@gmail.com',
  'gandini.antonio@gmail.com', 'espindolacarros@gmail.com',
  'mr.rodrigo@outlook.com.br', 'pedrosantana784a@gmail.com',
  'theomorato77@gmail.com', 'leiladias85@icloud.com'
]

async function run() {
  console.log('--- ATUALIZANDO ROLES DE GERENTES ---\n')
  
  for (const email of managerEmails) {
    const emailLower = email.toLowerCase().trim()
    console.log(`Updating role for ${emailLower}...`)
    
    const cmd = `curl -s -X PATCH "${supabaseUrl}/rest/v1/users?email=eq.${emailLower}" \
      -H "apikey: ${serviceKey}" \
      -H "Authorization: Bearer ${serviceKey}" \
      -H "Content-Type: application/json" \
      -d '{"role": "manager"}'`
    
    execSync(cmd)
    console.log('  - OK')
  }
  
  // Special case for admins
  const admins = ['luzdirecaoconsultoria@gmail.com', 'danieljsvendas@gmail.com']
  for (const email of admins) {
    execSync(`curl -s -X PATCH "${supabaseUrl}/rest/v1/users?email=eq.${email.toLowerCase()}" \
      -H "apikey: ${serviceKey}" \
      -H "Authorization: Bearer ${serviceKey}" \
      -H "Content-Type: application/json" \
      -d '{"role": "admin"}'`)
    console.log(`Updated admin: ${email}`)
  }
}

run()
