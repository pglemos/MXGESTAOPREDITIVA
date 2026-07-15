import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('./NovoRegistroModal.tsx', import.meta.url), 'utf8')

describe('NovoRegistroModal — critérios FEV-FORM', () => {
  // MX-22.4 (AC-1): a query direta a vinculos_loja/usuarios foi trocada por
  // uma RPC SECURITY DEFINER (listar_responsaveis_tratativa_loja) porque a
  // RLS bloqueava um vendedor comum de ver colegas de loja (o combo ficava
  // vazio/só-o-próprio-usuário em produção, apesar do código estar certo).
  test('usa a RPC listar_responsaveis_tratativa_loja (não mais query direta a vinculos_loja, bloqueada por RLS pra vendedor comum)', () => {
    expect(source).toContain("rpc('listar_responsaveis_tratativa_loja'")
    expect(source).not.toContain("from('vinculos_loja')")
    expect(source).not.toContain('RESPONSAVEIS_TRATATIVA')
    expect(source).toContain('responsavel_id')
  })

  // MX-22.4: fórmula D+1/09:00 extraída pra resolveGarantiaPositionDefaults
  // (testada com comportamento real em garantia-position-defaults.test.ts,
  // não mais só regex de string aqui).
  test('deriva posicionamento de reference_date + 1 e 09:00 via resolveGarantiaPositionDefaults', () => {
    expect(source).toContain('const amanha =')
    expect(source).toContain('resolveGarantiaPositionDefaults(hoje)')
    expect(source).not.toContain('new Date(`${hoje}T12:00:00`)')
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
