#!/usr/bin/env tsx
/**
 * Provisiona os 4 colaboradores admin da equipe MX.
 *
 * Pré-requisito: rodar `tsx scripts/audit_mx_team_access.ts` antes
 * e revisar o relatório em docs/audit/.
 *
 * Uso (dry-run):  tsx scripts/provision_mx_team.ts
 * Uso (apply):    tsx scripts/provision_mx_team.ts --apply
 *
 * Variáveis: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * - Cada colaborador é criado com role=admin e senha 123456.
 * - must_change_password = true (forçará troca no primeiro login).
 * - Admins MX não recebem membership inicial, porque `memberships.role`
 *   aceita apenas dono/gerente/vendedor.
 */
import { createClient } from '@supabase/supabase-js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv()

const MX_COLLABORATORS = [
  { name: 'Daniel', email: 'danieljsvendas@gmail.com' },
  { name: 'Gedson', email: 'gedson.freire.localiza@gmail.com' },
  { name: 'João', email: 'camarajoaoaugusto@gmail.com' },
  { name: 'Mariane', email: 'marianedcs@gmail.com' },
] as const

const APPLY = process.argv.includes('--apply')
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEFAULT_PASSWORD = '123456'

interface ProvisionResult {
  name: string
  email: string
  action: 'created' | 'updated_role' | 'skipped' | 'error'
  detail: string
  user_id: string | null
}

async function provision(email: string, name: string): Promise<ProvisionResult> {
  const lower = email.trim().toLowerCase()
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const existing = list?.users.find((u) => (u.email || '').toLowerCase() === lower)

  if (existing) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', existing.id)
      .maybeSingle()

    if (!APPLY) {
      return {
        name,
        email: lower,
        action: 'updated_role',
        detail: `[DRY-RUN] garantiria role "${profile?.role || '?'}" → "admin", senha=${DEFAULT_PASSWORD}, must_change_password=true`,
        user_id: existing.id,
      }
    }

    const { error: authError } = await supabase.auth.admin.updateUserById(existing.id, {
      password: DEFAULT_PASSWORD,
      user_metadata: {
        ...(existing.user_metadata || {}),
        name,
        role: 'admin',
        must_change_password: true,
      },
    })

    if (authError) return { name, email: lower, action: 'error', detail: `auth: ${authError.message}`, user_id: existing.id }

    const { error } = await supabase
      .from('users')
      .upsert(
        { id: existing.id, email: lower, name, role: 'admin', active: true, must_change_password: true },
        { onConflict: 'id' },
      )

    if (error) return { name, email: lower, action: 'error', detail: error.message, user_id: existing.id }
    return {
      name,
      email: lower,
      action: 'updated_role',
      detail: `admin garantido; senha temporária ${DEFAULT_PASSWORD}; must_change_password=true`,
      user_id: existing.id,
    }
  }

  if (!APPLY) {
    return {
      name,
      email: lower,
      action: 'created',
      detail: `[DRY-RUN] criaria usuário com password=${DEFAULT_PASSWORD}, role=admin, must_change_password=true`,
      user_id: null,
    }
  }

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: lower,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { name, role: 'admin', must_change_password: true },
  })
  if (createErr || !created?.user) {
    return { name, email: lower, action: 'error', detail: createErr?.message || 'createUser falhou', user_id: null }
  }

  const userId = created.user.id

  const { error: profileErr } = await supabase
    .from('users')
    .upsert(
      { id: userId, email: lower, name, role: 'admin', active: true, must_change_password: true },
      { onConflict: 'id' },
    )
  if (profileErr) return { name, email: lower, action: 'error', detail: `profile: ${profileErr.message}`, user_id: userId }

  return {
    name,
    email: lower,
    action: 'created',
    detail: `criado com senha temporária ${DEFAULT_PASSWORD}, must_change_password=true, sem membership inicial`,
    user_id: userId,
  }
}

async function main() {
  console.log(`Modo: ${APPLY ? 'APLICAR' : 'DRY-RUN (use --apply para escrever)'}\n`)
  console.log('Membership inicial: não aplicável para role=admin\n')

  const results: ProvisionResult[] = []
  for (const c of MX_COLLABORATORS) {
    const r = await provision(c.email, c.name)
    results.push(r)
    console.log(`[${r.action.padEnd(13)}] ${r.name.padEnd(10)} ${r.email.padEnd(36)} → ${r.detail}`)
  }

  const date = new Date().toISOString().slice(0, 10)
  const outDir = join(process.cwd(), 'docs', 'audit')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, `mx-team-provisioning-log-${date}${APPLY ? '' : '-dryrun'}.md`)

  const md = `# Provisionamento Equipe MX — ${APPLY ? 'APPLY' : 'DRY-RUN'}

**Data:** ${date}
**Script:** scripts/provision_mx_team.ts
**Membership inicial:** não aplicável para role=admin

| Nome | Email | Ação | User ID | Detalhe |
|------|-------|------|---------|---------|
${results
  .map((r) => `| ${r.name} | \`${r.email}\` | **${r.action}** | ${r.user_id || '-'} | ${r.detail} |`)
  .join('\n')}

## Próximos passos

${
  APPLY
    ? '1. Compartilhar credenciais com cada colaborador (ver `docs/templates/welcome-message-mx-admin.md`).\n2. Rodar `tsx scripts/audit_mx_team_access.ts` novamente para validar estado final.'
    : '1. Revisar este dry-run.\n2. Rodar novamente com `--apply` para efetivar mudanças.'
}
`
  writeFileSync(outPath, md, 'utf8')
  console.log(`\nLog salvo em: ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
