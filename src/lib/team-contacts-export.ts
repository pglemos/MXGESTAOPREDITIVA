export const CONTACT_EXPORT_HEADERS = [
  'Loja',
  'Papel',
  'Nome',
  'Telefone',
  'Email',
  'Origem',
  'Vínculo desde',
] as const

export type TeamContactRow = Record<(typeof CONTACT_EXPORT_HEADERS)[number], string>

export type TeamContactSummaryRow = {
  Papel: string
  Origem: string
  Total: number
}

export type TeamContactsWorkbookSheet<T extends object = object> = {
  name: string
  rows: T[]
  headers: string[]
}

export type ContactExportUser = {
  id: string
  name?: string | null
  email?: string | null
  phone?: string | null
  active?: boolean | null
}

export type ContactExportPartner = {
  name?: string | null
  email?: string | null
  phone?: string | null
}

export type ContactExportStore = {
  id: string
  name?: string | null
  active?: boolean | null
  partners?: ContactExportPartner[] | null
}

export type ContactExportMembership = {
  user_id: string
  store_id: string
  role?: string | null
  is_active?: boolean | null
  ended_at?: string | null
  created_at?: string | null
  users?: ContactExportUser | null
  store?: ContactExportStore | null
}

export type ContactExportSellerTenure = {
  seller_user_id: string
  store_id: string
  started_at?: string | null
  ended_at?: string | null
  is_active?: boolean | null
}

export type BuildTeamContactRowsInput = {
  memberships: ContactExportMembership[]
  sellerTenures?: ContactExportSellerTenure[]
  stores?: ContactExportStore[]
  referenceDate?: string
}

const ROLE_LABELS: Record<string, string> = {
  dono: 'Dono',
  gerente: 'Gerente',
  vendedor: 'Vendedor',
}

const STORE_ROLES = new Set(Object.keys(ROLE_LABELS))

export function buildTeamContactRows(input: BuildTeamContactRowsInput): TeamContactRow[] {
  const referenceDate = input.referenceDate || new Date().toISOString().slice(0, 10)
  const tenureMap = new Map(
    (input.sellerTenures || []).map((tenure) => [`${tenure.store_id}:${tenure.seller_user_id}`, tenure]),
  )

  const userRows = input.memberships
    .filter((membership) => isExportableMembership(membership, tenureMap, referenceDate))
    .map((membership) => {
      const tenure = tenureMap.get(`${membership.store_id}:${membership.user_id}`)
      return buildRow({
        storeName: membership.store?.name,
        roleLabel: ROLE_LABELS[String(membership.role)],
        name: membership.users?.name,
        phone: membership.users?.phone,
        email: membership.users?.email,
        origin: 'usuarios/vinculos_loja',
        startedAt: membership.created_at || tenure?.started_at,
      })
    })

  const partnerRows = (input.stores || [])
    .filter((store) => store.active !== false)
    .flatMap((store) =>
      (store.partners || [])
        .filter((partner) => hasAnyContactValue(partner.name, partner.phone, partner.email))
        .map((partner) =>
          buildRow({
            storeName: store.name,
            roleLabel: 'Dono/Sócio',
            name: partner.name,
            phone: partner.phone,
            email: partner.email,
            origin: 'lojas.partners',
            startedAt: null,
          }),
        ),
    )

  return [...userRows, ...partnerRows]
}

export function summarizeTeamContacts(rows: TeamContactRow[]): TeamContactSummaryRow[] {
  const totals = new Map<string, TeamContactSummaryRow>()
  for (const row of rows) {
    const key = `${row.Papel}\u0000${row.Origem}`
    const current = totals.get(key) || { Papel: row.Papel, Origem: row.Origem, Total: 0 }
    current.Total += 1
    totals.set(key, current)
  }
  return Array.from(totals.values()).sort((a, b) =>
    a.Papel.localeCompare(b.Papel, 'pt-BR') || a.Origem.localeCompare(b.Origem, 'pt-BR'),
  )
}

export function buildTeamContactsWorkbook(rows: TeamContactRow[]): [
  TeamContactsWorkbookSheet<TeamContactRow>,
  TeamContactsWorkbookSheet<TeamContactSummaryRow>,
] {
  return [
    { name: 'Contatos', rows, headers: [...CONTACT_EXPORT_HEADERS] },
    { name: 'Resumo', rows: summarizeTeamContacts(rows), headers: ['Papel', 'Origem', 'Total'] },
  ]
}

function isExportableMembership(
  membership: ContactExportMembership,
  tenureMap: Map<string, ContactExportSellerTenure>,
  referenceDate: string,
) {
  const role = String(membership.role || '')
  if (!STORE_ROLES.has(role)) return false
  if (membership.is_active === false || membership.ended_at) return false
  if (!membership.users || membership.users.active === false) return false
  if (!membership.store || membership.store.active === false) return false

  if (role !== 'vendedor') return true
  const tenure = tenureMap.get(`${membership.store_id}:${membership.user_id}`)
  if (!tenure) return true
  if (tenure.is_active === false) return false
  if (tenure.started_at && tenure.started_at > referenceDate) return false
  if (tenure.ended_at && tenure.ended_at < referenceDate) return false
  return true
}

function buildRow(input: {
  storeName?: string | null
  roleLabel: string
  name?: string | null
  phone?: string | null
  email?: string | null
  origin: string
  startedAt?: string | null
}): TeamContactRow {
  return {
    Loja: clean(input.storeName),
    Papel: input.roleLabel,
    Nome: clean(input.name),
    Telefone: clean(input.phone),
    Email: clean(input.email),
    Origem: input.origin,
    'Vínculo desde': clean(input.startedAt),
  }
}

function hasAnyContactValue(...values: Array<string | null | undefined>) {
  return values.some((value) => clean(value).length > 0)
}

function clean(value: string | null | undefined) {
  return String(value || '').trim()
}
