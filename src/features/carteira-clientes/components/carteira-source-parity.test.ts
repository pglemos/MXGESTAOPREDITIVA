import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const EXACT_COMPONENTS = [
  'CarteiraAtivaTab.jsx',
  'ModoAtaque.jsx',
  'ProximaOportunidadeModal.jsx',
  'RetornoWhatsAppModal.jsx',
  'carteiraUtils.jsx',
  'proximoPassoLib.js',
  'VeiculosChegaram.jsx',
]

const INTEGRATED_COMPONENTS = {
  'FichaClienteSheet.jsx': [
    'w-full sm:max-w-xl overflow-y-auto p-0 flex flex-col',
    'Mentor Comercial',
    'Alterar próximo passo',
    'sticky bottom-0 bg-white border-t border-slate-100',
  ],
  'NovoClienteModal.jsx': [
    'max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl',
    'Novo Cliente',
    'Em que momento esse cliente está?',
    'Adicionar cliente',
  ],
  'WhatsAppRoteiro.jsx': [
    'max-w-md rounded-2xl max-h-[92vh] overflow-y-auto',
    'Registrar resultado do contato',
    'animate-in slide-in-from-top-2 duration-200',
    'Registrar resultado',
  ],
}

describe('Base44 1:1 visual source parity', () => {
  for (const filename of EXACT_COMPONENTS) {
    test(`${filename} remains byte-for-byte equal to the Base44 reference`, () => {
      const runtime = readFileSync(`src/components/carteira/${filename}`, 'utf8')
      const reference = readFileSync(`src/base44-reference/components/carteira/${filename}`, 'utf8')
      expect(runtime).toBe(reference)
    })
  }

  for (const [filename, visualTokens] of Object.entries(INTEGRATED_COMPONENTS)) {
    test(`${filename} preserves the Base44 visual contract around MX persistence`, () => {
      const runtime = readFileSync(`src/components/carteira/${filename}`, 'utf8')
      const reference = readFileSync(`src/base44-reference/components/carteira/${filename}`, 'utf8')
      for (const token of visualTokens) {
        expect(reference, `${filename} reference token: ${token}`).toContain(token)
        expect(runtime, `${filename} runtime token: ${token}`).toContain(token)
      }
      expect(runtime).toContain('finally')
      expect(runtime).toContain('toast({')
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
