import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.VITE_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Configure SUPABASE_URL/VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_ANON_KEY.')
}

const supabase = createClient(supabaseUrl, supabaseKey)

const catalog = [
  ['sales_total', 'Vendas totais', 'increase', 'number', 'Vendas', 'daily', null, 10],
  ['sales_internet', 'Vendas Internet', 'increase', 'number', 'Vendas', 'daily', null, 20],
  ['leads_received', 'Leads recebidos', 'increase', 'number', 'Vendas', 'marketing', null, 30],
  ['appointments', 'Agendamentos', 'increase', 'number', 'Vendas', 'daily', null, 40],
  ['visits', 'Comparecimentos', 'increase', 'number', 'Vendas', 'daily', null, 50],
  ['lead_to_appointment_rate', 'Conversao de leads em agendamentos', 'increase', 'percent', 'Vendas', 'computed', 'appointments/leads_received', 60],
  ['appointment_to_visit_rate', 'Conversao de agendamentos em visitas', 'increase', 'percent', 'Vendas', 'computed', 'visits/appointments', 70],
  ['visit_to_sale_rate', 'Conversao de visitas em vendas', 'increase', 'percent', 'Vendas', 'computed', 'sales_internet/visits', 80],
  ['internet_cost_per_sale', 'Custo por venda na internet', 'decrease', 'currency', 'Marketing', 'computed', 'internet_investment/sales_internet', 90],
  ['stock_turnover', 'Giro de Estoque', 'increase', 'number', 'Estoque', 'computed', 'sales_total/stock_total', 100],
  ['stock_over_90_rate', 'Tempo de Estoque +90', 'decrease', 'percent', 'Estoque', 'inventory', null, 110],
  ['avg_margin', 'Margem Media', 'increase', 'currency', 'Gestao', 'dre', null, 120],
]

const parameterValues = [
  ['lead_to_appointment_rate', 0.20, 0.30, 0.20, 0.10, 0.20, 0.30, 'Parametro 20/60/33 citado na reuniao.'],
  ['appointment_to_visit_rate', 0.60, 0.70, 0.60, 0.40, 0.60, 0.70, 'Parametro 20/60/33 citado na reuniao.'],
  ['visit_to_sale_rate', 0.33, 0.40, 0.33, 0.20, 0.33, 0.40, 'Parametro 20/60/33 citado na reuniao.'],
  ['internet_cost_per_sale', 940, 650, 650, 1200, 940, 650, 'Valor base extraido dos materiais PMR.'],
  ['stock_turnover', 0.45, 0.65, 0.70, 0.30, 0.45, 0.65, 'Comparativo mercado/boa pratica dos decks.'],
  ['stock_over_90_rate', 0.26, 0.15, 0.15, 0.36, 0.26, 0.15, 'Comparativo estoque +90 dos decks.'],
  ['avg_margin', 7000, 8500, 8500, 6500, 7000, 8500, 'Cenarios financeiros PMR.'],
]

async function main() {
  const catalogRows = catalog.map(([metric_key, label, direction, value_type, area, source_scope, formula_key, sort_order]) => ({
    metric_key,
    label,
    direction,
    value_type,
    area,
    source_scope,
    formula_key,
    sort_order,
    active: true,
  }))

  const { error: catalogError } = await supabase
    .from('catalogo_metricas_consultoria')
    .upsert(catalogRows, { onConflict: 'metric_key' })

  if (catalogError) throw catalogError

  await supabase
    .from('conjuntos_parametros_consultoria')
    .update({ active: false })
    .eq('active', true)

  const { data: setRow, error: setError } = await supabase
    .from('conjuntos_parametros_consultoria')
    .upsert({
      name: 'PMR Base MX',
      version: '2026.04',
      active: true,
      source_reference: 'Reuniao 2026-04-17 + anexos PMR',
    }, { onConflict: 'name,version' })
    .select('id')
    .single()

  if (setError) throw setError

  const valueRows = parameterValues.map(([metric_key, market_average, best_practice, target_default, red_threshold, yellow_threshold, green_threshold, notes]) => ({
    parameter_set_id: setRow.id,
    metric_key,
    market_average,
    best_practice,
    target_default,
    red_threshold,
    yellow_threshold,
    green_threshold,
    formula: {},
    notes,
  }))

  const { error: valuesError } = await supabase
    .from('valores_parametros_consultoria')
    .upsert(valueRows, { onConflict: 'parameter_set_id,metric_key' })

  if (valuesError) throw valuesError

  console.log(`Seed PMR concluido: ${catalogRows.length} indicadores, ${valueRows.length} parametros.`)
}

main().catch((error) => {
  console.error('Falha no seed PMR:', error.message || error)
  process.exit(1)
})
