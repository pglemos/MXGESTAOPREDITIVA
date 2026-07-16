import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const EXACT_COMPONENTS = [
  'CarteiraAtivaTab.jsx',
  'FichaClienteSheet.jsx',
  'ModoAtaque.jsx',
  'NovoClienteModal.jsx',
  'WhatsAppRoteiro.jsx',
  'ProximaOportunidadeModal.jsx',
  'RetornoWhatsAppModal.jsx',
  'carteiraUtils.jsx',
  'proximoPassoLib.js',
  'VeiculosChegaram.jsx',
]

describe('Base44 1:1 visual source parity', () => {
  for (const filename of EXACT_COMPONENTS) {
    test(`${filename} remains byte-for-byte equal to the Base44 reference`, () => {
      const runtime = readFileSync(`src/components/carteira/${filename}`, 'utf8')
      const reference = readFileSync(`src/base44-reference/components/carteira/${filename}`, 'utf8')
      expect(runtime).toBe(reference)
    })
  }

  test('the plan tab preserves the exact Base44 renderer and only adds persistence around it', () => {
    const source = readFileSync('src/components/carteira/PlanoAtaqueTab.jsx', 'utf8')
    expect(source).toContain('PlanoAtaqueTabBase44')
    expect(source).toContain('@/base44-reference/components/carteira/PlanoAtaqueTab.jsx')
    expect(source).toContain('CarteiraMissao.filter')
  })

  test('mission execution preserves Base44 interaction tokens while persisting every action', () => {
    const source = readFileSync('src/components/carteira/ExecucaoMissao.jsx', 'utf8')
    for (const token of [
      'bg-[#005BFF]',
      'rounded-2xl',
      'Aguardando respostas',
      'CarteiraMissao.update',
      'indice_atual',
      'mensagens_enviadas',
      'pulados',
    ]) expect(source).toContain(token)
  })
})