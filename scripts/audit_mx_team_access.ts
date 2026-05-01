#!/usr/bin/env tsx
/**
 * Audita o estado de acesso dos colaboradores da equipe MX antes de
 * provisionar novos usuários. Detecta colisões com contas existentes,
 * roles divergentes e memberships ativos.
 *
 * Uso:
 *   tsx scripts/audit_mx_team_access.ts
 *
 * Variáveis necessárias:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Saída: docs/audit/mx-team-access-<DATA>.md
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

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

interface AuditRow {
  name: string
  email: string
  authExists: boolean
  authId: string | null
  authCreatedAt: string | null
  authLastSignIn: string | null
  publicProfileExists: boolean
  publicRole: string | null
  mustChangePassword: boolean | null
  active: boolean | null
  membershipsCount: number
  membershipsSummary: string
  recommendation: string
}

async function auditOne(email: string, name: string): Promise<AuditRow> {
  const lower = email.trim().toLowerCase()

  const { data: authList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const authUser = authList?.users.find((u) => (u.email || '').toLowerCase() === lower)

  let publicProfile: any = null
  let memberships: any[] = []

  if (authUser?.id) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, email, name, role, must_change_password, active')
      .eq('id', authUser.id)
      .maybeSingle()
    publicProfile = profile

    const { data: ms } = await supabase
      .from('memberships')
      .select('store_id, role, store:store_id(name)')
      .eq('user_id', authUser.id)
    memberships = ms || []
  } else {
    const { data: profile } = await supabase
      .from('users')
      .select('id, email, name, role, must_change_password, active')
      .ilike('email', lower)
      .maybeSingle()
    publicProfile = profile

    if (profile?.id) {
      const { data: ms } = await supabase
        .from('memberships')
        .select('store_id, role, store:store_id(name)')
        .eq('user_id', profile.id)
      memberships = ms || []
    }
  }

  const recommendation = (() => {
    if (!authUser && !publicProfile) return 'PROVISIONAR (novo usuário com role admin + senha 123456)'
    if (authUser && publicProfile?.role === 'admin') return 'JÁ EXISTE COMO ADMIN — somente revisar memberships'
    if (authUser && publicProfile && publicProfile.role !== 'admin') {
      return `ATUALIZAR ROLE de "${publicProfile.role}" → "admin" (decisão manual do PO antes de aplicar)`
    }
    if (authUser && !publicProfile) return 'CONTA AUTH ÓRFÃ — criar profile em public.users + atribuir role admin'
    return 'CASO INESPERADO — auditar manualmente'
  })()

  return {
    name,
    email: lower,
    authExists: !!authUser,
    authId: authUser?.id || null,
    authCreatedAt: authUser?.created_at || null,
    authLastSignIn: authUser?.last_sign_in_at || null,
    publicProfileExists: !!publicProfile,
    publicRole: publicProfile?.role || null,
    mustChangePassword: publicProfile?.must_change_password ?? null,
    active: publicProfile?.active ?? null,
    membershipsCount: memberships.length,
    membershipsSummary: memberships
      .map((m: any) => `${m.store?.name || m.store_id}:${m.role}`)
      .join(', ') || '-',
    recommendation,
  }
}

async function main() {
  console.log('Auditando acessos MX...\n')
  const rows: AuditRow[] = []
  for (const c of MX_COLLABORATORS) {
    const row = await auditOne(c.email, c.name)
    rows.push(row)
    console.log(`✓ ${row.name.padEnd(10)} | auth=${row.authExists ? 'sim' : 'NÃO'} | role=${row.publicRole ?? '-'} | ${row.recommendation}`)
  }

  const date = new Date().toISOString().slice(0, 10)
  const outDir = join(process.cwd(), 'docs', 'audit')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, `mx-team-access-${date}.md`)
  const allReady = rows.every((r) => r.authExists && r.publicProfileExists && r.publicRole === 'admin' && r.mustChangePassword === true)

  const md = `# Auditoria de Acessos — Equipe MX

**Data:** ${date}
**Script:** scripts/audit_mx_team_access.ts
**Total auditados:** ${rows.length}

| Nome | Email | Auth? | Profile? | Role | must_change_password | active | Memberships | Recomendação |
|------|-------|-------|----------|------|----------------------|--------|-------------|--------------|
${rows
  .map(
    (r) =>
      `| ${r.name} | \`${r.email}\` | ${r.authExists ? '✅' : '❌'} | ${r.publicProfileExists ? '✅' : '❌'} | ${r.publicRole || '-'} | ${r.mustChangePassword ?? '-'} | ${r.active ?? '-'} | ${r.membershipsSummary} | ${r.recommendation} |`,
  )
  .join('\n')}

## Próximos passos

${
  allReady
    ? '1. Compartilhar credenciais usando `docs/templates/welcome-message-mx-admin.md`.\n2. Cada colaborador faz login com `123456` e troca a senha no primeiro acesso.'
    : '1. PO revisa este relatório.\n2. Para cada linha "PROVISIONAR": rodar a edge function `register-user` com role=admin e password=123456.\n3. Para cada linha "ATUALIZAR ROLE": confirmar com PO antes de aplicar UPDATE.\n4. Auditoria final: rodar este script novamente após provisionamento e arquivar.'
}

---

_Gerado automaticamente por scripts/audit_mx_team_access.ts._
`

  writeFileSync(outPath, md, 'utf8')
  console.log(`\nRelatório salvo em: ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
