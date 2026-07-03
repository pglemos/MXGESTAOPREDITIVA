/** Formata BRL sem centavos redondos, igual ao Base44 (`formatBRL(v).replace(",00","")`). */
export function formatBRLWhole(value: number): string {
  const num = Number.isNaN(value) ? 0 : value || 0
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(',00', '')
}
