import CarteiraClientesReference from '@/base44-reference/pages/CarteiraClientes.jsx'

/**
 * Interaction surface preserved from the Base44 reference implementation.
 * These names are intentionally documented here because every overlay and
 * flow must remain available after the route replacement.
 */
export const CARTEIRA_BASE44_PARITY_SURFACE = [
  'CarteiraAtivaTab',
  'PlanoAtaqueTab',
  'ExecucaoMissao',
  'NovoClienteModal',
  'WhatsAppRoteiro',
  'FichaClienteSheet',
  'ProximaOportunidadeModal',
  'RetornoWhatsAppModal',
  'ModoAtaque',
] as const

export function CarteiraClientesBase44Page() {
  return <CarteiraClientesReference />
}
