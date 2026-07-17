import { describe, expect, test } from 'bun:test'
import { resolveGarantiaPositionDefaults } from './garantia-position-defaults'

// MX-22.4 (AC-3; FEV-FORM-01) — teste de comportamento (não string) que
// faltava: prova a fórmula D+1/09:00 de verdade, não só que o texto
// "addDaysDateOnly(hoje, 1)" existe no arquivo-fonte.
describe('resolveGarantiaPositionDefaults (MX-22.4)', () => {
  test('data = reference_date + 1 dia, hora = 09:00', () => {
    expect(resolveGarantiaPositionDefaults('2026-07-09')).toEqual({
      dataPosicionamento: '2026-07-10',
      horaPosicionamento: '09:00',
    })
  })

  test('atravessa virada de mês corretamente', () => {
    expect(resolveGarantiaPositionDefaults('2026-07-31')).toEqual({
      dataPosicionamento: '2026-08-01',
      horaPosicionamento: '09:00',
    })
  })

  test('atravessa virada de ano corretamente', () => {
    expect(resolveGarantiaPositionDefaults('2026-12-31')).toEqual({
      dataPosicionamento: '2027-01-01',
      horaPosicionamento: '09:00',
    })
  })
})
