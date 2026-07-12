import { describe, expect, it } from 'vitest'
import {
  AGENDA_D1_DEFAULT_FILTERS,
  buildWhatsappMessage,
  buildWhatsappUrl,
  dedupeActiveAppointments,
  extractMeetLink,
  filterAgenda,
  normalizePhoneBr,
  type AgendaD1Row,
} from './agenda-d1'

function row(partial: Partial<AgendaD1Row> & { id: string }): AgendaD1Row {
  return {
    data_hora: '2026-07-12T10:00:00-03:00',
    canal: 'carteira',
    tipo: 'visita',
    status: 'aguardando',
    observacoes: null,
    seller_user_id: 'seller-1',
    cliente: { id: `cliente-${partial.id}`, nome: 'Cliente', telefone: '11 98888-7777', telefone_normalizado: null, ultima_interacao: null },
    ...partial,
  }
}

describe('normalizePhoneBr', () => {
  it('adiciona DDI 55 para números de 10 e 11 dígitos', () => {
    expect(normalizePhoneBr('(11) 98888-7777')).toBe('5511988887777')
    expect(normalizePhoneBr('1133334444')).toBe('551133334444')
  })
  it('mantém números já com DDI 55', () => {
    expect(normalizePhoneBr('+55 11 98888-7777')).toBe('5511988887777')
  })
  it('rejeita números inválidos', () => {
    expect(normalizePhoneBr('')).toBeNull()
    expect(normalizePhoneBr(null)).toBeNull()
    expect(normalizePhoneBr('12345')).toBeNull()
  })
})

describe('buildWhatsappMessage', () => {
  it('gera mensagem por tipo sem linhas vazias', () => {
    const message = buildWhatsappMessage({ clienteNome: 'Ana', tipo: 'test_drive', dataHora: '2026-07-12T14:30:00-03:00', lojaNome: 'Loja Centro' })
    expect(message).toContain('Ana')
    expect(message).toContain('test drive')
    expect(message).toContain('14:30')
    expect(message.split('\n').every(line => line.trim().length > 0)).toBe(true)
  })
  it('inclui link de videoconferência apenas quando existir', () => {
    const semLink = buildWhatsappMessage({ clienteNome: 'Ana', tipo: 'retorno', dataHora: '2026-07-12T09:00:00-03:00' })
    expect(semLink).not.toContain('videoconferência')
    const comLink = buildWhatsappMessage({ clienteNome: 'Ana', tipo: 'retorno', dataHora: '2026-07-12T09:00:00-03:00', meetLink: 'https://meet.google.com/abc' })
    expect(comLink).toContain('https://meet.google.com/abc')
  })
})

describe('buildWhatsappUrl', () => {
  it('monta URL wa.me com texto codificado', () => {
    expect(buildWhatsappUrl('5511988887777', 'Olá, tudo bem?')).toBe('https://wa.me/5511988887777?text=Ol%C3%A1%2C%20tudo%20bem%3F')
  })
})

describe('extractMeetLink', () => {
  it('extrai link de meet/zoom/teams', () => {
    expect(extractMeetLink('Reunião: https://meet.google.com/xyz-abc')).toBe('https://meet.google.com/xyz-abc')
    expect(extractMeetLink('sem link')).toBeNull()
    expect(extractMeetLink(null)).toBeNull()
  })
})

describe('dedupeActiveAppointments', () => {
  it('mantém um registro por cliente (mais cedo), descarta sem cliente e não compareceu', () => {
    const rows: AgendaD1Row[] = [
      row({ id: 'b', data_hora: '2026-07-12T15:00:00-03:00', cliente: { id: 'c1', nome: 'Ana', telefone: null, telefone_normalizado: null, ultima_interacao: null } }),
      row({ id: 'a', data_hora: '2026-07-12T09:00:00-03:00', cliente: { id: 'c1', nome: 'Ana', telefone: null, telefone_normalizado: null, ultima_interacao: null } }),
      row({ id: 'c', cliente: null }),
      row({ id: 'd', status: 'nao_compareceu' }),
      row({ id: 'e', cliente: { id: 'c2', nome: 'Bia', telefone: null, telefone_normalizado: null, ultima_interacao: null } }),
    ]
    const result = dedupeActiveAppointments(rows)
    expect(result.map(item => item.id)).toEqual(['a', 'e'])
  })
})

describe('filterAgenda', () => {
  const rows: AgendaD1Row[] = [
    row({ id: 'manha', data_hora: '2026-07-12T09:00:00-03:00', seller_user_id: 's1', canal: 'carteira', tipo: 'visita', status: 'aguardando' }),
    row({ id: 'tarde', data_hora: '2026-07-12T15:00:00-03:00', seller_user_id: 's2', canal: 'internet', tipo: 'entrega', status: 'confirmado' }),
  ]
  it('sem filtros retorna tudo', () => {
    expect(filterAgenda(rows, AGENDA_D1_DEFAULT_FILTERS)).toHaveLength(2)
  })
  it('filtra por vendedor, canal, tipo, status e período', () => {
    expect(filterAgenda(rows, { ...AGENDA_D1_DEFAULT_FILTERS, sellerId: 's1' }).map(r => r.id)).toEqual(['manha'])
    expect(filterAgenda(rows, { ...AGENDA_D1_DEFAULT_FILTERS, canal: 'internet' }).map(r => r.id)).toEqual(['tarde'])
    expect(filterAgenda(rows, { ...AGENDA_D1_DEFAULT_FILTERS, tipo: 'entrega' }).map(r => r.id)).toEqual(['tarde'])
    expect(filterAgenda(rows, { ...AGENDA_D1_DEFAULT_FILTERS, status: 'confirmado' }).map(r => r.id)).toEqual(['tarde'])
    expect(filterAgenda(rows, { ...AGENDA_D1_DEFAULT_FILTERS, periodo: 'manha' }).map(r => r.id)).toEqual(['manha'])
    expect(filterAgenda(rows, { ...AGENDA_D1_DEFAULT_FILTERS, periodo: 'tarde' }).map(r => r.id)).toEqual(['tarde'])
  })
})
