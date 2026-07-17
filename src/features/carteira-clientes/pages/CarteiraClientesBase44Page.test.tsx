import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

describe('CarteiraClientes route contract', () => {
  test('uses the Base44-adapted page instead of the legacy container', () => {
    const source = readFileSync('src/pages/CarteiraClientes.tsx', 'utf8')

    expect(source).toContain('CarteiraClientesBase44Page')
    expect(source).not.toContain('CarteiraClientes.container')
  })

  test('keeps the Base44 interaction surface mounted in the adapted page', () => {
    const source = readFileSync('src/features/carteira-clientes/pages/CarteiraClientesBase44Page.tsx', 'utf8')

    for (const token of [
      'CarteiraAtivaTab',
      'PlanoAtaqueTab',
      'ExecucaoMissao',
      'NovoClienteModal',
      'WhatsAppRoteiro',
      'FichaClienteSheet',
      'ProximaOportunidadeModal',
      'RetornoWhatsAppModal',
      'ModoAtaque',
    ]) {
      expect(source).toContain(token)
    }
  })
})