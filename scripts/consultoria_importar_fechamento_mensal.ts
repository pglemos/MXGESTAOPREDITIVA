import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import XLSX from 'xlsx'

dotenv.config()

type Args = {
  clientId?: string
  file?: string
  dryRun: boolean
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const get = (name: string) => {
    const index = args.indexOf(name)
    return index >= 0 ? args[index + 1] : undefined
  }
  return {
    clientId: get('--client-id'),
    file: get('--file'),
    dryRun: args.includes('--dry-run'),
  }
}

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function findTable(sheet: XLSX.WorkSheet, required: string[]) {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null })
  const requiredNorm = required.map(normalize)
  const headerIndex = rows.findIndex((row) => {
    const normalized = row.map(normalize)
    return requiredNorm.every((requiredColumn) => normalized.includes(requiredColumn))
  })

  if (headerIndex < 0) {
    throw new Error(`Cabecalho nao encontrado. Colunas obrigatorias: ${required.join(', ')}`)
  }

  const headers = rows[headerIndex].map((value) => normalize(value))
  return rows.slice(headerIndex + 1)
    .filter((row) => row.some((value) => value !== null && value !== ''))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header || `col_${index}`, row[index] ?? null])))
}

function asNumber(value: unknown) {
  if (typeof value === 'number') return value
  const parsed = Number(String(value ?? '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function asDate(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const text = String(value ?? '').trim()
  if (!text) return new Date().toISOString().slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  const parts = text.split(/[/-]/)
  if (parts.length >= 2) {
    const [day, month, year = String(new Date().getFullYear())] = parts
    return `${year.padStart(4, '20')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  return new Date().toISOString().slice(0, 10)
}

function asMonth(value: unknown) {
  const date = asDate(value)
  return `${date.slice(0, 7)}-01`
}

async function main() {
  const args = parseArgs()
  if (!args.file) throw new Error('Use --file caminho.xlsx')
  if (!args.clientId && !args.dryRun) throw new Error('Use --client-id UUID ou --dry-run')

  const workbook = XLSX.readFile(args.file, { cellDates: true })
  for (const sheetName of ['Cadmkt', 'Cadven', 'Cadest']) {
    if (!workbook.Sheets[sheetName]) throw new Error(`Aba obrigatoria ausente: ${sheetName}`)
  }

  const marketing = findTable(workbook.Sheets.Cadmkt, ['Mês/Ano', 'Midia', 'Volume de Leads', 'Volume de Vendas', 'Investimento (R$)'])
  const sales = findTable(workbook.Sheets.Cadven, ['Data Venda', 'Veículo Vendido', 'Nome do Vendedor'])
  const inventory = findTable(workbook.Sheets.Cadest, ['Data Compra', 'Modelo', 'Tempo Estoque'])

  console.log('Fechamento mensal lido:')
  console.table({
    Cadmkt: marketing.length,
    Cadven: sales.length,
    Cadest: inventory.length,
  })

  if (args.dryRun) return

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.VITE_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) throw new Error('Configure SUPABASE_URL/VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_ANON_KEY.')
  const supabase = createClient(supabaseUrl, supabaseKey)

  const marketingRows = marketing.map((row) => ({
    client_id: args.clientId,
    reference_month: asMonth(row.mes_ano),
    media: String(row.midia || row.media || 'Indefinida'),
    leads_volume: asNumber(row.volume_de_leads || row.volume_leads) || 0,
    sales_volume: asNumber(row.volume_de_vendas || row.volume_vendas) || 0,
    investment: asNumber(row.investimento_r || row.investimento) || 0,
  }))

  const salesRows = sales.map((row) => ({
    client_id: args.clientId,
    sale_date: asDate(row.data_venda || row.data),
    seller_name: String(row.nome_do_vendedor || row.vendedor || row.consultor || ''),
    channel: String(row.canal || row.origem || ''),
    media: String(row.midia || row.media || ''),
    vehicle: String(row.veiculo_vendido || row.veiculo || row.modelo || ''),
    vehicle_year: row.ano ? String(row.ano) : null,
    model: String(row.modelo || ''),
    sale_value: asNumber(row.valor_de_venda || row.valor_venda || row.preco_venda || row.venda) || 0,
    purchase_value: asNumber(row.valor_de_compra || row.valor_compra || row.compra) || 0,
    preparation_expenses: asNumber(row.despesas_de_preparacao || row.preparacao || row.despesas_preparacao) || 0,
    source_payload: row,
  }))

  const referenceMonth = marketingRows[0]?.reference_month || `${new Date().toISOString().slice(0, 7)}-01`
  const over90 = inventory.filter((row) => (asNumber(row.tempo_estoque || row.dias_estoque || row.dias) || 0) > 90).length
  const snapshot = {
    client_id: args.clientId,
    reference_month: referenceMonth,
    total_stock: inventory.length,
    active_stock: inventory.length,
    percent_over_90_days: inventory.length ? over90 / inventory.length : 0,
    source_payload: { file: args.file },
  }

  const { data: snapshotRow, error: snapshotError } = await supabase
    .from('snapshots_estoque_consultoria')
    .upsert(snapshot, { onConflict: 'client_id,reference_month' })
    .select('id')
    .single()
  if (snapshotError) throw snapshotError

  const inventoryRows = inventory.map((row) => ({
    snapshot_id: snapshotRow.id,
    purchase_date: row.data_compra ? asDate(row.data_compra) : null,
    vehicle: String(row.veiculo || row.modelo || ''),
    vehicle_year: row.ano ? String(row.ano) : null,
    model: String(row.modelo || ''),
    fipe_price: asNumber(row.preco_fipe || row.fipe),
    sale_price: asNumber(row.preco_de_venda || row.valor_venda || row.preco_venda),
    km: asNumber(row.km || row.quilometragem),
    stock_days: asNumber(row.tempo_estoque || row.dias_estoque || row.dias),
    source_payload: row,
  }))

  const inserts = await Promise.all([
    marketingRows.length ? supabase.from('marketing_mensal_consultoria').upsert(marketingRows, { onConflict: 'client_id,reference_month,media' }) : { error: null },
    salesRows.length ? supabase.from('entradas_vendas_consultoria').insert(salesRows) : { error: null },
    inventoryRows.length ? supabase.from('itens_estoque_consultoria').insert(inventoryRows) : { error: null },
  ])

  const insertError = inserts.find((result) => result.error)?.error
  if (insertError) throw insertError

  console.log(`Importacao concluida para cliente ${args.clientId}.`)
}

main().catch((error) => {
  console.error('Falha ao importar fechamento mensal:', error.message || error)
  process.exit(1)
})
