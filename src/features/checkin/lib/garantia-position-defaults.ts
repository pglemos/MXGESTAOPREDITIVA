import { addDaysDateOnly } from './crm-derived-totals'

// MX-22.4 (AC-3; Spec §9.1 "Data para Posicionar o Cliente" — FEV-FORM-01):
// data = reference_date + 1 dia, hora = 09:00. Extraído do inline de
// handleSelectTipo (NovoRegistroModal.tsx) pra ser testável sem montar o
// modal inteiro (que depende de useAuth/useClientes/useOportunidades).
// referenceDate é sempre o mainDate já resolvido por ActiveClosingContext
// (22.1) — nunca new Date() cru do dispositivo (chamador garante isso).
export function resolveGarantiaPositionDefaults(referenceDate: string): {
  dataPosicionamento: string
  horaPosicionamento: string
} {
  return {
    dataPosicionamento: addDaysDateOnly(referenceDate, 1),
    horaPosicionamento: '09:00',
  }
}
