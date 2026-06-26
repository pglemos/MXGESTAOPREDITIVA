import { describe, expect, it, mock } from 'bun:test'

mock.restore()

const { calcularScoreRotina } = await import('./useScoreRotina')

describe('calcularScoreRotina (Central de Execução §4)', () => {
  it('exemplo do spec: abriu + fechamento + 1 cliente novo = 70', () => {
    const { score } = calcularScoreRotina({ clientesCriadosHoje: 1, fechamentoFeito: true })
    expect(score).toBe(70)
  })

  it('exemplo do spec: abriu + fechamento + 3 clientes novos = 100', () => {
    const { score } = calcularScoreRotina({ clientesCriadosHoje: 3, fechamentoFeito: true })
    expect(score).toBe(100)
  })

  it('só abriu a Central, sem fechamento e sem clientes novos = 10', () => {
    const { score } = calcularScoreRotina({ clientesCriadosHoje: 0, fechamentoFeito: false })
    expect(score).toBe(10)
  })

  it('escalona pontos por clientes novos: 0/1/2/3+ => 0/40/60/70', () => {
    expect(calcularScoreRotina({ clientesCriadosHoje: 0, fechamentoFeito: false }).score).toBe(10)
    expect(calcularScoreRotina({ clientesCriadosHoje: 1, fechamentoFeito: false }).score).toBe(50)
    expect(calcularScoreRotina({ clientesCriadosHoje: 2, fechamentoFeito: false }).score).toBe(70)
    expect(calcularScoreRotina({ clientesCriadosHoje: 3, fechamentoFeito: false }).score).toBe(80)
    expect(calcularScoreRotina({ clientesCriadosHoje: 10, fechamentoFeito: false }).score).toBe(80)
  })

  it('nunca passa de 100', () => {
    const { score } = calcularScoreRotina({ clientesCriadosHoje: 99, fechamentoFeito: true })
    expect(score).toBe(100)
  })
})
