export const VENDEDOR_VINCULO_TIPO = ['loja', 'autonomo'] as const

export type VendedorVinculoTipo = (typeof VENDEDOR_VINCULO_TIPO)[number]

export function resolverVinculoTipoVendedor(input: {
  perfilVinculoTipo?: VendedorVinculoTipo | null
  lojaId?: string | null
  activeStoreId?: string | null
  vinculosLojaCount?: number | null
}): VendedorVinculoTipo {
  if (input.perfilVinculoTipo === 'loja' || input.perfilVinculoTipo === 'autonomo') {
    return input.perfilVinculoTipo
  }
  if (input.lojaId || input.activeStoreId || (input.vinculosLojaCount ?? 0) > 0) {
    return 'loja'
  }
  return 'autonomo'
}

export function podeExibirCarreiraMercado(vinculoTipo: VendedorVinculoTipo): boolean {
  return vinculoTipo === 'autonomo'
}

export function podeReceberFeedbackGerente(vinculoTipo: VendedorVinculoTipo): boolean {
  return vinculoTipo === 'loja'
}
