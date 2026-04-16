export function fmt(value: number | null | undefined): string {
  if (value == null) return '0'
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function pct(value: number | null | undefined): string {
  if (value == null) return '0,00%'
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'
}

export type ValueFormat = 'currency' | 'percent' | 'number'

export function formatValue(val: number, valueFormat: ValueFormat = 'currency'): string {
  switch (valueFormat) {
    case 'percent': return pct(val * 100)
    case 'number': return String(val)
    case 'currency': return `R$ ${fmt(val)}`
  }
}

export function formatMonthLabel(m: string): string {
  return new Date(m + '-15').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase()
}
