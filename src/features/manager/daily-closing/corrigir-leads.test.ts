import { describe, expect, it } from 'vitest'
import {
  buildLeadCorrectionPayload,
  buildLeadCorrectionReason,
  computeLeadDiff,
  getLeadOriginals,
  validateLeadCorrection,
} from './corrigir-leads'

const originals = { leads_prev_day: 5, leads_net_prev_day: 3 }

describe('getLeadOriginals', () => {
  it('normaliza nulos para zero', () => {
    expect(getLeadOriginals({ leads_prev_day: 0, leads_net_prev_day: 0 })).toEqual({ leads_prev_day: 0, leads_net_prev_day: 0 })
    expect(getLeadOriginals({ leads_prev_day: 7, leads_net_prev_day: 2 })).toEqual({ leads_prev_day: 7, leads_net_prev_day: 2 })
  })
})

describe('computeLeadDiff', () => {
  it('retorna anterior, novo e diferença apenas dos campos alterados', () => {
    const diff = computeLeadDiff(originals, { leads_prev_day: 8, leads_net_prev_day: 3 })
    expect(diff).toEqual([
      { key: 'leads_prev_day', label: 'Leads Showroom/Carteira', anterior: 5, novo: 8, diferenca: 3 },
    ])
  })
})

describe('validateLeadCorrection', () => {
  it('exige inteiro não negativo', () => {
    expect(validateLeadCorrection(originals, { leads_prev_day: -1, leads_net_prev_day: 3, motivo: 'motivo válido', observacao: '' })).toContain('inteiro')
    expect(validateLeadCorrection(originals, { leads_prev_day: 2.5, leads_net_prev_day: 3, motivo: 'motivo válido', observacao: '' })).toContain('inteiro')
  })
  it('exige alteração e motivo mínimo', () => {
    expect(validateLeadCorrection(originals, { ...originals, motivo: 'motivo válido', observacao: '' })).toBe('Nenhum lead foi alterado.')
    expect(validateLeadCorrection(originals, { leads_prev_day: 6, leads_net_prev_day: 3, motivo: 'curto', observacao: '' })).toContain('8 caracteres')
  })
  it('aprova entrada válida', () => {
    expect(validateLeadCorrection(originals, { leads_prev_day: 6, leads_net_prev_day: 3, motivo: 'Cliente contado em duplicidade', observacao: '' })).toBeNull()
  })
})

describe('buildLeadCorrectionPayload', () => {
  it('envia somente chaves de leads — nunca vendas/atendimentos/agendamentos', () => {
    const payload = buildLeadCorrectionPayload({ leads_prev_day: 6, leads_net_prev_day: 4 })
    expect(Object.keys(payload).sort()).toEqual(['leads_net_prev_day', 'leads_prev_day'])
  })
})

describe('buildLeadCorrectionReason', () => {
  it('combina motivo e observação para a trilha de auditoria', () => {
    expect(buildLeadCorrectionReason({ motivo: ' Duplicidade ', observacao: 'conferido com o vendedor ' })).toBe('Duplicidade — Obs.: conferido com o vendedor')
    expect(buildLeadCorrectionReason({ motivo: 'Duplicidade', observacao: '' })).toBe('Duplicidade')
  })
})
