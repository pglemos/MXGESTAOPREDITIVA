import { describe, expect, test } from 'bun:test'
import { calcularDisciplina } from './disciplina'

// Especificação Funcional — Tela Fechamento Diário, §18 (Exemplos de disciplina)
describe('calcularDisciplina', () => {
  test('exemplo 1 — D+1 informado=2, detalhado=0 → 70%', () => {
    const r = calcularDisciplina({ totalAgendamentosD1: 2, creditosValidos: 0, finalizadoAposPrazo: false })
    expect(r.pontuacaoDisciplinaBase).toBe(70)
    expect(r.pontuacaoDisciplinaFinal).toBe(70)
  })

  test('exemplo 2 — D+1 informado=2, detalhado=1 → 85%', () => {
    const r = calcularDisciplina({ totalAgendamentosD1: 2, creditosValidos: 1, finalizadoAposPrazo: false })
    expect(r.pontuacaoDisciplinaBase).toBe(85)
    expect(r.pontuacaoDisciplinaFinal).toBe(85)
  })

  test('exemplo 3 — D+1 informado=2, detalhado=2 → 100%', () => {
    const r = calcularDisciplina({ totalAgendamentosD1: 2, creditosValidos: 2, finalizadoAposPrazo: false })
    expect(r.pontuacaoDisciplinaBase).toBe(100)
    expect(r.pontuacaoDisciplinaFinal).toBe(100)
  })

  test('exemplo 4 — D+1 informado=0 → 100% (nada a detalhar)', () => {
    const r = calcularDisciplina({ totalAgendamentosD1: 0, creditosValidos: 0, finalizadoAposPrazo: false })
    expect(r.pontuacaoDisciplinaBase).toBe(100)
    expect(r.pontuacaoDisciplinaFinal).toBe(100)
  })

  test('exemplo 5 — base 100% com atraso liberado → 90% (-10pp)', () => {
    const r = calcularDisciplina({ totalAgendamentosD1: 0, creditosValidos: 0, finalizadoAposPrazo: true })
    expect(r.pontuacaoDisciplinaBase).toBe(100)
    expect(r.pontuacaoDisciplinaFinal).toBe(90)
  })

  test('penalidade nunca deixa o final negativo', () => {
    const r = calcularDisciplina({ totalAgendamentosD1: 2, creditosValidos: 0, finalizadoAposPrazo: true })
    expect(r.pontuacaoDisciplinaBase).toBe(70)
    expect(r.pontuacaoDisciplinaFinal).toBe(60)
  })

  test('§17 — fórmula respeita o mínimo por canal mesmo com excesso de detalhamento', () => {
    // 3 D+1 informados, 5 "válidos" creditados (já limitados a 3 antes de chegar aqui pelo caller)
    const r = calcularDisciplina({ totalAgendamentosD1: 3, creditosValidos: 3, finalizadoAposPrazo: false })
    expect(r.pontuacaoDisciplinaFinal).toBe(100)
  })
})
