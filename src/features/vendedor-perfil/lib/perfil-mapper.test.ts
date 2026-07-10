import { describe, expect, test } from 'vitest'
import {
    carreiraInteresseFromLabel,
    carreiraInteresseToLabel,
    montarOpcoesJornada,
    montarPlanosDisponiveis,
    selecionarPlano,
} from './perfil-mapper'

describe('montarPlanosDisponiveis', () => {
    test('monta label e totais a partir do plano real, sem defaults fabricados', () => {
        const [plano] = montarPlanosDisponiveis([
            { id: 'p1', cargo: 'Vendedor', salario_fixo: 2000, salario_variavel: 500, beneficios: 300 },
        ])
        expect(plano).toEqual({
            id: 'p1',
            cargo: 'Vendedor',
            label: 'Vendedor - R$ 2.000 fixo',
            salary_goal: 2800,
            commission_per_unit: 500,
        })
    })

    test('trata valores nulos como zero', () => {
        const [plano] = montarPlanosDisponiveis([
            { id: 'p2', cargo: 'Sênior', salario_fixo: null, salario_variavel: null, beneficios: null },
        ])
        expect(plano.salary_goal).toBe(0)
        expect(plano.commission_per_unit).toBe(0)
    })
})

describe('selecionarPlano', () => {
    const planos = montarPlanosDisponiveis([
        { id: 'p1', cargo: 'Vendedor', salario_fixo: 2000, salario_variavel: 500, beneficios: 0 },
        { id: 'p2', cargo: 'Sênior', salario_fixo: 3000, salario_variavel: 800, beneficios: 0 },
    ])

    test('prioriza o plano vinculado por id', () => {
        expect(selecionarPlano(planos, 'p2', 'Vendedor')?.id).toBe('p2')
    })

    test('cai para o cargo atual quando não há vínculo por id', () => {
        expect(selecionarPlano(planos, null, 'sênior')?.id).toBe('p2')
    })

    test('usa o único plano existente como último recurso', () => {
        const unico = planos.slice(0, 1)
        expect(selecionarPlano(unico, null, 'Gerente')?.id).toBe('p1')
    })

    test('retorna null quando não é possível decidir', () => {
        expect(selecionarPlano(planos, null, 'Gerente')).toBeNull()
    })
})

describe('montarOpcoesJornada', () => {
    test('deduplica jornadas da loja e inclui a jornada atual', () => {
        const opcoes = montarOpcoesJornada(
            [
                { hora_entrada: '08:00:00', hora_saida: '18:00:00' },
                { hora_entrada: '08:00:00', hora_saida: '18:00:00' },
                { hora_entrada: null, hora_saida: '18:00:00' },
            ],
            '09:00',
            '19:00',
        )
        expect(opcoes).toEqual([
            { id: '08:00-18:00', label: '08:00 - 18:00', work_start: '08:00', work_end: '18:00' },
            { id: '09:00-19:00', label: '09:00 - 19:00', work_start: '09:00', work_end: '19:00' },
        ])
    })
})

describe('carreira interesse', () => {
    test('round-trip entre valor persistido e rótulo exibido', () => {
        for (const valor of ['disponivel', 'confidencial', 'nao'] as const) {
            expect(carreiraInteresseFromLabel(carreiraInteresseToLabel(valor))).toBe(valor)
        }
    })

    test('valor desconhecido vira "Não"', () => {
        expect(carreiraInteresseToLabel(null)).toBe('Não')
        expect(carreiraInteresseFromLabel('qualquer coisa')).toBe('nao')
    })
})
