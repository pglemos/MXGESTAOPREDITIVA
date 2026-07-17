// MX-22.4 (AC-1/AC-2; Spec §9.1 "Responsável pela Tratativa"): mapeamento
// puro do retorno de listar_responsaveis_tratativa_loja (RPC SECURITY
// DEFINER) pras opções do combo — extraído do componente pra ser testável
// sem montar NovoRegistroModal inteiro (que depende de useAuth/useClientes/
// useOportunidades/useAgendamentos; mock.module de tantos hooks juntos já
// se mostrou frágil neste projeto, ver useCheckinsSubmit.ts).
export type ResponsavelTratativa = { id: string; name: string; role: string }

export interface ResponsavelTratativaRow {
  id: string
  name: string
  role: string
}

export function mapResponsaveisTratativaOptions(
  rows: ResponsavelTratativaRow[] | null | undefined,
): ResponsavelTratativa[] {
  const options = (rows || [])
    .filter(row => Boolean(row?.id) && Boolean(row?.name))
    .map(row => ({ id: row.id, name: row.name, role: row.role || 'vendedor' }))
  return options.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}
