import { describe, expect, test } from 'bun:test'
import { filterOwnerAlerts } from './AlertsView'
import type { OwnerPerformanceAlert } from '../PerformanceAlerts'

const alerts: OwnerPerformanceAlert[] = [
  {
    title: 'Conversão abaixo do benchmark',
    description: 'Perda de oportunidades',
    recommendation: 'Auditar origem dos leads',
    action: 'Criar ação',
    variant: 'danger',
    department: 'Marketing',
    impact: 'Alto',
    ctaLabel: 'Criar ação',
    ctaTo: '/dono/plano-acao',
  },
  {
    title: 'Rotina diária incompleta',
    description: 'Faltam lançamentos',
    recommendation: 'Cobrar fechamento',
    action: 'Cobrar equipe',
    variant: 'warning',
    department: 'Operações',
    impact: 'Médio',
    ctaLabel: 'Cobrar equipe',
    ctaTo: '/dono/rotina',
  },
]

describe('Dono — filtros de Alertas', () => {
  test('combina status e departamento sem alterar a fonte original', () => {
    expect(filterOwnerAlerts(alerts, 'danger', 'Marketing')).toHaveLength(1)
    expect(filterOwnerAlerts(alerts, 'warning', 'Marketing')).toHaveLength(0)
    expect(alerts).toHaveLength(2)
  })

  test('busca título, descrição e recomendação e permite estado vazio real', () => {
    expect(filterOwnerAlerts(alerts, 'todos', 'todos', 'lançamentos')[0]?.title).toBe('Rotina diária incompleta')
    expect(filterOwnerAlerts(alerts, 'todos', 'todos', 'texto inexistente')).toEqual([])
  })
})
