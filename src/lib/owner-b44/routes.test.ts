import { describe, expect, it } from 'bun:test'
import { mapLegacyOwnerPathToCanonical } from './routes'

describe('legacy owner route mapping', () => {
  it.each([
    ['/lojas/mx-consultoria', '/dono'],
    ['/lojas/mx-consultoria/rotina', '/dono/rotina'],
    ['/lojas/mx-consultoria/decisoes', '/dono/decisoes'],
    ['/lojas/mx-consultoria/plano-estrategico', '/dono/plano-estrategico'],
    ['/lojas/mx-consultoria/plano-acao', '/dono/plano-acao'],
    ['/lojas/mx-consultoria/consultoria', '/dono/consultoria'],
    ['/lojas/mx-consultoria/departamentos', '/dono/departamentos'],
    ['/lojas/mx-consultoria/departamentos/visao-geral', '/dono/departamentos'],
    ['/lojas/mx-consultoria/departamentos/comercial', '/dono/departamentos/comercial'],
    ['/lojas/mx-consultoria/departamentos/marketing', '/dono/departamentos/marketing'],
    ['/lojas/mx-consultoria/departamentos/produto', '/dono/departamentos/produto-e-estoque'],
    ['/lojas/mx-consultoria/departamentos/rh', '/dono/departamentos/pessoas-rh'],
    ['/lojas/mx-consultoria/departamentos/financeiro', '/dono/departamentos/financeiro'],
    ['/lojas/mx-consultoria/departamentos/operacional', '/dono/departamentos/operacoes'],
    ['/lojas/mx-consultoria/mercado', '/dono/mercado'],
    ['/lojas/mx-consultoria/universidade', '/dono/universidade'],
    ['/lojas/mx-consultoria/consultor-ia', '/dono/consultoria'],
    ['/lojas/mx-consultoria/constructor', '/dono'],
    ['/lojas/mx-consultoria/toString', '/dono'],
    ['/lojas/mx-consultoria/__proto__', '/dono'],
    ['/lojas/mx-consultoria/rota-desconhecida', '/dono'],
  ])('maps %s to %s', (legacyPath, canonicalPath) => {
    expect(mapLegacyOwnerPathToCanonical(legacyPath)).toBe(canonicalPath)
  })
})
