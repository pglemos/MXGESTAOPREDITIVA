import { describe, expect, it } from 'bun:test'
import { obterScriptSugerido } from './scriptTemplates'

describe('obterScriptSugerido', () => {
  it('preenche template conhecido com nome e veiculo', () => {
    const script = obterScriptSugerido('Enviar mensagem 1 de primeiro contato', 'Ana', 'Onix LT')
    expect(script).toContain('Ana')
    expect(script).toContain('Onix LT')
    expect(script).not.toContain('{nome}')
    expect(script).not.toContain('{veiculo}')
  })

  it('usa template padrao quando proxima_acao nao é reconhecida', () => {
    const script = obterScriptSugerido('Ação inexistente qualquer', 'Bruno', 'HB20')
    expect(script).toContain('Bruno')
    expect(script).toContain('HB20')
  })

  it('usa fallback de veiculo quando nao informado', () => {
    const script = obterScriptSugerido(null, 'Carla', null)
    expect(script).toContain('Carla')
    expect(script).toContain('veículo de interesse')
  })
})
