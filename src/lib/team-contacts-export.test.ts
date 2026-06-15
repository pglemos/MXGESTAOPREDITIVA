import { describe, expect, it } from 'bun:test'
import {
  CONTACT_EXPORT_HEADERS,
  buildTeamContactRows,
  buildTeamContactsWorkbook,
  summarizeTeamContacts,
} from './team-contacts-export'

const activeStore = {
  id: 'store-1',
  name: 'Loja Centro',
  active: true,
  partners: [
    { name: 'Socio Loja', phone: '11999990000', email: 'socio@loja.com' },
    { name: '', phone: '', email: '' },
  ],
}

describe('team contacts export', () => {
  it('exports active store users and store partners with the expected public columns', () => {
    const rows = buildTeamContactRows({
      memberships: [
        {
          user_id: 'owner-1',
          store_id: 'store-1',
          role: 'dono',
          is_active: true,
          users: { id: 'owner-1', name: 'Dona Maria', email: 'maria@mx.com', phone: '11911111111', active: true },
          store: activeStore,
        },
        {
          user_id: 'seller-1',
          store_id: 'store-1',
          role: 'vendedor',
          is_active: true,
          users: { id: 'seller-1', name: 'Joao Vendedor', email: 'joao@mx.com', phone: '11922222222', active: true },
          store: activeStore,
        },
      ],
      sellerTenures: [
        {
          seller_user_id: 'seller-1',
          store_id: 'store-1',
          started_at: '2026-01-01',
          ended_at: null,
          is_active: true,
        },
      ],
      stores: [activeStore],
      referenceDate: '2026-06-15',
    })

    expect(rows).toEqual([
      {
        Loja: 'Loja Centro',
        Papel: 'Dono',
        Nome: 'Dona Maria',
        Telefone: '11911111111',
        Email: 'maria@mx.com',
        Origem: 'usuarios/vinculos_loja',
        'Vínculo desde': '',
      },
      {
        Loja: 'Loja Centro',
        Papel: 'Vendedor',
        Nome: 'Joao Vendedor',
        Telefone: '11922222222',
        Email: 'joao@mx.com',
        Origem: 'usuarios/vinculos_loja',
        'Vínculo desde': '2026-01-01',
      },
      {
        Loja: 'Loja Centro',
        Papel: 'Dono/Sócio',
        Nome: 'Socio Loja',
        Telefone: '11999990000',
        Email: 'socio@loja.com',
        Origem: 'lojas.partners',
        'Vínculo desde': '',
      },
    ])
  })

  it('filters inactive memberships, users, stores and inactive seller tenure rows', () => {
    const rows = buildTeamContactRows({
      memberships: [
        {
          user_id: 'manager-1',
          store_id: 'store-1',
          role: 'gerente',
          is_active: false,
          users: { id: 'manager-1', name: 'Gerente Inativo', email: 'g@mx.com', phone: '1', active: true },
          store: activeStore,
        },
        {
          user_id: 'seller-2',
          store_id: 'store-1',
          role: 'vendedor',
          is_active: true,
          users: { id: 'seller-2', name: 'Vendedor Encerrado', email: 'v@mx.com', phone: '2', active: true },
          store: activeStore,
        },
        {
          user_id: 'owner-2',
          store_id: 'store-2',
          role: 'dono',
          is_active: true,
          users: { id: 'owner-2', name: 'Loja Inativa', email: 'o@mx.com', phone: '3', active: true },
          store: { id: 'store-2', name: 'Loja Inativa', active: false, partners: [] },
        },
      ],
      sellerTenures: [
        {
          seller_user_id: 'seller-2',
          store_id: 'store-1',
          started_at: '2026-01-01',
          ended_at: null,
          is_active: false,
        },
      ],
      stores: [],
      referenceDate: '2026-06-15',
    })

    expect(rows).toEqual([])
  })

  it('keeps one row per store for users linked to multiple active stores', () => {
    const rows = buildTeamContactRows({
      memberships: [
        {
          user_id: 'owner-1',
          store_id: 'store-1',
          role: 'dono',
          is_active: true,
          users: { id: 'owner-1', name: 'Dona Maria', email: 'maria@mx.com', phone: '11911111111', active: true },
          store: { id: 'store-1', name: 'Loja Centro', active: true, partners: [] },
        },
        {
          user_id: 'owner-1',
          store_id: 'store-2',
          role: 'dono',
          is_active: true,
          users: { id: 'owner-1', name: 'Dona Maria', email: 'maria@mx.com', phone: '11911111111', active: true },
          store: { id: 'store-2', name: 'Loja Norte', active: true, partners: [] },
        },
      ],
      stores: [],
      referenceDate: '2026-06-15',
    })

    expect(rows.map((row) => row.Loja)).toEqual(['Loja Centro', 'Loja Norte'])
  })

  it('builds workbook data with contact headers and summary counts', () => {
    const rows = [
      {
        Loja: 'Loja Centro',
        Papel: 'Dono',
        Nome: 'Dona Maria',
        Telefone: '11911111111',
        Email: 'maria@mx.com',
        Origem: 'usuarios/vinculos_loja',
        'Vínculo desde': '',
      },
      {
        Loja: 'Loja Centro',
        Papel: 'Dono/Sócio',
        Nome: 'Socio Loja',
        Telefone: '11999990000',
        Email: 'socio@loja.com',
        Origem: 'lojas.partners',
        'Vínculo desde': '',
      },
    ]

    expect(summarizeTeamContacts(rows)).toEqual([
      { Papel: 'Dono', Origem: 'usuarios/vinculos_loja', Total: 1 },
      { Papel: 'Dono/Sócio', Origem: 'lojas.partners', Total: 1 },
    ])

    expect(buildTeamContactsWorkbook(rows)).toEqual([
      { name: 'Contatos', rows, headers: CONTACT_EXPORT_HEADERS },
      {
        name: 'Resumo',
        rows: [
          { Papel: 'Dono', Origem: 'usuarios/vinculos_loja', Total: 1 },
          { Papel: 'Dono/Sócio', Origem: 'lojas.partners', Total: 1 },
        ],
        headers: ['Papel', 'Origem', 'Total'],
      },
    ])
  })
})
