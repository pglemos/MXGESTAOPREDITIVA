import { describe, expect, it } from 'bun:test'
import { BAND_LABEL, NEXT_BAND } from './useMeuScore'

describe('BAND_LABEL', () => {
  it('maps all 5 bands to Portuguese labels', () => {
    expect(BAND_LABEL['elite']).toBe('Elite MX')
    expect(BAND_LABEL['excellent']).toBe('Excelente')
    expect(BAND_LABEL['good']).toBe('Bom')
    expect(BAND_LABEL['attention']).toBe('Atenção')
    expect(BAND_LABEL['critical']).toBe('Crítico')
  })
})

describe('NEXT_BAND', () => {
  it('progression is correct', () => {
    expect(NEXT_BAND['critical']).toBe('Atenção')
    expect(NEXT_BAND['attention']).toBe('Bom')
    expect(NEXT_BAND['good']).toBe('Excelente')
    expect(NEXT_BAND['excellent']).toBe('Elite MX')
    expect(NEXT_BAND['elite']).toBe('Elite MX')
  })

  it('elite returns itself — ceiling band', () => {
    expect(NEXT_BAND['elite']).toBe(BAND_LABEL['elite'])
  })
})

describe('BAND_LABEL and NEXT_BAND coverage', () => {
  it('cover exactly the same 5 keys', () => {
    const bandKeys = Object.keys(BAND_LABEL).sort()
    const nextKeys = Object.keys(NEXT_BAND).sort()
    expect(bandKeys).toEqual(nextKeys)
    expect(bandKeys).toHaveLength(5)
  })
})
