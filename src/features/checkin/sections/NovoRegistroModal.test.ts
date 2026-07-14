import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('./NovoRegistroModal.tsx', import.meta.url), 'utf8')

describe('NovoRegistroModal — critérios FEV-FORM', () => {
  test('usa responsáveis ativos vinculados à loja, sem catálogo fictício', () => {
    expect(source).toContain("from('vinculos_loja')")
    expect(source).toContain(".eq('is_active', true)")
    expect(source).toContain(".in('role', ['vendedor', 'gerente', 'dono'])")
    expect(source).not.toContain('RESPONSAVEIS_TRATATIVA')
    expect(source).toContain('responsavel_id')
  })

  test('deriva posicionamento de reference_date + 1 e 09:00', () => {
    expect(source).toContain('const amanha =')
    expect(source).toContain('addDaysDateOnly(hoje, 1)')
    expect(source).not.toContain('new Date(`${hoje}T12:00:00`)')
    expect(source).toContain("hora_posicionamento: '09:00'")
    expect(source).toContain('form.data_posicionamento || amanha')
  })

  test('mantém catálogo motivo → descrição e exige texto apenas para Outro', () => {
    expect(source).toContain('DESCRICOES_GARANTIA_POR_MOTIVO')
    expect(source).toContain("form.descricao_garantia === 'Outro'")
    expect(source).toContain('form.descricao_garantia_outro?.trim()')
  })

  test('expõe ajuda operacional completa para todos os status de Qualificado', () => {
    expect(source).toContain('SITUACOES_OPORTUNIDADE_AJUDA')
    expect(source).toContain('Mentor Comercial:')
    expect(source).toContain('Próxima ação:')
    expect(source).toContain('Temperatura/prioridade:')
    expect(source).toContain('Métricas:')
  })
})
