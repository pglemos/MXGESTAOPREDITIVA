import { describe, expect, it } from 'bun:test'
import {
  CRM_TIPO_VEICULO_LABEL,
  OportunidadeSchema,
} from './crm.schema'

const baseOportunidade = {
  id: '11111111-1111-4111-8111-111111111111',
  cliente_id: '22222222-2222-4222-8222-222222222222',
  loja_id: '33333333-3333-4333-8333-333333333333',
  seller_user_id: '44444444-4444-4444-8444-444444444444',
  veiculo_interesse: 'Onix LT 1.0',
  valor_negociado: '89000.50',
  etapa: 'prospeccao',
  canal: 'internet',
  sinal: 1000,
  financiamento: 'pendente',
  carro_avaliado: false,
  motivo_perda: null,
  created_at: '2026-06-16T10:00:00.000Z',
  updated_at: '2026-06-16T10:00:00.000Z',
  closed_at: null,
}

describe('OportunidadeSchema', () => {
  it('normaliza tipo_veiculo ausente para null sem descartar oportunidades antigas', () => {
    const parsed = OportunidadeSchema.parse(baseOportunidade)

    expect(parsed.tipo_veiculo).toBeNull()
    expect(parsed.valor_negociado).toBe(89000.5)
  })

  it('aceita categorias de veiculo usadas para comissionamento', () => {
    const parsed = OportunidadeSchema.parse({
      ...baseOportunidade,
      tipo_veiculo: 'caminhao',
    })

    expect(parsed.tipo_veiculo).toBe('caminhao')
    expect(CRM_TIPO_VEICULO_LABEL.caminhao).toBe('Caminhão')
  })

  it('rejeita categoria de veiculo fora do contrato', () => {
    const parsed = OportunidadeSchema.safeParse({
      ...baseOportunidade,
      tipo_veiculo: 'van',
    })

    expect(parsed.success).toBe(false)
  })
})
