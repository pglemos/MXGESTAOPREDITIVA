import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })

const repoRoot = process.cwd()
const templatePath = path.join(repoRoot, 'supabase/templates/recovery.html')
const linkedProjectPath = path.join(repoRoot, 'supabase/.temp/project-ref')

function inferProjectRef() {
  if (process.env.SUPABASE_PROJECT_REF) return process.env.SUPABASE_PROJECT_REF
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  if (!url) return null

  try {
    return new URL(url).hostname.split('.')[0] || null
  } catch {
    return null
  }
}

async function getProjectRef() {
  const inferred = inferProjectRef()
  if (inferred) return inferred

  try {
    return (await fs.readFile(linkedProjectPath, 'utf8')).trim()
  } catch {
    return null
  }
}

async function main() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error('SUPABASE_ACCESS_TOKEN e obrigatorio para atualizar templates no Supabase hosted.')
  }

  const projectRef = await getProjectRef()
  if (!projectRef) {
    throw new Error('SUPABASE_PROJECT_REF, SUPABASE_URL/VITE_SUPABASE_URL ou supabase/.temp/project-ref e obrigatorio.')
  }

  const content = await fs.readFile(templatePath, 'utf8')
  if (!content.includes('{{ .ConfirmationURL }}')) {
    throw new Error('Template invalido: {{ .ConfirmationURL }} nao encontrado.')
  }

  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mailer_subjects_recovery: 'Recuperar acesso | MX Performance',
      mailer_templates_recovery_content: content,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Falha ao atualizar template (${response.status}): ${text}`)
  }

  console.log(`Template de recuperacao atualizado no projeto ${projectRef}.`)
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
