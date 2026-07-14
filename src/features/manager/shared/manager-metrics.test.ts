import { describe, expect, test } from 'bun:test'
import { classifyAppointmentCoverage, classifyDiscipline, classifyRoutine, getClosingStatus, percent } from './manager-metrics'

describe('manager metrics', () => {
  test('classifica disciplina nas faixas oficiais', () => {
    expect(classifyDiscipline(39)).toBe('Crítica')
    expect(classifyDiscipline(40)).toBe('Baixa')
    expect(classifyDiscipline(50)).toBe('Baixa')
    expect(classifyDiscipline(70)).toBe('Boa')
    expect(classifyDiscipline(89)).toBe('Boa')
    expect(classifyDiscipline(90)).toBe('Excelente')
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

  test('classifica cobertura de agendamentos sem fabricar base', () => {
    expect(classifyAppointmentCoverage(0, 10)).toBe('Ruim')
    expect(classifyAppointmentCoverage(5, 10)).toBe('Ruim')
    expect(classifyAppointmentCoverage(6, 10)).toBe('Regular')
    expect(classifyAppointmentCoverage(10, 10)).toBe('Bom')
    expect(classifyAppointmentCoverage(15, 10)).toBe('Bom')
    expect(classifyAppointmentCoverage(16, 10)).toBe('Excelente')
    expect(classifyAppointmentCoverage(10, null)).toBeNull()
  })
})
