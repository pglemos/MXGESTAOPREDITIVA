import { describe, expect, test } from 'bun:test'
import { classifyDiscipline, classifyRoutine, getClosingStatus, percent } from './manager-metrics'

describe('manager metrics', () => {
  test('classifica disciplina nas faixas oficiais', () => {
    expect(classifyDiscipline(49)).toBe('Muito baixa')
    expect(classifyDiscipline(50)).toBe('Baixa')
    expect(classifyDiscipline(70)).toBe('Boa')
    expect(classifyDiscipline(85)).toBe('Muito boa')
    expect(classifyDiscipline(95)).toBe('Excelente')
  })

  test('classifica rotina nas faixas oficiais', () => {
    expect(classifyRoutine(49)).toBe('Crítico')
    expect(classifyRoutine(50)).toBe('Atenção')
    expect(classifyRoutine(75)).toBe('Em dia')
  })

  test('não inventa percentual sem denominador', () => expect(percent(1, 0)).toBe(0))

  test('regularização pendente prevalece sobre envio', () => {
    expect(getClosingStatus(undefined, true)).toBe('Aguardando aprovação')
    expect(getClosingStatus(undefined, false)).toBe('Pendente')
  })
})
